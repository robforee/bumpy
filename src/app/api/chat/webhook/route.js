// src/app/api/chat/webhook/route.js
/**
 * Google Chat Webhook Endpoint
 *
 * Receives incoming messages from Google Chat and processes them
 *
 * Configured in Google Cloud Console:
 * - Webhook URL: https://redshirt.info/api/chat/webhook
 * - Event types: MESSAGE, ADDED_TO_SPACE, REMOVED_FROM_SPACE
 */

import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import admin from 'firebase-admin';
import crypto from 'crypto';

// Initialize Firebase Admin if needed
if (admin.apps.length === 0) {
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const serviceAccount = JSON.parse(require('fs').readFileSync(serviceAccountPath, 'utf8'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}

/**
 * Verify request is from Google
 * Google Chat includes a bearer token in Authorization header
 */
function verifyGoogleRequest(request) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  // In production, verify the JWT token
  // For now, just check it exists
  return true;
}

/**
 * Decrypt token from Firestore
 */
function decrypt(text) {
  if (!text || !text.includes(':')) return text;

  const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);

  const [ivHex, encryptedHex] = text.split(':');
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    key,
    Buffer.from(ivHex, 'hex')
  );

  return decipher.update(Buffer.from(encryptedHex, 'hex'), 'hex', 'utf8') +
         decipher.final('utf8');
}

/**
 * Get user credentials for responding
 */
async function getUserCredentials(userId) {
  const db = admin.firestore();
  const tokenRef = db.collection('service_credentials').doc(`${userId}_messenger`);
  const tokenDoc = await tokenRef.get();

  if (!tokenDoc.exists) {
    throw new Error(`No messenger credentials found for user: ${userId}`);
  }

  const tokenData = tokenDoc.data();

  return {
    access_token: decrypt(tokenData.accessToken),
    refresh_token: decrypt(tokenData.refreshToken)
  };
}

/**
 * Send response to Google Chat
 */
async function sendChatResponse(spaceName, messageText, userId) {
  try {
    const credentials = await getUserCredentials(userId);

    const oauth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token
    });

    const chat = google.chat({ version: 'v1', auth: oauth2Client });

    const response = await chat.spaces.messages.create({
      parent: spaceName,
      requestBody: {
        text: messageText
      }
    });

    return response.data;

  } catch (error) {
    console.error('Error sending chat response:', error);
    throw error;
  }
}

/**
 * Process MESSAGE event
 */
async function handleMessage(event) {
  const { message, space, user } = event;

  // Don't respond to bot's own messages
  if (message.sender.type === 'BOT') {
    return null;
  }

  console.log('[Chat Webhook] Message received:', {
    from: user.displayName,
    text: message.text,
    space: space.name
  });

  // Simple echo response for now
  // In production, this would process with PAI/chat-manager
  const responseText = `Echo: ${message.text}`;

  // For now, just return synchronous response
  // Google Chat will display this immediately
  return {
    text: responseText
  };
}

/**
 * Process ADDED_TO_SPACE event
 */
async function handleAddedToSpace(event) {
  const { space } = event;

  console.log('[Chat Webhook] Added to space:', space.name);

  return {
    text: `Hello! I'm your PAI assistant. Send me a message and I'll help you out.`
  };
}

/**
 * Process REMOVED_FROM_SPACE event
 */
async function handleRemovedFromSpace(event) {
  const { space } = event;

  console.log('[Chat Webhook] Removed from space:', space.name);

  // Can't send message after being removed
  // Just log it
  return null;
}

/**
 * POST handler for Google Chat webhook
 */
export async function POST(request) {
  try {
    // Verify request is from Google
    if (!verifyGoogleRequest(request)) {
      console.error('[Chat Webhook] Unauthorized request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse webhook payload
    const event = await request.json();

    console.log('[Chat Webhook] Event received:', {
      type: event.type,
      space: event.space?.name,
      user: event.user?.displayName
    });

    let response = null;

    // Handle different event types
    switch (event.type) {
      case 'MESSAGE':
        response = await handleMessage(event);
        break;

      case 'ADDED_TO_SPACE':
        response = await handleAddedToSpace(event);
        break;

      case 'REMOVED_FROM_SPACE':
        response = await handleRemovedFromSpace(event);
        break;

      default:
        console.log('[Chat Webhook] Unknown event type:', event.type);
        response = null;
    }

    // Return response to Google Chat
    if (response) {
      return NextResponse.json(response);
    } else {
      return NextResponse.json({});
    }

  } catch (error) {
    console.error('[Chat Webhook] Error processing webhook:', error);

    // Return error to Google Chat
    return NextResponse.json(
      {
        text: `⚠️ Error processing message: ${error.message}`
      },
      { status: 200 } // Return 200 so Google doesn't retry
    );
  }
}

/**
 * GET handler for verification/health check
 */
export async function GET(request) {
  return NextResponse.json({
    status: 'ok',
    service: 'google-chat-webhook',
    timestamp: new Date().toISOString()
  });
}
