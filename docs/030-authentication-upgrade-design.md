# Detailed Design Document: Authentication Upgrade and Gmail Integration

## 1. Overview

This document outlines the design for upgrading the authentication system of web-bumpy to include OAuth 2.0 server-side flow for Gmail access while maintaining the existing Firebase Authentication for website login.

## 2. Goals

- Maintain existing Firebase Authentication for website login
- Implement OAuth 2.0 server-side flow for long-term access to Gmail
- Enable secure server-side Gmail querying
- Allow client-side Gmail querying when appropriate
- Ensure proper token management and security

## 3. Authentication Flow

### 3.1 Sign-In Process

1. User initiates sign-in via the Header component
2. `signInWithGoogle()` in auth.js handles the sign-in process
3. During sign-in, request additional scopes for Gmail access
4. On successful sign-in, retrieve and securely store the refresh token
5. Update UI based on authentication state

### 3.2 OAuth 2.0 Consent Flow

1. Modify `signInWithGoogle()` function in auth.js:
   ```javascript
   export async function signInWithGoogle() {
     const provider = new GoogleAuthProvider();
     provider.addScope('https://www.googleapis.com/auth/gmail.modify');
     provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
     
     try {
       const result = await signInWithPopup(auth, provider);
       const credential = GoogleAuthProvider.credentialFromResult(result);
       const token = credential.accessToken;
       
       // Send tokens to backend
       await sendTokensToBackend(token, result.user.refreshToken, result.user.uid);
       
       return result.user;
     } catch (error) {
       console.error("Error signing in with Google", error);
       throw error;
     }
   }
   
   async function sendTokensToBackend(accessToken, refreshToken, userId) {
     // Implement secure token transmission to backend
     // This will be a new server endpoint
   }
   ```

2. Create a new server endpoint in `src/app/api/storeTokens.js`:
   ```javascript
   import { getAdminFirestore } from '@/src/lib/firebase/adminApp';

   export default async function handler(req, res) {
     if (req.method === 'POST') {
       const { accessToken, refreshToken, userId } = req.body;
       
       const db = getAdminFirestore();
       const userTokensRef = db.collection('userTokens').doc(userId);
       
       await userTokensRef.set({
         refreshToken: refreshToken,
         accessToken: accessToken,
         createdAt: new Date()
       }, { merge: true });
       
       res.status(200).json({ message: 'Tokens stored successfully' });
     } else {
       res.status(405).json({ message: 'Method not allowed' });
     }
   }
   ```

## 4. Token Management

### 4.1 Token Storage

1. Create a new Firestore collection called `userTokens`
2. Store refresh tokens and access tokens in this collection
3. Implement the following Firestore security rules:
   ```
   match /userTokens/{userId} {
     allow read, write: if request.auth != null && request.auth.uid == userId;
   }
   ```

### 4.2 Token Refresh Mechanism

1. Create a new file `src/lib/firebase/tokenManager.js`:
   ```javascript
   import { getAdminFirestore } from '@/src/lib/firebase/adminApp';
   import { google } from 'googleapis';

   const oauth2Client = new google.auth.OAuth2(
     process.env.GOOGLE_CLIENT_ID,
     process.env.GOOGLE_CLIENT_SECRET,
     process.env.GOOGLE_REDIRECT_URI
   );

   export async function refreshAccessToken(userId) {
     const db = getAdminFirestore();
     const userTokensRef = db.collection('userTokens').doc(userId);
     
     const tokenDoc = await userTokensRef.get();
     const { refreshToken } = tokenDoc.data();
     
     oauth2Client.setCredentials({
       refresh_token: refreshToken
     });
     
     const { token } = await oauth2Client.getAccessToken();
     
     await userTokensRef.update({
       accessToken: token,
       lastRefreshed: new Date()
     });
     
     return token;
   }
   ```

## 5. Gmail API Integration

### 5.1 Server-side Gmail Operations

