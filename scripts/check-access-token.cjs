// src/scripts/check-access-token.js

const admin = require('firebase-admin');
const { google } = require('googleapis');
const crypto = require('crypto');
const moment = require('moment-timezone');
const fetch = require('node-fetch');
const readline = require('readline');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccountPath = path.join(process.env.HOME, 'work/auth/analyst-server-firebase-adminsdk-bumpy-2.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccountPath)
});

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

  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
  ];

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
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();
  return data.email;
}

async function storeTokens(userId, accessToken, refreshToken, expiryDate, email) {
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
    updateData.refreshToken = encrypt(refreshToken);
  }

  await userTokensRef.set(updateData, { merge: true });

  console.log(`Tokens updated for user ${userId}. Expires at ${new Date(expiryDate).toLocaleString()}`);
}

async function refreshTokenIfNeeded(userId, forceRefresh = false) {
  
  console.log('# \tstart refreshTokenIfNeeded')

  const userTokensRef = db.collection('user_tokens').doc(userId);
  const tokenDoc = await userTokensRef.get();
  
  if (!tokenDoc.exists) {
    console.log(`No tokens found for user: ${userId}. Initiating authorization flow.`);
    return null;
  }
  
  const { accessToken, refreshToken, expirationTime } = tokenDoc.data();

  const someMinutes = 60000 * 5;// minute
  if (forceRefresh || Date.now() >= expirationTime - someMinutes) {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ refresh_token: decrypt(refreshToken) });
    
    try {
      const response = await oauth2Client.refreshAccessToken();

      if (!response || !response.credentials || !response.credentials.access_token) {
        throw new Error('Invalid response from refreshAccessToken');
      }

      const { credentials } = response;
      const email = await getUserEmail(credentials.access_token);
      
      await storeTokens(
        userId, 
        credentials.access_token, 
        credentials.refresh_token || decrypt(refreshToken),
        credentials.expiry_date,
        email
      );

      return credentials.access_token;
      
      // GaxiosError: invalid_grant
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }
  
  return decrypt(accessToken);
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
    const email = await getUserEmail(tokens.access_token);
    await storeTokens(userId, tokens.access_token, tokens.refresh_token, tokens.expiry_date, email);
    console.log('New tokens obtained and stored successfully');

    const newTokenInfo = await getTokenInfo(tokens.access_token);
    console.log('New token info:', newTokenInfo);

    return tokens;
  } catch (tokenError) {
    console.error('Error saving new tokens:', tokenError);
    throw tokenError;
  }
}

async function checkAccessToken(userId, forceRefresh = false) {

  let refreshedAccessToken = await refreshTokenIfNeeded(userId, forceRefresh);

  if (!refreshedAccessToken) {
    console.log('No valid tokens found. Initiating authorization flow.');
    const authorizationCode = await promptForAuthorizationCode(userId);
    const newTokens = await saveNewTokens(userId, authorizationCode);
    refreshedAccessToken = newTokens.access_token;
  }

  try {
    const tokenInfo = await getTokenInfo(refreshedAccessToken);
    console.log('Token info:', tokenInfo);

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ access_token: refreshedAccessToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const response = await gmail.users.getProfile({ userId: 'me' });
    console.log('Access token is valid');

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
      const subject = headers.find(h => h.name === 'Subject')?.value;
      console.log(`Subject: ${subject}`);
    } else {
      console.log('No messages found');
    }

  } catch (error) {
    console.error('Error in checkAccessToken:', error);
    console.log('Retrying authorization flow...');
    return checkAccessToken(userId);
  }

  console.log('API calls completed successfully');
}

async function main() {
  let userUid = 'e660ZS3gfxTXZR06kqn5M23VCzl2'; // Replace with actual user ID
      userUid = 'CtAyzps80VXRzna32Kdy0NHYcPe2'
  await checkAccessToken(userUid, false);
  await admin.app().delete();
}

main().catch(console.error);
