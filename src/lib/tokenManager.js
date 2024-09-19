// src/lib/tokenManager.js

import { getAdminFirestore } from '@/src/lib/firebase/adminApp';
import { google } from 'googleapis';
import crypto from 'crypto';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

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

export async function storeTokens(userId, accessToken, refreshToken) {
  const db = getAdminFirestore();
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

  //console.log(`Tokens stored for user ${userId}. Expires at ${new Date(expirationTime).toLocaleString()}`);
}

export async function getTokens(userId) {
  const db = getAdminFirestore();
  const userTokensRef = db.collection('user_tokens').doc(userId);
  
  const tokenDoc = await userTokensRef.get();
  if (!tokenDoc.exists) {
    throw new Error(`No tokens found for user: ${userId}`);
  }
  
  const { accessToken, refreshToken, expirationTime } = tokenDoc.data();

  return {
    accessToken: decrypt(accessToken),
    refreshToken: decrypt(refreshToken),
    expirationTime: expirationTime
  };
}

export async function refreshAccessToken(userId) {
  const db = getAdminFirestore();
  const userTokensRef = db.collection('user_tokens').doc(userId);
  
  try {
    console.log(`Refreshing access token for user: ${userId}`);
    const { refreshToken } = await getTokens(userId);
    
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { tokens } = await oauth2Client.refreshAccessToken();
    
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
    delete error.config;
    console.error(`Error refreshing access token for user ${userId}:`, error || 'barf') ;
    console.error('\n\n');
    throw new Error(`Failed to refresh access token: ${error.message}`);
  }
}

export async function getGmailService(userId) {
  try {
    console.log(`Initializing Gmail service for user: ${userId}`);

    const accessToken = await getValidAccessToken(userId);
    
    const oauth2Client = new google.auth.OAuth2();

    oauth2Client.setCredentials({ access_token: accessToken });
    
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });


    console.log(`Gmail service initialized successfully for user: ${userId}`);
    
    return gmail;
  } catch (error) {
    console.error(`Error initializing Gmail service for user ${userId}:`, error);
    throw new Error(`Failed to initialize Gmail service: ${error.message}`);
  }
}

export async function getDriveService(userId) {
  try {
    console.log(`Initializing Drive service for user: ${userId}`);
    const accessToken = await getValidAccessToken(userId);
    
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    console.log(`Drive service initialized successfully for user: ${userId}`);
    
    return drive;
  } catch (error) {
    console.error(`Error initializing Drive service for user ${userId}:`, error);
    throw new Error(`Failed to initialize Drive service: ${error.message}`);
  }
}

export async function getCalendarService(userId) {

  const accessToken = await getValidAccessToken(userId);

  const oauth2Client = new google.auth.OAuth2();

  oauth2Client.setCredentials({ access_token: accessToken });
  
  const cal = google.calendar({ version: 'v3', oauth2Client });
  
  return cal;
}

export async function checkTokenValidity(accessToken) {
  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    await gmail.users.getProfile({ userId: 'me' });
    console.log('Access token is valid');
    return true;
  } catch (error) {
    console.error('Access token is invalid:', error.message);
    return false;
  }
}

export async function getValidAccessToken(userId) {
  try {
    //console.log(`Retrieving valid access token for user: ${userId}`);
    const { accessToken, expirationTime } = await getTokens(userId);
    
    if (Date.now() >= expirationTime || !(await checkTokenValidity(accessToken))) {
      //console.log('Access token expired or invalid, refreshing...');
      return await refreshAccessToken(userId);
    }
    
    const duration = (expirationTime - Date.now()) / 1000 / 60; // duration in minutes
    //console.log(`Valid access token obtained. Expires on ${new Date(expirationTime).toLocaleString()} (in ${duration.toFixed(2)} minutes)`);
    
    return accessToken;
  } catch (error) {
    console.error('Error getting valid access token:', error);
    throw new Error(`Failed to get valid access token: ${error.message}`);
  }
}

async function getTokenInfo(accessToken) {
  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const tokenInfo = await oauth2Client.getTokenInfo(accessToken);
    return tokenInfo;
  } catch (error) {
    console.error('Error getting token info:', error);
    throw error;
  }
}

export async function checkAuthorizedScopes(userId, requiredScopes) {
  try {
    const { accessToken } = await getTokens(userId);
    const tokenInfo = await getTokenInfo(accessToken);
    
    const authorizedScopes = tokenInfo.scopes;
    const missingScopes = requiredScopes.filter(scope => !authorizedScopes.includes(scope));
    
    if (missingScopes.length > 0) {
      console.log(`User ${userId} is missing scopes:`, missingScopes);
      return false;
    }
    
    console.log(`User ${userId} has all required scopes`);
    return true;
  } catch (error) {
    console.error(`Error checking scopes for user ${userId}:`, error);
    return false;
  }
}