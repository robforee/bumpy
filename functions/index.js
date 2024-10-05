// functions/index.js

const { OpenAI } = require('openai');
const { logger } = require("firebase-functions");

const {onRequest} = require("firebase-functions/v2/https");
const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");

// onCall is for calling via Firebase SDK
const { defineSecret } = require("firebase-functions/params");
const cors = require('cors')({origin: true});
const moment = require('moment-timezone');

const admin = require('firebase-admin');

console.log('FUNCTIONS_EMULATOR ',process.env.FUNCTIONS_EMULATOR )

const functions = require('firebase-functions');
// const functions = process.env.FUNCTIONS_EMULATOR 
//   ? require('firebase-functions')
//   : require('firebase-admin/functions');

// The Firebase Admin SDK to access Firestore.
const {initializeApp} = require("firebase-admin/app");
 
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const crypto = require('crypto');

const openaiApiKey = defineSecret('OPENAI_API_KEY');
const encryptionKey = defineSecret('ENCRYPTION_KEY');

initializeApp();


exports.addmessage = onRequest(async (req, res) => {
  // Grab the text parameter.
  const original = req.query.text;
  // Push the new message into Firestore using the Firebase Admin SDK.
  const writeResult = await getFirestore()
      .collection("messages")
      .add({original: original});
  // Send back a message that we've successfully written the message
  res.json({result: `Message with ID: ${writeResult.id} added.`});
});

exports.makeuppercase = onDocumentCreated("/messages/{documentId}", (event) => {
  // Grab the current value of what was written to Firestore.
  const original = event.data.data().original;

  // Access the parameter `{documentId}` with `event.params`
  logger.log("Uppercasing", event.params.documentId, original);

  const uppercase = original.toUpperCase();

  // You must return a Promise when performing
  // asynchronous tasks inside a function
  // such as writing to Firestore.
  // Setting an 'uppercase' field in Firestore document returns a Promise.
  return event.data.ref.set({uppercase}, {merge: true});
});

exports.getServerTime = onCall((request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }  
  console.log('ping server');
  
  return {
    serverTime: new Date().toISOString()
  };
});

exports.addTopic = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in');
  }

  const { parentId, topicData } = request.data;
  const userId = request.auth.uid;

  const db = getFirestore();

  try {
    const newTopic = {
      ...topicData,
      topic_type: topicData.topic_type || 'default',
      owner: userId,
      parents: parentId ? [parentId] : [],
      children: [],
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('topics').add(newTopic);

    if (parentId) {
      await db.doc(`topics/${parentId}`).update({
        children: FieldValue.arrayUnion(docRef.id)
      });
    }

    return { id: docRef.id };
  } catch (error) {
    throw new functions.https.HttpsError('internal', 'Error adding new topic', error);
  }
}); 

exports.updateTopic = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in');
  }

  const { topicId, updateData } = request.data;
  const userId = request.auth.uid;

  const db = getFirestore();

  try {
    const topicRef = db.collection('topics').doc(topicId);
    const topicDoc = await topicRef.get();

    if (!topicDoc.exists) {
      throw new HttpsError('not-found', 'Topic not found');
    }

    if (topicDoc.data().owner !== userId) {
      throw new HttpsError('permission-denied', 'User does not have permission to update this topic');
    }

    await topicRef.update({
      ...updateData,
      updated_at: FieldValue.serverTimestamp()
    });

    return { message: 'Topic updated successfully' };
  } catch (error) {
    console.error('Error updating topic:', error);
    throw new HttpsError('internal', 'Error updating topic', error);
  }
});

exports.updateUser = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in');
  }

  const { updateData } = request.data;
  const userId = request.auth.uid;

  const db = getFirestore();

  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User not found');
    }

    await userRef.update({
      ...updateData,
      updated_at: FieldValue.serverTimestamp()
    });

    return { message: 'User updated successfully' };
  } catch (error) {
    console.error('Error updating user:', error);
    throw new HttpsError('internal', 'Error updating user', error);
  }
});

