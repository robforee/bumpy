---
source_type: implementation
source: Original documentation from bumpy
confidence: medium
last_validated: '2025-11-22'
next_review: '2026-05-21'
validation_frequency: 180
status: published
phase: stable
git_commits: []
git_blame_url: ''
replaces: ''
related_projects: []
---

# Bumpy Schema Documentation

## Overview

Bumpy uses Firestore as its primary database with a document-oriented schema. This document describes all data structures, their relationships, and validation rules.

---

## Firestore Collections

### users/{userId}

User profile information. Document ID is the Firebase Auth UID.

```typescript
interface User {
    email: string;                    // User's email address
    displayName: string | null;       // Display name from Google
    photoURL: string | null;          // Profile photo URL
    topicRootId: string | null;       // ID of user's root topic (matches userId)
    preferences: {
        'gmail-sync': boolean;        // Gmail sync preference
        'drive-sync': boolean;        // Drive sync preference
        'calendar-sync': boolean;     // Calendar sync preference
    };
    syncGmail: {
        consecutiveFailures: number;  // Failure counter for Gmail sync
    };
    createdAt: string;                // 'YYYY-MM-DD HH:mm CST' format
    updatedAt: string;                // 'YYYY-MM-DD HH:mm CST' format
}
```

**Security Rules**: Owner or admin read/write only.

---

### user_tokens/{userId}

Legacy unified token storage. Being deprecated in favor of service_credentials.

```typescript
interface UserTokens {
    __last_token_update: number;           // Unix timestamp of last update
    __web_token_update: string;            // Human-readable timestamp
    __web_refresh_token_update: string | null;
    __error_time: string | null;           // Timestamp of last error
    __last_error: string | null;           // Last error message
    accessToken: string;                   // Encrypted access token
    refreshToken: string | null;           // Encrypted refresh token
    expirationTime: number;                // Unix timestamp of expiration
    userEmail: string;                     // Associated email
    authorizedScopes: string[];            // List of authorized scopes
    errors: string[];                      // Error history
    consecutiveFailures: number;           // Failure counter
    requiresUserAction: boolean;           // User intervention needed
    requiresRefreshToken: boolean;         // Re-auth needed
}
```

**Security Rules**: Owner or admin full access.

---

### service_credentials/{userId}_{serviceName}

Per-service OAuth credentials. Document ID format: `{userId}_{serviceName}`.

**Service Names**: `gmail`, `drive`, `calendar`, `messenger`

```typescript
interface ServiceCredential {
    accessToken: string;          // Encrypted access token
    refreshToken: string | null;  // Encrypted refresh token
    scopes: string[];             // Granted scopes for this service
    grantedAt: number;            // Unix timestamp when granted
    lastRefreshed: number;        // Unix timestamp of last refresh
    expiresAt: number;            // Unix timestamp of expiration
}
```

**Security Rules**:
```
allow read, write: if request.auth != null &&
    (credentialId.matches(request.auth.uid + '_.*') || isAdmin());
```

---

### authorized_scopes/{userId}

Public-readable authorized scopes for login display.

```typescript
interface AuthorizedScopes {
    authorizedScopes: string[];   // List of all authorized scopes
    userEmail: string;            // Associated email
}
```

**Security Rules**: Public read, owner/admin write.

---

### user_scopes/{userId}

User's requested/available scopes.

```typescript
interface UserScopes {
    services: {
        gmail: string[];
        drive: string[];
        calendar: string[];
        chat: string[];
    };
}
```

**Security Rules**: Public read, owner/admin write.

---

### topics/{topicId}

Hierarchical topic storage.

```typescript
interface Topic {
    // Ownership
    owner: string;                     // userId of owner (legacy)
    owner_id: string;                  // userId of owner (current)
    sharing: 'private' | 'public';     // Visibility setting

    // Versioning
    version: number;                   // Current version number
    versions: VersionEntry[];          // Version history
    seq: number;                       // Sequence number (timestamp)

    // Classification
    topic_type: TopicType;             // Type classification
    output_type?: string;              // Output format type

    // Content
    title: string;                     // Primary title
    subtitle: string;                  // Secondary description
    text: string;                      // Main content (markdown)
    description?: string;              // Alternative description field
    photo_url?: string;                // Associated image
    topic_doc_uri?: string;            // External document link

    // Hierarchy
    parents: string[];                 // Parent topic IDs (usually single)
    children: string[];                // Child topic IDs
    parent_id?: string | null;         // Single parent reference

    // Timestamps
    created_at?: string;               // Creation timestamp
    updated_at?: string;               // Last update timestamp
    createdAt?: string;                // Alternative timestamp field
    updatedAt?: string;                // Alternative timestamp field
}

type TopicType =
    | 'root'      // User's root topic
    | 'topic'     // General topic
    | 'concept'   // AI-analyzed concept
    | 'milestone' // Progress marker
    | 'question'  // Inquiry
    | 'subtopic'  // Sub-topic
    | 'Comment'   // User annotation
    | 'Prompt';   // AI query template

interface VersionEntry {
    version: number;
    timestamp: number;
    changes: Record<string, any>;
}
```

