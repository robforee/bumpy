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

# Bumpy Implementation Architecture

## Overview

This document describes the technical implementation of Bumpy, including code organization, key components, data flows, and extension points.

---

## Code Organization

### Directory Structure

```
bumpy/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.js               # Root layout with UserProvider
│   │   ├── page.jsx                # Landing page
│   │   ├── actions/                # Server Actions
│   │   │   ├── auth-actions.js     # Authentication & tokens
│   │   │   ├── google-actions.js   # Google API operations
│   │   │   ├── topic-actions.js    # Topic CRUD
│   │   │   ├── query-actions.js    # AI queries
│   │   │   ├── user-actions.js     # User operations
│   │   │   └── ...
│   │   ├── api/                    # API Routes (legacy)
│   │   ├── auth/
│   │   │   └── callback/           # OAuth callback handler
│   │   ├── dashboard/              # Dashboard page
│   │   └── topics/
│   │       └── [id]/               # Dynamic topic routes
│   ├── components/                 # React components
│   │   ├── ui/                     # Primitive components
│   │   ├── widgets/                # Service widgets
│   │   ├── restaurant/             # Demo feature
│   │   ├── Header.jsx              # Main header
│   │   ├── TopicTableContainer.jsx # Topic table logic
│   │   └── ...
│   ├── contexts/
│   │   └── UserProvider.js         # Global user context
│   ├── lib/
│   │   ├── firebase/               # Firebase SDK setup
│   │   │   ├── clientApp.js        # Client-side Firebase
│   │   │   ├── serverApp.js        # Server-side Firebase
│   │   │   ├── adminApp.js         # Admin SDK
│   │   │   └── firebaseAuth.js     # Auth utilities
│   │   ├── openai/                 # OpenAI integration
│   │   ├── utils/                  # Utility functions
│   │   └── TopicModel.js           # Topic ORM
│   ├── services/
│   │   └── userService.js          # User lifecycle
│   ├── utils/
│   │   └── TopicCache.js           # Topic caching
│   ├── config/
│   │   └── devConfig.js            # Development config
│   └── pages/
│       └── _document.js            # Custom document
├── public/
│   ├── auth-service-worker.js      # Built service worker
│   ├── data/
│   │   └── scopes/                 # OAuth scope definitions
│   └── img/                        # Static images
├── functions/                      # Firebase Functions
│   └── index.js                    # Cloud functions
├── docs/                           # Documentation
├── scripts/                        # Utility scripts
├── PROPOSAL/                       # Feature proposals
└── README/                         # Additional READMEs
```

---

## Key Modules

### 1. Firebase SDK Modules

#### clientApp.js

Client-side Firebase initialization:

```javascript
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    // ... other config
};

export const app = getApps().length === 0 ?
    initializeApp(firebaseConfig) : getApps()[0];

export const db_viaClient = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app);
```

#### serverApp.js

Server-side Firebase with user authentication:

```javascript
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

export async function getAuthenticatedAppForUser(idToken) {
    // Initialize admin app
    const adminApp = initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL
        })
    });

    // Verify user token
    const decodedToken = await getAuth(adminApp).verifyIdToken(idToken);
    const currentUser = {
        uid: decodedToken.uid,
        email: decodedToken.email
    };

    return { firebaseServerApp: adminApp, currentUser };
}
```

### 2. Authentication Module

#### firebaseAuth.js

Client-side auth operations:

```javascript
import { auth } from './clientApp';
import {
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    onAuthStateChanged as firebaseOnAuthStateChanged
} from 'firebase/auth';

export async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    // Add scopes dynamically based on user needs
    provider.addScope('profile');
    provider.addScope('email');

    const result = await signInWithPopup(auth, provider);
    return result.user;
}

export async function signOut() {
    return firebaseSignOut(auth);
}

export function onAuthStateChanged(callback) {
    return firebaseOnAuthStateChanged(auth, callback);
}
```

### 3. Server Actions

#### Pattern: Authenticated Server Action

All server actions follow this pattern:

```javascript
'use server'

import { getAuthenticatedAppForUser } from '@/src/lib/firebase/serverApp';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

export async function myServerAction(param, idToken) {
    try {
        // 1. Authenticate user
        const { firebaseServerApp, currentUser } =
            await getAuthenticatedAppForUser(idToken);

        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        // 2. Get Firestore reference
        const db = getFirestore(firebaseServerApp);

        // 3. Perform operation
        const docRef = doc(db, 'collection', param);
        const docSnap = await getDoc(docRef);

        // 4. Return result
        return {
            success: true,
            data: docSnap.data()
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
```

### 4. UserProvider Context

Global state management for authentication:

```javascript
'use client';

import { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged } from '@/src/lib/firebase/firebaseAuth';
import { userService } from '@/src/services/userService';

const UserContext = createContext();

export function UserProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(async (authUser) => {
            setLoading(true);

            if (authUser) {
                setUser(authUser);
                // Load profile from Firestore
                const profile = await userService.getUserProfile(authUser.uid);
                setUserProfile(profile);
            } else {
                setUser(null);
                setUserProfile(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <UserContext.Provider value={{ user, userProfile, loading }}>
            {children}
        </UserContext.Provider>
    );
}

export const useUser = () => useContext(UserContext);
```

