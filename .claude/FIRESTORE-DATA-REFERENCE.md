# Bumpy Firestore Data Reference

## Overview

This document describes how user preferences, configurations, and data are stored in Firestore for the Bumpy application. It includes the collection structure, field definitions, and example queries for exploring the data.

## Collection Architecture

### Primary Collections

```
Firestore Root
├── users/                      # User profiles and preferences
├── user_tokens/                # OAuth tokens (encrypted)
├── user_scopes/                # Legacy scope storage (being deprecated)
├── authorized_scopes/          # Public scope visibility
├── service_credentials/        # Per-service OAuth tokens (new pattern)
├── topics/                     # Hierarchical topic management
├── restaurants/                # Demo feature: restaurant data
│   └── {restaurantId}/
│       ├── ratings/           # Subcollection: restaurant ratings
│       └── messages/          # Subcollection: restaurant messages
├── admin/                      # Admin-only configuration
├── admin_data/                 # Admin application config
├── public_data/                # Publicly readable configuration
├── auth_logs/                  # Authentication audit trail
└── logs/                       # General application logs
```

---

## Core Collections

### 1. `users/` - User Profiles and Preferences

**Document ID**: `{userId}` (Firebase Auth UID)

**Purpose**: Stores user profile data and application preferences

**Schema**:
```javascript
{
  // Identity
  email: "user@example.com",
  displayName: "User Name",
  photoURL: "https://...",

  // Application State
  topicRootId: "abc123",           // ID of user's root topic node

  // User Preferences
  preferences: {
    "gmail-sync": true,             // Enable Gmail synchronization
    "drive-sync": true,             // Enable Drive synchronization
    "calendar-sync": true           // Enable Calendar synchronization
  },

  // Service Health Tracking
  syncGmail: {
    consecutiveFailures: 0          // Track sync failures for alerting
  },

  // Timestamps
  createdAt: "2025-10-24 14:30 CST",
  updatedAt: "2025-11-14 09:15 CST"
}
```

**Security Rules**:
- Users can read/write their own document
- Admins can access all documents

**Created By**: `userService.initializeNewUserIfNeeded()` (src/services/userService.js:9)

**Example Queries**:

```javascript
// Firebase Console Query
// Get user profile
db.collection('users').doc('USER_ID').get()

// List all users (admin only)
db.collection('users').get()

// Find users with Gmail sync enabled
db.collection('users')
  .where('preferences.gmail-sync', '==', true)
  .get()

// Find users with sync failures
db.collection('users')
  .where('syncGmail.consecutiveFailures', '>', 0)
  .get()
```

---

### 2. `user_tokens/` - OAuth Access and Refresh Tokens

**Document ID**: `{userId}` (Firebase Auth UID)

**Purpose**: Stores encrypted OAuth tokens for Google services (legacy unified token storage)

**Schema**:
```javascript
{
  // Encrypted Tokens
  accessToken: "encrypted_string",      // AES-256-CBC encrypted
  refreshToken: "encrypted_string",     // AES-256-CBC encrypted

  // Token Metadata
  expirationTime: 1731604800000,        // Unix timestamp (ms)
  userEmail: "user@example.com",
  authorizedScopes: [                   // Array of OAuth scopes
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/calendar"
  ],

  // Timestamp Tracking
  __last_token_update: 1731518400000,   // Unix timestamp (ms)
  __web_token_update: "2025-11-14 09:15", // Human-readable (CST)
  __web_refresh_token_update: "2025-11-14 09:15", // When refresh token last updated

  // Error Tracking
  __error_time: null,                   // Last error timestamp (formatted)
  __last_error: null,                   // Last error message
  errors: [],                           // Array of error messages
  consecutiveFailures: 0,               // Count of consecutive failures

  // Status Flags
  requiresUserAction: false,            // True if reauthorization needed
  requiresRefreshToken: false           // True if refresh token missing
}
```

**Encryption**: Uses crypto.scrypt with AES-256-CBC (auth-actions.js:16-43)

**Security Rules**:
- Users can read/write their own tokens
- Admins can access all tokens
- Public can query limited fields for login (authorizedScopes, userEmail with specific query constraints)

**Where Token Data is Stored**:

