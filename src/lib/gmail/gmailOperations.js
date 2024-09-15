// src/lib/gmail/gmailOperations.js

import { getAdminFirestore, getGmailService } from '../firebase/adminApp';
const { google } = require('googleapis');

export async function getUserTokens(userId) {
  const db = getAdminFirestore();
  const userTokensDoc = await db.collection('user_tokens').doc(userId).get();
  if (!userTokensDoc.exists) {
    throw new Error('No tokens found for user');
  }
  return userTokensDoc.data();
}

export async function queryEmails(accessToken, query = '') {
  const gmail = await getGmailService(accessToken);
  const response = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults: 10  // Limit to 10 results for this example
  });
  return response.data.messages || [];
}

export async function getEmailContent(accessToken, messageId) {
  const gmail = await getGmailService(accessToken);
  const response = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
  });
  return response.data;
}
