# Settings Page Documentation

## Overview
The settings page manages Google OAuth scopes for the user. It allows users to:
- View their current authorized scopes
- Add new scopes (requires Google consent)
- Remove existing scopes

## Key Components

### Auth Flow
1. `loadScopes()`: 
   - Runs on page load
   - Waits for Firebase auth state
   - Gets current user's authorized scopes
   - Shows error if not signed in

2. `handleAddScope(scope)`:
   - Adds scope to Firestore
   - Triggers Google consent flow
   - If user grants access:
     - Stores new tokens
     - Updates scope list
   - If user denies:
     - Removes scope from Firestore
     - Shows error message

3. `handleRemoveScope(scope)`:
   - Removes scope from Firestore
   - Updates local state
   - Note: Does not revoke Google access
     (user must revoke via Google Account settings)

## Files Involved
- `settings/page.js`: Main settings page component
- `actions/auth-actions.js`: Server actions for token/scope management
- `lib/firebase/firebaseAuth.js`: Client-side auth utilities

## Database Schema
### Firestore Collections
- `user_tokens`: Stores encrypted tokens and authorized scopes
  ```js
  {
    // Token data
    accessToken: string (encrypted),
    refreshToken: string (encrypted),
    authorizedScopes: string[],
    
    // Token timestamps
    __last_token_update: number (epoch),       // Latest token update in epoch time
    __web_token_update: string (CST),          // Latest web update in CST format
    __ops_token_update: string (CST),          // Latest node-ops update in CST
    __refresh_token_update: string (CST),      // Latest refresh in CST
    
    // Legacy fields (for backwards compatibility)
    lastUpdated: string (CST),
    updateTime: string (CST),
    
    // Other metadata
    userEmail: string,
    isValid: boolean,
    account: string (Google client ID)
  }
  ```
- `authorized_scopes`: Backup/mirror of authorized scopes
  ```js
  {
    // Core data
    userEmail: string,
    authorizedScopes: string[],
    
    // Scope timestamps
    __last_scopes_update: number (epoch),      // Latest scope update in epoch time
    __web_scopes_update: string (CST),         // Latest web update in CST format
    __ops_scopes_update: string (CST),         // Latest node-ops update in CST
    
    // Legacy fields (for backwards compatibility)
    lastUpdated: string (CST),
    updateTime: string (CST)
  }
  ```

### Timestamp Fields
1. Token Updates:
   - `__last_token_update`: Unix epoch for code operations
   - `__web_token_update`: CST time when web updates token
   - `__ops_token_update`: CST time when node-ops updates token
   - `__refresh_token_update`: CST time when token is refreshed

2. Scope Updates:
   - `__last_scopes_update`: Unix epoch for code operations
   - `__web_scopes_update`: CST time when web updates scopes
   - `__ops_scopes_update`: CST time when node-ops updates scopes

3. Legacy Fields:
   - `lastUpdated`: CST formatted time (kept for backwards compatibility)
   - `updateTime`: CST formatted time (kept for backwards compatibility)

### Utilities
Token timestamp utilities are in `src/lib/utils/token-utils.js`:
- `getTokenTimestamps(source)`: Get token update timestamps
- `getScopeTimestamps(source)`: Get scope update timestamps
- `getFormattedTimestamp()`: Get current CST timestamp
- `parseTimestamp(timestamp)`: Parse any timestamp format
- `getHoursSince(timestamp)`: Calculate hours since timestamp

## Common Issues
1. "Please sign in" message:
   - Appears when Firebase auth state isn't ready
   - Should resolve automatically after auth loads
   - If persists, check Firebase initialization

2. Failed scope grants:
   - Can happen if user denies consent
   - Scope is automatically removed from database
   - User must try granting access again

3. Token refresh failures:
   - Usually means tokens are expired/invalid
   - User needs to re-authenticate
   - System will prompt automatically

## Related Documentation
- [Google OAuth Scopes](https://developers.google.com/identity/protocols/oauth2/scopes)
- [Firebase Auth](https://firebase.google.com/docs/auth)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)