1. **Firestore Storage**:
   - Collection: `user_tokens/{userId}`
   - Fields: `accessToken`, `refreshToken` (both encrypted)
   - Path: `/databases/(default)/documents/user_tokens/{userId}`

2. **Server-Side Access**:
   - **Create/Update**: `storeTokenInfo()` - src/app/actions/auth-actions.js:46
   - **Retrieve**: `getTokenInfo()` - src/app/actions/auth-actions.js:212
   - **Refresh**: `refreshTokenInfo()` - src/app/actions/auth-actions.js:101
   - **Encrypt**: `encrypt()` - src/app/actions/auth-actions.js:16
   - **Decrypt**: `decrypt()` - src/app/actions/auth-actions.js:30

3. **Client-Side References**:
   - Service Worker may cache tokens temporarily (auth-service-worker.js)
   - UserProvider maintains auth state but NOT tokens (src/contexts/UserProvider.js)
   - Tokens NEVER stored in localStorage or sessionStorage

4. **Environment Dependencies**:
   - `ENCRYPTION_KEY` - Required for encrypt/decrypt operations
   - Stored in: `.env.local` (local dev) or Google Cloud Secret Manager (production)

**Created By**: `storeTokenInfo()` (auth-actions.js:46)

**Example Queries**:

```javascript
// Get user tokens
db.collection('user_tokens').doc('USER_ID').get()

// Find users with expired tokens (admin only)
const now = Date.now();
db.collection('user_tokens')
  .where('expirationTime', '<', now)
  .get()

// Find users requiring reauthorization
db.collection('user_tokens')
  .where('requiresUserAction', '==', true)
  .get()

// Find users with consecutive failures
db.collection('user_tokens')
  .where('consecutiveFailures', '>', 2)
  .get()
```

---

### 3. `service_credentials/` - Per-Service OAuth Tokens (NEW PATTERN)

**Document ID**: `{userId}_{serviceName}` (e.g., "abc123_gmail", "abc123_drive")

**Purpose**: Stores encrypted OAuth tokens per Google service (Gmail, Drive, Calendar, Messenger)

**Schema**:
```javascript
{
  // Encrypted Tokens
  accessToken: "encrypted_string",      // AES-256-CBC encrypted
  refreshToken: "encrypted_string",     // AES-256-CBC encrypted (can be null)

  // Service-Specific Scopes
  scopes: [
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/gmail.compose"
  ],

  // Timestamps
  grantedAt: 1731518400000,             // When user authorized (ms)
  lastRefreshed: 1731518400000,         // Last token refresh (ms)
  expiresAt: 1731522000000              // Token expiration (ms)
}
```

**Services Supported**:
- `gmail` - Email operations
- `drive` - File storage operations
- `calendar` - Calendar operations
- `messenger` - Chat/messaging operations

**Security Rules**:
- Document ID must match pattern: `{userId}_{serviceName}`
- Users can only read/write credentials matching their UID
- Admins can access all credentials

**Where Service Token Data is Stored**:

1. **Firestore Storage**:
   - Collection: `service_credentials/{userId}_{service}`
   - Fields: `accessToken`, `refreshToken` (both encrypted)
   - Path: `/databases/(default)/documents/service_credentials/{userId}_{service}`
   - Examples:
     - `service_credentials/CtAyzps80VXRzna32Kdy0NHYcPe2_gmail`
     - `service_credentials/CtAyzps80VXRzna32Kdy0NHYcPe2_drive`
     - `service_credentials/CtAyzps80VXRzna32Kdy0NHYcPe2_calendar`

2. **Server-Side Access**:
   - **Create/Update**: `storeServiceTokens()` - src/app/actions/auth-actions.js:412
   - **Retrieve (with auto-refresh)**: `getServiceToken()` - src/app/actions/auth-actions.js:465
   - **Check Authorization**: `checkServiceAuth()` - src/app/actions/auth-actions.js:541
   - **Encrypt**: `encrypt()` - src/app/actions/auth-actions.js:16
   - **Decrypt**: `decrypt()` - src/app/actions/auth-actions.js:30

3. **Client-Side Flow**:
   - OAuth callback stores tokens: `src/app/auth/callback/ClientCallback.jsx`
   - Service auth cards check status: `src/components/ServiceAuthCard.jsx`
   - Google API calls use service tokens: `src/app/actions/google-actions.js`

