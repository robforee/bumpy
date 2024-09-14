# Step-by-Step Cookbook: Authentication Upgrade Implementation

This cookbook provides a detailed, step-by-step guide for implementing the authentication upgrade and Gmail integration for web-bumpy.

## Step 1: Modify auth.js

File: `src/lib/firebase/auth.js`

1. Update the `signInWithGoogle` function:

```javascript
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "./clientApp";

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  
  // Add the required scopes
  provider.addScope('https://www.googleapis.com/auth/gmail.modify');
  provider.addScope('https://www.googleapis.com/auth/gmail.readonly');

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;

    // Send the tokens to your backend
    await sendTokensToBackend(token, result.user.refreshToken, result.user.uid);

    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
}

async function sendTokensToBackend(accessToken, refreshToken, userId) {
  const response = await fetch('/api/storeTokens', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ accessToken, refreshToken, userId }),
  });

  if (!response.ok) {
    throw new Error('Failed to store tokens');
  }
}
```

## Step 2: Create storeTokens API endpoint

File: `src/app/api/storeTokens.js`

Create this new file and add the following content:

```javascript
import { getAdminFirestore } from '@/src/lib/firebase/adminApp';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { accessToken, refreshToken, userId } = req.body;
    
    const db = getAdminFirestore();
    const userTokensRef = db.collection('userTokens').doc(userId);
    
    try {
      await userTokensRef.set({
        refreshToken: refreshToken,
        accessToken: accessToken,
        createdAt: new Date()
      }, { merge: true });
      
      res.status(200).json({ message: 'Tokens stored successfully' });
    } catch (error) {
      console.error('Error storing tokens:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
```

## Step 3: Create tokenManager.js

File: `src/lib/firebase/tokenManager.js`

Create this new file and add the following content:

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
  if (!tokenDoc.exists) {
    throw new Error('No tokens found for user');
  }
  
  const { refreshToken } = tokenDoc.data();
  
  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });
  
  try {
    const { token } = await oauth2Client.getAccessToken();
    
    await userTokensRef.update({
      accessToken: token,
      lastRefreshed: new Date()
    });
    
    return token;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw error;
  }
}
```

## Step 4: Create serverOperations.js for Gmail

File: `src/lib/gmail/serverOperations.js`

Create this new file and add the following content:

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
  
  try {
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query
    });
    
    return response.data.messages;
  } catch (error) {
    console.error('Error fetching emails:', error);
    throw error;
  }
}

export async function checkGmailAccess(userId) {
  try {
    await fetchEmails(userId, 'is:unread');
    return true;
  } catch (error) {
    console.error('Error checking Gmail access:', error);
    return false;
  }
}

// Implement other Gmail operations (send email, read email, etc.) here
```

## Step 5: Create clientOperations.js for Gmail

File: `src/lib/gmail/clientOperations.js`

Create this new file and add the following content:

```javascript
export async function fetchEmailsFromServer(query = '') {
  try {
    const response = await fetch(`/api/gmail/fetchEmails?query=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch emails');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching emails:', error);
    throw error;
  }
}

// Implement other client-side Gmail operations here
```

## Step 6: Create fetchEmails API endpoint

File: `src/app/api/gmail/fetchEmails.js`

Create this new file and add the following content:

```javascript
import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp";
import { fetchEmails } from "@/src/lib/gmail/serverOperations";

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { currentUser } = await getAuthenticatedAppForUser();
      
      if (!currentUser) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const { query } = req.query;
      
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

## Step 7: Update Header.jsx

File: `src/components/Header.jsx`

Update the Header component to include Gmail-related functionality:

```jsx
import React, { useState, useEffect } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { signInWithGoogle, signOut, onAuthStateChanged } from "@/src/lib/firebase/auth.js";
import { fetchEmailsFromServer } from "@/src/lib/gmail/clientOperations";

const Header = ({ initialUser, hasGmailAccess }) => {
  const [user, setUser] = useState(initialUser);
  const router = useRouter();

  // ... existing useEffect and other functions ...

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
      {/* ... existing header content ... */}
      {user && hasGmailAccess && (
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

export default Header;
```

## Step 8: Update Layout.js

File: `src/app/layout.js`

Update the Layout component to check for Gmail access:

```jsx
import "@/src/app/styles.css";
import Header from "@/src/components/Header.jsx";
import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp";
import { checkGmailAccess } from "@/src/lib/gmail/serverOperations";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Analyst Server",
  description: "Analyst Server provides secure communications monitoring and analysis",
};

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

## Step 9: Update Firestore Security Rules

File: `firestore.rules`

Add rules for the new `userTokens` collection:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Existing rules...

    match /userTokens/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Step 10: Update Environment Variables

File: `.env.local` (and other environment-specific files)

Add the following environment variables:

```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=your_redirect_uri
```

## Step 11: Install New Dependencies

Run the following command to install new dependencies:

```
npm install googleapis
```

## Final Steps

1. Test the entire authentication and Gmail access flow thoroughly.
2. Update any relevant documentation.
3. Implement error handling and user feedback throughout the application.
4. Consider implementing additional Gmail operations as needed.
5. Conduct a security review of the implemented changes.
6. Plan and execute a phased rollout of the new features.

This cookbook provides a step-by-step guide to implement the authentication upgrade and Gmail integration. Follow these steps carefully, and make sure to test each component thoroughly as you implement it.
