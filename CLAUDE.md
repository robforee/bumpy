# Bumpy - Topic Management & Google Services Integration

**Type**: Next.js Application
**Status**: Active Development
**Location**: `/home/robforee/analyst-server/bumpy`

## Overview

Bumpy is a Next.js application that provides hierarchical topic management with integrated Google services (Gmail, Drive, Calendar, Chat) and AI-powered concept analysis. It uses Firebase for authentication, data storage, and serverless functions.

## Core Features

1. **Topic Management**
   - Hierarchical topic structure with parent-child relationships
   - Categories: concepts, milestones, questions, subtopics
   - Real-time topic updates and listeners
   - Topic caching and offline support

2. **Google Services Integration**
   - Gmail: Email fetching and sending
   - Drive: File operations
   - Calendar: Event queries
   - Chat/Messenger: Messaging capabilities
   - OAuth 2.0 flow with token refresh

3. **AI Integration**
   - OpenAI for concept queries and analysis
   - Google Generative AI integration
   - Structured query preparation for concept analysis

4. **Authentication & Authorization**
   - Firebase Authentication
   - Google OAuth with scope management
   - Token storage and refresh (encrypted)
   - Service Worker for auth handling

## Architecture

### Tech Stack

```
Frontend:
- Next.js 14.2.3 (App Router)
- React 18.2.0
- TailwindCSS + Typography
- Lucide React Icons

Backend:
- Firebase (Firestore, Auth, Storage, Functions)
- Google APIs (Gmail, Drive, Calendar, Chat)
- OpenAI API

Authentication:
- Firebase Auth
- Google OAuth 2.0
- Service Worker (auth-service-worker.js)

State Management:
- React Query
- Context API (UserProvider)
```

### Directory Structure

```
bumpy/
├── src/
│   ├── app/
│   │   ├── actions/           # Server actions
│   │   │   ├── auth-actions.js
│   │   │   ├── google-actions.js
│   │   │   ├── topic-actions.js
│   │   │   ├── query-actions.js
│   │   │   └── user-actions.js
│   │   ├── api/               # API routes
│   │   ├── auth/              # Auth pages
│   │   │   └── callback/      # OAuth callback
│   │   ├── dashboard/         # Dashboard page
│   │   ├── topics/[id]/       # Topic detail pages
│   │   └── layout.js          # Root layout
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── TopicList/
│   │   ├── TopicTable/
│   │   └── ServiceAuthCard.jsx
│   ├── contexts/
│   │   └── UserProvider.js    # User context & auth state
│   ├── lib/
│   │   ├── firebase/          # Firebase config & operations
│   │   │   ├── clientApp.js
│   │   │   ├── serverApp.js
│   │   │   ├── adminApp.js
│   │   │   ├── firebaseAuth.js
│   │   │   └── firestore.js
│   │   ├── openai/            # OpenAI operations
│   │   ├── utils/             # Utility functions
│   │   │   ├── auth-utils.js
│   │   │   └── token-utils.js
│   │   └── TopicModel.js
│   └── services/
│       └── userService.js
├── public/
│   ├── auth-service-worker.js # Built from root
│   └── data/
│       └── scopes/            # Google OAuth scopes
├── firebase.json              # Firebase config
├── firestore.rules            # Firestore security rules
├── ecosystem.config.js        # PM2 config (if applicable)
└── .env.local                 # Local environment variables
```

## Key Flows

### Authentication Flow

```
1. User clicks "Sign In" (Header.jsx)
2. signInWithGoogle() → Firebase Auth with Google provider
3. OAuth popup with requested scopes
4. Token exchange and storage:
   - Access token + Refresh token stored encrypted in Firestore
   - User scopes stored in user_scopes collection
5. onAuthStateChanged() triggers → UserProvider updates context
6. User profile loaded from Firestore
```

### Google Service Access Flow

```
1. ServiceAuthCard checks auth status
2. If no valid token → initiate OAuth flow
3. exchangeCodeForTokens() → Get access + refresh tokens
4. Store encrypted tokens in Firestore (users/{uid}/tokens)
5. Use tokens for API calls via google-actions.js
6. Auto-refresh on expiry via token-utils.js
```

### Topic Management Flow

