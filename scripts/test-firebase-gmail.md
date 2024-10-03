encrypt                                 (test-firebase-gmail.js)
decrypt                                 (test-firebase-gmail.js)
generateAuthUrl                         (test-firebase-gmail.js)
storeTokens                             (test-firebase-gmail.js)
refreshAccessToken                      (test-firebase-gmail.js)
getGmailService                         (test-firebase-gmail.js)
getValidAccessToken                     (test-firebase-gmail.js)
getTokens                               (test-firebase-gmail.js)
checkTokenValidity                      (test-firebase-gmail.js)
checkGmailToken                         (test-firebase-gmail.js)
fetchGmailMessages                      (test-firebase-gmail.js)
exchangeCodeForTokens                   (test-firebase-gmail.js)
runTests                                (test-firebase-gmail.js)

// Dependencies
admin.initializeApp                     (firebase-admin)
admin.credential.cert                   (firebase-admin)
admin.firestore                         (firebase-admin)
google.auth.OAuth2                      (googleapis)
google.gmail                            (googleapis)

// Function call chain
runTests
-> fetchGmailMessages
   -> getGmailService
      -> getValidAccessToken
         -> getTokens
         -> checkTokenValidity
            -> checkGmailToken
         -> refreshAccessToken
            -> getTokens
-> exchangeCodeForTokens
   -> storeTokens

# NAME
test-firebase-gmail.js - Test Firebase and Gmail API integration

# SYNOPSIS
node test-firebase-gmail.js

# DESCRIPTION
test-firebase-gmail.js is a Node.js script that tests the integration between Firebase and the Gmail API. It demonstrates how to authenticate with Google, store and manage OAuth tokens in Firebase, and perform basic Gmail operations.

The script performs the following main functions:
1. Initializes Firebase Admin SDK
2. Manages OAuth 2.0 tokens (storing, retrieving, refreshing)
3. Authenticates with the Gmail API
4. Fetches a list of Gmail messages

It includes error handling for token expiration and invalid tokens, with the ability to trigger a re-authorization process if needed. This script is useful for developers working on applications that combine Firebase and Gmail functionalities, providing a foundation for more complex integrations.

# ENVIRONMENT
Requires the following environment variables:
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GOOGLE_REDIRECT_URI
- ENCRYPTION_KEY

# SEE ALSO
Firebase Admin SDK documentation, Google Gmail API documentation