**Security Rules**: Authenticated read, create. Owner update/delete.

---

### auth_logs/{logId}

Immutable authentication event logs.

```typescript
interface AuthLog {
    userId: string;
    event: string;
    timestamp: string;
    details: Record<string, any>;
}
```

**Security Rules**: Any auth user create, admin read/delete, no updates.

---

### restaurants/{restaurantId}

Example/demo restaurant data (from FriendlyEats template).

```typescript
interface Restaurant {
    name: string;
    category: string;
    city: string;
    price: number;
    photo: string;
    numRatings: number;
    avgRating: number;
}
```

**Security Rules**: Public read, auth create, owner update (name unchanged).

---

### restaurants/{restaurantId}/ratings/{ratingId}

Restaurant ratings subcollection.

```typescript
interface Rating {
    rating: number;
    text: string;
    userId: string;
    timestamp: Date;
}
```

---

### businesses/{businessId}

Business directory entries.

```typescript
interface Business {
    name: string;
    address: string;
    // Additional fields as needed
}
```

**Security Rules**: Development mode - open read/write.

---

### people/{personId}

People directory entries.

```typescript
interface Person {
    name: string;
    email: string;
    // Additional fields as needed
}
```

**Security Rules**: Public read, auth write.

---

### admin/{document}

Admin-only configuration.

**Security Rules**: Admin only.

---

### admin_data/{document}

Admin-only application data.

**Security Rules**: Admin only.

---

### public_data/{document}

Publicly readable, admin-writable data.

**Security Rules**: Public read, admin write.

---

### logs/{logId}

Application logs.

```typescript
interface Log {
    userId: string;
    message: string;
    level: string;
    timestamp: Date;
}
```

**Security Rules**: Owner or admin access.

---

### adminData/{userId}

User-specific admin data.

**Security Rules**: Owner or admin access.

---

### defined_corridors/{corridorId}

Geographic corridor definitions (for maps features).

**Security Rules**: Development mode - open read/write.

---

## API Response Schemas

### Standard Response Pattern

All Server Actions return:

```typescript
interface SuccessResponse<T> {
    success: true;
    data?: T;
    [key: string]: any;  // Additional fields
}

interface ErrorResponse {
    success: false;
    error: string;
}

type ActionResponse<T> = SuccessResponse<T> | ErrorResponse;
```

---

### Authentication Responses

#### storeTokenInfo

```typescript
interface StoreTokenResponse {
    success: boolean;
    error?: string;
}
```

#### getTokenInfo

```typescript
interface TokenInfoResponse {
    success: boolean;
    data?: {
        scopes: string[];
        expiresIn: number;
    };
    error?: string;
}
```

#### exchangeCodeForTokens

```typescript
interface TokenExchangeResponse {
    success: boolean;
    tokens?: {
        accessToken: string;
        refreshToken: string;
        expiresAt: number;
        scopes: string[];
    };
    error?: string;
}
```

#### checkServiceAuth

```typescript
interface ServiceAuthResponse {
    success: boolean;
    isAuthorized: boolean;
    scopes?: string[];
    error?: string;
}
```

---

### Google Service Responses

#### queryGmailInbox

```typescript
interface GmailInboxResponse {
    success: boolean;
    messages?: GmailMessage[];
    error?: string;
}

interface GmailMessage {
    id: string;
    threadId: string;
    subject: string;
    from: string;
    date: string;
    snippet: string;
}
```

#### queryDriveFiles

```typescript
interface DriveFilesResponse {
    success: boolean;
    files?: DriveFile[];
    error?: string;
}

interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    modifiedTime: string;
    webViewLink: string;
    iconLink?: string;
    thumbnailLink?: string;
    size?: string;
}
```

#### queryCalendarEvents

```typescript
interface CalendarEventsResponse {
    success: boolean;
    events?: CalendarEvent[];
    error?: string;
}

interface CalendarEvent {
    id: string;
    summary: string;
    description: string;
    start: string;       // ISO date or datetime
    end: string;
    location: string;
    attendees: string[];
    htmlLink: string;
}
```

#### queryChatSpaces

