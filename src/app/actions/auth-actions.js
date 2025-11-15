'use server'

// src/app/actions/auth-actions.js
import { getFirestore, doc, setDoc, getDoc, arrayUnion, arrayRemove, collection, query, where, getDocs, writeBatch } from "@firebase/firestore";
import moment from 'moment-timezone';
import crypto from 'crypto';
import { headers } from "next/headers";

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

    console.log('[BUMPY_AUTH] Storing authorized scopes:', JSON.stringify({
      userId: currentUser.uid,
      authorizedScopes: scopes,
      timestamp: new Date().toISOString()
    }));

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
    console.log('Auth Environment:', {
      CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      REDIRECT_URI: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI,
      NODE_ENV: process.env.NODE_ENV,
      // Don't log the secret!
    });

    const oauth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET,
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
    
    if (!currentUser) {
      console.error('[BUMPY_AUTH] No authenticated user for token info');
      return { success: false, error: 'No authenticated user' };
    }

    const db = getFirestore(firebaseServerApp);
    const userTokensRef = doc(db, 'user_tokens', currentUser.uid);
    const userTokensSnap = await getDoc(userTokensRef);

    if (!userTokensSnap.exists()) {
      console.log('[BUMPY_AUTH] No tokens found:', JSON.stringify({
        userId: currentUser.uid,
        timestamp: new Date().toISOString()
      }));
      return { success: false, error: 'No tokens found' };
    }

    const tokenInfo = userTokensSnap.data();
    console.log('[BUMPY_AUTH] Token info retrieved:', JSON.stringify({
      userId: currentUser.uid,
      hasAccessToken: !!tokenInfo.accessToken,
      hasRefreshToken: !!tokenInfo.refreshToken,
      authorizedScopes: tokenInfo.authorizedScopes || [],
      timestamp: new Date().toISOString()
    }));

    return {
      success: true,
      data: {
        scopes: tokenInfo.authorizedScopes || [],
        expiresIn: tokenInfo.expiresIn || 0
      }
    };
  } catch (error) {
    console.error('[BUMPY_AUTH] Error retrieving tokens:', error);
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

export async function exchangeCodeForTokens(code) {
  try {
    console.log('Token exchange request:', JSON.stringify({
      hasCode: !!code,
      codePreview: code ? `${code.substring(0, 8)}...` : 'none'
    }, null, 2));

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI
    );

    console.log('Token exchange parameters:', JSON.stringify({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      redirect_uri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI,
      code_preview: code.substring(0, 8) + '...'
    }, null, 2));

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    console.log('Token exchange response:', JSON.stringify({
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiryDate: tokens.expiry_date,
      scope: tokens.scope
    }, null, 2));

    return {
      success: true,
      tokens: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date, // Include actual expiry from Google
        scopes: tokens.scope.split(' ')
      }
    };
  } catch (error) {
    console.error('Token exchange error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Store service-specific tokens (Gmail, Drive, Calendar, Messenger)
 * @param {string} service - Service name ('gmail', 'drive', 'calendar', 'messenger')
 * @param {Object} tokens - Token object {accessToken, refreshToken, scopes}
 * @param {string} idToken - Firebase ID token for authentication
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function storeServiceTokens(service, tokens, uid) {
  'use server'

  try {
    console.log(`🔐 [storeServiceTokens] Storing ${service} tokens:`, {
      service,
      uid,
      hasAccessToken: !!tokens.accessToken,
      hasRefreshToken: !!tokens.refreshToken,
      scopes: tokens.scopes,
      timestamp: new Date().toISOString()
    });

    if (!uid) {
      return { success: false, error: 'User ID required' };
    }

    // Use client-side Firebase for Firestore access
    const { getFirestore, doc, setDoc } = await import('firebase/firestore');
    const db = getFirestore();
    const serviceCredsRef = doc(db, `service_credentials/${uid}_${service}`);

    // Encrypt tokens
    const encryptedAccessToken = await encrypt(tokens.accessToken);
    const encryptedRefreshToken = tokens.refreshToken ? await encrypt(tokens.refreshToken) : null;

    const now = Date.now();
    const credentialData = {
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      scopes: tokens.scopes || [],
      grantedAt: now,
      lastRefreshed: now,
      expiresAt: now + 3600000 // 1 hour from now
    };

    await setDoc(serviceCredsRef, credentialData);

    console.log(`✅ [storeServiceTokens] Successfully stored ${service} tokens for user ${uid}`);

    return { success: true };
  } catch (error) {
    console.error(`❌ [storeServiceTokens] Error storing ${service} tokens:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Get service-specific token (with auto-refresh if needed)
 * @param {string} service - Service name ('gmail', 'drive', 'calendar', 'messenger')
 * @param {string} idToken - Firebase ID token for authentication
 * @returns {Promise<{success: boolean, accessToken?: string, error?: string}>}
 */
export async function getServiceToken(service, idToken) {
  try {
    const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
    if (!currentUser?.uid) {
      return { success: false, error: 'User not authenticated' };
    }

    const db = getFirestore(firebaseServerApp);
    const serviceCredsRef = doc(db, 'service_credentials', currentUser.uid, service);
    const serviceCredsSnap = await getDoc(serviceCredsRef);

    if (!serviceCredsSnap.exists()) {
      console.log(`⚠️ [getServiceToken] No ${service} credentials found for user ${currentUser.uid}`);
      return { success: false, error: `No ${service} authorization found. Please connect ${service} first.` };
    }

    const creds = serviceCredsSnap.data();
    const now = Date.now();

    // Check if token is expired
    if (creds.expiresAt && creds.expiresAt < now) {
      console.log(`🔄 [getServiceToken] ${service} token expired, refreshing...`);

      // Refresh token
      if (!creds.refreshToken) {
        return { success: false, error: `${service} refresh token not found. Please re-authorize.` };
      }

      const oauth2Client = new google.auth.OAuth2(
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI
      );

      const decryptedRefreshToken = await decrypt(creds.refreshToken);
      oauth2Client.setCredentials({ refresh_token: decryptedRefreshToken });

      const { credentials } = await oauth2Client.refreshAccessToken();

      // Update stored credentials
      const encryptedAccessToken = await encrypt(credentials.access_token);
      await setDoc(serviceCredsRef, {
        accessToken: encryptedAccessToken,
        lastRefreshed: now,
        expiresAt: now + (credentials.expiry_date || 3600000)
      }, { merge: true });

      console.log(`✅ [getServiceToken] ${service} token refreshed successfully`);

      return {
        success: true,
        accessToken: credentials.access_token
      };
    }

    // Token is still valid
    const decryptedAccessToken = await decrypt(creds.accessToken);

    console.log(`✅ [getServiceToken] ${service} token retrieved successfully`);

    return {
      success: true,
      accessToken: decryptedAccessToken
    };
  } catch (error) {
    console.error(`❌ [getServiceToken] Error getting ${service} token:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if user has authorized a specific service
 * @param {string} service - Service name ('gmail', 'drive', 'calendar', 'messenger')
 * @param {string} idToken - Firebase ID token for authentication
 * @returns {Promise<{success: boolean, authorized: boolean, scopes?: string[], error?: string}>}
 */
export async function checkServiceAuth(service, idToken) {
  try {
    const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
    if (!currentUser?.uid) {
      return { success: false, isAuthorized: false, error: 'User not authenticated' };
    }

    const db = getFirestore(firebaseServerApp);
    // Match the path used in ClientCallback: service_credentials/{userId}_{service}
    const serviceCredsRef = doc(db, `service_credentials/${currentUser.uid}_${service}`);
    const serviceCredsSnap = await getDoc(serviceCredsRef);

    if (!serviceCredsSnap.exists()) {
      console.log(`🔍 [checkServiceAuth] No credentials found for ${service}`);
      return { success: true, isAuthorized: false };
    }

    const creds = serviceCredsSnap.data();
    console.log(`✅ [checkServiceAuth] Found credentials for ${service}`, {
      scopes: creds.scopes?.length || 0,
      hasAccessToken: !!creds.accessToken,
      hasRefreshToken: !!creds.refreshToken
    });

    return {
      success: true,
      isAuthorized: true,
      scopes: creds.scopes || []
    };
  } catch (error) {
    console.error(`❌ [checkServiceAuth] Error checking ${service} auth:`, error);
    return { success: false, isAuthorized: false, error: error.message };
  }
}