1. Create a new file `src/lib/gmail/serverOperations.js`:
   ```javascript
   import { google } from 'googleapis';
   import { refreshAccessToken } from '../firebase/tokenManager';

   const oauth2Client = new google.auth.OAuth2(
     process.env.GOOGLE_CLIENT_ID,
     process.env.GOOGLE_CLIENT_SECRET,
     process.env.GOOGLE_REDIRECT_URI
   );

   export async function fetchEmails(userId, query = '') {
     const accessToken = await refreshAccessToken(userId);
     oauth2Client.setCredentials({ access_token: accessToken });
     
     const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
     
     const response = await gmail.users.messages.list({
       userId: 'me',
       q: query
     });
     
     return response.data.messages;
   }

   // Implement other Gmail operations (send email, read email, etc.) here
   ```

### 5.2 Client-side Gmail Operations

1. Create a new file `src/lib/gmail/clientOperations.js`:
   ```javascript
   import axios from 'axios';

   export async function fetchEmailsFromServer(query = '') {
     try {
       const response = await axios.get('/api/gmail/fetchEmails', { params: { query } });
       return response.data;
     } catch (error) {
       console.error('Error fetching emails:', error);
       throw error;
     }
   }

   // Implement other client-side Gmail operations here
   ```

2. Create corresponding server endpoints in `src/app/api/gmail/fetchEmails.js`:
   ```javascript
   import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp";
   import { fetchEmails } from "@/src/lib/gmail/serverOperations";

   export default async function handler(req, res) {
     if (req.method === 'GET') {
       const { currentUser } = await getAuthenticatedAppForUser();
       
       if (!currentUser) {
         return res.status(401).json({ message: 'Unauthorized' });
       }
       
       const { query } = req.query;
       
       try {
         const emails = await fetchEmails(currentUser.uid, query);
         res.status(200).json(emails);
       } catch (error) {
         console.error('Error fetching emails:', error);
         res.status(500).json({ message: 'Internal server error' });
       }
     } else {
       res.status(405).json({ message: 'Method not allowed' });
     }
   }
   ```

## 6. Security Considerations

1. Implement rate limiting on Gmail API endpoints to prevent abuse
2. Ensure all server-side operations validate user authentication before accessing or modifying data
3. Use HTTPS for all client-server communications
4. Implement proper error handling to avoid exposing sensitive information in error messages
5. Regularly rotate OAuth 2.0 client secrets and update the application accordingly

## 7. Updates to Existing Components

### 7.1 Header.jsx

Update the Header component to display Gmail-related options when the user has granted Gmail access:

```jsx
import { fetchEmailsFromServer } from "@/src/lib/gmail/clientOperations";

const Header = ({ initialUser }) => {
  // ... existing code ...

  const handleFetchEmails = async () => {
    if (!user) {
      console.log('User not logged in');
      return;
    }

    try {
      const emails = await fetchEmailsFromServer();
      console.log('Fetched emails:', emails);
      // Update UI to display emails or navigate to an email view
    } catch (error) {
      console.error('Error fetching emails:', error);
    }
  };

  return (
    <header>
      {/* ... existing code ... */}
      {user && (
        <div className="menu">
          {/* ... existing menu items ... */}
          <li>
            <a href="#" onClick={handleFetchEmails}>
              Fetch Emails
            </a>
          </li>
        </div>
      )}
    </header>
  );
};
```

### 7.2 Layout.js

Update the Layout component to check for Gmail access permission:

```jsx
import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp";
import { checkGmailAccess } from "@/src/lib/gmail/serverOperations";

export default async function RootLayout({ children }) {
  const { currentUser } = await getAuthenticatedAppForUser();
  const hasGmailAccess = currentUser ? await checkGmailAccess(currentUser.uid) : false;

  return (
    <html lang="en">
      <body>
        <Header initialUser={currentUser?.toJSON()} hasGmailAccess={hasGmailAccess} />
        <main>{children}</main>
      </body>
    </html>
  );
}
```

## 8. Next Steps

1. Implement the designed changes in the codebase
2. Create unit tests for new functionality
3. Perform thorough testing of the entire authentication and Gmail access flow
4. Update documentation and comments throughout the codebase
5. Conduct a security review of the implemented changes
6. Plan and execute a phased rollout of the new features

This design document provides a comprehensive plan for upgrading the authentication system to include OAuth 2.0 server-side flow for Gmail access while maintaining the existing Firebase Authentication. It covers the authentication flow, token management, Gmail API integration, security considerations, and necessary updates to existing components.
