// src/lib/gmail/gmailOperationsCommon.js

const { getAdminFirestore } = require('../firebase/adminAppCommon');
const { google } = require('googleapis');

async function getGmailService(accessToken) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

async function getUserTokens(userId) {
  const db = getAdminFirestore();
  const userTokensDoc = await db.collection('user_tokens').doc(userId).get();
  if (!userTokensDoc.exists) {
    throw new Error('No tokens found for user');
  }
  return userTokensDoc.data();
}

async function queryEmails(accessToken, query = '') {
  const gmail = await getGmailService(accessToken);
  const response = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults: 10  // Limit to 10 results for this example
  });
  return response.data.messages || [];
}

async function getEmailContent(accessToken, messageId) {
  const gmail = await getGmailService(accessToken);
  const response = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
  });
  return response.data;
}

module.exports = {
  getUserTokens,
  queryEmails,
  getEmailContent
};