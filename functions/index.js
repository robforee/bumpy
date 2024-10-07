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

// addTopic, updateTopic, updateUser


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