exports.runOpenAIAndAddTopic = onCall({ secrets: [openaiApiKey] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in');
  }

  const { model, temp, response_format, messages, owner, parentId, title } = request.data;

  // Initialize OpenAI
  const openai = new OpenAI({ apiKey: openaiApiKey.value() });

  try {
    // Run OpenAI query
    const request = {
      model: model || "gpt-4o-mini",
      temperature: temp || 0.1,
      response_format: response_format || { type: "json_object" },
      messages: messages,
    };
    const response = await openai.chat.completions.create(request);

    const content = response.choices[0].message.content;

    // Add topic
    const db = getFirestore();
    const newTopic = {
      topic_type: 'prompt-response',
      title: title,
      content: content,
      owner: owner || request.auth.uid,
      parents: parentId ? [parentId] : [],
      children: [],
      created_at: new Date(),
      updated_at: new Date()
    };

    const docRef = await db.collection('topics').add(newTopic);

    if (parentId) {
      await db.doc(`topics/${parentId}`).update({
        children: FieldValue.arrayUnion(docRef.id)
      });
    }

    return { 
      id: docRef.id,
      content: content
    };
  } catch (error) {
    console.error("Error in runOpenAIAndAddTopic:", error);
    throw new HttpsError('internal', 'Error processing request', error);
  }
});

function encrypt(text) {
  // Ensure the encryption key is exactly 32 bytes long
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'defaultdevkey', 'salt', 32);
  
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

// ,"https://bumpy-roads--analyst-server.us-central1.hosted.app"
exports.storeTokens2 = functions.https.onCall( { cors:  true  }, async (data, context) => {

  //console.log('Received data structure:', JSON.stringify(data, null, 2));
  
  // Access the actual data sent by the client
  const clientData = data.data;
  
  //console.log('Client data:', JSON.stringify(clientData, null, 2));
  
  // Safely access properties from clientData
  const accessToken = clientData?.accessToken;
  const refreshToken = clientData?.refreshToken;
  const userId = clientData?.userId;

  // Check if required data is present
  if (!accessToken || !refreshToken || !userId) {
    console.error('Missing required data');
    throw new functions.https.HttpsError('invalid-argument', 'Missing required data');
  }

  try {
    const expirationTime = Date.now() + 3600000; // 1 hour
    const encryptedAccessToken = encrypt(accessToken);
    const encryptedRefreshToken = encrypt(refreshToken);
    const updateTime = moment().tz('America/Chicago').format('YYYY-MM-DD HH:mm [CST]');

    // Use Admin SDK to write to Firestore
    const db = admin.firestore();
    const userTokensRef = db.collection('user_tokens').doc(userId);

    await userTokensRef.set({
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      expirationTime: expirationTime,
      createdAt: FieldValue.serverTimestamp(),
      updateTime: updateTime
    }, { merge: true });

    console.log('Tokens stored successfully. Update time:', updateTime);
    return { message: 'Tokens stored successfully', updateTime: updateTime };
  } catch (error) {
    console.error('Error storing tokens:', error);
    throw new functions.https.HttpsError('internal', 'Error storing tokens', error);
  }
});

exports.storeTokens3 = functions.https.onCall(async (data, context) => {
  const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true';

  const clientData = data.data;

  // is context always empty?
  console.log('context empty now?',context)
  console.log('crypto key?',process.env.ENCRYPTION_KEY)
  // Authentication check
  if (!isEmulator && !context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }

  const { accessToken, refreshToken, userId } = clientData;
  
  // Use provided userId in all cases, as we're not using the auth emulator
  const authenticatedUserId = userId;

  if (!authenticatedUserId) {
    throw new functions.https.HttpsError('invalid-argument', 'User ID is required');
  }

  function encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(process.env.ENCRYPTION_KEY || 'defaultkeyfordevenv1234567890123456', 'utf8'), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  try {
    const expirationTime = Date.now() + 3600000; // 1 hour
    const encryptedAccessToken = encrypt(accessToken);
    const encryptedRefreshToken = encrypt(refreshToken);
    const updateTime = moment().utc().format('YYYY-MM-DD HH:mm:ss [UTC]');

    // Use Admin SDK to write to Firestore (works in both emulator and production)
    const db = admin.firestore();
    const userTokensRef = db.collection('user_tokens').doc(authenticatedUserId);

    await userTokensRef.set({
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      expirationTime: expirationTime,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updateTime: updateTime
    }, { merge: true });

    console.log('Tokens stored successfully. Update time:', updateTime);
    return { message: 'Tokens stored successfully', updateTime: updateTime };
  } catch (error) {
    console.error('Error storing tokens:', error);
    throw new functions.https.HttpsError('internal', 'Error storing tokens', error);
  }
});

