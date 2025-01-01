# Web-Bumpy Changelog

## 2025-01-01 17:42 CST - OAuth Token Flow Improvements

### Bottlenecks Encountered
1. Race Conditions in Auth State
   - Firebase auth state and Google OAuth tokens arriving in different orders
   - Multiple sign-in popups causing conflicts
   - Solution: Added auth state waiting with timeout

2. Token Lifecycle Management
   - Refresh token requires special OAuth parameters
   - Need to preserve existing refresh tokens
   - Solution: Added proper token refresh and storage flow

3. State Coordination
   - Client/server state synchronization
   - Error state management
   - Solution: Centralized auth state in UserProvider

### Key Routes and Functions

1. Auth Flow Routes
   ```
   /auth/callback - OAuth2 callback handling
   /api/auth/token - Token exchange endpoint
   ```

2. Critical Functions
   ```javascript
   signInWithGoogle() - Initial auth and OAuth flow
   handleOAuth2Callback() - Process OAuth code and get tokens
   storeTokenInfo() - Encrypt and store tokens
   refreshTokenInfo() - Handle token refresh flow
   ```

### Token Storage Structure
```javascript
{
  // Timestamps
  __last_token_update: timestamp,
  __web_token_update: formatted_time,
  __web_refresh_token_update: formatted_time,
  
  // Encrypted tokens
  accessToken: encrypted_string,
  refreshToken: encrypted_string,
  
  // State management
  expirationTime: timestamp,
  authorizedScopes: string[],
  errors: string[],
  consecutiveFailures: number
}
```

### Common CLI Commands
```bash
# Check token storage
firebase firestore:get user_tokens/{uid}

# Review auth logs
firebase functions:log --only auth

# Test local auth flow
npm run dev
```

### Previous Entries:

## 2024-12-31 21:36 CST - User Profile and Google Integration Updates

### Changes Made
- Consolidated user profile management and Google OAuth token handling
- Updated user preferences structure in userService.js to include sync settings for:
  - Gmail sync
  - Drive sync
  - Calendar sync

### Token Management Updates
- Enhanced token storage in auth-actions.js:
  - Added `__web_token_update` timestamp for better tracking
  - Separated token and scope storage into dedicated collections
  - Added atomic updates to ensure data consistency
  - Improved error handling and validation

### OAuth Flow Improvements
- Updated signInWithGoogle in firebaseAuth.js:
  - Added proper ID token retrieval
  - Improved scope validation and comparison
  - Added better error handling for missing tokens
  - Added force consent handling for scope mismatches

### Collections Structure
- `user_tokens`: Stores encrypted access and refresh tokens
- `authorized_scopes`: Stores user's authorized Google OAuth scopes
- `users`: Stores user profile and preferences

### Common CLI Commands
```bash
# Review recent changes
git log --oneline -n 5

# Check Firebase collections
firebase firestore:get users
firebase firestore:get user_tokens
firebase firestore:get authorized_scopes

# Deploy changes
npm run build
firebase deploy
```

### User Profile Creation Flow
```
UserProvider (Layout)
├── onAuthStateChanged
│   └── User Signs In
│       ├── signInWithGoogle (firebaseAuth.js)
│       │   ├── Get Google OAuth Tokens
│       │   │   ├── accessToken
│       │   │   ├── refreshToken
│       │   │   └── idToken
│       │   └── Verify Scopes
│       │       └── Force consent if needed
│       │
│       ├── storeTokenInfo (auth-actions.js)
│       │   ├── user_tokens/
│       │   │   ├── accessToken (encrypted)
│       │   │   ├── refreshToken (encrypted)
│       │   │   └── timestamps
│       │   └── authorized_scopes/
│       │       ├── authorizedScopes[]
│       │       └── lastUpdated
│       │
│       └── initializeNewUserIfNeeded (userService.js)
│           └── users/
│               ├── displayName
│               ├── email
│               ├── photoURL
│               ├── topicRootId
│               ├── preferences/
│               │   ├── gmail-sync
│               │   ├── drive-sync
│               │   └── calendar-sync
│               ├── syncGmail/
│               │   └── consecutiveFailures
│               └── timestamps
```

### Known Issues
- None currently reported

### Next Steps
- Monitor token refresh reliability
- Track OAuth scope authorization success rates
- Watch for any token storage failures
