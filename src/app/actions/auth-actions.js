// src/app/actions/auth-actions.js
"use server";

import { getFirestore, doc, setDoc, getDoc, arrayUnion, arrayRemove, collection, query, where, getDocs, writeBatch } from "@firebase/firestore";
import moment from 'moment-timezone';
import crypto from 'crypto';
import { headers } from "next/headers";

import { getIdToken } from "firebase/auth";
import { auth } from "@/src/lib/firebase/clientApp";
import { getAuthenticatedAppForUser } from '@/src/lib/firebase/serverApp';  
import { getTokenTimestamps, getScopeTimestamps } from '@/src/lib/utils/token-utils';
import { google } from 'googleapis';

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
export async function storeTokenInfo({ accessToken, refreshToken, scopes, idToken }) {
  try {
    if (!accessToken) {
      console.error('Missing access token in storeTokens');
      return { success: false, error: 'Access token is required' };
    }

    console.log('Storing tokens:', {
      hasAccessToken: !!accessToken,
      accessTokenPreview: accessToken ? accessToken.substring(0, 8) : 'none',
      hasRefreshToken: !!refreshToken,
      refreshTokenPreview: refreshToken ? refreshToken.substring(0, 8) : 'none',
      hasScopes: !!scopes && Array.isArray(scopes),
      scopesCount: scopes?.length || 0
    });

    const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
    if (!currentUser?.uid) {
      return { success: false, error: 'User not authenticated' };
    }

    const db = getFirestore(firebaseServerApp);
    const userTokensRef = doc(db, 'user_tokens', currentUser.uid);
    const now = Date.now();

    // Base token data - TESTING: store refresh token without encryption
    const tokenData = {
      __last_token_update: now,
      __web_refresh_token_update: moment().tz('America/Chicago').format('YYYY-MM-DD HH:mm'),
      accessToken: accessToken, // TESTING: No encryption
      refreshToken: refreshToken, // TESTING: No encryption
      expirationTime: now + 3600000,
      userEmail: currentUser.email,
      authorizedScopes: scopes,
      errors: [],
      consecutiveFailures: 0,
      requiresUserAction: false,
      requiresRefreshToken: false
    };

    // Store tokens
    await setDoc(userTokensRef, tokenData, { merge: true });

    console.log('Successfully stored tokens:', {
      uid: currentUser.uid,
      email: currentUser.email,
      hasRefreshToken: !!refreshToken,
      requiresRefreshToken: false,
      lastUpdate: tokenData.__web_token_update,
      refreshTokenUpdate: tokenData.__web_refresh_token_update
    });

    return { success: true };
  } catch (error) {
    console.error('Error storing tokens:', error);
    return { success: false, error: error.message };
  }
}

export async function refreshTokenInfo(idToken) {
  console.log('Refreshing token for user:', idToken);
  try {
    // Wait 60 seconds before refreshing
    console.log('Waiting 60 seconds before refresh...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    console.log('Continuing with refresh after wait');

    // Get existing tokens
    const { success, data: tokenData, error } = await getTokenInfo(idToken);
    if (!success) {
      console.error('Failed to get existing tokens:', error);
      return { success: false, error };
    }

    if (!tokenData.refreshToken) {
      return { success: false, error: 'No refresh token available' };
    }

    // Set up OAuth client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    console.log('OAuth2 client config:', {
      clientId: process.env.GOOGLE_CLIENT_ID,
      hasSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI
    });

    // Set existing credentials
    oauth2Client.setCredentials({
      refresh_token: tokenData.refreshToken,
    });

    // Log refresh token (first few chars)
    const refreshTokenPreview = tokenData.refreshToken ? 
      `${tokenData.refreshToken.substring(0, 8)}...` : 'none';
    console.log('Using refresh token:', refreshTokenPreview);

    // Refresh the token
    console.log('Refreshing token for user:', idToken);
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      console.log('Refreshed credentials for user:', credentials);
      // Store the new tokens
      await storeTokenInfo({
        accessToken: credentials.access_token,
        refreshToken: credentials.refresh_token || tokenData.refreshToken, // Keep existing refresh token if new one not provided
        scopes: credentials.scope?.split(' ') || tokenData.authorizedScopes,
        idToken
      });

      return { 
        success: true, 
        data: {
          accessToken: credentials.access_token,
          expiryDate: credentials.expiry_date
        }
      };
    } catch (refreshError) {
      console.error('Token refresh error details:', {
        name: refreshError.name,
        message: refreshError.message,
        response: refreshError.response?.data
      });
      throw refreshError;
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    return { success: false, error: error.message };
  }
}

// Verifies a given token
async function verifyToken(accessToken) {
  try {
    const url = `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${accessToken}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to verify token here');
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

// Retrieves tokens for a given user
export async function getTokenInfo(idToken) {
  try {
    const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
    if (!currentUser?.uid) {
      return { success: false, error: 'User not authenticated' };
    }

    const db = getFirestore(firebaseServerApp);
    const userTokensRef = doc(db, 'user_tokens', currentUser.uid);
    const userTokensSnap = await getDoc(userTokensRef);

    if (!userTokensSnap.exists()) {
      return { success: false, error: 'No tokens found for user' };
    }

    const tokenData = userTokensSnap.data();
    
    // TESTING: Only decrypt access token
    const decryptedData = {
      ...tokenData,
      accessToken: tokenData.accessToken, // TESTING: No decryption
      refreshToken: tokenData.refreshToken // TESTING: No decryption
    };

    console.log('Successfully retrieved tokens:', {
      uid: currentUser.uid,
      email: currentUser.email,
      hasRefreshToken: !!decryptedData.refreshToken,
      requiresRefreshToken: decryptedData.requiresRefreshToken,
      lastUpdate: decryptedData.__web_token_update,
      refreshTokenUpdate: decryptedData.__web_refresh_token_update
    });

    return { 
      success: true, 
      data: decryptedData 
    };
  } catch (error) {
    console.error('Error retrieving tokens:', error);
    return { success: false, error: error.message };
  }
}

// Gets scopes for a given user from the client side
export async function getAuthenticatedScopes(userId, idToken) {
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

// Adds a scope for a given user
export async function addScopes_toPUBLIC(scope, idToken, userId) {
  try {
    const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    const db = getFirestore(firebaseServerApp);
    const PUBLIC_SCOPE_REF = doc(db, 'authorized_scopes', userId);
    const currentScopes = await getDoc(PUBLIC_SCOPE_REF);

    console.log('me')
    if (!currentScopes.exists()) {
      await setDoc(PUBLIC_SCOPE_REF, { scopes: [scope] });
    } else {
      const existingScopes = currentScopes.data().authorizedScopes || [];
      //console.log('me3',existingScopes)
      if (!existingScopes.includes(scope)) {
        await setDoc(PUBLIC_SCOPE_REF, { authorizedScopes: arrayUnion(scope) }, { merge: true });
        //console.log( await getDoc(userTokensRef).data() )
      }
    }

    return (await getDoc(PUBLIC_SCOPE_REF)).data()
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