4. **Token Lifecycle**:
   ```
   User authorizes service
   → OAuth callback receives code
   → exchangeCodeForTokens() gets tokens from Google
   → storeServiceTokens() encrypts and stores in Firestore
   → getServiceToken() retrieves and auto-refreshes when expired
   → checkServiceAuth() verifies authorization status
   ```

5. **Environment Dependencies**:
   - `ENCRYPTION_KEY` - Required for encrypt/decrypt operations
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - OAuth client ID
   - `GOOGLE_CLIENT_SECRET` - OAuth client secret (server-only)
   - `NEXT_PUBLIC_GOOGLE_REDIRECT_URI` - OAuth callback URL

**Created By**: `storeServiceTokens()` (auth-actions.js:412)

**Example Queries**:

```javascript
// Get Gmail credentials for user
db.collection('service_credentials').doc('USER_ID_gmail').get()

// Get all service credentials for a user
db.collection('service_credentials')
  .where(firebase.firestore.FieldPath.documentId(), '>=', 'USER_ID_')
  .where(firebase.firestore.FieldPath.documentId(), '<=', 'USER_ID_\uf8ff')
  .get()

// Admin: Find all Gmail authorizations
db.collection('service_credentials')
  .where(firebase.firestore.FieldPath.documentId(), '>=', '_gmail')
  .where(firebase.firestore.FieldPath.documentId(), '<=', '_gmail\uf8ff')
  .get()

// Find expired service tokens (admin)
const now = Date.now();
db.collection('service_credentials')
  .where('expiresAt', '<', now)
  .get()
```

---

### 4. `authorized_scopes/` - Public Scope Visibility

**Document ID**: `{userId}` (Firebase Auth UID)

**Purpose**: Publicly readable record of which scopes a user has authorized (for login/status checks)

**Schema**:
```javascript
{
  userEmail: "user@example.com",
  authorizedScopes: [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/gmail.modify"
  ],
  lastUpdated: "2025-11-14 09:15 AM CST"
}
```

**Security Rules**:
- Anyone can read (public)
- Only owner or admin can write

**Created By**: `addScopes_toPUBLIC()` (auth-actions.js:291)

**Example Queries**:

```javascript
// Get user's authorized scopes (public)
db.collection('authorized_scopes').doc('USER_ID').get()

// Find users with Gmail scope
db.collection('authorized_scopes')
  .where('authorizedScopes', 'array-contains',
    'https://www.googleapis.com/auth/gmail.modify')
  .get()
```

---

### 5. `topics/` - Hierarchical Topic Management

**Document ID**: Auto-generated or `{userId}` (for root topic)

**Purpose**: Stores hierarchical topic structure with parent-child relationships

**Schema**:
```javascript
{
  // Identity
  title: "Topic Title",
  subtitle: "Optional subtitle",
  description: "Detailed description",

  // Content
  text: "Markdown or plain text content",
  prompt: "AI prompt used to generate this",
  concept: "Concept name or query",
  concept_json: { /* structured concept data */ },

  // Classification
  topic_type: "concept" | "milestone" | "question" | "subtopic" | "root",
  topic_sub_type: "specific_subtype",

  // Ownership
  owner: "USER_ID",
  owner_email: "user@example.com",
  owner_name: "User Name",

  // Hierarchy
  parents: ["parent_topic_id"],         // Array of parent IDs
  children: ["child_id_1", "child_id_2"], // Array of child IDs
  parent_id: "direct_parent_id",        // Single parent reference

  // Timestamps
  created_at: Timestamp,
  updated_at: Timestamp
}
```

**Topic Types**:
- `root` - User's root topic node
- `concept` - Conceptual topic
- `milestone` - Milestone/goal topic
- `question` - Question topic
- `subtopic` - General subtopic

**Security Rules**:
- Authenticated users can read all topics
- Authenticated users can create topics
- Authenticated users can update/delete topics

**Created By**:
- `userService.initializeTopicRoot()` (userService.js:76) - Creates root
- `createTopic()` (topic-actions.js:22) - Creates new topics

**Example Queries**:

