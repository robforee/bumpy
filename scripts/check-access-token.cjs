// src/scripts/check-access-token.js

const silent = false; // show function call names
const givePeep = true; // single response
const debug = false; // show operationss  details
const showMsgs = false;  // show gmail results
let expireTime = '' // info for peep
let userScopes = []
const reauthOnScopeMismatch = true;

// required for use in generateAuthUrl();
const defaultScopes = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/chat.messages',
  'https://www.googleapis.com/auth/chat.spaces',
  'https://www.googleapis.com/auth/contacts'
]
/* 
  checkAccessToken     @ 5:52
    refreshTokenIfNeeded
    getTokenInfo

*/
// asks you to follow a url, copy code from redirect
// this updates firestore:/user_tokens/{userUid}


const admin = require('firebase-admin');
const { google } = require('googleapis');
const crypto = require('crypto');
const moment = require('moment-timezone');
const fetch = require('node-fetch');
const readline = require('readline');
const path = require('path');

// Initialize Firebase Admin SDK

const serviceAccountPath = path.join(process.env.HOME, 'work/auth/analyst-server-service.json');
if(!silent) console.log('admin.credential.cert\n\t',serviceAccountPath);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccountPath)
});

if(!silent) console.log('db = admin.firestore');
const db = admin.firestore();

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

function encrypt(text) {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  const key = crypto.scryptSync(encryptionKey, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  const key = crypto.scryptSync(encryptionKey, 'salt', 32);
  const [ivHex, encryptedHex] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function generateAuthUrl() {
  const oauth2Client = getOAuth2Client();

  const scopes = defaultScopes;

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });
}

async function getTokenInfo(accessToken) {
  const url = `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${accessToken}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to get token info');
  }
  return await response.json();
}

async function getUserEmail(accessToken) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  
  try {
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();
    return data.email;
  } catch (error) {
    console.error('Error getting user email:', error);
    throw error;
  }
}

async function storeTokens(userId, accessToken, refreshToken, expiryDate, email) {
  if(!silent) console.log('         db.collection(user_tokens).doc(userId)');
  const userTokensRef = db.collection('user_tokens').doc(userId);
  
  const encryptedAccessToken = encrypt(accessToken);
  const touchedTime = moment().tz('America/Chicago').format('YYYY-MM-DD HH:mm [CST]');

  const updateData = {
    accessToken: encryptedAccessToken,
    expirationTime: expiryDate,
    touchedAt: touchedTime,
    email: email
  };

  if (refreshToken) {
    if(!silent) console.log('         encrypt(refreshToken)');
    updateData.refreshToken = encrypt(refreshToken);
  }

  await userTokensRef.set(updateData, { merge: true });

  if(!silent) console.log(`Tokens updated for user \n\t ${userId}. Expires at\n\t ${new Date(expiryDate).toLocaleString()}`);
}

async function refreshTokenIfNeeded(userId, forceRefresh = false) {
  if(!silent) console.log('   db.collection(user_tokens).doc(userId)')
  const userTokensRef = db.collection('user_tokens').doc(userId);
  const tokenDoc = await userTokensRef.get();
  
  if (!tokenDoc.exists) {
    console.log(`No tokens found for user: ${userId}. Initiating authorization flow.`);
    return null;
  }
  
  const { accessToken, refreshToken, expirationTime, scopes } = tokenDoc.data();
  userScopes = scopes;

  const someMinutes = 60000 * 5;
  if(!silent) console.log('   if( forceRefresh || date >  expirationTime ')
  
  let currentAccessToken;
  
  if (forceRefresh || Date.now() >= expirationTime - someMinutes) {
    if(!silent) console.log('      REFRESH TOKEN')
    const oauth2Client = getOAuth2Client();
    if(!silent) console.log('      decrypt(refreshToken)');
    oauth2Client.setCredentials({ refresh_token: decrypt(refreshToken) });
    
    try {
      if(!silent) console.log('      oauth2Client.refreshAccessToken');
      const response = await oauth2Client.refreshAccessToken();

      if (!response || !response.credentials || !response.credentials.access_token) {
        throw new Error('Invalid response from refreshAccessToken');
      }

      const { credentials } = response;
      const email = await getUserEmail(credentials.access_token);
      
      if(!silent) console.log('      storeTokens');
      await storeTokens(
        userId, 
        credentials.access_token, 
        credentials.refresh_token || decrypt(refreshToken),
        credentials.expiry_date,
        email
      );

      expireTime = credentials.expiry_date;
      currentAccessToken = credentials.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  } else {
    if(!silent) console.log('   valid token')
    expireTime = expirationTime;
    currentAccessToken = decrypt(accessToken);
  }
  
  // Verify token scopes after refresh or retrieval
  try {
    if(!silent) console.log('   Verifying token scopes');
    const tokenInfo = await checkTokenScopes(currentAccessToken);
    
    // Check for missing required scopes
    const missingScopes = defaultScopes.filter(scope => 
      !tokenInfo.scopes.includes(scope)
    );
    
    if (missingScopes.length > 0) {
      console.warn('Warning: Missing required scopes:', missingScopes.join(', '));
      
      if (reauthOnScopeMismatch) {
        if(!silent) console.log('Scope mismatch detected - initiating reauthorization');
        // Delete existing token to force reauth
        await userTokensRef.delete();
        return null; // This will trigger reauth flow in checkAccessToken
      }
    }

    if(!silent) {
      console.log('Token scope verification:');
      console.log('- Available scopes:', tokenInfo.scopes.join(', '));
      console.log('- Expires in:', tokenInfo.expiresIn, 'seconds');
    }
  } catch (error) {
    console.error('Error verifying token scopes:', error);
    if (reauthOnScopeMismatch) {
      return null; // Trigger reauth on verification error
    }
  }
  
  return currentAccessToken;
}

async function checkTokenScopes(accessToken) {
  const url = `https://oauth2.googleapis.com/tokeninfo`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Token validation failed: ${response.status}`);
  }

  const tokenInfo = await response.json();
  return {
    scopes: tokenInfo.scope ? tokenInfo.scope.split(' ') : [],
    expiresIn: tokenInfo.expires_in,
    email: tokenInfo.email,
    userId: tokenInfo.sub,
    issuedTo: tokenInfo.issued_to
  };
}

