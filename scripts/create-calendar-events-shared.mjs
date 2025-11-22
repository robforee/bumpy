#!/usr/bin/env node

/**
 * Script to create calendar events and share them with a specific email
 *
 * This script creates two events for 2025-11-19 and shares them with robforee@gmail.com:
 * 1. 7:00 AM - Meet Drew at Chukar Circle - Ozone Treatment Check
 * 2. 10:00 AM - Meet Sam at his house
 *
 * Usage: node create-calendar-events-shared.mjs [email]
 */

import { google } from 'googleapis';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '/home/robforee/auth/.env' });

const TARGET_EMAIL = process.argv[2] || 'robforee@gmail.com';

async function createCalendarEventsShared() {
  try {
    console.log('🔑 Setting up Google Calendar API...');

    // Set up authentication using service account
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const authClient = await auth.getClient();
    const calendar = google.calendar({ version: 'v3', auth: authClient });

    console.log('✅ Authentication successful\n');

    // Event 1: Meet Drew at Chukar Circle
    const event1 = {
      summary: 'Meet Drew at Chukar Circle - Ozone Treatment Check',
      location: '9602 Chukar Circle',
      description: 'Check out the ozone treatment work at Drew\'s property',
      start: {
        dateTime: '2025-11-19T07:00:00-08:00', // Pacific Time
        timeZone: 'America/Los_Angeles',
      },
      end: {
        dateTime: '2025-11-19T08:00:00-08:00',
        timeZone: 'America/Los_Angeles',
      },
      attendees: [
        { email: TARGET_EMAIL },
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
        ],
      },
      guestsCanModify: true,
    };

    // Event 2: Meet Sam at his house
    const event2 = {
      summary: 'Meet Sam at his house',
      description: 'Meeting with Sam',
      start: {
        dateTime: '2025-11-19T10:00:00-08:00', // Pacific Time
        timeZone: 'America/Los_Angeles',
      },
      end: {
        dateTime: '2025-11-19T11:00:00-08:00',
        timeZone: 'America/Los_Angeles',
      },
      attendees: [
        { email: TARGET_EMAIL },
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
        ],
      },
      guestsCanModify: true,
    };

    console.log(`📅 Creating calendar events for November 19, 2025 and sharing with ${TARGET_EMAIL}...\n`);

    // Create Event 1
    console.log('Creating Event 1...');
    const created1 = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event1,
      sendUpdates: 'all', // Send invitation email
    });

    console.log('✅ Event 1 created and shared!');
    console.log(`   Title: ${created1.data.summary}`);
    console.log(`   Time: ${new Date(created1.data.start.dateTime).toLocaleString()}`);
    console.log(`   Location: ${created1.data.location}`);
    console.log(`   Shared with: ${TARGET_EMAIL}`);
    console.log(`   Event ID: ${created1.data.id}`);
    console.log(`   Link: ${created1.data.htmlLink}\n`);

    // Create Event 2
    console.log('Creating Event 2...');
    const created2 = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event2,
      sendUpdates: 'all', // Send invitation email
    });

    console.log('✅ Event 2 created and shared!');
    console.log(`   Title: ${created2.data.summary}`);
    console.log(`   Time: ${new Date(created2.data.start.dateTime).toLocaleString()}`);
    console.log(`   Shared with: ${TARGET_EMAIL}`);
    console.log(`   Event ID: ${created2.data.id}`);
    console.log(`   Link: ${created2.data.htmlLink}\n`);

    // Summary
    console.log('='.repeat(70));
    console.log('✨ SUMMARY - Both events created and shared successfully!');
    console.log('='.repeat(70));
    console.log(`\nEvent 1: ${created1.data.summary}`);
    console.log(`  Date/Time: ${new Date(created1.data.start.dateTime).toLocaleString()}`);
    console.log(`  Location: ${created1.data.location}`);
    console.log(`  Shared with: ${TARGET_EMAIL}`);
    console.log(`  Event ID: ${created1.data.id}`);
    console.log(`  Calendar Link: ${created1.data.htmlLink}`);

    console.log(`\nEvent 2: ${created2.data.summary}`);
    console.log(`  Date/Time: ${new Date(created2.data.start.dateTime).toLocaleString()}`);
    console.log(`  Shared with: ${TARGET_EMAIL}`);
    console.log(`  Event ID: ${created2.data.id}`);
    console.log(`  Calendar Link: ${created2.data.htmlLink}`);
    console.log('='.repeat(70));
    console.log(`\n📧 Calendar invitations have been sent to ${TARGET_EMAIL}`);

    return {
      event1: {
        id: created1.data.id,
        summary: created1.data.summary,
        htmlLink: created1.data.htmlLink,
      },
      event2: {
        id: created2.data.id,
        summary: created2.data.summary,
        htmlLink: created2.data.htmlLink,
      },
    };

  } catch (error) {
    console.error('\n❌ Error creating calendar events:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
    throw error;
  }
}

// Run the script
createCalendarEventsShared()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    console.log('📋 Check your email for calendar invitations.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  });
