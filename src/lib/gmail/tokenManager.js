// src/lib/gmail/tokenManager.js

const { google } = require('googleapis');
const { getAdminFirestore } = require('../firebase/adminAppCommon');

async function getGmailService(accessToken) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.gmail({ version: 'v1', auth: oauth2Client });
  }

async function checkTokenValidity(accessToken) {
  try {
    const gmail = await getGmailService(accessToken);
    await gmail.users.getProfile({ userId: 'me' });
    console.log('Access token is valid');
    return true;
  } catch (error) {
    console.error('Access token is invalid:', error.message);
    return false;
  }
  }

async function refreshAccessToken(userId, refreshToken) {
    const db = getAdminFirestore();
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
  
    try {
      console.log('Attempting to refresh access token...');
      oauth2Client.setCredentials({ refresh_token: refreshToken });
      const { tokens } = await oauth2Client.refreshAccessToken();
      const newAccessToken = tokens.access_token;
      const expirationTime = Date.now() + (tokens.expires_in * 1000); // Calculate expiration time
  
      console.log('New access token obtained. Updating in Firestore...');
      await db.collection('user_tokens').doc(userId).update({
        accessToken: newAccessToken,
        expirationTime: expirationTime
      });
  
      const expirationDate = new Date(expirationTime);
      const duration = (expirationTime - Date.now()) / 1000 / 60; // duration in minutes
      console.log(`Access token refreshed successfully. Expires on ${expirationDate.toLocaleString()} (in ${duration.toFixed(2)} minutes)`);
      
      return { accessToken: newAccessToken, expirationTime };
    } catch (error) {
      console.error('Error refreshing access token:', error.message);
      throw new Error(`Failed to refresh access token: ${error.message}`);
    }
  }
  
async function getValidAccessToken(userId) {
    const db = getAdminFirestore();
    
    try {
      console.log(`Retrieving tokens for user: ${userId}`);
      const userTokensDoc = await db.collection('user_tokens').doc(userId).get();
      
      if (!userTokensDoc.exists) {
        throw new Error(`No tokens found for user: ${userId}`);
      }
      
      let { accessToken, refreshToken, expirationTime } = userTokensDoc.data();
      
      // If expirationTime is not set or is invalid, refresh the token
      if (!expirationTime || isNaN(expirationTime)) {
        console.log('Expiration time is invalid, refreshing token...');
        return await refreshAccessToken(userId, refreshToken);
      }
  
      // Convert expirationTime to number if it's stored as a string
      expirationTime = Number(expirationTime);
      
      if (Date.now() >= expirationTime || !(await checkTokenValidity(accessToken))) {
        console.log('Access token expired or invalid, refreshing...');
        return await refreshAccessToken(userId, refreshToken);
      }
      
      const expirationDate = new Date(expirationTime);
      const duration = (expirationTime - Date.now()) / 1000 / 60; // duration in minutes
      console.log(`Valid access token obtained. Expires on ${expirationDate.toLocaleString()} (in ${duration.toFixed(2)} minutes)`);
      
      return { accessToken, expirationTime };
    } catch (error) {
      console.error('Error getting valid access token:', error.message);
      throw new Error(`Failed to get valid access token: ${error.message}`);
    }
  }

module.exports = {
  getValidAccessToken,
  checkTokenValidity,
  refreshAccessToken
};