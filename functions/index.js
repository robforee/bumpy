// functions/index.js

const { OpenAI } = require('openai');
const {logger} = require("firebase-functions");
const {onRequest} = require("firebase-functions/v2/https");
const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

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

