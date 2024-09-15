# Authentication Structure for queryEmails Functionality

We are testing an authentication structure for a web application that uses Firebase Authentication and integrates with the Gmail API. The structure involves the following components:

1. Firebase Authentication: Used for user sign-in and management.
2. OAuth 2.0: Implemented for long-term access to Google services, specifically Gmail.
3. Token Management: Involves storing and refreshing OAuth tokens securely.

Key Components:

1. `src/lib/firebase/adminAppCommon.js`: 
   - Initializes Firebase Admin SDK
   - Provides functions to get admin app, auth, and Firestore instances

2. `src/lib/gmail/gmailOperationsCommon.js`:
   - Handles Gmail-related operations
   - Includes functions for getting user tokens, querying emails, and fetching email content

3. `scripts/data/queryEmails.js`:
   - A Node.js script to test email querying functionality
   - Loads environment variables and uses Gmail operations

4. `.env.local`:
   - Contains necessary environment variables, including Firebase configuration

Current Flow:
1. The script loads environment variables from `.env.local`
2. It initializes the Firebase Admin SDK using these variables
3. The script then attempts to:
   a. Retrieve user tokens from Firestore
   b. Use these tokens to query unread emails via the Gmail API
   c. Fetch and display the subject of the first unread email

We're currently troubleshooting issues related to:
1. Proper loading of environment variables
2. Correct initialization of Firebase Admin SDK
3. Successful retrieval and use of OAuth tokens for Gmail API requests

The main goal is to ensure that this authentication structure allows secure and efficient querying of a user's Gmail inbox through our application's backend.
