// scripts/data/queryEmails.js

const path = require('path');
const dotenv = require('dotenv');

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
const { google } = require('googleapis');

async function main() {
    const userId = 'e660ZS3gfxTXZR06kqn5M23VCzl2';
    
    try {
      console.log('Starting email query process...');
  
      console.log('Attempting to get a valid access token...');

      // GET VALID USER TOKEN
      const { accessToken, expirationTime } = await getValidAccessToken(userId);
      
      // AUTH WITH USER TOKEN
      const oauth2Client = new google.auth.OAuth2();
            oauth2Client.setCredentials({ access_token: accessToken });

      // QUERY-EMAIL emailResponse
      const myGmail =  google.gmail({ version: 'v1', auth: oauth2Client });
      const emailResponse = await myGmail.users.messages.list({
        userId: 'me',
        q: '',
        maxResults: 10  // Limit to 10 results for this example
      });
      let messages = emailResponse.data.messages || [];

      // QUERY DRIVE driveResponse  "'root' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder'",
      const myDrive = google.drive({ version: 'v3', auth: oauth2Client });

      const driveResponse = await myDrive.files.list(
        { q: "trashed = false",
          fields: 'files(id, name, mimeType, modifiedTime)',
          orderBy: 'modifiedTime desc',
          pageSize: 10
        }        
      );
      const rootFiles = driveResponse.data.files || [];
      

      console.log(`Found ${messages.length} unread messages:`);
      console.log(`Found ${rootFiles.length} docs`,rootFiles[0]);
      
      // Get content of first email
      if (messages.length > 0) {
        console.log('Fetching content of first email...');
        const emailContent = await getEmailContent(accessToken, messages[0].id);
        console.log('First email subject:', emailContent.payload.headers.find(h => h.name === 'Subject').value);
      }
  
      console.log('Email query process completed successfully.');
    } catch (error) {
      console.error('Error in main function:', error.message);
    }
  }
  
  main().catch(error => {
    console.error('Unhandled error in main:', error.message);
    process.exit(1);
  });