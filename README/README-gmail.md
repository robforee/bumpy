-- Receive idToken from client
   | queryGmailInbox(idToken) in google-actions.js
   
-- Authenticate user and get Firebase app instance
   | getAuthenticatedAppForUser(idToken) in serverApp.js
      -- Get admin app instance
         | getAdminApp() in serverApp.js
      -- Verify ID token using admin SDK
         | adminAuth.verifyIdToken(idToken)
      -- Initialize server app with verified token
         | initializeServerApp(firebaseConfig, { authIdToken: idToken })
      -- Wait for auth state
         | auth.authStateReady()

-- Get fresh access token
   | ensureFreshTokens(idToken) in auth-actions.js
      -- Get user's stored tokens from Firestore
         | getDoc(userTokensRef)
      -- Check if tokens need refresh
         | verifyToken(accessToken) in auth-actions.js
      -- If refresh needed:
         | refreshAccessToken(refreshToken, storedScopes) in auth-actions.js
            -- Call Google OAuth API to refresh token
               | oauth2Client.refreshToken(refreshToken)
         | storeTokens({ accessToken, refreshToken, idToken }) in auth-actions.js

-- Initialize Google OAuth client
   | new google.auth.OAuth2()
   | oauth2Client.setCredentials({ access_token: accessToken })

-- Create Gmail API client
   | google.gmail({ version: 'v1', auth: oauth2Client })

-- Query Gmail messages
   | gmail.users.messages.list()
   | gmail.users.messages.get() for each message