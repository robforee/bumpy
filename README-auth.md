# Authentication and Authorization


└── OAuth2 Flow
    ├── `signInWithGoogle` in `firebaseAuth.js`
    │   ├── `GoogleAuthProvider` in `@firebase/auth`
    │   └── `signInWithPopup` in `@firebase/auth`
    ├── `OAuth2Callback` in `page.js`
    │   └── `exchangeCodeForTokens` in `auth-actions.js`
    │       └── `google.auth.OAuth2` in `googleapis`
    ├── `handleTokenStorage` in `ClientCallback.jsx`
    │   ├── `onAuthStateChanged` in `@firebase/auth`
    │   └── `storeTokenInfo` in `auth-actions.js`
    │       ├── `encrypt` in `auth-actions.js`
    │       └── `setDoc` in `@firebase/firestore`
    └── `loadUserProfile` in `UserProvider.js`
        ├── `getDoc` in `@firebase/firestore`
        └── `setContext` in `UserProvider.js`

Credentials
└── Required forOauth2
    ├── GOOGLE_CLIENT_ID
    └── GOOGLE_CLIENT_SECRET
    └── GOOGLE_REDIRECT_URI
    └── ENCRYPTION_KEY
└── Locations
    ├── `~/.bash_aliases`
    ├── `~/work/auth/`
    ├── `.env.local`
    ├── `.env.production`
    ├── `apphosting.yaml`
    ├── `secretmanager` at `https://console.cloud.google.com/security/secret-manager`

## Authentication Flow
└── Sign In Flow
    ├── Email Entry
    │   └── `handleEmailSubmit` in `Header.jsx`
    ├── Scope Resolution
    │   └── `getScopes_fromClient` in `auth-actions.js`
    ├── Firebase Authentication
    │   ├── Initialize Provider
    │   │   └── `signInWithGoogle` in `firebaseAuth.js`
    │   │   └──── `signInWithPopup(auth, GoogleAuthProvider())`
    │   ├── Add Required Scopes
    │   │   └── `provider.addScope` in `firebaseAuth.js`
    │   └── Sign In With Popup
    │       └── `signInWithPopup` in `firebaseAuth.js`
    ├── Token Management
    │   ├── Get Firebase Token
    │   │   └── `user.getIdToken` in `firebaseAuth.js`
    │   ├── Store Tokens
    │   │   └── `storeTokens_fromClient` in `auth-actions.js`
    │   └── Store Authorized Scopes
    │       └── `setDoc(userScopesRef)` in `auth-actions.js`
    └── User Profile
        ├── Load Profile
        │   └── `loadUserProfile` in `UserProvider.js`
        └── Initialize If Needed
            └── `initializeNewUserIfNeeded` in `UserProvider.js`

## OAuth2 Code Exchange Flow
└── OAuth2 Code Exchange Flow
    ├── Initial Google Auth
    │   ├── Build OAuth URL
    │   │   └── `signInWithGoogle` in `firebaseAuth.js`
    │   │       └── URLSearchParams with client_id, redirect_uri, scopes
    │   └── Redirect to Google Consent
    │       └── `window.location.href = oauthUrl`
    ├── Google Callback
    │   ├── Receive Auth Code
    │   │   └── `/auth/callback` page.js
    │   └── Handle Callback
    │       └── `handleOAuth2Callback` in `firebaseAuth.js`
    ├── Token Exchange (Server Action)
    │   ├── Exchange Code for Tokens
    │   │   └── `exchangeCodeForTokens` in `auth-actions.js`
    │   │       └── Using google.auth.OAuth2 client
    │   └── Parse Token Response
    │       └── Access Token, Refresh Token, Scope
    ├── Token Storage
    │   ├── Encrypt Tokens
    │   │   └── `encrypt` in `auth-actions.js`
    │   ├── Store in Firestore
    │   │   └── `storeTokenInfo` in `auth-actions.js`
    │   └── Store Token Timestamps
    │       └── `getTokenTimestamps` in `token-utils.js`
    └── Response to Client
        ├── Success Case
        │   └── Return tokens object with success: true
        └── Error Case
            └── Return error object with success: false

