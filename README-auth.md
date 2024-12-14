# Authentication and Authorization

## Authentication Flow

### Sign In Flow (`handleSignIn` in `Header.jsx`)
1. User clicks sign in button
2. `handleSignIn` in `Header.jsx` initiates the flow with required scopes:
   - calendar
   - gmail.modify
   - gmail.compose
   - drive
   - drive.file
   - drive.appdata
   - chat.messages
   - chat.spaces
   - contacts

3. `signInWithGoogle` (`firebaseAuth.js`)
   - Creates GoogleAuthProvider with scopes
   - Sets `prompt: 'select_account'` parameter
   - Calls `signInWithPopup` from Firebase Auth
     1. Opens Google account selection popup
     2. User selects account
     3. Google OAuth checks if app needs authorization:
        - First time: Shows consent screen for all scopes
        - Returning user: Shows consent only for new/unauthorized scopes
        - Fully authorized: Proceeds directly
     4. Google OAuth creates/refreshes tokens
   - Returns tokens (accessToken, refreshToken) and user info

4. Token Storage (`auth-actions.js`)
   - `storeTokens_fromClient` called with (userId, accessToken, refreshToken, idToken, scopes)
   - Encrypts tokens using AES-256-CBC
   - Stores in Firestore `/user_tokens` collection with:
     - Encrypted access token
     - Encrypted refresh token
     - Expiration time (1 hour)
     - Update time
     - Creation time
     - User email

5. User Profile Management
   - `refreshUserProfile` from `UserProvider.js` is called
   - Triggers `loadUserProfile` which:
     - Calls `userService.getUserProfile(uid)`
     - If no profile exists:
       - Calls `userService.initializeNewUserIfNeeded`
       - Creates new user document in Firestore `/users`
       - Initializes topic root for new user

6. Post-Authentication
   - On success: Redirects to dashboard
   - On failure: Handles various error cases
     - Popup blocked: Redirects to enable-popups
     - Auth error: Redirects to auth-error
     - Other errors: Stays on current page

### Sign Out Flow (`handleSignOut` in `Header.jsx`)
1. User clicks sign out button
2. `handleSignOut` calls `signOut` from `firebaseAuth.js`
3. Firebase Auth sign out is executed
4. On success:
   - Redirects to home page
5. On failure:
   - Logs error
   - Redirects to auth-error page

### Token Refresh Flow
1. `ensureFreshTokens` in `auth-actions.js`
   - Checks token expiration
   - If expired or force refresh:
     - Calls `refreshAccessToken`
     - Updates stored tokens
2. Token encryption/decryption
   - Uses AES-256-CBC encryption
   - Requires ENCRYPTION_KEY environment variable

### User Profile Management
1. `UserProvider.js` manages user state
2. On auth state change:
   - Updates user state
   - Loads/refreshes user profile
3. `userService.js` handles:
   - User profile initialization
   - Topic root initialization
   - Profile updates
   - Stored in Firestore `/users` collection

## Scope Management

### Authorization States
- First-time login: Google will ask for authorization for all requested scopes
- Subsequent logins: 
  - If previously authorized all scopes: Only account selection needed
  - If new scopes added or some scopes not authorized: Will prompt for authorization again
- Authorization state is managed by Google OAuth, not the application
- Tokens are still refreshed and stored even when no re-authorization is needed

### Scope Storage
- Authorized scopes are stored in Firestore `/user_scopes` collection
- Each user document contains their authorized scopes

### Available Functions (`auth-actions.js`)
- `getScopes()`: Retrieve current user's authorized scopes
- `addScope(scope)`: Request additional authorization for a new scope
- `deleteScope(scope)`: Remove authorization for a scope

### Valid Scopes
```
- https://www.googleapis.com/auth/calendar
- https://www.googleapis.com/auth/gmail.modify
- https://www.googleapis.com/auth/gmail.compose
- https://www.googleapis.com/auth/drive
- https://www.googleapis.com/auth/drive.file
- https://www.googleapis.com/auth/drive.appdata
- https://www.googleapis.com/auth/chat.messages
- https://www.googleapis.com/auth/chat.spaces
- https://www.googleapis.com/auth/contacts
```

### Adding New Scopes
- Call `addScope()` with the desired scope
- User will need to re-authenticate to authorize the new scope
- After authorization, the new scope is stored in `/user_scopes`
- Subsequent sign-ins will request all stored scopes

**Note:** When a user needs additional scopes:
1. First sign-in identifies the user
2. Check authorized scopes via `getScopes()`
3. Request additional scopes via `addScope()`
4. User re-authenticates to approve new scopes
