// src/app/actions/auth-actions.js
"use server";

import { google } from 'googleapis';// oauth
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
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
      userEmail: currentUser.email
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

  console.log('scopes.length',scopes)

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
      scopes: scopes ? scopes : []
    };
    //console.log('tokenData.scopes.length',tokenData.scopes.length)

    await setDoc(userTokensRef, tokenData, { merge: true });

    console.log('#\tTokens stored successfully');
    return { success: true, message: 'Tokens stored successfully', updateTime: updateTime };

  } catch (error) {
    console.error('Error in storeTokens_fromClient:', error);
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
    scope: storedScopes.join(' ') // Join scopes into a space-separated string
  });  

  try {

    const { tokens } = await oauth2Client.refreshAccessToken();    

    return { success: true, tokens:tokens };
  } catch (error) {
    if (error.response && error.response.data) {
      //console.error('Full error response:', error);
    }
    return { 
      success: false, 
      error: error.message || 'Unknown error occurred while refreshing token'
    };
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
    const updateTime = moment(tokens.updateTime).tz('America/Chicago');
    const expirationTime = moment(tokens.expirationTime).tz('America/Chicago');

    return {
      lastUpdate: updateTime.format('YYYY-MM-DD HH:mm:ss [CST]'),
      expirationTime: expirationTime.format('YYYY-MM-DD HH:mm:ss [CST]'),
    };
  } catch (error) {
    console.error('# Error in getTokenInfo');
    throw new Error('An error occurred while fetching token information');
  }
}

export async function getScopes() {
  try {
    const idToken = await getIdToken(auth.currentUser);
    const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
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
    const idToken = await getIdToken(auth.currentUser);
    const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
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
    const idToken = await getIdToken(auth.currentUser);
    const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
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

