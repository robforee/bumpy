// src/app/actions.js
"use server";

import { getFirestore, doc, setDoc, collection, getDoc } from "firebase/firestore";
import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp";
import { addReviewToRestaurant } from "@/src/lib/firebase/firestore";
import { getAdminAuth, getAdminFirestore } from '@/src/lib/firebase/adminApp';
import { FieldValue } from 'firebase-admin/firestore';
import { google } from 'googleapis';
import moment from 'moment-timezone';
import crypto from 'crypto';

const encryptionKey = process.env.ENCRYPTION_KEY;


export async function handleReviewFormSubmission(data) {

    try {
        const { firebaseServerApp } = await getAuthenticatedAppForUser();

        const db = getFirestore(firebaseServerApp);
        await addReviewToRestaurant(db, data.get("restaurantId"), {
            text: data.get("text"),
            rating: 5,
            userId: data.get("userId"),
            userName: data.get("userName")
        });

    } catch (error) {
        console.error("Error submitting review:", error);
        throw error;
    }
}

export async function writeReviewServerSide(restaurantId, review) {

    try {
        const { firebaseServerApp } = await getAuthenticatedAppForUser();
        const db = getFirestore(firebaseServerApp);

        await addReviewToRestaurant(db, restaurantId, review);

        return { success: true };
    } catch (error) {
        console.error("Error submitting review from server-side:", error);
        throw error;
    }
}

export async function writeToUserOwnedPath(userId, rating) {

    try {
        const { firebaseServerApp } = await getAuthenticatedAppForUser();
        const db = getFirestore(firebaseServerApp);

        const ratingId = `rating_${Date.now()}`; // Generate a unique ID for the rating
        const ratingRef = doc(collection(db, 'users', userId, 'ratings'), ratingId);

        await setDoc(ratingRef, rating);

        return { success: true };
    } catch (error) {
        console.error("Error submitting rating to user-owned path:", error);
        throw error;
    }
}

export async function ServerWriteWithServiceAccount() {
  const db = getAdminFirestore();
  const docRef = db.collection('adminData').doc('testDoc');
  await docRef.set({
    message: "This was written with service account permissions",
    timestamp: new Date().toISOString()
  });
  return { success: true };
}

// running on the server via route
export async function ServerWriteAsImpersonatedUser(idToken) {
    const adminAuth = getAdminAuth();
    const db = getAdminFirestore();

    try {
        // Verify the ID token
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        console.log('Verified UID:', uid);

        // Perform your Firestore operations here
        const docRef = db.collection('adminData').doc(uid);
        await docRef.set({
            message: "This was written from the server, impersonating the user",
            timestamp: new Date().toISOString()
        });

        console.log('Write operation completed successfully');
        return { success: true };
    } catch (error) {
        console.error('Error in ServerWriteAsImpersonatedUser:', error);
        // Don't expose detailed error messages to the client
        throw new Error('An error occurred while processing your request');
    }
}

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
  
  async function getStoredTokens(userId) {
    const db = getAdminFirestore();
    const userTokenDoc = await db.collection('user_tokens').doc(userId).get();
    if (!userTokenDoc.exists) {
      return null; // Return null instead of throwing an error
    }
    const tokens = userTokenDoc.data();
    return {
      accessToken: decrypt(tokens.accessToken),
      refreshToken: decrypt(tokens.refreshToken),
      expirationTime: tokens.expirationTime
    };
  }
  
export async function storeTokens({ userId, accessToken, refreshToken }) {
  const db = getAdminFirestore();
  const userTokensRef = db.collection('user_tokens').doc(userId);
  const expirationTime = Date.now() + 3600000; // 1 hour
  const updateTime = moment().tz('America/Chicago').format('YYYY-MM-DD HH:mm [CST]');

  try {
    await userTokensRef.set({
      accessToken: encrypt(accessToken),
      refreshToken: encrypt(refreshToken),
      expirationTime: expirationTime,
      updateTime: updateTime,
      createdAt: FieldValue.serverTimestamp()
    }, { merge: true });

    return { success: true, message: 'Tokens stored successfully', updateTime: updateTime };
  } catch (error) {
    console.error('Error storing tokens:', error);
    return { success: false, error: error.message };
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
      if (error.message === 'invalid_grant') {
        return { success: false, error: 'invalid_grant' };
      }
      throw error;
    }
  }
  
  export async function queryGmailInbox(idToken) {
    const adminAuth = getAdminAuth();
  
    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      const userId = decodedToken.uid;
  
      let storedTokens = await getStoredTokens(userId);
  
      if (!storedTokens) {
        console.log('No stored tokens found for user');
        throw new Error('REAUTH_REQUIRED');
      }
  
      let { accessToken, refreshToken, expirationTime } = storedTokens;
  
      // Check if the access token is expired
      if (Date.now() > expirationTime) {
        console.log('Access token expired, refreshing...');
        const refreshResult = await refreshAccessToken(refreshToken);
        
        if (!refreshResult.success) {
          if (refreshResult.error === 'invalid_grant') {
            // Delete the stored tokens as they are no longer valid
            await deleteStoredTokens(userId);
            throw new Error('REAUTH_REQUIRED');
          } else {
            throw new Error('Failed to refresh token');
          }
        }
        
        const updateTime = await storeTokens({
          userId,
          accessToken: refreshResult.tokens.access_token,
          refreshToken: refreshResult.tokens.refresh_token || refreshToken
        });
        console.log('Tokens refreshed and stored. Update time:', updateTime);
        accessToken = refreshResult.tokens.access_token;
      }
  
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: accessToken });
  
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 10,
      });
  
      const messages = response.data.messages || [];
      const messageDetails = await Promise.all(messages.map(async (message) => {
        const details = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'metadata',
          metadataHeaders: ['Subject', 'From'],
        });
  
        const subject = details.data.payload.headers.find(h => h.name === 'Subject')?.value || 'No Subject';
        const from = details.data.payload.headers.find(h => h.name === 'From')?.value || 'Unknown Sender';
  
        return { id: message.id, subject, from };
      }));
  
      return messageDetails;
  
    } catch (error) {
      console.error('Error querying Gmail:', error);
      if (error.message === 'REAUTH_REQUIRED') {
        throw new Error('REAUTH_REQUIRED');
      }
      throw new Error('An error occurred while querying Gmail: ' + error.message);
    }
  }
  
  async function deleteStoredTokens(userId) {
    const db = getAdminFirestore();
    await db.collection('user_tokens').doc(userId).delete();
  }