```javascript
// Get user's root topic
db.collection('topics').doc('USER_ID').get()

// Get all topics owned by user
db.collection('topics')
  .where('owner', '==', 'USER_ID')
  .get()

// Get topics by type
db.collection('topics')
  .where('topic_type', '==', 'concept')
  .get()

// Get child topics of a parent
db.collection('topics')
  .where('parents', 'array-contains', 'PARENT_ID')
  .get()

// Get topics created after a date
const date = firebase.firestore.Timestamp.fromDate(new Date('2025-11-01'));
db.collection('topics')
  .where('created_at', '>', date)
  .orderBy('created_at', 'desc')
  .get()
```

---

## Secondary Collections

### 6. `auth_logs/` - Authentication Audit Trail

**Document ID**: Auto-generated

**Purpose**: Immutable audit log of authentication events

**Schema**:
```javascript
{
  userId: "USER_ID",
  event: "sign_in" | "sign_out" | "token_refresh" | "scope_change",
  timestamp: Timestamp,
  metadata: {
    // Event-specific metadata
  }
}
```

**Security Rules**:
- Any authenticated user can create logs
- Only admins can read logs
- No updates allowed (immutable)
- Only admins can delete logs

---

### 7. `restaurants/` - Demo Feature

**Document ID**: Auto-generated

**Purpose**: Example restaurant data with ratings and messages

**Schema**:
```javascript
{
  name: "Restaurant Name",
  category: "Italian" | "Mexican" | etc.,
  photo: "https://...",
  seq: 1,

  // Aggregated ratings
  numRatings: 42,
  sumRating: 180,
  avgRating: 4.3,

  timestamp: Timestamp
}
```

**Subcollections**:
- `ratings/` - User reviews and ratings
- `messages/` - User messages

**Security Rules**:
- Anyone can read
- Authenticated users can write

---

## Migration Notes

### Token Storage Evolution

The application is transitioning from unified token storage to per-service credentials:

**OLD PATTERN** (still in use):
```
user_tokens/{userId}
- Single document with all OAuth tokens
- Used for general Google API access
```

**NEW PATTERN** (being adopted):
```
service_credentials/{userId}_{service}
- Separate document per service (gmail, drive, calendar, messenger)
- Allows granular authorization per service
- Better security and scope management
```

**Migration Status**:
- Both patterns currently supported
- New OAuth flows use `service_credentials/`
- Legacy tokens remain in `user_tokens/`
- No automated migration scheduled

---

## Data Encryption

### Encrypted Fields

The following fields are encrypted using AES-256-CBC:

1. `user_tokens/{userId}/accessToken`
2. `user_tokens/{userId}/refreshToken`
3. `service_credentials/{credentialId}/accessToken`
4. `service_credentials/{credentialId}/refreshToken`

### Encryption Method

**Algorithm**: AES-256-CBC
**Key Derivation**: crypto.scrypt with static salt
**Implementation**: `auth-actions.js:16-43`

```javascript
// Encryption
const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
const iv = crypto.randomBytes(16);
const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
encrypted = iv.toString('hex') + ':' + cipher.update(text, 'utf8', 'hex') + cipher.final('hex');

// Decryption
const [ivHex, encryptedHex] = encrypted.split(':');
const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(ivHex, 'hex'));
decrypted = decipher.update(Buffer.from(encryptedHex, 'hex'), 'hex', 'utf8') + decipher.final('utf8');
```

**Environment Variable**: `ENCRYPTION_KEY` (required in server environment)

---

## Common Query Patterns

### User Profile with Preferences

```javascript
// Get user with preferences
const userDoc = await db.collection('users').doc(userId).get();
const userData = userDoc.data();

console.log('Gmail Sync Enabled:', userData.preferences['gmail-sync']);
console.log('Drive Sync Enabled:', userData.preferences['drive-sync']);
console.log('Calendar Sync Enabled:', userData.preferences['calendar-sync']);
```

### Check Service Authorization

```javascript
// Check if user has authorized Gmail
const gmailCreds = await db.collection('service_credentials')
  .doc(`${userId}_gmail`)
  .get();

const isAuthorized = gmailCreds.exists();
const scopes = gmailCreds.exists() ? gmailCreds.data().scopes : [];

console.log('Gmail Authorized:', isAuthorized);
console.log('Gmail Scopes:', scopes);
```

