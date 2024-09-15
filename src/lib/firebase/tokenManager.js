// src/lib/firebase/tokenManager.js

import { getAdminFirestore } from '@/src/lib/firebase/adminApp';
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export async function refreshAccessToken(userId) {
  const db = getAdminFirestore();
  const userTokensRef = db.collection('userTokens').doc(userId);
  
  const tokenDoc = await userTokensRef.get();
  if (!tokenDoc.exists) {
    throw new Error('No tokens found for user');
  }
  
  const { refreshToken } = tokenDoc.data();
  
  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });
  
  try {
    const { token } = await oauth2Client.getAccessToken();
    
    await userTokensRef.update({
      accessToken: token,
      lastRefreshed: new Date()
    });
    
    return token;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw error;
  }
}