settings/page
  handleGrantAll                            : settings/page
    signInWithGoogle(availableScopes, true) : firebaseAuth.js
    loadScopes()             : settings/page
      getScopes_fromClient() : auth-actions : get from firebase user_scopes!
      getCurrentScopes(scopes || []);

signInWithGoogle
  signInWithPopup
    

### Sign In Flow (`handleEmailSubmit` in `Header.jsx`)
1. User enters email in input box (pre-filled with last used email from localStorage)

2. Email-based Scope Resolution
   - Queries Firestore `/user_scopes` collection using email
   - If user found:
     - Retrieves previously authorized scopes
     - Proceeds with `select_account` prompt
   - If user not found or query fails:
     - Uses minimal scope (userinfo.email)
     - Forces consent prompt for new authorization

3. Google Sign-in (`signInWithGoogle` in `firebaseAuth.js`)
   - Creates GoogleAuthProvider with resolved scopes
   - Sets prompt parameter:
     - `select_account`: for existing users with authorized scopes
     - `consent`: for new users or when requesting new scopes
   - Calls `signInWithPopup` from Firebase Auth
   - Returns tokens and user info

4. Token Storage (`auth-actions.js`)
   - `storeTokens_fromClient` called with:
     - userId
     - accessToken
     - refreshToken
     - idToken
     - authorized scopes
   - Verifies token scopes with Google API
   - Encrypts tokens using AES-256-CBC
   - Stores in Firestore `/user_tokens` collection with:
     - Encrypted access token
     - Encrypted refresh token
     - Expiration time (1 hour)
     - Update time
     - Creation time
     - User email

5. User Scope Management
   - For new users:
     - Creates document in `/user_scopes` collection
     - Stores email and initial scopes
   - For existing users:
     - Maintains existing scope authorizations
     - Updates only when new scopes are authorized

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

### Token Refresh and Reauthorization
1. Automatic Token Refresh
   - Firebase Auth automatically refreshes tokens
   - Refresh token used to obtain new access token
   - No user interaction required for valid refresh tokens

2. Token Verification
   - `verifyTokenScopes` checks token validity with Google API
   - If token invalid or scopes insufficient:
     - Firebase Auth triggers automatic refresh
     - If refresh fails, triggers new authentication
     - Uses stored scopes from `/user_scopes`
     - Shows only account selection (not consent) for authorized scopes

3. Error Recovery
   - Handles various token errors:
     - Expired tokens: Automatic refresh
     - Revoked tokens: Re-authentication
     - Invalid scopes: New consent if needed
   - Maintains user session when possible
   - Only requests new consent when absolutely necessary

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

2. Client/Server Authentication Pattern
   - Always handle Firebase Authentication on the client side
   - Never try to access Firebase Auth's `currentUser` on the server
   - Follow this pattern:
     ```javascript
     // Client Component
     async function handleClientAction() {
       // 1. Get authentication info on client side
       const auth = getAuth();
       if (!auth.currentUser) {
         throw new Error('Not authenticated');
       }
       const idToken = await auth.currentUser.getIdToken();

       // 2. Pass only the idToken to server
       const result = await serverAction(idToken);
     }

     // Server Action
     export async function serverAction(idToken) {
       // 3. Verify token and get user info on server
       const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
       // Perform secure operations...
     }
     ```
   - Key Points:
     - Client side handles: auth state, idToken generation, auth UI
     - Server side handles: token verification, user info retrieval, secure operations
     - Never "dot into" client modules from server components
     - Always pass idToken as a parameter to server actions

3. Client-Side Auth Only
   - Use `firebaseAuth.js` ONLY for:
     - Google sign-in popup
     - Auth state management
     - Token retrieval
   - Never use for direct data operations

4. Naming Conventions
   - Server actions: Base name (e.g., `storeTokens`)
   - Client-to-server bridges: Base name + `_fromClient` (e.g., `storeTokens_fromClient`)
   - Auth operations: In `firebaseAuth.js` (e.g., `signInWithGoogle`)

5. Security Requirements
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