### Get Token with Auto-Refresh Check

```javascript
// Get token and check if refresh needed
const tokenDoc = await db.collection('user_tokens').doc(userId).get();
const tokenData = tokenDoc.data();

const now = Date.now();
const isExpired = tokenData.expirationTime < now;
const needsRefresh = isExpired && tokenData.refreshToken;

console.log('Token Expired:', isExpired);
console.log('Can Auto-Refresh:', needsRefresh);
console.log('Requires User Action:', tokenData.requiresUserAction);
```

### Get User's Topic Hierarchy

```javascript
// Get root topic
const rootDoc = await db.collection('topics').doc(userId).get();
const rootTopic = rootDoc.data();

// Get all child topics
const childrenSnapshot = await db.collection('topics')
  .where('parents', 'array-contains', userId)
  .get();

const children = childrenSnapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));

console.log('Root Topic:', rootTopic.title);
console.log('Child Count:', children.length);
```

### Find Users Needing Attention

```javascript
// Find users with auth issues (admin query)
const problemUsers = await db.collection('user_tokens')
  .where('requiresUserAction', '==', true)
  .get();

const expiringSoon = await db.collection('user_tokens')
  .where('expirationTime', '<', Date.now() + 86400000) // Next 24 hours
  .get();

console.log('Users Requiring Reauth:', problemUsers.size);
console.log('Tokens Expiring Soon:', expiringSoon.size);
```

---

## Firebase Console Queries

### Navigate to Collections

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select **analyst-server** project
3. Go to **Firestore Database**
4. Browse collections in left sidebar

### Useful Filters

**Find your own data** (replace with your UID):
```
Collection: users
Document ID: CtAyzps80VXRzna32Kdy0NHYcPe2
```

**View all topics**:
```
Collection: topics
Order by: created_at (descending)
```

**View token health**:
```
Collection: user_tokens
Where: consecutiveFailures > 0
```

**View service authorizations**:
```
Collection: service_credentials
Where: document ID starts with: YOUR_UID_
```

---

## Related Files

- **Firestore Rules**: `/firestore.rules` (security rules)
- **User Service**: `/src/services/userService.js` (user initialization)
- **Auth Actions**: `/src/app/actions/auth-actions.js` (token management)
- **User Provider**: `/src/contexts/UserProvider.js` (client-side auth state)
- **Firestore Operations**: `/src/lib/firebase/firestore.js` (CRUD operations)
- **Topic Actions**: `/src/app/actions/topic-actions.js` (topic management)

---

## Security Considerations

### Best Practices

1. **Never decrypt tokens client-side** - Always use server actions
2. **Validate user ownership** - Check `request.auth.uid` in rules
3. **Use structured queries** - Avoid exposing entire collections
4. **Monitor consecutive failures** - Alert on `consecutiveFailures > 3`
5. **Rotate encryption key** - Update `ENCRYPTION_KEY` periodically

### Security Rules Summary

| Collection | Read | Write | Notes |
|------------|------|-------|-------|
| users/ | Owner, Admin | Owner, Admin | Profile data |
| user_tokens/ | Owner, Admin, Limited Public | Owner, Admin | OAuth tokens |
| service_credentials/ | Owner, Admin | Owner, Admin | Per-service tokens |
| authorized_scopes/ | Public | Owner, Admin | Public scope visibility |
| topics/ | Authenticated | Authenticated | Topic hierarchy |
| auth_logs/ | Admin | Authenticated (create only) | Immutable audit log |
| restaurants/ | Public | Authenticated | Demo feature |
| admin/ | Admin | Admin | Admin-only config |
| admin_data/ | Admin | Admin | Application config |
| public_data/ | Public | Admin | Public config |

---

## Token Storage Architecture Reference