```
1. User navigates to /topics/[id]
2. fetchTopicsByCategory() → Firestore query
3. Real-time listener (onTopicsChange)
4. TopicTable renders with data
5. User edits → updateTopic() server action
6. Firestore security rules validate user ownership
```

### Concept Query Flow

```
1. User enters concept query (TopicHeaderRow)
2. handleConceptQuery():
   - Fetch context from state
   - Prepare structured query (prepareStructuredQuery_forConceptAnalysis)
   - runConceptQuery() → OpenAI API
3. Parse response → Generate markdown
4. handleSaveTopic() → Save to Firestore
```

## Environment Configuration

### Required Environment Variables

**Client-side** (NEXT_PUBLIC_*):
```bash
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_GOOGLE_CLIENT_ID
NEXT_PUBLIC_GOOGLE_REDIRECT_URI
```

**Server-side**:
```bash
# Firebase Admin SDK
FIREBASE_PROJECT_ID
FIREBASE_PRIVATE_KEY_ID
FIREBASE_PRIVATE_KEY
FIREBASE_CLIENT_EMAIL
FIREBASE_CLIENT_ID
FIREBASE_AUTH_URI
FIREBASE_TOKEN_URI
FIREBASE_AUTH_PROVIDER_X509_CERT_URL
FIREBASE_CLIENT_X509_CERT_URL

# Google OAuth
GOOGLE_CLIENT_SECRET

# Encryption
ENCRYPTION_KEY

# OpenAI
OPENAI_API_KEY
```

**Setup**:
1. Copy `.env.local.template` to `.env.local`
2. Fill in values from Firebase Console & Google Cloud Console
3. For production: Use Firebase App Hosting secrets via `apphosting.yaml`

## Development

### Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Build service worker
npm run build-service-worker
```

### Testing

```bash
# Run all tests
npm run test

# Run specific test file
npm run test -- path/to/test.js

# Test credentials
./test-credentials.sh
./test-service-credentials.mjs
```

### Firebase Emulators

```bash
# Start emulators with data import/export
npm run emulators
```

### Firestore Rules Deployment

```bash
# Deploy updated rules
./deploy-firestore-rules.sh

# Show rule diff
./show-new-rules.sh
```

## Current Issues & Solutions

### Issue: Missing Firebase Environment Variables

**Error**: "Authentication failed: Missing required Firebase environment variables"

**Cause**: Server-side Firebase Admin SDK requires service account credentials

**Solution**:
1. Ensure `.env.local` contains all `FIREBASE_*` variables (not just `NEXT_PUBLIC_*`)
2. For local dev: Use service account JSON key
3. For production: Use Firebase App Hosting secrets (apphosting.yaml)

### Issue: Import Error - `encrypt` not exported

**Error**: "Attempted import error: 'encrypt' is not exported from '@/src/lib/utils/auth-utils'"

**Cause**: Function not exported or file path incorrect

**Solution**:
1. Check `src/lib/utils/auth-utils.js` exports
2. Verify import path in `ClientCallback.jsx`
3. Ensure function is properly exported: `export function encrypt(...)`

### Issue: Firestore Permission Errors

**Error**: "Missing or insufficient permissions"

**Cause**: Firestore security rules deny access

**Solutions**:
1. Review `firestore.rules` for current user/service permissions
2. For development: Temporarily allow read/write (NOT for production)
3. For production: Update rules and deploy via `./deploy-firestore-rules.sh`
4. Verify user authentication state before queries

## Firestore Data Model

### Collections

```
users/
  {uid}/
    - email
    - displayName
    - photoURL
    - rootTopicId
    - createdAt

  tokens/
    {service}/
      - accessToken (encrypted)
      - refreshToken (encrypted)
      - expiresAt
      - scopes

  scopes/
    - services: { gmail: [...], drive: [...] }

topics/
  {topicId}/
    - userId
    - title
    - subtitle
    - text
    - category (concept|milestone|question|subtopic)
    - parentId
    - createdAt
    - updatedAt

