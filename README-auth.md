# Authentication and Authorization

## Authentication Flow

### Sign In Flow (`handleSignIn` in `Header.jsx`)
1. User clicks sign in button

2. Initial Sign-in (`signInWithGoogle` without scopes)
   - Creates GoogleAuthProvider without scopes
   - Calls `signInWithPopup` from Firebase Auth for identification only
   - User selects account from popup
   - Returns initial tokens and user info

3. Scope Resolution
   - Retrieves user's ID token
   - Calls `getScopes()` to fetch previously authorized scopes from Firestore
   - If fetch fails, proceeds with empty scope list

4. Scoped Sign-in (if needed)
   - If user has previously authorized scopes:
     - Calls `signInWithGoogle` again with those scopes
     - Google OAuth may show consent screen for any new/unauthorized scopes
     - Returns new tokens with proper scope access
   - If user has no scopes (new user):
     - Proceeds with initial tokens
     - No additional authorization needed

5. Token Storage (`auth-actions.js`)
   - `storeTokens_fromClient` called with:
     - userId
     - accessToken
     - refreshToken
     - idToken
     - authorized scopes (empty array for new users)
   - Encrypts tokens using AES-256-CBC
   - Stores in Firestore `/user_tokens` collection with:
     - Encrypted access token
     - Encrypted refresh token
     - Expiration time (1 hour)
     - Update time
     - Creation time
     - User email

6. User Profile Management
   - `refreshUserProfile` from `UserProvider.js` is called
   - Triggers `loadUserProfile` which:
     - Calls `userService.getUserProfile(uid)`
     - If no profile exists:
       - Calls `userService.initializeNewUserIfNeeded`
       - Creates new user document in Firestore `/users`
       - Initializes topic root for new user

7. Post-Authentication
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

## Client/Server Request Architecture

### Directory Structure
- `src/app/actions/`: Server-side actions (Next.js Server Actions)
- `src/lib/firebase/`: Client/server Firebase initialization and utilities
  - `clientApp.js`: Client-side Firebase initialization (for auth only)
  - `serverApp.js`: Server-side Firebase initialization
  - `firebaseAuth.js`: Client-side auth operations

### Request Rules
1. All Firebase Data Operations
   - ALWAYS use server actions in `auth-actions.js`
   - Benefits:
     - Consistent data validation
     - Rate limiting capability
     - Audit trail of operations
     - Additional security layer
     - Easier debugging
   - Example: `storeTokens_fromClient()` in `auth-actions.js`

2. Client-Side Auth Only
   - Use `firebaseAuth.js` ONLY for:
     - Google sign-in popup
     - Auth state management
     - Token retrieval
   - Never use for direct data operations

3. Naming Conventions
   - Server actions: Base name (e.g., `storeTokens`)
   - Client-to-server bridges: Base name + `_fromClient` (e.g., `storeTokens_fromClient`)
   - Auth operations: In `firebaseAuth.js` (e.g., `signInWithGoogle`)

4. Security Requirements
   - Never expose service account credentials to client
   - All Firebase data operations must go through server actions
   - Validate all data on server before storage
   - Use Firebase Security Rules as backup, not primary security

## Scope Management

### Authorization States
- First-time users start with no scopes
- Returning users:
  - First authenticate without scopes for identification
  - Then re-authenticate with their previously authorized scopes
  - Only see consent screen for new/unauthorized scopes
- Authorization state is managed by both:
  - Google OAuth (for consent and token generation)
  - Firestore `/user_scopes` collection (for persistence)

### Scope Storage
- Authorized scopes are stored in Firestore `/user_scopes` collection
- Each user document contains their authorized scopes array
- Scopes are fetched during sign-in to ensure proper authorization

### Available Google API Scopes

These are the Google API scopes that can be requested through the server actions. Add these as needed when implementing new Google API features:

```javascript
const AVAILABLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar',      // Calendar access
  'https://www.googleapis.com/auth/gmail.modify',  // Read/write Gmail
  'https://www.googleapis.com/auth/gmail.compose', // Compose Gmail
  'https://www.googleapis.com/auth/drive',         // Full Drive access
  'https://www.googleapis.com/auth/drive.file',    // Limited Drive access
  'https://www.googleapis.com/auth/drive.appdata', // App-specific Drive data
  'https://www.googleapis.com/auth/chat.messages', // Chat messages
  'https://www.googleapis.com/auth/chat.spaces',   // Chat spaces
  'https://www.googleapis.com/auth/contacts'       // Contacts access
];
```

### Scope Usage Guidelines
1. Start users with no scopes on initial sign-in
2. Request specific scopes through server actions as needed
3. Store authorized scopes in Firestore
4. Re-authenticate with stored scopes on subsequent sign-ins

### Adding New Scopes
1. Add the scope to the server actions that need it
2. Update Firestore security rules if needed
3. Document the new scope's purpose and usage
4. Test the scope with the Google OAuth consent screen

### Available Functions (`auth-actions.js`)
- `getScopes()`: Retrieve current user's authorized scopes
  - Used during sign-in flow
  - Returns empty array for new users
- `addScope(scope)`: Request additional authorization for a new scope
  - Validates scope against allowed list
  - Updates user's scope list in Firestore
  - User will need to re-authenticate to authorize new scope
- `deleteScope(scope)`: Remove authorization for a scope
  - Updates user's scope list in Firestore
  - Next sign-in will not request removed scope

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
1. Check current scopes via `getScopes()`
2. Call `addScope()` with the desired new scope
3. User signs out
4. On next sign-in:
   - Initial authentication identifies user
   - Scoped authentication includes new scope
   - User authorizes new scope via Google consent screen
   - New scope is available after authorization

## Scope Management UI

The application provides a user-friendly interface for managing Google API scopes through the Settings page:

### Accessing Settings
- Click on your profile picture in the header
- Select "Settings" from the user menu
- The settings page shows both current and available scopes

### Features
- View currently authorized scopes with descriptions
- Add new scopes from available options
- Remove existing scopes
- Automatic re-authentication when scopes change
- Clear error handling and loading states

### Implementation Details
- Located at `/settings` route
- Uses server actions for scope management
- Maintains scope state in Firestore
- Updates authentication tokens after scope changes
- Provides real-time feedback on operations

### Best Practices
1. Add scopes incrementally as needed
2. Remove unused scopes for better security
3. Review scope descriptions before adding
4. Check for successful re-authentication after changes
