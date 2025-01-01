# Web-Bumpy Changelog

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