```typescript
interface ChatSpacesResponse {
    success: boolean;
    spaces?: ChatSpace[];
    error?: string;
}

interface ChatSpace {
    id: string;
    displayName: string;
    spaceType: string;
    messages: ChatMessage[];
}

interface ChatMessage {
    id: string;
    text: string;
    sender: {
        displayName: string;
        avatarUrl?: string;
    };
    createTime: string;
}
```

---

## Configuration Schemas

### Environment Variables

```typescript
interface ClientEnvVars {
    NEXT_PUBLIC_FIREBASE_API_KEY: string;
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: string;
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
    NEXT_PUBLIC_FIREBASE_APP_ID: string;
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: string;
    NEXT_PUBLIC_GOOGLE_REDIRECT_URI: string;
}

interface ServerEnvVars {
    FIREBASE_PROJECT_ID: string;
    FIREBASE_PRIVATE_KEY_ID: string;
    FIREBASE_PRIVATE_KEY: string;
    FIREBASE_CLIENT_EMAIL: string;
    FIREBASE_CLIENT_ID: string;
    FIREBASE_AUTH_URI: string;
    FIREBASE_TOKEN_URI: string;
    FIREBASE_AUTH_PROVIDER_X509_CERT_URL: string;
    FIREBASE_CLIENT_X509_CERT_URL: string;
    GOOGLE_CLIENT_SECRET: string;
    ENCRYPTION_KEY: string;
    OPENAI_API_KEY: string;
}
```

### apphosting.yaml Schema

```yaml
env:
  - variable: VARIABLE_NAME
    secret: secret-manager-id

runConfig:
  cpu: 1
  memoryMiB: 512
  concurrency: 80
```

---

## OAuth Scopes Schema

### Gmail Scopes

```typescript
const GMAIL_SCOPES = [
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.labels',
    'https://www.googleapis.com/auth/gmail.settings.basic'
];
```

### Drive Scopes

```typescript
const DRIVE_SCOPES = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.appdata'
];
```

### Calendar Scopes

```typescript
const CALENDAR_SCOPES = [
    'https://www.googleapis.com/auth/calendar'
];
```

### Chat Scopes

```typescript
const CHAT_SCOPES = [
    'https://www.googleapis.com/auth/chat.spaces',
    'https://www.googleapis.com/auth/chat.messages'
];
```

---

## Encryption Schema

### Encrypted Value Format

```
{iv_hex}:{encrypted_hex}
```

- IV: 16 bytes random, hex encoded (32 chars)
- Separator: `:` character
- Encrypted: AES-256-CBC output, hex encoded

### Encryption Parameters

```typescript
interface EncryptionConfig {
    algorithm: 'aes-256-cbc';
    keyDerivation: 'scrypt';
    salt: 'salt';
    keyLength: 32;
    ivLength: 16;
}
```

---

## Validation Rules

### Topic Validation

```typescript
const TopicSchema = z.object({
    title: z.string().min(1).max(200),
    subtitle: z.string().max(500).optional(),
    text: z.string().max(50000).optional(),
    topic_type: z.enum(['root', 'topic', 'concept', 'milestone', 'question', 'subtopic', 'Comment', 'Prompt']),
    sharing: z.enum(['private', 'public']).default('private')
});
```

### User Validation

```typescript
const UserSchema = z.object({
    email: z.string().email(),
    displayName: z.string().max(100).optional(),
    photoURL: z.string().url().optional()
});
```

---

## Index Requirements

Firestore indexes are auto-created but these compound queries require manual index creation:

```javascript
// Topics by user and type
topics: userId, topic_type, created_at

// Topics by parent
topics: parent_id, seq

// Topics children query
topics: parents, seq
```

---

## Data Relationships

### User to Topics

```
users/{userId}
    └── topicRootId → topics/{userId} (root topic)
        └── children → topics/{childId}*
```

### User to Service Credentials

```
users/{userId}
    ├── service_credentials/{userId}_gmail
    ├── service_credentials/{userId}_drive
    ├── service_credentials/{userId}_calendar
    └── service_credentials/{userId}_messenger
```

### Topic Hierarchy

```
topics/{rootId} (topic_type: 'root')
    └── children: [childId1, childId2, ...]
        └── topics/{childId1}
            └── children: [grandchildId1, ...]
```

---

## Migration Notes

### Legacy Token Migration

When migrating from `user_tokens` to `service_credentials`:

1. Read `user_tokens/{userId}`
2. Extract tokens and scopes
3. Create separate `service_credentials/{userId}_{service}` documents
4. Maintain `user_tokens` for backward compatibility

### Field Naming Conventions

The codebase uses mixed conventions due to evolution:
- `snake_case`: `topic_type`, `owner_id`, `created_at`
- `camelCase`: `topicRootId`, `displayName`, `accessToken`

New code should prefer `camelCase` for JavaScript consistency.
