#!/usr/bin/env node

/**
 * Script to create calendar events using Google Calendar API
 *
 * This script creates two events for 2025-11-19:
 * 1. 7:00 AM - Meet Drew at Chukar Circle
 * 2. 10:00 AM - Meet Sam at his house
 */

import { google } from 'googleapis';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
async function loadEnv() {
  try {
    const envPath = path.join(__dirname, '../.env.local');
    const envContent = await fs.readFile(envPath, 'utf-8');
    const lines = envContent.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        process.env[key] = value;
      }
    }
  } catch (error) {
    console.error('Error loading .env.local:', error.message);
    throw error;
  }
}

// Helper function to authenticate with Google
async function authorize() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI
  );

  // Try to load saved credentials
  const TOKEN_PATH = path.join(__dirname, 'token.json');
  try {
    const token = await fs.readFile(TOKEN_PATH, 'utf-8');
    const credentials = JSON.parse(token);
    oauth2Client.setCredentials(credentials);
    console.log('✅ Loaded saved credentials');
    return oauth2Client;
  } catch (error) {
    console.error('❌ No saved credentials found. Please run authentication first.');
    console.error('You need to get an access token from your Firestore database or run the OAuth flow.');
    throw new Error('Authentication required');
  }
}

// Create a calendar event
async function createEvent(auth, eventDetails) {
  const calendar = google.calendar({ version: 'v3', auth });

  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: eventDetails,
    });

    console.log(`✅ Event created: ${response.data.summary}`);
    console.log(`   Event ID: ${response.data.id}`);
    console.log(`   Link: ${response.data.htmlLink}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error creating event:`, error.message);
    throw error;
  }
}

// Main function
async function main() {
  try {
    console.log('🔑 Loading environment variables...');
    await loadEnv();

    console.log('🔐 Authenticating with Google...');
    const auth = await authorize();

    // Event 1: Meet Drew at Chukar Circle
    const event1 = {
      summary: 'Meet Drew at Chukar Circle - Ozone Treatment Check',
      location: '9602 Chukar Circle',
      description: 'Check out the ozone treatment work at Drew\'s property',
      start: {
        dateTime: '2025-11-19T07:00:00',
        timeZone: 'America/Los_Angeles', // Adjust timezone as needed
      },
      end: {
        dateTime: '2025-11-19T08:00:00',
        timeZone: 'America/Los_Angeles',
      },
      reminders: {
        useDefault: true,
      },
    };

    // Event 2: Meet Sam at his house
    const event2 = {
      summary: 'Meet Sam at his house',
      description: 'Meeting with Sam',
      start: {
        dateTime: '2025-11-19T10:00:00',
        timeZone: 'America/Los_Angeles',
      },
      end: {
        dateTime: '2025-11-19T11:00:00',
        timeZone: 'America/Los_Angeles',
      },
      reminders: {
        useDefault: true,
      },
    };

    console.log('\n📅 Creating calendar events for 2025-11-19...\n');

    const created1 = await createEvent(auth, event1);
    const created2 = await createEvent(auth, event2);

    console.log('\n✨ Summary:');
    console.log('='.repeat(60));
    console.log(`Event 1: ${created1.summary}`);
    console.log(`  Time: ${new Date(created1.start.dateTime).toLocaleString()}`);
    console.log(`  ID: ${created1.id}`);
    console.log(`  Link: ${created1.htmlLink}`);
    console.log('');
    console.log(`Event 2: ${created2.summary}`);
    console.log(`  Time: ${new Date(created2.start.dateTime).toLocaleString()}`);
    console.log(`  ID: ${created2.id}`);
    console.log(`  Link: ${created2.htmlLink}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