// had this , cors: ['http://localhost:3000','http://redshirt.info']
exports.storeTokens1 = onCall({ secrets: [encryptionKey] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in');
  }

  const { accessToken, refreshToken } = request.data;
  const userId = request.auth.uid;

  const db = getFirestore();
  const userTokensRef = db.collection('user_tokens').doc(userId);

  function encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encryptionKey.value(), 'hex'), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  try {
    const expirationTime = Date.now() + 3600000; // 1 hour
    const encryptedAccessToken = encrypt(accessToken);
    const encryptedRefreshToken = encrypt(refreshToken);
    const updateTime = moment().utc().format('YYYY-MM-DD HH:mm:ss [UTC]');

    await userTokensRef.set({
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      expirationTime: expirationTime,
      createdAt: FieldValue.serverTimestamp(),
      updateTime: updateTime
    }, { merge: true });

    logger.log('Tokens stored successfully. Update time:', updateTime);
    return { message: 'Tokens stored successfully', updateTime: updateTime };
  } catch (error) {
    logger.error('Error storing tokens:', error);
    throw new HttpsError('internal', 'Error storing tokens', error);
  }
});
exports.storeTokens = onCall({ secrets: [encryptionKey] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in');
  }

  const { accessToken, refreshToken } = request.data;
  const userId = request.auth.uid;

  const db = getFirestore();
  const userTokensRef = db.collection('user_tokens').doc(userId);

  function encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encryptionKey.value(), 'hex'), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  try {
    const expirationTime = Date.now() + 3600000; // 1 hour
    const encryptedAccessToken = encrypt(accessToken);
    const encryptedRefreshToken = encrypt(refreshToken);

    await userTokensRef.set({
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      expirationTime: expirationTime,
      createdAt: FieldValue.serverTimestamp()
    }, { merge: true });

    return { message: 'Tokens stored successfully' };
  } catch (error) {
    logger.error('Error storing tokens:', error);
    throw new HttpsError('internal', 'Error storing tokens', error);
  }
});

exports.decryptTokens = onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }

  const userId = context.auth.uid;
  const db = getFirestore();

  function decrypt(text) {
    const [ivHex, encryptedHex] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(process.env.ENCRYPTION_KEY, 'hex'), iv);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }

  try {
    const userTokensRef = db.collection('user_tokens').doc(userId);
    const tokenDoc = await userTokensRef.get();

    if (!tokenDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'No tokens found for this user');
    }

    const { accessToken, refreshToken } = tokenDoc.data();

    return {
      accessToken: decrypt(accessToken),
      refreshToken: decrypt(refreshToken)
    };
  } catch (error) {
    console.error('Error decrypting tokens:', error);
    throw new functions.https.HttpsError('internal', 'Error decrypting tokens', error);
  }
});

const cleanForTask = async (task) => {
  return str.replace(/[\\"\u0000-\u001F\u007F-\u009F]/g, (c) => {
    return '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4);
  });
};

exports.runOpenAiQuery = onCall({ secrets: [openaiApiKey] }, async (request) => {
  const openai = new OpenAI({ apiKey: openaiApiKey.value() });

  try {
    const {
      systemPrompt,
      userPrompts,
      model,
      temperature,
      responseFormat,
      owner
    } = request.data;

    console.log('Received request:', JSON.stringify(request.data, null, 2));

    const messages = [
      { role: "system", content: systemPrompt },
      ...userPrompts.map(prompt => ({ role: "user", content: prompt }))
    ];

    console.log('Sending request to OpenAI:', JSON.stringify({
      model,
      temperature,
      response_format: responseFormat,
      messages
    }, null, 2));

    const openAiResponse = await openai.chat.completions.create({
      model,
      temperature,
      response_format: responseFormat,
      messages,
    });

    console.log('Received response from OpenAI:', JSON.stringify(openAiResponse, null, 2));

    const content = openAiResponse.choices[0].message.content;

    return { content };
  } catch (error) {
    console.error("Detailed error in runOpenAiQuery:", JSON.stringify(error, null, 2));
    throw new HttpsError('internal', 'Error processing OpenAI query', error.message);
  }
});