### Complete Token Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. USER AUTHENTICATION                                      │
│     • User signs in with Google                             │
│     • Firebase Auth creates session                         │
│     • ID Token generated (client-side)                      │
│     Location: Firebase Auth (memory only)                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  2. OAUTH AUTHORIZATION FLOW                                │
│     • User grants scopes for specific service               │
│     • Google OAuth returns authorization code               │
│     • exchangeCodeForTokens() called                        │
│     File: src/app/actions/auth-actions.js:358               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  3. TOKEN ENCRYPTION (Server-Side Only)                     │
│     • Access token encrypted with AES-256-CBC               │
│     • Refresh token encrypted with AES-256-CBC              │
│     • Encryption key from environment (ENCRYPTION_KEY)      │
│     File: src/app/actions/auth-actions.js:16-43             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  4. FIRESTORE STORAGE                                       │
│     ┌───────────────────────────────────────────────┐       │
│     │ PATTERN A: Legacy Unified Tokens              │       │
│     │ Collection: user_tokens/{userId}              │       │
│     │ - accessToken (encrypted)                     │       │
│     │ - refreshToken (encrypted)                    │       │
│     │ - authorizedScopes (array)                    │       │
│     │ - expirationTime (timestamp)                  │       │
│     │ Created by: storeTokenInfo()                  │       │
│     └───────────────────────────────────────────────┘       │
│                                                              │
│     ┌───────────────────────────────────────────────┐       │
│     │ PATTERN B: Per-Service Tokens (NEW)          │       │
│     │ Collection: service_credentials/              │       │
│     │             {userId}_{service}                │       │
│     │ - accessToken (encrypted)                     │       │
│     │ - refreshToken (encrypted)                    │       │
│     │ - scopes (service-specific array)             │       │
│     │ - expiresAt (timestamp)                       │       │
│     │ Created by: storeServiceTokens()              │       │
│     └───────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  5. TOKEN RETRIEVAL & AUTO-REFRESH                          │
│     • Server action calls getTokenInfo() or                 │
│       getServiceToken()                                     │
│     • Checks expiration timestamp                           │
│     • If expired: uses refresh token to get new access token│
│     • Decrypts token (server-side only)                     │
│     • Returns plaintext token to server action              │
│     File: src/app/actions/auth-actions.js:212, 465          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  6. GOOGLE API USAGE                                        │
│     • Server action uses plaintext token                    │
│     • Token passed in Authorization header                  │
│     • API call executed                                     │
│     • Token NEVER sent to client                            │
│     File: src/app/actions/google-actions.js                 │
└─────────────────────────────────────────────────────────────┘
```

### Token Storage Locations by File

| File | Purpose | Token Access | Storage Method |
|------|---------|--------------|----------------|
| `src/app/actions/auth-actions.js` | Token management | Encrypts, decrypts, stores, retrieves | Firestore (encrypted) |
| `src/app/actions/google-actions.js` | Google API calls | Retrieves via getServiceToken() | Memory (during request) |
| `src/app/auth/callback/ClientCallback.jsx` | OAuth callback | Stores after authorization | Calls storeServiceTokens() |
| `src/contexts/UserProvider.js` | Auth state | NO token access | N/A |
| `src/services/userService.js` | User initialization | Creates token documents | Calls Firestore |
| `auth-service-worker.js` | Request interception | May cache temporarily | Service Worker cache |

### Where Tokens Are NOT Stored

❌ **Client-side localStorage** - Never used for tokens
❌ **Client-side sessionStorage** - Never used for tokens
❌ **Client-side cookies** - Only session cookies, not tokens
❌ **React state** - UserProvider only stores user info, not tokens
❌ **Browser cache** - Tokens not cached by browser
❌ **Source code** - No hardcoded tokens
❌ **Environment variables (client)** - Only server-side env vars used

### Token Security Checklist

✅ **Tokens encrypted at rest** - AES-256-CBC in Firestore
✅ **Encryption key in environment** - Never in source code
✅ **Server-side decryption only** - Client never sees plaintext
✅ **HTTPS only** - All token transmission encrypted
✅ **Firestore security rules** - User can only access own tokens
✅ **Auto-refresh on expiry** - Minimizes token exposure window
✅ **Separate per-service tokens** - Granular access control
✅ **Audit logging** - auth_logs tracks token events

### Token Lifecycle Timestamps

Each token document includes multiple timestamps for tracking:

```javascript
{
  // Creation/Update (Unix timestamp)
  __last_token_update: 1731518400000,

  // Human-readable (CST formatted)
  __web_token_update: "2025-11-14 09:15",
  __web_refresh_token_update: "2025-11-14 09:15",

  // Expiration
  expirationTime: 1731604800000,    // user_tokens
  expiresAt: 1731604800000,         // service_credentials

  // Service-specific
  grantedAt: 1731518400000,         // When user authorized
  lastRefreshed: 1731518400000      // Last auto-refresh
}
```

### Finding Tokens in Firebase Console

**Step 1: Navigate to Collection**
1. Open Firebase Console → Firestore Database
2. Select collection: `user_tokens` or `service_credentials`

**Step 2: Find Your Tokens**
```
user_tokens/
  └── YOUR_USER_ID              ← Document ID is your Firebase Auth UID
      ├── accessToken: "abc123..." (encrypted)
      ├── refreshToken: "xyz789..." (encrypted)
      └── authorizedScopes: [...]

