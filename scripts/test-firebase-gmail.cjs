// scripts/test-firebase-gmail.js
const admin = require('firebase-admin');
const path = require('path');
const { google } = require('googleapis');
const crypto = require('crypto');
const moment = require('moment-timezone');

// Path to your service account key JSON file
const serviceAccountPath = path.join(process.env.HOME, 'work/auth/analyst-server-firebase-adminsdk-bumpy-2.json');

// Initialize Firebase Admin SDK
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath)
  });
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  process.exit(1);
}

// Get Firestore instance
const db = admin.firestore();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // Must be 32 bytes for AES-256
const IV_LENGTH = 16; // For AES, this is always 16 bytes

function encrypt(text) {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY environment variable is missing');
  }
  const encryptionKey = process.env.ENCRYPTION_KEY;
  const key = crypto.scryptSync(encryptionKey, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY environment variable is missing');
  }
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

// in getTokens and runTest

function generateAuthUrl() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/drive.readonly',
    // Add any other necessary scopes
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });

  return url;
}








async function refreshAccessToken(userId) {
  console.log('~\t refreshAccessToken')
  const userTokensRef = db.collection('user_tokens').doc(userId);
  
  try {
    console.log(`Refreshing access token for user: ${userId}`);
    const { refreshToken, touchedAt } = await getTokens(userId);
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    console.log('*\t thrown?') 
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    console.log('*\tsetCredentials:',refreshToken.slice(-5),' - ',touchedAt);
    const { tokens } = await oauth2Client.refreshAccessToken();
    console.log('*\ttokens:',tokens);
    console.log('*\t thrown?') 
    if (!tokens || !tokens.access_token) {
      throw new Error('Failed to obtain new access token');
    }
    
    const newAccessToken = tokens.access_token;
    const expirationTime = Date.now() + (tokens.expires_in * 1000);
    
    const encryptedAccessToken = encrypt(newAccessToken);
    const touchedTime = moment().tz('America/Chicago').format('YYYY-MM-DD HH:mm [CST]');

    
    await userTokensRef.update({
      accessToken: encryptedAccessToken,
      expirationTime: expirationTime,
      lastRefreshed: new Date(),
      touchedAt: touchedTime
    });
    
    console.log(`Access token refreshed for user ${userId}. New expiration: ${new Date(expirationTime).toLocaleString()}`);
    return newAccessToken;
  } catch (error) {
    //console.error(`Error refreshing access token for user ${userId}:`, error);
    if (error.response) {
      console.error('Error response 1:', error.response.data);
    }
    throw new Error(`*Failed to refresh access token: ${error.message}`);
    //throw new Error(`Failed to refresh access token: `);
  }
}

async function getGmailService(userId) {
  try {
    console.log(`Initializing Gmail service for user: ${userId}`);
    const accessToken = await getValidAccessToken(userId);
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });    
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    console.log(`Gmail service initialized successfully for user: ${userId}`);
    return gmail;
  } catch (error) {
    console.error(`Error in getGmailService for user ${userId}:`);
    //console.error(`Error in getGmailService for user ${userId}:`, error);
    throw error;
  }
}

async function getValidAccessToken(userId) {
  console.log('~\t getValidAccessToken')
  try {
    console.log('Getting tokens for user:', userId);
    const { accessToken, expirationTime } = await getTokens(userId);
    
    const forceRefresh = true;
    if (forceRefresh || Date.now() >= expirationTime || !(await checkTokenValidity(accessToken))) {
      console.log('Token forcee, expired or invalid. Attempting to refresh...');
      try {
        return await refreshAccessToken(userId);
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);
        console.log('Attempting to use existing token as fallback...');
        if (await checkTokenValidity(accessToken)) {
          console.log('Existing token is still valid. Using it as fallback.');
          return accessToken;
        } else {
          throw new Error('Both token refresh and fallback to existing token failed');
        }
      }
    }
    return accessToken;
  } catch (error) {
    console.error('Error in getValidAccessToken:', error);
    //console.error('Error in getValidAccessToken:');
    throw error;
  }
}










async function getTokens(userId) {
  console.log('~\t getTokens')
  
  if (!userId) {
    throw new Error('UserId is required');
  }

  const userTokensRef = db.collection('user_tokens').doc(userId);

  try {
    console.log(`Fetching token document for user: ${userId}`);
    const tokenDoc = await userTokensRef.get();

    if (!tokenDoc.exists) {
      console.log(`No tokens found for user: ${userId}`);
      
      const authUrl = generateAuthUrl();

      console.log(`Please visit this URL to authorize the application: ${authUrl}`);
      throw new Error(`No tokens found. Please authorize at: ${authUrl}`);
    }

    console.log(`Token document retrieved for user: ${userId}`);
    const { accessToken, refreshToken, expirationTime, touchedAt } = tokenDoc.data();

    console.log(`Decrypting tokens for user: ${userId}`);
    return {
      accessToken: decrypt(accessToken),
      refreshToken: decrypt(refreshToken),
      expirationTime: expirationTime,
      touchedAt: touchedAt ? touchedAt : ''
    };
  } catch (error) {
    console.error(`Error in getTokens for user ${userId}:`, error);
    throw error;
  }
}


