// scripts/data/queryEmails.js

const path = require('path');
const dotenv = require('dotenv');
const { google } = require('googleapis');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Load environment variables from .env.local
let envPath = path.resolve(process.cwd(), '.env.local');
envPath = '~/work/redshirt/web-bumpy/.env.local'
const result = dotenv.config({ path: envPath });

if (result.error) {
  throw result.error;
}

console.log('Loaded environment variables from:', envPath);

const { queryEmails, getEmailContent } = require('../../src/lib/gmail/gmailOperationsCommon');
const { getValidAccessToken } = require('../../src/lib/gmail/tokenManager');
const { getAdminFirestore } = require('../../src/lib/firebase/adminAppCommon');

const serviceAccount_fromFile = require('/home/user/work/auth/analyst-server-firebase-adminsdk-bumpy-2.json');

async function getUserCalendars(calendar) {
  const response = await calendar.calendarList.list();
  return response.data.items;
}

async function getNextCalendarEvents(calendar, calendarId = 'primary', maxResults = 10) {
  const response = await calendar.events.list({
    calendarId: calendarId,
    timeMin: (new Date()).toISOString(),
    maxResults: maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  });
  return response.data.items;
}

async function addCalendarEvent(calendar, calendarId = 'primary') {
  const event = {
    summary: 'New Event from Script',
    start: {
      dateTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      timeZone: 'America/Los_Angeles',
    },
    end: {
      dateTime: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
      timeZone: 'America/Los_Angeles',
    },
  };

  const response = await calendar.events.insert({
    calendarId: calendarId,
    resource: event,
  });
  return response.data;
}

async function main() {
    const userId = 'e660ZS3gfxTXZR06kqn5M23VCzl2';
    
    try {
      console.log('Starting query process...');
  
      console.log('Attempting to get a valid access token...');

      const { accessToken, expirationTime } = await getValidAccessToken(userId);
      
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: accessToken });

      const myGmail = google.gmail({ version: 'v1', auth: oauth2Client });
      const emailResponse = await myGmail.users.messages.list({
        userId: 'me',
        q: '',
        maxResults: 10
      });
      let messages = emailResponse.data.messages || [];
      console.log(`Found ${messages.length} messages.`);

      if (messages.length > 0) {
        console.log('Fetching content of first email...');
        const emailContent = await getEmailContent(accessToken, messages[0].id);
        console.log('First email subject:', emailContent.payload.headers.find(h => h.name === 'Subject').value);
      }

      async function createLabel(name) {
        try {
          const response = await myGmail.users.labels.create({
            userId: 'me',
            requestBody: {
              name: name,
              labelListVisibility: 'labelShow',
              messageListVisibility: 'show'
            }
          });
          console.log(`Label "${name}" created successfully`);
          return response.data.id;
        } catch (error) {
          if (error.code === 409) {
            console.log(`Label "${name}" already exists`);
            const labelsResponse = await myGmail.users.labels.list({ userId: 'me' });
            const existingLabel = labelsResponse.data.labels.find(label => label.name === name);
            return existingLabel.id;
          } else {
            console.error(`Error creating label "${name}":`, error.message);
            throw error;
          }
        }
      }

      // Create parent label
      const redshirtLabelId = await createLabel('redshirt');
      const marketingLabelId = await createLabel('redshirt/marketing');
      const invoiceLabelId = await createLabel('redshirt/accounting/invoice');

      if (messages.length > 0) {
        try {
          await myGmail.users.messages.modify({
            userId: 'me',
            id: messages[0].id,
            requestBody: {
              addLabelIds: [marketingLabelId]
            }
          });
          console.log('Label "redshirt.marketing" applied to the first email');
        } catch (error) {
          console.error('Error applying label to email:', error.message);
        }
      }

      const myDrive = google.drive({ version: 'v3', auth: oauth2Client });
      const driveResponse = await myDrive.files.list({
        q: "trashed = false",
        fields: 'files(id, name, mimeType, modifiedTime)',
        orderBy: 'modifiedTime desc',
        pageSize: 10
      });
      const rootFiles = driveResponse.data.files || [];
      console.log(`Found ${rootFiles.length} docs`, rootFiles[0]);

      const app = initializeApp({
        credential: cert(serviceAccount_fromFile)
      }, 'userApp');
      const db = getFirestore(app);

      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        console.log('User data:', userDoc.data());
      } else {
        console.log('No user document found.');
      }
      console.log('Reading from Firestore...');

      console.log('Writing to Firestore...');
      await db.collection('user_activity').add({
        userId: userId,
        timestamp: new Date(),
        action: 'Queried emails and drive'
      });
      console.log('Activity logged to Firestore.');

      // Calendar operations
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      
      console.log('Getting user calendars...');
      const calendars = await getUserCalendars(calendar);
      console.log('User calendars:', calendars.map(cal => cal.summary));

      console.log('Getting next 10 calendar events...');
      const events = await getNextCalendarEvents(calendar);
      console.log('Next events:', events.map(event => event.summary));

      console.log('Adding a new calendar event...');
      const newEvent = await addCalendarEvent(calendar);
      console.log('New event added:', newEvent.htmlLink);

      console.log('Query process completed successfully.');
    } catch (error) {
      console.error('Error in main function:', error.message);
    }
  }
  
  main().catch(error => {
    console.error('Unhandled error in main:', error.message);
    process.exit(1);
  });