// functions/index.js
/*
current firebase functions code uses CommonJS module syntax (require), 
not using ES Modules syntax (import)

*/

const { OpenAI } = require('openai');
const { logger } = require("firebase-functions");
const { onSchedule } = require("firebase-functions/v2/scheduler");

const {onRequest} = require("firebase-functions/v2/https");
const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");

// onCall is for calling via Firebase SDK
const { defineSecret } = require("firebase-functions/params");
const moment = require('moment-timezone');


const admin = require('firebase-admin');
const { google } = require('googleapis');


console.log('FUNCTIONS_EMULATOR ',process.env.FUNCTIONS_EMULATOR )

const functions = require('firebase-functions');
// const functions = process.env.FUNCTIONS_EMULATOR 
//   ? require('firebase-functions')
//   : require('firebase-admin/functions');

// The Firebase Admin SDK to access Firestore.
const {initializeApp} = require("firebase-admin/app");
 
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const crypto = require('crypto');

const googleServiceAccountKey = defineSecret('GOOGLE_SERVICE_ACCOUNT_KEY');
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

// Function to send Google Chat message
async function sendGoogleChatMessage(sender, recipient, message) {
    try {
        // Create JWT client using service account
        const auth = new google.auth.JWT({
            email: sender,
            key: googleServiceAccountKey.value(),
            scopes: ['https://www.googleapis.com/auth/chat.messages']
        });

        // Create Chat API client
        const chat = google.chat({
            version: 'v1',
            auth
        });

        // Prepare the message
        const chatMessage = {
            parent: recipient,  // Space name where to send the message
            requestBody: {
                text: message,
                // Space for future card formatting
                // cards: [] 
            }
        };

        // Send message
        const response = await chat.spaces.messages.create(chatMessage);
        return response.data;
    } catch (error) {
        logger.error('Failed to send Google Chat message:', error);
        throw error;
    }
}

exports.scheduledHelloWorld = onSchedule({
    schedule: 'every 1 hours',
    timeZone: 'America/Chicago',
    retryCount: 3,
    maxRetrySeconds: 60
}, async (event) => {
    try {
        // Get data from the scheduler event
        const data = event.data || {};
        
        // Format timestamp in Central time
        const timestamp = moment()
            .tz('America/Chicago')
            .format('YYYY-MM-DD HH:mm:ss z');
        
        // Prepare status message
        let statusMessage = `🤖 Scheduled Task Report\n\n`;
        
        // Simulate work and potential failure
        if (data.shouldFail === true) {
            throw new Error('Scheduled task failed intentionally');
        }

        // Success message
        statusMessage += `✅ Status: Success\n`;
        statusMessage += `⏰ Timestamp: ${timestamp}\n`;
        if (Object.keys(data).length > 0) {
            statusMessage += `📄 Data: ${JSON.stringify(data, null, 2)}\n`;
        }

        // Log success
        logger.info('Scheduled task completed successfully', { data });
        
        // Send Google Chat message
        await sendGoogleChatMessage(
            'robert@redshirt.info',
            'robforee@gmail.com',
            statusMessage
        );

        return {
            status: 'success',
            message: 'Hello World executed successfully',
            timestamp,
            data
        };
    } catch (error) {
        // Format error message
        const errorMessage = `🤖 Scheduled Task Report\n\n` +
            `❌ Status: Error\n` +
            `⏰ Timestamp: ${moment().tz('America/Chicago').format('YYYY-MM-DD HH:mm:ss z')}\n` +
            `🚨 Error: ${error.message}\n`;
        
        // Log error
        logger.error('Scheduled task failed', { error: error.message, data: event.data });
        
        // Send error notification via Google Chat
        await sendGoogleChatMessage(
            'robert@redshirt.info',
            'robforee@gmail.com',
            errorMessage
        );
        
        // Throwing the error will trigger the retry policy
        throw error;
    }
});