async function verifyTokenAfterRefresh(userId, accessToken) {
  try {
    const tokenInfo = await checkTokenScopes(accessToken);
    
    // Compare against defaultScopes
    const missingScopes = defaultScopes.filter(scope => 
      !tokenInfo.scopes.includes(scope)
    );

    if (missingScopes.length > 0) {
      console.log('Warning: Token is missing the following scopes:', missingScopes);
    }

    console.log(`Token verification for ${userId}:`);
    console.log('- Scopes:', tokenInfo.scopes.join('\n  '));
    console.log('- Expires in:', tokenInfo.expiresIn, 'seconds');
    console.log('- Email:', tokenInfo.email);
    
    return tokenInfo;
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
}

async function promptForAuthorizationCode(userId) {
  const authUrl = generateAuthUrl();
  console.log(`Please visit this URL to authorize the application: ${authUrl}`);
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`Enter the authorization code for ${userId}: `, (code) => {
      rl.close();
      resolve(code);
    });
  });
}

async function saveNewTokens(userId, code) {
  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    
    // Set credentials before making any API calls
    oauth2Client.setCredentials(tokens);
    
    // Now get user email with proper authentication
    const email = await getUserEmail(tokens.access_token);
    
    // Store tokens with email
    await storeTokens(
      userId, 
      tokens.access_token, 
      tokens.refresh_token, 
      tokens.expiry_date, 
      email
    );
    
    if (!silent) console.log('New tokens obtained and stored successfully');

    // Get token info after storing
    const tokenInfo = await getTokenInfo(tokens.access_token);
    if (!silent) console.log('New token info:', tokenInfo);

    return tokens;
  } catch (tokenError) {
    console.error('Error saving new tokens:', tokenError);
    throw tokenError;
  }
}

async function checkAccessToken(userId, forceRefresh = false) {

  if(!silent) console.log('checkAccessToken')
    if(!silent) console.log('   refreshTokenIfNeeded')
  let refreshedAccessToken = await refreshTokenIfNeeded(userId, forceRefresh);

  if(!silent) console.log('   !refreshedAccessToken && promptForAuthorizationCode(userId)')
  if (!refreshedAccessToken) {
    
    console.log('No valid tokens found. Initiating authorization flow.');
    const authorizationCode = await promptForAuthorizationCode(userId);

    if(!silent) console.log('   saveNewtoken')
    const newTokens = await saveNewTokens(userId, authorizationCode);
    refreshedAccessToken = newTokens.access_token;
  }
  
  //if(givePeep) console.log(`valid token for\n\t ${userId}\n\t expires ${new Date(expireTime).toLocaleString()}`);
  if(givePeep) console.log(`valid token for\n\t ${userId}\n\t expires ${expireTime}`);


  try {
    const tokenInfo = await getTokenInfo(refreshedAccessToken);
    if(!silent) console.log('   getTokenInfo');
    if(debug) console.log('Token info:', tokenInfo);
    

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ access_token: refreshedAccessToken });
    
    //  VERIFY SCOPES
    if(!silent) console.log('   verify scopes');
    if(!silent) console.log(userScopes)
    if(userScopes.indexOf('gmail')){
    
    }
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    if(!silent) console.log('   gmail.users.getProfile');
    const response = await gmail.users.getProfile({ userId: 'me' });

    if(!silent) console.log('   gmail.users.messages.list');
    const response2 = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 2
    });
    if(showMsgs) console.log('Messages list:', response2.data);

    if (response2.data.messages && response2.data.messages.length > 0) {
      const messageId = response2.data.messages[0].id;
      const details = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'metadata',
        metadataHeaders: ['Date', 'From', 'Subject', 'To']
      });

      const headers = details.data.payload.headers;
      const subject = headers.find(h => h.name === 'Subject')?.value;
      if(showMsgs) console.log(`Subject: ${subject}`);
    } else {
      if(!silent) console.log('   No messages found');
    }

  } catch (error) {
    console.error('Error in checkAccessToken:', error);
    console.log('Retrying authorization flow...');
    // recall self
    return checkAccessToken(userId);
  }

  if(debug) console.log('API calls completed successfully');
}

async function main() {
  let userUid = 'e660ZS3gfxTXZR06kqn5M23VCzl2'; // robert@redshirt.info
      //userUid = 'CtAyzps80VXRzna32Kdy0NHYcPe2'; // robforee@gmail.com
  await checkAccessToken(userUid, false);
  await admin.app().delete();
}

main().catch(console.error);
