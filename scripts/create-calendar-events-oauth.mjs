#!/usr/bin/env node

/**
 * Create calendar events using user OAuth credentials (not service account)
 * This creates events directly on the user's personal Google Calendar
 *
 * Usage: node create-calendar-events-oauth.mjs <email>
 */

import { getCalendarClientByEmail } from '../../packages/auth-google-clients/index.mjs';

const userEmail = process.argv[2] || 'robforee@gmail.com';

async function createCalendarEvents() {
  try {
    console.log(`\n🔑 Getting Calendar client for ${userEmail}...`);

    // Get authenticated calendar client using user's OAuth tokens
    const calendar = await getCalendarClientByEmail(userEmail);

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
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
        ],
      },
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
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
        ],
      },
    };

    console.log('📅 Creating calendar events for November 19, 2025...\n');

    // Create Event 1
    console.log('Creating Event 1...');
    const created1 = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event1,
    });

    console.log('✅ Event 1 created successfully!');
    console.log(`   Title: ${created1.data.summary}`);
    console.log(`   Time: ${new Date(created1.data.start.dateTime).toLocaleString()}`);
    console.log(`   Location: ${created1.data.location}`);
    console.log(`   Event ID: ${created1.data.id}`);
    console.log(`   Link: ${created1.data.htmlLink}\n`);

    // Create Event 2
    console.log('Creating Event 2...');
    const created2 = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event2,
    });

    console.log('✅ Event 2 created successfully!');
    console.log(`   Title: ${created2.data.summary}`);
    console.log(`   Time: ${new Date(created2.data.start.dateTime).toLocaleString()}`);
    console.log(`   Event ID: ${created2.data.id}`);
    console.log(`   Link: ${created2.data.htmlLink}\n`);

    // Summary
    console.log('='.repeat(70));
    console.log('✨ SUMMARY - Both events created successfully!');
    console.log('='.repeat(70));
    console.log(`\nEvent 1: ${created1.data.summary}`);
    console.log(`  Date/Time: ${new Date(created1.data.start.dateTime).toLocaleString()}`);
    console.log(`  Location: ${created1.data.location}`);
    console.log(`  Event ID: ${created1.data.id}`);
    console.log(`  Calendar Link: ${created1.data.htmlLink}`);

    console.log(`\nEvent 2: ${created2.data.summary}`);
    console.log(`  Date/Time: ${new Date(created2.data.start.dateTime).toLocaleString()}`);
    console.log(`  Event ID: ${created2.data.id}`);
    console.log(`  Calendar Link: ${created2.data.htmlLink}`);
    console.log('='.repeat(70));

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
createCalendarEvents()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  });
