// functions/index.js
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');

admin.initializeApp();

const db = admin.firestore();

// Use process.env to access environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || functions.config().encryption?.key;

if (!ENCRYPTION_KEY) {
  console.error('ENCRYPTION_KEY is not set. Please set it in your environment variables or Firebase config.');
  // You might want to throw an error here or handle it appropriately
}

exports.storeToken = functions.https.onCall(async (data, context) => {
  // Ensure the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const { token } = data;
  const userId = context.auth.uid;

  // Encrypt the token
  const encryptedToken = encryptToken(token);

  try {
    // Store the encrypted token in Firestore
    await db.collection('user_tokens').doc(userId).set({
      encryptedToken: encryptedToken,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error storing token:', error);
    throw new functions.https.HttpsError('internal', 'Error storing token.');
  }
});

function encryptToken(token) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

exports.decryptToken = functions.https.onCall(async (data, context) => {
  // Ensure the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const userId = context.auth.uid;

  try {
    const doc = await db.collection('user_tokens').doc(userId).get();
    if (!doc.exists) {
      throw new functions.https.HttpsError('not-found', 'Token not found for user.');
    }

    const { encryptedToken } = doc.data();
    const decryptedToken = decryptToken(encryptedToken);

    // In a real-world scenario, you might want to use this token to make an API call
    // rather than sending it back to the client
    return { token: decryptedToken };
  } catch (error) {
    console.error('Error decrypting token:', error);
    throw new functions.https.HttpsError('internal', 'Error decrypting token.');
  }
});

function decryptToken(encryptedToken) {
  const [iv, encrypted] = encryptedToken.split(':');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

exports.getServerTime = functions.https.onCall((data, context) => {
  console.log('ping server');
  return {
    serverTime: new Date().toISOString()
  };
});

// Uncomment if you want to use the v2 onRequest function
// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });