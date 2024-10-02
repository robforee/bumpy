const admin = require('firebase-admin');
const path = require('path');
const { google } = require('googleapis');
const crypto = require('crypto');

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
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  const [ivHex, encryptedHex] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

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

async function storeTokens(userId, accessToken, refreshToken) {
  const userTokensRef = db.collection('user_tokens').doc(userId);
  
  const expirationTime = Date.now() + 3600000; // 3600000 ms = 1 hour
  const encryptedAccessToken = encrypt(accessToken);
  const encryptedRefreshToken = encrypt(refreshToken);
  
  await userTokensRef.set({
    accessToken: encryptedAccessToken,
    refreshToken: encryptedRefreshToken,
    expirationTime: expirationTime,
    createdAt: new Date()
  }, { merge: true });

  console.log(`Tokens stored for user ${userId}. Expires at ${new Date(expirationTime).toLocaleString()}`);
}

async function refreshAccessToken(userId) {
  const userTokensRef = db.collection('user_tokens').doc(userId);
  
  try {
    console.log(`Refreshing access token for user: ${userId}`);
    const { refreshToken } = await getTokens(userId);
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    
    console.log('Attempting to refresh access token...');
    const { tokens } = await oauth2Client.refreshAccessToken();
    
    if (!tokens || !tokens.access_token) {
      throw new Error('Failed to obtain new access token');
    }
    
    const newAccessToken = tokens.access_token;
    const expirationTime = Date.now() + (tokens.expires_in * 1000);
    
    const encryptedAccessToken = encrypt(newAccessToken);
    
    await userTokensRef.update({
      accessToken: encryptedAccessToken,
      expirationTime: expirationTime,
      lastRefreshed: new Date()
    });
    
    console.log(`Access token refreshed for user ${userId}. New expiration: ${new Date(expirationTime).toLocaleString()}`);
    return newAccessToken;
  } catch (error) {
    console.error(`Error refreshing access token for user ${userId}:`, error);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    throw new Error(`Failed to refresh access token: ${error.message}`);
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
    console.error(`Error in getGmailService for user ${userId}:`, error);
    throw error;
  }
}

async function getValidAccessToken(userId) {
  try {
    console.log('Getting tokens for user:', userId);
    const { accessToken, expirationTime } = await getTokens(userId);
    
    if (Date.now() >= expirationTime || !(await checkTokenValidity(accessToken))) {
      console.log('Token expired or invalid. Attempting to refresh...');
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
    throw error;
  }
}

async function getTokens(userId) {
  if (!userId) {
    throw new Error('UserId is required');
  }

  console.log(`Starting getTokens for user: ${userId}`);
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
    const { accessToken, refreshToken, expirationTime } = tokenDoc.data();

    console.log(`Decrypting tokens for user: ${userId}`);
    return {
      accessToken: decrypt(accessToken),
      refreshToken: decrypt(refreshToken),
      expirationTime: expirationTime
    };
  } catch (error) {
    console.error(`Error in getTokens for user ${userId}:`, error);
    throw error;
  }
}

async function checkTokenValidity(accessToken) {
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
      console.log(`${service} token is valid`);
    } catch (error) {
      results[service] = false;
      console.error(`${service} token is invalid:`, error.message);
      if (error.response) {
        console.error(`${service} error response:`, error.response.data);
      }
    }
  }

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
      maxResults: 10
    });

    console.log('Fetched Gmail messages:', response.data);
  } catch (error) {
    console.error('Error fetching Gmail messages:', error.message);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    throw error;
  }
}

async function exchangeCodeForTokens(code, userId) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    await storeTokens(userId, tokens.access_token, tokens.refresh_token);
    console.log('New tokens obtained and stored successfully');
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    throw error;
  }
}

async function runTests() {
  try {
    console.log('Environment variables:', {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'present' : 'missing',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'present' : 'missing',
      GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
      ENCRYPTION_KEY: process.env.ENCRYPTION_KEY ? 'present' : 'missing'
    });

    const userUid = 'e660ZS3gfxTXZR06kqn5M23VCzl2';
    
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

runTests();