# Updated Gmail and Google Drive Integration Plan

## Objective
Implement secure Gmail access for reading, labeling, and archiving emails, with the ability to periodically poll emails from outside the app. Also, prepare for future Google Drive integration.

## OAuth 2.0 Scopes

Request the following scopes during the Google Sign-In flow:

```
https://www.googleapis.com/auth/gmail.modify
https://www.googleapis.com/auth/drive.file
https://www.googleapis.com/auth/userinfo.email
```

- `gmail.modify`: Allows reading, modifying, and archiving emails (but not deleting)
- `drive.file`: Limited Drive access (only files/folders created by the app)
- `userinfo.email`: Retrieve user's email address

## Implementation Steps

1. Update OAuth consent screen in Google Cloud Console to include new scopes.
2. Modify Google Sign-In flow to request additional scopes.
3. Implement server-side token storage and encryption using Firebase Cloud Functions.
4. Create server-side functions for Gmail operations.
5. Set up a separate service for periodic email polling.
6. Implement client-side UI for Gmail interactions and permission management.
7. Develop error handling and re-authorization flows.
8. Prepare for future Google Drive integration.

## Token Storage and Management

- Store encrypted refresh tokens in Firestore under a `user_tokens` collection.
- Implement server-side refresh token rotation and access token generation using Firebase Cloud Functions.
- Create functions to revoke access and delete stored tokens upon user request.

## Security Measures

- Encrypt all stored tokens using strong encryption (e.g., AES-256).
- Use Firebase Security Rules to restrict access to token documents.
- Perform all sensitive operations (token refresh, API calls) server-side using Firebase Cloud Functions.

## User Permission Management

- Provide UI options for users to view current permissions and revoke access.
- Implement server-side logic to handle permission revocation requests.

## Compliance and Transparency

- Update privacy policy to reflect new data access and usage.
- Implement data deletion processes for revoked permissions and account deletions.
- Clearly communicate requested permissions and data usage to users during sign-in.

## Error Handling

- Develop robust error handling for token invalidation and API errors.
- Implement user notification system for authorization issues.

## Periodic Email Polling

- Set up a Cloud Function triggered by Cloud Scheduler for periodic email polling.
- Implement secure access to stored refresh tokens for the polling service.

## Files to be Modified

```
// Client-side files
src/components/Header.jsx                 // Update sign-in button to request new scopes
src/lib/firebase/auth.js                  // Modify signInWithGoogle function
src/components/UserSettings.jsx           // New component for managing permissions
src/pages/dashboard.js                    // Add Gmail interaction components

// Server-side files (Firebase Functions)
functions/index.js                        // New Functions for token management and API calls
functions/tokenEncryption.js              // Implement token encryption/decryption
functions/gmailOperations.js              // Functions for Gmail API calls
functions/emailPolling.js                 // Function for periodic email polling

// Configuration files
firebase.json                             // Update to include new Firebase Functions
firestore.rules                           // Add rules for user_tokens collection

// Documentation
README.md                                 // Update with new features and setup instructions
PRIVACY_POLICY.md                         // Update to reflect new data usage
```

## Next Steps

1. Begin by updating the OAuth consent screen in Google Cloud Console.
2. Modify the sign-in flow in the client-side application.
3. Develop server-side token storage and management functions.
4. Implement Gmail operation functions.
5. Set up the periodic email polling service.
6. Create user interface components for new features.
7. Thoroughly test all new functionality, focusing on security and error handling.
8. Update documentation and privacy policy before deploying to production.

## Impact on Login/Registration Process

- The login process will be modified to request additional Gmail permissions.
- Existing users will need to re-authenticate to grant these new permissions.
- New users will see the additional permission requests during their first sign-in.
- The registration process itself (if separate from sign-in) won't be directly affected.

## Ensuring Selective Permissions for Future Apps

When implementing the Google Drive functionality in a separate app:
- Specify only the required Drive scopes (e.g., `https://www.googleapis.com/auth/drive.file`) during that app's OAuth flow.
- This ensures users are only asked for Drive permissions in the Drive app context, despite Gmail scopes being listed on the OAuth consent screen.

Remember to approach this implementation incrementally, testing each component thoroughly before moving to the next. Prioritize security and user transparency at every step of the process.

