# Web-Bumpy OAuth2 Implementation

## 1. System Overview
The web application implementation of OAuth2 token management.

## 2. Required Configuration
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `ENCRYPTION_KEY` (for token encryption)

## 3. Library and Initialization
```javascript
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);
```

## 4. Token Storage
Tokens are stored in Firestore under `user_tokens/[userId]`:
```javascript
{
    // Core token data
    accessToken: string (encrypted),
    refreshToken: string (encrypted),
    expirationTime: number (epoch ms),
    
    // Standard timestamps (all in CST format: YYYY-MM-DD HH:mm:ss [CST])
    updateTime: string,
    lastUpdated: string,
    createdAt: number (epoch ms),
    touchedAt: string,
    
    // Token update tracking
    __last_token_update: number (epoch ms),
    __web_token_update: string,
    
    // Legacy/compatibility fields
    bumpy_expirationTimeCST: string,
    bumpy_lastRefreshTime__: string,
    bumpy_account: string,
    
    // User metadata
    userEmail: string
}
```

## 5. Token Management Functions
1. `storeTokens`: Server-side token storage
   - Encrypts tokens before storage
   - Updates Firestore with timestamps
   - Manages user metadata

2. `refreshAccessToken`: Token refresh handling
   - Uses refresh token to get new access token
   - Verifies token validity and scopes
   - Returns new token set

## 6. Error Handling
- Comprehensive error logging
- Token validation checks
- Scope verification failures
- User reauthorization prompts
- Environment variable validation

## 7. Timestamp Management
- All string timestamps use America/Chicago timezone in format: 'YYYY-MM-DD HH:mm:ss [CST]'
- Epoch timestamps stored in milliseconds since Unix epoch
- Token updates tracked with both epoch (__last_token_update) and formatted (__web_token_update) timestamps
- Maintains backwards compatibility with legacy timestamp fields

## 8. File Locations
Key implementation in:
- Token management: `src/app/actions/auth-actions.js`
- Firebase config: `src/lib/firebase/serverApp.js`

## 9. Unique Features
1. Web-specific security:
   - Token encryption before storage
   - Server-side only token handling
   - Environment validation
   
2. Integration features:
   - Next.js server actions
   - Client-side token handling
   - Dynamic scope management
