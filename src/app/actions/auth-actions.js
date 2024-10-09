// src/app/actions/auth-actions.js
"use server";

import { getAuthenticatedAppForUser } from '@/src/lib/firebase/serverApp';  
import { google } from 'googleapis';// oauth
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import moment from 'moment-timezone';
import crypto from 'crypto';
import { headers } from "next/headers";

const encryptionKey = process.env.ENCRYPTION_KEY;

function encrypt(text) {
    const key = crypto.scryptSync(encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  
function decrypt(text) {
    const key = crypto.scryptSync(encryptionKey, 'salt', 32);
    const [ivHex, encryptedHex] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
  
export async function storeTokens({ accessToken, refreshToken }) {
    try {
      const idToken = headers().get("Authorization")?.split("Bearer ")[1];

      const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser();
      
      // console.log('\n~~~ storeTokens ~~~~\n', '\n~~~ currentUser ~~~~\n',currentUser.length, userId,'\n~~~ idTokens ~~~~\n',idToken )
      // console.log('why no auth?')

      if (!currentUser || !currentUser?.uid ) {
        throw new Error('User not authenticated or mismatch',currentUser, currentUser.uid);
      }
  
      const db = getFirestore(firebaseServerApp);
      const userTokensRef = doc(db, 'user_tokens', currentUser.uid);
      const expirationTime = Date.now() + 3600000; // 1 hour
      const updateTime = Date.now() + 0; 
      const touchedTime = moment().tz('America/Chicago').format('YYYY-MM-DD HH:mm [CST]');
  
      const tokenData = {
        accessToken: encrypt(accessToken),
        refreshToken: encrypt(refreshToken),
        expirationTime: expirationTime,
        updateTime: updateTime,
        createdAt: updateTime,
        touchedAt: touchedTime,
        userEmail: currentUser.email
      };
  
      await setDoc(userTokensRef, tokenData, { merge: true });
  
      return { success: true, message: 'Tokens stored successfullly', updateTime: updateTime };
    } catch (error) {
      console.error('Error storing tokens:', error);
      return { success: false, error: error.message };
    }
  }
  
export async function ensureFreshTokens(forceRefresh = false) {
  try {
    const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const db = getFirestore(firebaseServerApp);
    const userTokensRef = doc(db, 'user_tokens', currentUser.uid);
    const userTokensSnap = await getDoc(userTokensRef);

    if (!userTokensSnap.exists()) {
      throw new Error('REAUTH_REQUIRED');
    }

    const tokens = userTokensSnap.data();
    const accessToken = decrypt(tokens.accessToken);
    const refreshToken = decrypt(tokens.refreshToken);
    const expirationTime = tokens.expirationTime;

    // Check if the access token is expired or if forceRefresh is true
    if (forceRefresh || Date.now() > expirationTime) {
      console.log('Refreshing access token...');
      const refreshResult = await refreshAccessToken(refreshToken);
      
      if (!refreshResult.success) {
        if (refreshResult.error === 'invalid_grant') {
          await setDoc(userTokensRef, { tokens: null });
          throw new Error('REAUTH_REQUIRED');
        } else {
          throw new Error('Failed to refresh token');
        }
      }
      
      const newAccessToken = refreshResult.tokens.access_token;
      const newRefreshToken = refreshResult.tokens.refresh_token || refreshToken;

      const storeResult = await storeTokens({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      });

      if (!storeResult.success) {
        throw new Error('Failed to store refreshed tokens');
      }

      console.log('Tokens refreshed and stored. Update time:', storeResult.updateTime);
      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expirationTime: Date.now() + 3600000 // 1 hour, matching the logic in storeTokens
      };
    }

    // If the token is still fresh and forceRefresh is false, return the existing tokens
    return { accessToken, refreshToken, expirationTime };

  } catch (error) {
    console.error('Error in ensureFreshTokens:', error);
    if (error.message === 'REAUTH_REQUIRED') {
      throw new Error('REAUTH_REQUIRED');
    }
    throw new Error('An error occurred while refreshing tokens');
  }
}
async function refreshAccessToken(refreshToken) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });

  try {
    const { tokens } = await oauth2Client.refreshAccessToken();
    return { success: true, tokens };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    if (error.response && error.response.data) {
      // Log the full error response for debugging
      console.error('Full error response:', error.response.data);
    }
    return { 
      success: false, 
      error: error.message || 'Unknown error occurred while refreshing token'
    };
  }
}

export async function getTokenInfo() {
  try {
    const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const db = getFirestore(firebaseServerApp);
    const userTokensRef = doc(db, 'user_tokens', currentUser.uid);
    const userTokensSnap = await getDoc(userTokensRef);

    if (!userTokensSnap.exists()) {
      throw new Error('No token information found');
    }

    const tokens = userTokensSnap.data();
    const updateTime = moment(tokens.updateTime).tz('America/Chicago');
    const expirationTime = moment(tokens.expirationTime).tz('America/Chicago');

    return {
      lastUpdate: updateTime.format('YYYY-MM-DD HH:mm:ss [CST]'),
      expirationTime: expirationTime.format('YYYY-MM-DD HH:mm:ss [CST]'),
    };
  } catch (error) {
    console.error('Error in getTokenInfo:', error);
    throw new Error('An error occurred while fetching token information');
  }
}

export async function getScopes() {
  try {
    const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const db = getFirestore(firebaseServerApp);
    const userScopesRef = doc(db, 'user_scopes', currentUser.uid);
    const userScopesSnap = await getDoc(userScopesRef);

    if (!userScopesSnap.exists()) {
      return [];
    }

    return userScopesSnap.data().scopes || [];
  } catch (error) {
    console.error('Error in getScopes:', error);
    throw new Error('An error occurred while fetching user scopes');
  }
}

export async function addScope(scope) {
  try {
    const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const validScopes = [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/gmail.compose",
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/drive.appdata",
      "https://www.googleapis.com/auth/chat.messages",
      "https://www.googleapis.com/auth/chat.spaces",
      "https://www.googleapis.com/auth/contacts"
    ];

    if (!validScopes.includes(scope)) {
      throw new Error('Invalid scope');
    }

    const db = getFirestore(firebaseServerApp);
    const userScopesRef = doc(db, 'user_scopes', currentUser.uid);

    await setDoc(userScopesRef, {
      scopes: arrayUnion(scope)
    }, { merge: true });

    return { success: true, message: 'Scope added successfully' };
  } catch (error) {
    console.error('Error in addScope:', error);
    throw new Error('An error occurred while adding the scope');
  }
}

export async function deleteScope(scope) {
  try {
    const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const db = getFirestore(firebaseServerApp);
    const userScopesRef = doc(db, 'user_scopes', currentUser.uid);

    await setDoc(userScopesRef, {
      scopes: arrayRemove(scope)
    }, { merge: true });

    return { success: true, message: 'Scope deleted successfully' };
  } catch (error) {
    console.error('Error in deleteScope:', error);
    throw new Error('An error occurred while deleting the scope');
  }
}

