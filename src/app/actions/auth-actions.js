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
    const authorizedScopesRef = doc(db, 'authorized_scopes', currentUser.uid);
    const now = Date.now();

    // Base token data for access token update
    const tokenData = {
      __last_token_update: now,
      __web_token_update: moment().tz('America/Chicago').format('YYYY-MM-DD HH:mm'),
      accessToken: await encrypt(accessToken),
      expirationTime: now + 3600000,
      userEmail: currentUser.email,
      // Clear error states on successful token update
      errors: [],
      consecutiveFailures: 0,
      requiresUserAction: false,
      requiresRefreshToken: false
    };

    // If refresh token is provided, include additional data
    if (refreshToken) {
      Object.assign(tokenData, {
        refreshToken: await encrypt(refreshToken),
        __web_refresh_token_update: moment().tz('America/Chicago').format('YYYY-MM-DD HH:mm'),
        __web_account: process.env.GOOGLE_CLIENT_ID
      });
    }

    // Store authorized scopes separately
    const scopesData = {
      userEmail: currentUser.email,
      authorizedScopes: scopes || [],
      lastUpdated: moment().tz('America/Chicago').format('YYYY-MM-DD HH:mm [CST]')
    };

    // Update collections atomically
    await Promise.all([
      setDoc(userTokensRef, tokenData, { merge: true }),
      setDoc(authorizedScopesRef, scopesData, { merge: true })
    ]);

    return { success: true };
  } catch (error) {
    console.error('Error storing tokens:', error);
    return { success: false, error: error.message };
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

// Refreshes an access token using a refresh token
async function refreshAccessToken(refreshToken, accessToken, storedScopes) {
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
    refresh_token:  decrypt(refreshToken),
    access_token: decrypt(accessToken)
  });  
 
  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    console.log('oauth2Client.refreshAccessToken 322:', JSON.stringify(credentials,null,2));

    // Verify the refreshed token's scopes
    const tokenVerification = await verifyToken(credentials.access_token);
    
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
        ...credentials,
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
