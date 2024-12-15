// src/app/actions/auth-actions.js
"use server";

import { google } from 'googleapis';// oauth
import { getFirestore, doc, getDoc, setDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import moment from 'moment-timezone';
import crypto from 'crypto';
import { headers } from "next/headers";

import { getIdToken } from "firebase/auth";
import { auth } from "@/src/lib/firebase/clientApp";
import { getAuthenticatedAppForUser } from '@/src/lib/firebase/serverApp';  

const encryptionKey = process.env.ENCRYPTION_KEY;

function encrypt(text) {
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

function decrypt(text) {
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

function getFormattedTimestamp() {
  try {
    const options = {
      timeZone: 'America/Chicago',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true
    };
    return new Date().toLocaleString('en-US', options);
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return new Date().toISOString(); // fallback to ISO format
  }
}

// calls by
//  auth-actions - server side (works)
//  firebaseAuth - client side (broken)
//
export async function storeTokens({ accessToken, refreshToken, idToken }) {
  try {

    const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
    
    if (!currentUser || !currentUser?.uid ) {
      console.log( 'User not authenticated or mismatch storeTokens' );
      throw new Error('User not authenticated or mismatch',currentUser, currentUser.uid);
    }

    const db = getFirestore(firebaseServerApp);

    const userTokensRef = doc(db, 'user_tokens', currentUser.uid);
    const expirationTime = Date.now() + 3600000; // 1 hour
    const updateTime = Date.now() + 0; 
    const touchedTime = moment().tz('America/Chicago').format('YYYY-MM-DD HH:mm [CST]');

    console.log(refreshToken.length,'refreshToken.length')
    console.log(refreshToken.slice(-5),'refreshToken')

    let encryptedAccessToken, encryptedRefreshToken;
    try {
      encryptedAccessToken = encrypt(accessToken);
      encryptedRefreshToken = encrypt(refreshToken);
    } catch (encryptError) {
      console.error('Error during encryption:', encryptError);
      throw new Error(`Encryption failed: ${encryptError.message}`);
    }

    const tokenData = {
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      expirationTime: expirationTime,
      updateTime: updateTime,
      createdAt: updateTime,
      touchedAt: touchedTime,
      userEmail: currentUser.email,
      lastUpdated: getFormattedTimestamp()
    };

    await setDoc(userTokensRef, tokenData, { merge: true });

    return { success: true, message: 'Tokens stored successfullly', updateTime: updateTime };

  } catch (error) {
    console.error('Error storing tokens in auth-actions.storeTokens');
    return { success: false, error: error.message };
  }
}

// CALLED FROM HEADER
export async function storeTokens_fromClient(userId, accessToken, refreshToken, idToken, scopes) {
  console.log('Storing tokens with scopes:', scopes);

  if (!userId || !accessToken || !refreshToken || !idToken) {
    console.error('Missing required parameters');
    return { success: false, error: 'Missing required parameters' };
  }

  try {
    const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
    
    if (!currentUser || currentUser.uid !== userId) {
      console.log('User not authenticated or mismatch in storeTokens_fromClient');
      throw new Error('User not authenticated or mismatch');
    }

    const db = getFirestore(firebaseServerApp);
    const userTokensRef = doc(db, 'user_tokens', currentUser.uid);
    const expirationTime = Date.now() + 3600000; // 1 hour
    const updateTime = Date.now();
    const touchedTime = moment().tz('America/Chicago').format('YYYY-MM-DD HH:mm [CST]');

    let encryptedAccessToken, encryptedRefreshToken;
    try {
      encryptedAccessToken = encrypt(accessToken);
      encryptedRefreshToken = encrypt(refreshToken);
    } catch (encryptError) {
      console.error('Error during encryption:', encryptError);
      throw new Error(`Encryption failed: ${encryptError.message}`);
    }

    // Verify the token's actual scopes
    const tokenVerification = await verifyTokenScopes(accessToken);
    const verifiedScopes = tokenVerification.scopes;

    console.log('Verified token scopes:', verifiedScopes,
      moment().tz('America/Chicago').format('YYYY-MM-DD HH:mm:ss [CST]')
    );

    // Store both requested and verified scopes
    const tokenData = {
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      expirationTime: expirationTime,
      updateTime: updateTime,
      createdAt: updateTime,
      touchedAt: touchedTime,
      userEmail: currentUser.email,
      lastUpdated: getFormattedTimestamp(),
      requestedScopes: scopes || [],
      authorizedScopes: verifiedScopes,
      isValid: tokenVerification.valid
    };

    await setDoc(userTokensRef, tokenData, { merge: true });

    // Also update the user_scopes collection
    const userScopesRef = doc(db, 'user_scopes', currentUser.uid);
    await setDoc(userScopesRef, {
      scopes: verifiedScopes,
      lastUpdated: getFormattedTimestamp()
    }, { merge: true });

    return { 
      success: true, 
      message: 'Tokens stored successfully', 
      updateTime: updateTime,
      authorizedScopes: verifiedScopes
    };

  } catch (error) {
    console.error('Error storing tokens:', error);
    return { success: false, error: error.message };
  }
}

// CALLED FROM DASHBOARD/TokenInfo
export async function ensureFreshTokens(idToken, userId, forceRefresh = false) {
  try {
    const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const db = getFirestore(firebaseServerApp);
    const userTokensRef = doc(db, 'user_tokens', currentUser.uid); // ON SERVER
    const userTokensSnap = await getDoc(userTokensRef);

    if (!userTokensSnap.exists()) {
      throw new Error('REAUTH_REQUIRED');
    }else{
      console.log('#\n#\n tokens exist')
    }

    const tokens = userTokensSnap.data();
    const accessToken = decrypt(tokens.accessToken);
    const refreshToken = decrypt(tokens.refreshToken);
    const scopes = tokens.scopes;
    const expirationTime = tokens.expirationTime;

    // Check if the access token is expired or if forceRefresh is true
    if (forceRefresh || Date.now() > expirationTime) {
      console.log('#\n#\t\tRefreshing access token...');

      const refreshResult = await refreshAccessToken(refreshToken, scopes);
      
      if (!refreshResult.success) {
        console.log(refreshResult.error);
        if (refreshResult.error === 'invalid_grant') {

          //await setDoc(userTokensRef, { msg: 'invalid_grant' });
          
          //console.log(refreshResult.error)

          throw new Error('REAUTH_REQUIRED');
        } else {
          throw new Error('Failed to refresh token');
        }
      }
      
      const newAccessToken = refreshResult.tokens.access_token;
      const newRefreshToken = refreshResult.tokens.refresh_token || refreshToken;

      const storeResult = await storeTokens({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        idToken: idToken,
        scopes: scopes
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
    }else{
      console.log('#\n#\n\ttoken still valid\n#\n#')
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

export async function ensureFreshTokens_fromClient(idToken, userId, forceRefresh = false) {
  try {

    const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
    
    if (!currentUser || currentUser.uid !== userId) {
      console.log('User not authenticated or mismatch in storeTokens_fromClient');
      throw new Error('User not authenticated or mismatch');
    }
    console.log('currentUser ok and not mismatch')

    const db = getFirestore(firebaseServerApp);
    const userTokensRef = doc(db, 'user_tokens', currentUser.uid); // ON SERVER
    const userTokensSnap = await getDoc(userTokensRef);

    if (!userTokensSnap.exists()) {
      throw new Error('REAUTH_REQUIRED');
    }else{
      console.log('#\n#\n tokens exist')
    }

    const tokens = userTokensSnap.data();
    const accessToken = decrypt(tokens.accessToken);
    const refreshToken = decrypt(tokens.refreshToken);
    const expirationTime = tokens.expirationTime;
    const storedScopes = tokens.scopes;

    console.log('#\t', refreshToken.slice(-5),'refreshToken')
    console.log('#\tforceRefresh',forceRefresh)


    // Check if the access token is expired or if forceRefresh is true
    if (forceRefresh || Date.now() > expirationTime) {

      console.log('#\tRefreshing access token...');

      const refreshResult = await refreshAccessToken(refreshToken, storedScopes);
      
      if (!refreshResult.success) {

        if (refreshResult.error === 'invalid_grant') {

          //await setDoc(userTokensRef, { msg: 'invalid_grant' });
          
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
    }else{
      console.log('#\n#\n\ttoken still valid\n#\n#')
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

async function verifyTokenScopes(accessToken) {
  try {
    const url = `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${accessToken}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to verify token scopes');
    }
    const tokenInfo = await response.json();
    return {
      scopes: tokenInfo.scope ? tokenInfo.scope.split(' ') : [],
      expiresIn: tokenInfo.exp,
      valid: true
    };
  } catch (error) {
    console.error('Error verifying token scopes:', error);
    return { scopes: [], expiresIn: 0, valid: false };
  }
}

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
    const accessToken = decrypt(tokens.accessToken);
    
    // Verify current token scopes
    const tokenVerification = await verifyTokenScopes(accessToken);
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

export async function getScopes_fromClient(userId, idToken) {
  try {
    if (!idToken) {
      throw new Error('Authentication token is required');
    }
    if (!userId) {
      throw new Error('User ID is required');
    }

    const { firebaseServerApp } = await getAuthenticatedAppForUser(idToken);
    const db = getFirestore(firebaseServerApp);
    const userScopesRef = doc(db, 'user_scopes', userId);
    const userScopesSnap = await getDoc(userScopesRef);

    if (!userScopesSnap.exists()) {
      return [];
    }

    return userScopesSnap.data().scopes || [];
  } catch (error) {
    console.error('Error in getScopes_fromClient:', error);
    throw error; // Pass through the original error
  }
}

async function refreshAccessToken(refreshToken, storedScopes) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
    throw new Error('Missing required Google OAuth environment variables');
  }
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
    scope: storedScopes.join(' ')
  });  

  try {

    const { tokens } = await oauth2Client.refreshAccessToken();    

    // Verify the refreshed token's scopes
    const tokenVerification = await verifyTokenScopes(tokens.access_token);
    
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

export async function addScope(scope, idToken) {
  try {
    if (!idToken) {
      throw new Error('Authentication token is required');
    }

    const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const validScopes = [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/gmail.compose",
      "https://www.googleapis.com/auth/gmail.labels",
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
      scopes: arrayUnion(scope),
      lastUpdated: getFormattedTimestamp()
    }, { merge: true });

    return { success: true, message: 'Scope added successfully' };
  } catch (error) {
    console.error('Error in addScope:', error);
    throw error;
  }
}

export async function deleteScope(scope, idToken) {
  try {
    if (!idToken) {
      throw new Error('Authentication token is required');
    }

    const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const db = getFirestore(firebaseServerApp);
    const userScopesRef = doc(db, 'user_scopes', currentUser.uid);

    await setDoc(userScopesRef, {
      scopes: arrayRemove(scope),
      lastUpdated: getFormattedTimestamp()
    }, { merge: true });

    return { success: true, message: 'Scope deleted successfully' };
  } catch (error) {
    console.error('Error in deleteScope:', error);
    throw error; // Pass through the original error
  }
}