### 5. TopicModel

ORM-like abstraction for topics:

```javascript
import { db_viaClient } from './firebase/clientApp';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';

class TopicModel {
    constructor(id, data) {
        this.id = id;
        this.data = data;
    }

    static async getTopic(id) {
        const docRef = doc(db_viaClient, 'topics', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return new TopicModel(id, docSnap.data());
        }
        throw new Error('Topic not found');
    }

    static async addTopic(parentId, data) {
        const newTopicRef = doc(db_viaClient, 'topics');
        const newTopic = {
            owner: data.owner,
            title: data.title,
            parents: [parentId],
            children: [],
            // ... other fields
        };
        await setDoc(newTopicRef, newTopic);

        // Update parent's children
        const parentRef = doc(db_viaClient, 'topics', parentId);
        await updateDoc(parentRef, {
            children: arrayUnion(newTopicRef.id)
        });

        return new TopicModel(newTopicRef.id, newTopic);
    }

    async changeParent(newParentId) {
        // Remove from old parent, add to new parent
        // Update this topic's parent reference
    }
}
```

---

## Data Flows

### Authentication Flow

```
User clicks Sign In
        ↓
signInWithGoogle()
        ↓
Firebase Auth popup
        ↓
Google OAuth consent
        ↓
Firebase receives token
        ↓
onAuthStateChanged fires
        ↓
UserProvider updates context
        ↓
loadUserProfile()
        ↓
If new user → initializeNewUserIfNeeded()
        ↓
Create users/{uid}, user_tokens/{uid}, root topic
        ↓
App renders authenticated state
```

### Service Authorization Flow

```
User clicks "Connect Gmail"
        ↓
Build OAuth URL with Gmail scopes
        ↓
window.location = authUrl
        ↓
Google OAuth consent
        ↓
Redirect to /auth/callback?code=...
        ↓
exchangeCodeForTokens(code)
        ↓
Google returns access + refresh tokens
        ↓
storeServiceTokens('gmail', tokens, uid)
        ↓
Encrypt tokens
        ↓
Store in service_credentials/{uid}_gmail
        ↓
Redirect to dashboard
        ↓
Gmail widget shows data
```

### API Request Flow

```
Component needs Gmail data
        ↓
const idToken = await user.getIdToken()
        ↓
queryGmailInbox(userId, idToken)
        ↓
getAuthenticatedAppForUser(idToken)
        ↓
Verify idToken, get currentUser
        ↓
Get service_credentials/{uid}_gmail
        ↓
getValidAccessToken()
        ↓
If expired → refresh token
        ↓
Create Google API client
        ↓
gmail.users.messages.list()
        ↓
Return { success: true, messages: [...] }
        ↓
Component renders messages
```

### Topic CRUD Flow

```
User creates topic
        ↓
createTopic(parentId, data, idToken)
        ↓
Verify user auth
        ↓
Generate topic document
        ↓
setDoc(topicRef, topicData)
        ↓
Update parent.children array
        ↓
Real-time listener fires
        ↓
UI updates automatically
```

---

## Component Architecture

### Layout Hierarchy

```
RootLayout
    └── UserProvider (context)
        └── Header (navigation)
        └── {children} (pages)
```

### Topic Page Hierarchy

```
TopicPage
    └── TopicTableContainer (logic/handlers)
        └── TopicTable (rendering)
            ├── TopicHeaderRow (header with actions)
            └── TopicRow[] (data rows)
        └── TopicModals (dialogs)
            ├── AddTopicModal
            └── EditPropertyModal
```

### Dashboard Hierarchy

```
DashboardPage
    ├── EmailWidget
    ├── DriveWidget
    ├── CalendarWidget
    └── MessengerWidget
```

### Widget Pattern

```javascript
function ServiceWidget() {
    const { user } = useUser();
    const [authorized, setAuthorized] = useState(false);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function checkAndFetch() {
            const idToken = await user.getIdToken();
            const authResult = await checkServiceAuth('service', idToken);

            if (authResult.isAuthorized) {
                setAuthorized(true);
                const dataResult = await queryService(user.uid, idToken);
                setData(dataResult.data);
            }
            setLoading(false);
        }

        if (user) checkAndFetch();
    }, [user]);

    if (loading) return <LoadingSpinner />;
    if (!authorized) return <AuthorizeButton service="service" />;
    return <DataDisplay data={data} />;
}
```

---

