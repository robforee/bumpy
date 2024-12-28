// src/app/actions/auth-actions.js
"use server";

import { google } from 'googleapis';// oauth
import { getFirestore, doc, getDoc, setDoc, arrayUnion, arrayRemove, collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import moment from 'moment-timezone';
import crypto from 'crypto';
import { headers } from "next/headers";

import { getIdToken } from "firebase/auth";
import { auth } from "@/src/lib/firebase/clientApp";
import { getAuthenticatedAppForUser } from '@/src/lib/firebase/serverApp';  
import { getTokenTimestamps, getScopeTimestamps } from '@/src/lib/utils/token-utils';

const encryptionKey = process.env.ENCRYPTION_KEY;

// Encrypts a given text using the encryption key
export async function encrypt(text) {
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

// Decrypts a given text using the encryption key
export async function decrypt(text) {
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

// Stores tokens for a given user
export async function storeTokens({ accessToken, refreshToken, idToken }) {
  try {
    // Validate required tokens
    if (!accessToken) {
      console.error('Missing access token in storeTokens');
      return { 
        success: false, 
        error: 'Access token is required' 
      };
    }

    if (!idToken) {
      console.error('Missing ID token in storeTokens');
      return { 
        success: false, 
        error: 'ID token is required' 
      };
    }

    const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
    
    if (!currentUser || !currentUser?.uid ) {
      console.error('User not authenticated or mismatch storeTokens:', { 
        hasUser: !!currentUser, 
        hasUid: !!currentUser?.uid 
      });
      return { 
        success: false, 
        error: 'User not authenticated or mismatch' 
      };
    }

    const db = getFirestore(firebaseServerApp);

    const userTokensRef = doc(db, 'user_tokens', currentUser.uid);
    const now = Date.now();
    const cstTime = moment().tz('America/Chicago').format('YYYY-MM-DD hh:mm A [CST]');

    try {
      const encryptedAccessToken = await encrypt(accessToken);
      const encryptedRefreshToken = refreshToken ? await encrypt(refreshToken) : null;

      const tokenData = {
        accessToken: encryptedAccessToken,
        ...(encryptedRefreshToken && { refreshToken: encryptedRefreshToken }),
        expirationTime: now + 3600000, // 1 hour from now
        __last_token_update: now,
        __web_token_update: cstTime,
        __web_refreshToken_update: refreshToken ? cstTime : null,
        __web_account: process.env.GOOGLE_CLIENT_ID,
        createdAt: now,
        userEmail: currentUser.email
      };

      await setDoc(userTokensRef, tokenData, { merge: true });
      console.log('Tokens stored successfully for user:', currentUser.uid);

      return { 
        success: true, 
        message: 'Tokens stored successfully', 
        updateTime: cstTime 
      };

    } catch (encryptError) {
      console.error('Error encrypting tokens:', encryptError);
      return { 
        success: false, 
        error: 'Failed to encrypt tokens' 
      };
    }

  } catch (error) {
    console.error('Error in storeTokens:', error);
    return { 
      success: false, 
      error: error.message || 'Unknown error storing tokens',
      stack: error.stack
    };
  }
}

// Stores tokens for a given user from the client side
export async function storeTokens_fromClient(userId, accessToken, refreshToken, idToken, scopes) {
  try {
    // Validate required tokens
    if (!accessToken) {
      console.error('Missing access token in storeTokens_fromClient');
      return { 
        success: false, 
        error: 'Access token is required' 
      };
    }

    if (!idToken) {
      console.error('Missing ID token in storeTokens_fromClient');
      return { 
        success: false, 
        error: 'ID token is required' 
      };
    }

    const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);

    if (!currentUser) {
      console.error('User not authenticated in storeTokens_fromClient');
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    const db = getFirestore(firebaseServerApp);
    const userTokensRef = doc(db, 'user_tokens', currentUser.uid);

    try {
      // If we didn't get a new refresh token, check if user has an existing one
      if (!refreshToken) {
        const userTokens = await getDoc(userTokensRef);
        if (userTokens.exists() && userTokens.data().refreshToken) {
          console.log('Preserving existing refresh token for user:', currentUser.uid);
          refreshToken = await decrypt(userTokens.data().refreshToken);
        }
      }

      const tokenVerification = await verifyToken(accessToken);
      const now = Date.now();
      const cstTime = moment().tz('America/Chicago').format('YYYY-MM-DD hh:mm A [CST]');

      const encryptedAccessToken = await encrypt(accessToken);
      const encryptedRefreshToken = refreshToken ? await encrypt(refreshToken) : null;

      const tokenData = {
        accessToken: encryptedAccessToken,
        ...(encryptedRefreshToken && { refreshToken: encryptedRefreshToken }),
        expirationTime: now + 3600000, // 1 hour from now
        __last_token_update: now,
        __web_token_update: cstTime,
        __web_refreshToken_update: refreshToken ? cstTime : null,
        __web_account: process.env.GOOGLE_CLIENT_ID,
        userEmail: currentUser.email,
        authorizedScopes: scopes,
        isValid: tokenVerification.valid
      };

      await setDoc(userTokensRef, tokenData, { merge: true });
      console.log('Tokens stored successfully for user:', currentUser.uid, {
        hasAccessToken: true,
        hasRefreshToken: !!encryptedRefreshToken
      });

      return { success: true, message: 'Tokens stored successfully', updateTime: cstTime };

    } catch (encryptError) {
      console.error('Error encrypting/storing tokens:', encryptError);
      return { 
        success: false, 
        error: 'Failed to encrypt or store tokens' 
      };
    }

  } catch (error) {
    console.error('Error in storeTokens_fromClient:', error);
    return { 
      success: false, 
      error: error.message || 'Unknown error storing tokens',
      stack: error.stack
    };
  }
}

// Ensures fresh tokens for a given user
export async function ensureFreshTokens(idToken, forceRefresh = false) {
  if(forceRefresh) console.log('forceRefresh',forceRefresh)
  try {
    const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const db = getFirestore(firebaseServerApp);
    const userTokensRef = doc(db, 'user_tokens', currentUser.uid); // ON SERVER
    const userTokensSnap = await getDoc(userTokensRef);

    if (!userTokensSnap.exists()) {
      await logReauthRequired(db, currentUser.uid, 'No tokens found');
      throw new Error('REAUTH_REQUIRED');
    }

    const tokens = userTokensSnap.data();
    const accessToken = await decrypt(tokens.accessToken);
    const refreshToken = await decrypt(tokens.refreshToken);
    const authorizedScopes = tokens.authorizedScopes;
    const expirationTime = tokens.expirationTime;

    // Check if the access token is expired or if forceRefresh is true
    if (forceRefresh || Date.now() > expirationTime) {
      console.log('Refreshing access token...');

      const refreshResult = await refreshAccessToken(refreshToken, authorizedScopes);
      
      if(forceRefresh) console.log('refreshResult',JSON.stringify(refreshResult,null,2))

      if (!refreshResult.success) {
        if (refreshResult.error === 'invalid_grant') {
          await logReauthRequired(db, currentUser.uid, 'Invalid grant during refresh', refreshResult.error);
          throw new Error('REAUTH_REQUIRED');
        } else {
          throw new Error('Failed to refresh token');
        }
      }
      
      const newAccessToken = refreshResult.tokens.access_token; // short-lived
      const newRefreshToken = refreshResult.tokens.refresh_token || refreshToken;

      const storeResult = await storeTokens({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        idToken: idToken,
        scopes: authorizedScopes
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
    console.error('Error in ensureFreshTokens:');
    if (error.message === 'REAUTH_REQUIRED') {
      throw new Error('REAUTH_REQUIRED');
    }
    throw new Error('An error occurred while refreshing tokens');
  }
}

// Ensures fresh tokens for a given user from the client side
export async function ensureFreshTokens_fromClient(idToken, userId, forceRefresh = false) {
  try {
    const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
    
    if (!currentUser || currentUser.uid !== userId) {
      console.log('User not authenticated or mismatch in storeTokens_fromClient');
      throw new Error('User not authenticated or mismatch');
    }

    const db = getFirestore(firebaseServerApp);
    const userTokensRef = doc(db, 'user_tokens', currentUser.uid); // ON SERVER
    const userTokensSnap = await getDoc(userTokensRef);

    if (!userTokensSnap.exists()) {
      await logReauthRequired(db, currentUser.uid, 'No tokens found in ensureFreshTokens_fromClient');
      throw new Error('REAUTH_REQUIRED');
    }

    const tokens = userTokensSnap.data();
    const accessToken = await decrypt(tokens.accessToken);
    const refreshToken = await decrypt(tokens.refreshToken);
    const expirationTime = tokens.expirationTime;
    const storedScopes = tokens.authorizedScopes;

    // Check if the access token is expired or if forceRefresh is true
    if (forceRefresh || Date.now() > expirationTime) {
      console.log('Refreshing access token...');

      const refreshResult = await refreshAccessToken(refreshToken, storedScopes);
      
      if (!refreshResult.success) {
        if (refreshResult.error === 'invalid_grant') {
          await logReauthRequired(db, currentUser.uid, 'Invalid grant during refresh in fromClient', refreshResult.error);
          throw new Error('REAUTH_REQUIRED');
        } else {
          throw new Error('Failed to refresh token');
        }
      }
      
      const newAccessToken = refreshResult.tokens.access_token;
      const newRefreshToken = refreshResult.tokens.refresh_token || refreshToken;

      const storeResult = await storeTokens_fromClient(userId, newAccessToken, newRefreshToken, idToken, storedScopes );

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
    console.error('Error in ensureFreshTokens:');
    if (error.message === 'REAUTH_REQUIRED') {
      throw new Error('REAUTH_REQUIRED');
    }
    throw new Error('An error occurred while refreshing tokens');
  }
}

// Verifies a given token
async function verifyToken(accessToken) {
  try {
    const url = `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${accessToken}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to verify token');
    }
    const tokenInfo = await response.json();
    return {
      scopes: tokenInfo.scope ? tokenInfo.scope.split(' ') : [],
      expiresIn: tokenInfo.exp,
      valid: true
    };
  } catch (error) {
    console.error('Error verifying token:', error);
    return { scopes: [], expiresIn: 0, valid: false };
  }
}

// Gets token information for a given user
export async function getTokenInfo(idToken) {
  try {
    const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);

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
    const accessToken = await decrypt(tokens.accessToken);
    
    // Verify current token scopes
    const tokenVerification = await verifyToken(accessToken);
    const updateTime = moment(tokens.updateTime).tz('America/Chicago');
    const expirationTime = moment(tokens.expirationTime).tz('America/Chicago');

    return {
      lastUpdate: updateTime.format('YYYY-MM-DD HH:mm:ss [CST]'),
      expirationTime: expirationTime.format('YYYY-MM-DD HH:mm:ss [CST]'),
      authorizedScopes: tokenVerification.scopes,
      isValid: tokenVerification.valid
    };
  } catch (error) {
    console.error('Error in getTokenInfo:', error);
    throw new Error('An error occurred while fetching token information');
  }
}

// Gets scopes for a given user from the client side
export async function getScopes_fromClient(userId, idToken) {
  try {
    if (!userId || !idToken) {
      throw new Error('User ID and ID token are required');
    }

    const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Verify the user ID matches
    if (currentUser.uid !== userId) {
      throw new Error('User ID mismatch');
    }

    const db = getFirestore(firebaseServerApp);
    const userTokensRef = doc(db, 'user_tokens', userId);
    const userTokensDoc = await getDoc(userTokensRef);

    if (!userTokensDoc.exists()) {
      return { success: true, scopes: [] };
    }

    const authorizedScopes = userTokensDoc.data().authorizedScopes || [];
    return { success: true, scopes: authorizedScopes };
  } catch (error) {
    console.error('Error in getScopes_fromClient:', error);
    return { success: false, error: error.message };
  }
}

// Refreshes an access token using a refresh token
async function refreshAccessToken(refreshToken, storedScopes) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
    throw new Error('Missing required Google OAuth environment variables');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  // refresh token is long-lived token
  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });  

  try {
    const { tokens } = await oauth2Client.refreshAccessToken();
    console.log('Refreshed access token:', JSON.stringify(tokens,null,2));

    // Verify the refreshed token's scopes
    const tokenVerification = await verifyToken(tokens.access_token);
    
    if (!tokenVerification.valid) {
      return { 
        success: false, 
        error: 'Invalid token after refresh'
      };
    }

    // Check if all requested scopes are authorized
    const missingScopes = storedScopes.filter(scope => 
      !tokenVerification.scopes.includes(scope)
    );

    if (missingScopes.length > 0) {
      console.warn('Warning: Some requested scopes were not granted:', missingScopes);
      return {
        success: false,
        error: 'Some requested scopes were not granted',
        missingScopes
      };
    }

    return { 
      success: true, 
      tokens: {
        ...tokens,
        authorized_scopes: tokenVerification.scopes
      }
    };
  } catch (error) {
    console.error('Error refreshing token:', error);
    return { 
      success: false, 
      error: error.message || 'Unknown error occurred while refreshing token'
    };
  }
}

// Adds a scope for a given user
export async function addScope(scope, idToken) {
  try {
    const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const db = getFirestore(firebaseServerApp);
    const userTokensRef = doc(db, 'user_tokens', currentUser.uid);
    const userTokensDoc = await getDoc(userTokensRef);

    if (!userTokensDoc.exists()) {
      throw new Error('No tokens found for user');
    }

    const currentData = userTokensDoc.data();
    const currentScopes = currentData.authorizedScopes || [];

    if (currentScopes.includes(scope)) {
      return { success: true, message: 'Scope already exists' };
    }

    // Update both collections atomically
    const batch = writeBatch(db);
    
    // Update user_tokens
    batch.set(userTokensRef, {
      authorizedScopes: arrayUnion(scope),
      lastUpdated: moment().tz('America/Chicago').format('YYYY-MM-DD hh:mm A [CST]')
    }, { merge: true });

    // Update authorized_scopes
    const authorizedScopesRef = doc(db, 'authorized_scopes', currentUser.uid);
    batch.set(authorizedScopesRef, {
      authorizedScopes: arrayUnion(scope),
      lastUpdated: moment().tz('America/Chicago').format('YYYY-MM-DD hh:mm A [CST]')
    }, { merge: true });

    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error('Error adding scope:', error);
    return { success: false, error: error.message };
  }
}

// Deletes a scope for a given user
export async function deleteScope(scope, idToken) {
  try {
    const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const db = getFirestore(firebaseServerApp);
    
    // Update both collections atomically
    const batch = writeBatch(db);
    
    // Update user_tokens
    const userTokensRef = doc(db, 'user_tokens', currentUser.uid);
    batch.set(userTokensRef, {
      authorizedScopes: arrayRemove(scope),
      lastUpdated: moment().tz('America/Chicago').format('YYYY-MM-DD hh:mm A [CST]')
    }, { merge: true });

    // Update authorized_scopes
    const authorizedScopesRef = doc(db, 'authorized_scopes', currentUser.uid);
    batch.set(authorizedScopesRef, {
      authorizedScopes: arrayRemove(scope),
      lastUpdated: moment().tz('America/Chicago').format('YYYY-MM-DD hh:mm A [CST]')
    }, { merge: true });

    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error('Error removing scope:', error);
    return { success: false, error: error.message };
  }
}

async function logReauthRequired(db, userId, reason, error = null) {
  try {
    const timestamp = moment().tz('America/Chicago').format('YYYY-MM-DD hh:mm A [CST]');
    const logRef = doc(db, 'spool', 'logs');
    const reauthRef = doc(logRef, 'reauth', `${userId}_${timestamp}`);
    
    await setDoc(reauthRef, {
      userId,
      timestamp,
      reason,
      error,
      redirectUri: process.env.GOOGLE_REDIRECT_URI,
      clientId: process.env.GOOGLE_CLIENT_ID
    });
  } catch (logError) {
    console.error('Failed to log reauth:', logError);
  }
}