async function checkTokenValidity(accessToken) {
  console.log('# checkTokenValidity 1')
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const checks = {
    gmail: checkGmailToken,
  };

  const results = {};

  for (const [service, checkFunction] of Object.entries(checks)) {
    try {
      await checkFunction(oauth2Client);
      results[service] = true;
      console.log(`#\t${service} token is valid`);
    } catch (error) {
      results[service] = false;
      console.error(`#\t${service} token is invalid:`, error.message);
      if (error.response) {
        console.error(`${service} error response:`, error.response.data.message);
      }
    }
  }
  console.log('# checkTokenValidity 2')
  return Object.values(results).every(result => result);
}









async function checkGmailToken(auth) {
  const gmail = google.gmail({ version: 'v1', auth });
  await gmail.users.getProfile({ userId: 'me' });
}








async function fetchGmailMessages(userId) {
  try {
    const gmail = await getGmailService(userId);
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 1
    });

    console.log('Fetching details for Gmail messages...');

    const messageDetails = await Promise.all(response.data.messages.map(async (message) => {
      const details = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'metadata',
        metadataHeaders: ['Date', 'From', 'Subject', 'To']
      });

      const headers = details.data.payload.headers;
      const date = headers.find(h => h.name === 'Date')?.value;
      const from = headers.find(h => h.name === 'From')?.value;
      const subject = headers.find(h => h.name === 'Subject')?.value;
      const to = headers.find(h => h.name === 'To')?.value;

      return {
        id: message.id,
        date,
        from,
        to,
        subject
      };
    }));

    console.log('Fetched Gmail messages:');
    messageDetails.forEach(msg => {
      console.log(`ID: ${msg.id}`);
      console.log(`\tDate: ${msg.date}`);
      console.log(`\tFrom: ${msg.from}`);
      console.log(`\tTo: ${msg.to}`);
      console.log(`\tSubject: ${msg.subject}`);
      console.log('---');
    });

    return messageDetails;
  } catch (error) {
    console.error('Error fetching Gmail messages:', error.message);
    if (error.response) {
      console.error('Error response 3:', error.response.data);
    }
    throw error;
  }
}

async function exchangeCodeForTokens(code, userId) {
  const touchedTime = moment().tz('America/Chicago').format('YYYY-MM-DD HH:mm [CST]');

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    await storeTokens(userId, 
      tokens.access_token, 
      tokens.refresh_token
    );
    console.log('New tokens obtained and stored successfully');
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    throw error;
  }
}













async function promptForAuthorizationCode(userUid) {
  const authUrl = generateAuthUrl();
  console.log(`Please visit this URL to re-authorize the application: ${authUrl}`);
  const authorizationCode = await new Promise(resolve => {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    readline.question('Enter the new authorization code: ', code => {
      readline.close();
      resolve(code);
    });
  });
  return authorizationCode;

}









async function runTests() {
  let userUid = 'e660ZS3gfxTXZR06kqn5M23VCzl2';
    //userUid = 'CtAyzps80VXRzna32Kdy0NHYcPe2';


  await checkAccessToken(userUid)

  return;
  try {
    console.log('Environment variables:', {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'present' : 'missing',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'present' : 'missing',
      GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
      ENCRYPTION_KEY: process.env.ENCRYPTION_KEY ? 'present' : 'missing'
    });

    async function attemptFetchMessages() {
      try {
        await fetchGmailMessages(userUid);
      } catch (error) {
        if (error.message.includes('Failed to refresh access token') || 
            error.message.includes('Both token refresh and fallback to existing token failed')) {
          console.log('Token refresh failed. Initiating re-authorization process...');
          const authUrl = generateAuthUrl();
          console.log(`Please visit this URL to re-authorize the application: ${authUrl}`);
          const authorizationCode = await new Promise(resolve => {
            const readline = require('readline').createInterface({
              input: process.stdin,
              output: process.stdout
            });
            readline.question('Enter the new authorization code: ', code => {
              readline.close();
              resolve(code);
            });
          });
          await exchangeCodeForTokens(authorizationCode, userUid);
          console.log('Re-authorization complete. Attempting to fetch messages again...');
          await fetchGmailMessages(userUid);
        } else {
          throw error;
        }
      }
    }

    await attemptFetchMessages();
  } catch (error) {
    console.error('Error in tests:', error);
  } finally {
    await admin.app().delete();
  }
}