service_credentials/
  ├── YOUR_USER_ID_gmail        ← Pattern: {userId}_{service}
  ├── YOUR_USER_ID_drive
  ├── YOUR_USER_ID_calendar
  └── YOUR_USER_ID_messenger
```

**Step 3: Viewing Encrypted Tokens**
- Encrypted tokens look like: `abc123def456:789xyz...`
- Format: `{iv_hex}:{encrypted_data_hex}`
- Cannot be decrypted in console (requires ENCRYPTION_KEY)

**Step 4: Token Health Check**
```
Check for issues:
- expirationTime < now → Token expired
- consecutiveFailures > 0 → Recent failures
- requiresUserAction: true → Needs reauth
- refreshToken: null → Cannot auto-refresh
```

### Code References for Token Operations

**Store Tokens**:
```javascript
// src/app/actions/auth-actions.js:46
export async function storeTokenInfo({ accessToken, refreshToken, scopes, idToken })

// src/app/actions/auth-actions.js:412
export async function storeServiceTokens(service, tokens, uid)
```

**Retrieve Tokens**:
```javascript
// src/app/actions/auth-actions.js:212
export async function getTokenInfo(idToken)

// src/app/actions/auth-actions.js:465
export async function getServiceToken(service, idToken)
```

**Refresh Tokens**:
```javascript
// src/app/actions/auth-actions.js:101
export async function refreshTokenInfo(idToken)

// Auto-refresh inside getServiceToken() at line 485-511
```

**Check Authorization**:
```javascript
// src/app/actions/auth-actions.js:541
export async function checkServiceAuth(service, idToken)
```

**Encryption/Decryption**:
```javascript
// src/app/actions/auth-actions.js:16
export async function encrypt(text)

// src/app/actions/auth-actions.js:30
export async function decrypt(text)
```

### Environment Variables for Token Management

**Required (Server-Side Only)**:
```bash
# .env.local or Google Cloud Secret Manager
ENCRYPTION_KEY=your-secret-encryption-key-here
GOOGLE_CLIENT_SECRET=your-google-oauth-secret
```

**Required (Public)**:
```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://your-app.web.app/auth/callback
```

**Security Note**:
- `ENCRYPTION_KEY` and `GOOGLE_CLIENT_SECRET` must NEVER be in client-side code
- Only server actions can access these variables
- Production: Store in Google Cloud Secret Manager
- Local dev: Store in `.env.local` (git-ignored)

---

## Document Metadata

**Created**: 2025-11-15
**Last Updated**: 2025-11-15
**Bumpy Version**: Active Development
**Firebase Project**: analyst-server
**Related Docs**: CLAUDE.md, firestore.rules

---

## Appendix: OAuth Scopes Reference

Common scopes used in Bumpy:

```javascript
// Identity
"openid"
"https://www.googleapis.com/auth/userinfo.email"
"https://www.googleapis.com/auth/userinfo.profile"

// Gmail
"https://www.googleapis.com/auth/gmail.modify"
"https://www.googleapis.com/auth/gmail.compose"
"https://www.googleapis.com/auth/gmail.labels"
"https://www.googleapis.com/auth/gmail.settings.basic"

// Drive
"https://www.googleapis.com/auth/drive"
"https://www.googleapis.com/auth/drive.file"
"https://www.googleapis.com/auth/drive.appdata"

// Calendar
"https://www.googleapis.com/auth/calendar"

// Contacts
"https://www.googleapis.com/auth/contacts"

// Chat (various)
"https://www.googleapis.com/auth/chat.*"
```

Full scope definitions: `public/data/scopes/` (if exists)
