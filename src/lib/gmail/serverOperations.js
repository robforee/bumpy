// src/lib/gmail/serverOperations.js

import { google } from 'googleapis';
import { refreshAccessToken } from '../firebase/tokenManager';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export async function fetchEmails(userId, query = '') {
  const accessToken = await refreshAccessToken(userId);
  oauth2Client.setCredentials({ access_token: accessToken });
  
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  
  try {
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query
    });
    
    return response.data.messages;
  } catch (error) {
    console.error('Error fetching emails:', error);
    throw error;
  }
}

export async function checkGmailAccess(userId) {
  try {
    await fetchEmails(userId, 'is:unread');
    return true;
  } catch (error) {
    console.error('Error checking Gmail access:', error);
    return false;
  }
}

// Implement other Gmail operations (send email, read email, etc.) here