## Dependencies

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| next | 14.2.3 | React framework |
| react | 18.2.0 | UI library |
| firebase | 10.11.1 | Client SDK |
| firebase-admin | 12.5.0 | Server SDK |
| googleapis | 144.0.0 | Google APIs |
| openai | 4.67.3 | AI integration |
| moment-timezone | 0.5.45 | Date handling |
| react-query | 3.39.3 | Server state |
| react-markdown | 9.0.1 | Markdown rendering |
| zod | 3.23.8 | Schema validation |
| lucide-react | 0.451.0 | Icons |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| tailwindcss | 3.4.11 | Styling |
| autoprefixer | 10.4.20 | CSS prefixes |
| postcss | 8.4.47 | CSS processing |
| esbuild | 0.20.2 | Service worker build |
| cross-env | 7.0.3 | Cross-platform env |

---

## Extension Points

### 1. Adding New Server Actions

Location: `src/app/actions/`

```javascript
// src/app/actions/my-new-actions.js
'use server'

export async function myNewAction(param, idToken) {
    // Follow the standard pattern
}
```

### 2. Adding New Components

Location: `src/components/`

```javascript
// src/components/MyComponent.jsx
'use client'

export default function MyComponent({ prop }) {
    return <div>{prop}</div>;
}
```

### 3. Adding New Pages

Location: `src/app/`

```javascript
// src/app/my-page/page.jsx
export default function MyPage() {
    return <h1>My Page</h1>;
}
```

### 4. Adding New Firebase Collections

1. Define schema in documentation
2. Add Firestore rules to `firestore.rules`
3. Create server actions for CRUD
4. Deploy rules

### 5. Adding New Google Services

1. Add scope file: `public/data/scopes/service.json`
2. Add check: `checkServiceAuth('service', idToken)`
3. Add query: `queryService()` in `google-actions.js`
4. Add widget: `src/components/widgets/ServiceWidget.jsx`

---

## Security Implementation

### Token Encryption

```javascript
// Encrypt
const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
const iv = crypto.randomBytes(16);
const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
let encrypted = cipher.update(text, 'utf8', 'hex');
encrypted += cipher.final('hex');
return iv.toString('hex') + ':' + encrypted;

// Decrypt
const [ivHex, encryptedHex] = text.split(':');
const iv = Buffer.from(ivHex, 'hex');
const encrypted = Buffer.from(encryptedHex, 'hex');
const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
let decrypted = decipher.update(encrypted, 'hex', 'utf8');
decrypted += decipher.final('utf8');
return decrypted;
```

### ID Token Verification

```javascript
// In getAuthenticatedAppForUser()
const decodedToken = await getAuth(adminApp).verifyIdToken(idToken);
```

This verifies:
- Token is valid
- Token is not expired
- Token is issued by Firebase
- Token is for correct project

### Firestore Rules

```javascript
// Owner-only access pattern
match /users/{userId} {
    allow read, write: if request.auth.uid == userId || isAdmin();
}

// Service credential pattern
match /service_credentials/{credentialId} {
    allow read, write: if credentialId.matches(request.auth.uid + '_.*');
}
```

---

## Performance Considerations

### Bundle Size

- Server Actions: Code-split, not in client bundle
- Dynamic imports: Used for large components
- Tree shaking: Unused exports eliminated

### Firestore Optimization

- Use specific field reads, not full documents when possible
- Batch writes for multiple operations
- Index compound queries

### Token Caching

- Tokens stored with expiration time
- Checked before API calls
- Refreshed only when expired

### React Optimization

- `useCallback` for memoized handlers
- `useMemo` for computed values
- Conditional rendering to avoid unnecessary DOM

---

## Testing Architecture

### Test Files Location

```
Email/tests/           # Email tests
src/**/*.test.js      # Component tests
```

### Test Configuration

Jest configuration in `package.json`:

```json
{
  "jest": {
    "testEnvironment": "node",
    "verbose": true
  }
}
```

### Test Patterns

```javascript
// Server action test
describe('storeTokenInfo', () => {
    it('should store encrypted tokens', async () => {
        const result = await storeTokenInfo({
            accessToken: 'test-token',
            refreshToken: 'refresh-token',
            scopes: ['scope1'],
            idToken: mockIdToken
        });
        expect(result.success).toBe(true);
    });
});
```

---

## Deployment Architecture

### Firebase App Hosting

```
GitHub Push → Cloud Build → Cloud Run → Firebase CDN
```

### Build Process

1. `npm run build-service-worker` → Build auth service worker
2. `npm run build` → Next.js production build
3. Deploy to Cloud Run via App Hosting

### Environment Resolution

1. Development: `.env.local`
2. Production: `apphosting.yaml` + Secret Manager

---

## Future Architecture Considerations

### Planned Improvements

1. **IndexedDB caching**: Offline topic access
2. **WebSocket integration**: Real-time updates beyond Firestore
3. **Service Worker enhancement**: Background sync
4. **Module federation**: Micro-frontend for widgets

### Scalability

1. **Collection sharding**: For high-volume topics
2. **CDN for assets**: Already via Firebase
3. **Edge functions**: For latency-sensitive operations

### Migration Paths

1. **To TypeScript**: Gradual migration with JSDoc
2. **To Prisma**: If relational data needed
3. **To custom backend**: Server Actions to Express/Fastify
