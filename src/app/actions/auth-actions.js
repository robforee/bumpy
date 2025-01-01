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

    const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
    if (!currentUser?.uid) {
      return { success: false, error: 'User not authenticated' };
    }

    const db = getFirestore(firebaseServerApp);
    const userTokensRef = doc(db, 'user_tokens', currentUser.uid);
    const now = Date.now();
    const nowFormatted = moment().tz('America/Chicago').format('YYYY-MM-DD HH:mm');

    // Encrypt tokens
    const encryptedAccessToken = await encrypt(accessToken);
    const encryptedRefreshToken = refreshToken ? await encrypt(refreshToken) : null;

    // Base token data with encryption
    const tokenData = {
      __last_token_update: now,
      __web_token_update: nowFormatted,
      __web_refresh_token_update: refreshToken ? nowFormatted : null,
      __error_time: null, // Clear error time
      __last_error: null, // Clear last error
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      expirationTime: now + 3600000, // 1 hour from now
      userEmail: currentUser.email,
      authorizedScopes: scopes,
      errors: [], // Clear errors array
      consecutiveFailures: 0, // Reset failure count
      requiresUserAction: false,
      requiresRefreshToken: false
    };

    // Store tokens
    await setDoc(userTokensRef, tokenData, { merge: true });

    return { success: true };
  } catch (error) {
    console.error('Error storing tokens:', error);
    return { success: false, error: error.message };
  }
}

export async function refreshTokenInfo(idToken) {
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
    if (!tokenData.refreshToken) {
      return { success: false, error: 'No refresh token found' };
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI
    );

    // Set existing credentials with decrypted refresh token
    oauth2Client.setCredentials({
      refresh_token: await decrypt(tokenData.refreshToken)
    });

    // Refresh the token
    const { credentials } = await oauth2Client.refreshAccessToken();
    const now = Date.now();
    const nowFormatted = moment().tz('America/Chicago').format('YYYY-MM-DD HH:mm');

    // Encrypt new tokens
    const encryptedAccessToken = await encrypt(credentials.access_token);
    const encryptedRefreshToken = credentials.refresh_token ? 
      await encrypt(credentials.refresh_token) : 
      tokenData.refreshToken; // Keep existing encrypted refresh token if none provided

    // Update token data
    const updatedTokenData = {
      __last_token_update: now,
      __web_token_update: nowFormatted,
      __error_time: null,
      __last_error: null,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      expirationTime: now + (credentials.expiry_date || 3600000),
      errors: [],
      consecutiveFailures: 0,
      requiresUserAction: false,
      requiresRefreshToken: false
    };

    await setDoc(userTokensRef, updatedTokenData, { merge: true });

    return { success: true };
  } catch (error) {
    console.error('Error refreshing token:', error);
    
    // Update error state
    const now = Date.now();
    const errorData = {
      __error_time: moment().tz('America/Chicago').format('YYYY-MM-DD HH:mm'),
      __last_error: error.message,
      errors: arrayUnion(error.message),
      consecutiveFailures: increment(1),
      requiresUserAction: error.message.includes('invalid_grant')
    };

    const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
    const db = getFirestore(firebaseServerApp);
    const userTokensRef = doc(db, 'user_tokens', currentUser.uid);
    await setDoc(userTokensRef, errorData, { merge: true });

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
    
    // Decrypt tokens
    const decryptedData = {
      ...tokenData,
      accessToken: await decrypt(tokenData.accessToken),
      refreshToken: tokenData.refreshToken ? await decrypt(tokenData.refreshToken) : null
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