restaurants/ (example feature)
members/ (example feature)
```

## Google OAuth Scopes

**Managed in**: `public/data/scopes/`

**Default scopes**:
- `https://www.googleapis.com/auth/userinfo.email`
- `https://www.googleapis.com/auth/userinfo.profile`
- `https://www.googleapis.com/auth/drive`
- `https://www.googleapis.com/auth/drive.file`
- `https://www.googleapis.com/auth/drive.appdata`
- `https://www.googleapis.com/auth/gmail.modify`
- `https://www.googleapis.com/auth/gmail.compose`
- `https://www.googleapis.com/auth/gmail.labels`
- `https://www.googleapis.com/auth/gmail.settings.basic`
- `https://www.googleapis.com/auth/calendar`
- `https://www.googleapis.com/auth/chat.*` (various chat scopes)
- `https://www.googleapis.com/auth/contacts`
- `openid`

## Key Files

| File | Purpose |
|------|---------|
| `src/app/actions/auth-actions.js` | Server actions for auth (checkServiceAuth, exchangeCodeForTokens) |
| `src/app/actions/google-actions.js` | Server actions for Google APIs (Gmail, Drive, Calendar) |
| `src/app/actions/topic-actions.js` | Server actions for topic CRUD |
| `src/lib/firebase/serverApp.js` | Firebase Admin SDK initialization (server) |
| `src/lib/firebase/clientApp.js` | Firebase Client SDK initialization |
| `src/lib/firebase/firebaseAuth.js` | Auth utilities (signIn, signOut, token management) |
| `src/contexts/UserProvider.js` | User context & authentication state |
| `src/components/Header.jsx` | Navigation & sign-in UI |
| `auth-service-worker.js` | Service worker for auth token handling |
| `firestore.rules` | Firestore security rules |
| `.env.local.template` | Template for local environment variables |

## Documentation References

- [Firebase Console](https://console.firebase.google.com/)
- [Google Cloud Console - Secret Manager](https://console.cloud.google.com/security/secret-manager?project=analyst-server)
- [Firebase App Hosting Secrets](https://firebase.google.com/docs/app-hosting/configure#secret-parameters)
- [Google Cloud Secret Manager Quickstart](https://cloud.google.com/secret-manager/docs/create-secret-quickstart#secretmanager-quickstart-gcloud)
- [Hosting Error Logs](https://console.cloud.google.com/logs/query) (analyst-server project)

## Deployment

### Firebase App Hosting

**Configuration**: `apphosting.yaml`

**Steps**:
1. Update environment secrets in Google Cloud Secret Manager
2. Map secrets in `apphosting.yaml`
3. Deploy via Firebase CLI or Console
4. Monitor logs for errors

### Security Checklist

- [ ] All sensitive environment variables in Secret Manager (not .env.local)
- [ ] Firestore rules deployed and tested
- [ ] Token encryption key rotated regularly
- [ ] OAuth redirect URIs whitelisted
- [ ] Service account permissions minimized

## Troubleshooting

### Check Firebase Auth State
```javascript
// In browser console
firebase.auth().currentUser
```

### Check Firestore Connection
```javascript
// In browser console
firebase.firestore().collection('topics').limit(1).get()
```

### Verify Token Storage
```javascript
// Server-side (serverApp.js)
const tokens = await getTokensForUser(uid, 'gmail')
console.log('Tokens:', tokens)
```

### Debug Service Worker
1. Open DevTools → Application → Service Workers
2. Check registration status
3. View console logs for auth-service-worker

## Next Steps / Roadmap

- [ ] Implement offline caching for topics
- [ ] Email display and swipe interface
- [ ] Document query and compare feature
- [ ] Calendar swimlanes visualization
- [ ] Voice input (dual channel)
- [ ] Chat interface integration
- [ ] Improve error handling and user feedback
- [ ] Add comprehensive test coverage
- [ ] Optimize token refresh logic
- [ ] Implement proper loading states

## Contact & Support

**Project Owner**: Rob Foree
**Project Type**: Personal AI Infrastructure Integration
**Related Projects**: analyst-server (parent orchestrator)

For issues related to:
- Firebase/Firestore → Check `firestore.rules` and auth state
- Google APIs → Verify tokens and scopes
- Environment config → Review `.env.local` and `apphosting.yaml`
- Build errors → Check `next.config.mjs` and dependencies

---

**Last Updated**: 2025-11-14
**Status**: Active development - fixing Firebase environment variable configuration and import errors