async function storeTokens(userId, accessToken, refreshToken, expiryDate) {
  const userTokensRef = db.collection('user_tokens').doc(userId);
  
  const encryptedAccessToken = encrypt(accessToken);
  const touchedTime = moment().tz('America/Chicago').format('YYYY-MM-DD HH:mm [CST]');

  const updateData = {
    accessToken: encryptedAccessToken,
    expirationTime: expiryDate, // Use the provided expiry_date
    touchedTime: touchedTime
  };

  if (refreshToken) {
    updateData.refreshToken = encrypt(refreshToken);
  }

  await userTokensRef.set(updateData, { merge: true });

  console.log(`Tokens updated for user ${userId}. Expires at ${new Date(expiryDate).toLocaleString()}`);
}

async function refreshTokenIfNeeded(userId, forceRefresh = false) {

  const { accessToken, refreshToken, expirationTime } = await getTokens(userId);

  if(forceRefresh){
    console.log('FORCE AT', ( expirationTime - 300000) - Date.now())
  }else{
    console.log('to go', ( expirationTime - 300000) - Date.now())
  }
  
  // Check if token is close to expiration (e.g., less than 5 minutes left)
  if (forceRefresh || Date.now() >= expirationTime - 300000) {

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    
    try {
      const response = await oauth2Client.refreshAccessToken();      
      //console.log('\nRefresh token response:', response,'\n\n');  // Log the entire response

      if (!response || !response.credentials || !response.credentials.access_token) {
        throw new Error('Invalid response from refreshAccessToken');
      }

      const { credentials } = response;
      
      // Store the new access token and its expiration time
      await storeTokens(
        userId, 
        credentials.access_token, 
        credentials.refresh_token || refreshToken,
        credentials.expiry_date
      );

      return credentials.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }
  
  return accessToken;
}

async function getTokenInfo(accessToken) {
  const url = `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${accessToken}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to get token info');
  }
  return await response.json();
}

async function checkAccessToken(userId) {
  
  const forceRefresh = false;

  const userTokensRef = db.collection('user_tokens').doc(userId);
  const tokenDoc = (await userTokensRef.get());
  const { accessToken, refreshToken, expirationTime, touchedAt } = tokenDoc.data();
  const accessTOKEN = decrypt(accessToken);

  try {
    const accessToken = await refreshTokenIfNeeded(userId, forceRefresh);

    // Get token info before making API calls
    const tokenInfo = await getTokenInfo(accessTOKEN);
    console.log('Token info:', tokenInfo);

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials({ access_token: accessTOKEN });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const response = await gmail.users.getProfile({ userId: 'me' });
    console.log('Access token is valid as of', touchedAt);

    const response2 = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 2
    });
    console.log('Messages list:', response2.data);

    if (response2.data.messages && response2.data.messages.length > 0) {
      const messageId = response2.data.messages[0].id;
      const details = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'metadata',
        metadataHeaders: ['Date', 'From', 'Subject', 'To']
      });

      const headers = details.data.payload.headers;
      const date = headers.find(h => h.name === 'Date')?.value;
      const from = headers.find(h => h.name === 'From')?.value;
      const subject = headers.find(h => h.name === 'Subject')?.value;
      const to = headers.find(h => h.name === 'To')?.value;


      console.log(`Subject: ${subject}`);
    } else {
      console.log('No messages found');
    }

  } catch (error) {
    console.log('token created at', touchedAt);
    console.log(error?.errors);

    const authorizationCode = await promptForAuthorizationCode(userId);
    
    async function saveNewTokens(code) {
      try {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI
        );
        oauth2Client.setCredentials({ access_token: accessTOKEN });        
        const { tokens } = await oauth2Client.getToken(code);
        await storeTokens(userId, tokens.access_token, tokens.refresh_token);
        console.log('New tokens obtained and stored successfully');

        // Get token info after refreshing
        const newTokenInfo = await getTokenInfo(tokens.access_token);
        console.log('New token info:', newTokenInfo);

        return tokens;
      } catch (tokenError) {
        console.error('Error saving new tokens:', tokenError);
        throw tokenError;
      }
    }

    const newTokens = await saveNewTokens(authorizationCode);
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );    
    oauth2Client.setCredentials(newTokens);
    
    // Retry the API calls with new tokens
    return checkAccessToken(userId);
  }

  console.log('API calls completed successfully');
}
runTests();