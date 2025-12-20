---
source_type: procedure
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

# Bumpy Procedures Guide

## Installation & Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase CLI (`npm install -g firebase-tools`)
- Google Cloud project with enabled APIs
- Firebase project

### Step 1: Clone Repository

```bash
git clone git@github.com:robforee/bumpy.git
cd bumpy
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment

1. Copy template:
```bash
cp .env.local.template .env.local
```

2. Fill in Firebase client values:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
```

3. Fill in Firebase server values:
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=123456789
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...
```

4. Add OAuth and encryption:
```env
GOOGLE_CLIENT_SECRET=your-client-secret
ENCRYPTION_KEY=your-32-char-encryption-key
OPENAI_API_KEY=sk-...
```

### Step 4: Configure Google Cloud

1. **Enable APIs** in Google Cloud Console:
   - Gmail API
   - Google Drive API
   - Google Calendar API
   - Google Chat API

2. **Configure OAuth consent screen**:
   - Add test users
   - Configure scopes
   - Set redirect URIs

3. **Create OAuth credentials**:
   - Application type: Web application
   - Add redirect URI: `http://localhost:3000/auth/callback`

### Step 5: Deploy Firestore Rules

```bash
./deploy-firestore-rules.sh
```

Or manually:
```bash
firebase deploy --only firestore:rules
```

### Step 6: Run Development Server

```bash
npm run dev
```

Access at `http://localhost:3000`

---

## Basic Usage Examples

### Example 1: Creating Your First Topic

```javascript
// Using TopicModel
import TopicModel from '@/src/lib/TopicModel';

// Create a topic under root
const rootId = user.uid; // Root topic ID = user ID
const topic = await TopicModel.addTopic(rootId, {
    owner: user.uid,
    title: 'My First Project',
    subtitle: 'Learning Bumpy',
    text: 'This is my first topic hierarchy.',
    topic_type: 'topic',
    output_type: 'markdown'
});

console.log('Created topic:', topic.id);
```

### Example 2: Authorizing Gmail

```javascript
// In a component
import { checkServiceAuth } from '@/src/app/actions/auth-actions';

const checkGmail = async () => {
    const idToken = await user.getIdToken();
    const result = await checkServiceAuth('gmail', idToken);

    if (!result.isAuthorized) {
        // Show authorization UI
        initiateOAuthFlow('gmail');
    } else {
        // Gmail is ready to use
        console.log('Gmail scopes:', result.scopes);
    }
};
```

### Example 3: Querying Gmail

```javascript
import { queryGmailInbox } from '@/src/app/actions/google-actions';

const fetchEmails = async () => {
    const idToken = await user.getIdToken();
    const result = await queryGmailInbox(user.uid, idToken);

    if (result.success) {
        result.messages.forEach(msg => {
            console.log(`${msg.subject} from ${msg.from}`);
        });
    } else {
        console.error('Error:', result.error);
    }
};
```

### Example 4: Running AI Analysis

```javascript
import {
    prepareStructuredQuery_forConceptAnalysis,
    runConceptQuery
} from '@/src/app/actions/query-actions';

const analyzeWithAI = async () => {
    const idToken = await user.getIdToken();

    // Prepare context
    const context = [
        { role: 'topic', content: parentTopic.text },
        { role: 'subtopics', content: childTopics.map(t => t.title).join(', ') }
    ];

    // Build query
    const query = prepareStructuredQuery_forConceptAnalysis(
        context,
        'What are the key concepts in this area?'
    );

    // Run analysis
    const result = await runConceptQuery(query, idToken);

    if (result.success) {
        console.log('AI Analysis:', result.completion);
    }
};
```

---

## Integration Procedures

### Integrating with Gmail

1. **Add scopes to request**:
```javascript
const GMAIL_SCOPES = [
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.compose'
];
```

2. **Build OAuth URL**:
```javascript
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${CLIENT_ID}&` +
    `redirect_uri=${REDIRECT_URI}&` +
    `response_type=code&` +
    `scope=${GMAIL_SCOPES.join(' ')}&` +
    `access_type=offline&` +
    `prompt=consent`;
```

3. **Handle callback**:
```javascript
// In auth/callback/page.jsx
const code = searchParams.get('code');
const result = await exchangeCodeForTokens(code);
await storeServiceTokens('gmail', result.tokens, user.uid);
```

4. **Use Gmail API**:
```javascript
const result = await queryGmailInbox(userId, idToken);
```

### Integrating with Drive

Similar process with Drive-specific scopes:
```javascript
const DRIVE_SCOPES = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file'
];

// After authorization
const result = await queryDriveFiles(userId, idToken);
```

### Integrating with Calendar

```javascript
const CALENDAR_SCOPES = [
    'https://www.googleapis.com/auth/calendar'
];

// After authorization
const result = await queryCalendarEvents(userId, idToken, 10);
```

---

## Extension/Customization Guide

### Adding a New Server Action

1. **Create action file**:
```javascript
// src/app/actions/my-actions.js
'use server'

import { getAuthenticatedAppForUser } from '@/src/lib/firebase/serverApp';

export async function myAction(param, idToken) {
    try {
        const { firebaseServerApp, currentUser } =
            await getAuthenticatedAppForUser(idToken);

        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        // Your logic here
        const result = doSomething(param);

        return { success: true, data: result };
    } catch (error) {
        console.error('Error:', error);
        return { success: false, error: error.message };
    }
}
```

2. **Use in component**:
```javascript
import { myAction } from '@/src/app/actions/my-actions';

const handleClick = async () => {
    const idToken = await user.getIdToken();
    const result = await myAction('param', idToken);
    if (result.success) {
        // Use result.data
    }
};
```

### Adding a New Service Widget

1. **Create widget component**:
```javascript
// src/components/widgets/MyServiceWidget.jsx
'use client'

import { useState, useEffect } from 'react';
import { useUser } from '@/src/contexts/UserProvider';
import { checkServiceAuth } from '@/src/app/actions/auth-actions';
import { queryMyService } from '@/src/app/actions/my-actions';

export default function MyServiceWidget() {
    const { user } = useUser();
    const [data, setData] = useState(null);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const check = async () => {
            const idToken = await user.getIdToken();
            const result = await checkServiceAuth('myservice', idToken);
            setAuthorized(result.isAuthorized);

            if (result.isAuthorized) {
                const dataResult = await queryMyService(user.uid, idToken);
                setData(dataResult.data);
            }
        };

        if (user) check();
    }, [user]);

    if (!authorized) {
        return <button>Connect My Service</button>;
    }

    return (
        <div>
            {data && data.map(item => (
                <div key={item.id}>{item.name}</div>
            ))}
        </div>
    );
}
```

2. **Add to dashboard**:
```javascript
// In dashboard page
import MyServiceWidget from '@/src/components/widgets/MyServiceWidget';

// In JSX
<MyServiceWidget />
```

### Adding a New Topic Type

1. **Update type definition** (if using TypeScript):
```typescript
type TopicType =
    | 'root'
    | 'topic'
    | 'concept'
    | 'milestone'
    | 'question'
    | 'subtopic'
    | 'myNewType';  // Add here
```

2. **Handle in TopicModel**:
```javascript
static async addMyNewType(parentId, data) {
    return TopicModel.addTopic(parentId, {
        ...data,
        topic_type: 'myNewType'
    });
}
```

3. **Update UI rendering**:
```javascript
// In TopicTableContainer
const renderTopic = (topic) => {
    switch (topic.topic_type) {
        case 'myNewType':
            return <MyNewTypeComponent topic={topic} />;
        // ... other cases
    }
};
```

---

## Troubleshooting

### Issue: "Missing required Firebase environment variables"

**Cause**: Server-side Firebase Admin SDK not configured.

**Solution**:
1. Check `.env.local` has all `FIREBASE_*` variables
2. Verify private key format (must include `\n` for newlines)
3. Restart dev server after changes

### Issue: "Token needs refresh" errors

**Cause**: OAuth token expired and refresh failed.

**Solution**:
1. Check if refresh token exists in credentials
2. Verify OAuth client ID/secret correct
3. User may need to reauthorize

```bash
# Check credentials
./test-credentials.sh
```

### Issue: Firestore permission denied

**Cause**: Security rules blocking access.

**Solution**:
1. Check user is authenticated
2. Verify document owner matches user
3. Review firestore.rules

```bash
# Show current vs new rules
./show-new-rules.sh
```

### Issue: OAuth callback fails

**Cause**: Redirect URI mismatch or invalid code.

**Solution**:
1. Check `NEXT_PUBLIC_GOOGLE_REDIRECT_URI` matches Cloud Console
2. Verify localhost vs production URL
3. Check code parameter in URL

### Issue: Service worker not updating

**Cause**: Cached old version.

**Solution**:
```bash
npm run build-service-worker
# Then hard refresh browser (Cmd+Shift+R)
```

---

## Testing Procedures

### Running All Tests

```bash
npm run test
```

### Testing Credentials

```bash
# Basic credential test
./test-credentials.sh

# Detailed service credential test
node test-service-credentials.mjs
```

### Testing with Firebase Emulators

```bash
# Start emulators
npm run emulators

# In another terminal
npm run dev
```

### Manual Testing Checklist

- [ ] Sign in with Google
- [ ] Root topic created
- [ ] Create child topic
- [ ] Edit topic
- [ ] Delete topic
- [ ] Authorize Gmail
- [ ] View Gmail inbox
- [ ] Authorize Drive
- [ ] View Drive files
- [ ] Authorize Calendar
- [ ] View calendar events
- [ ] Run AI query
- [ ] Sign out

---

## Deployment

### Deploy to Firebase App Hosting

1. **Configure secrets** in Secret Manager:
```bash
gcloud secrets create ENCRYPTION_KEY --replication-policy="automatic"
echo -n "your-key" | gcloud secrets versions add ENCRYPTION_KEY --data-file=-
```

2. **Update apphosting.yaml**:
```yaml
env:
  - variable: ENCRYPTION_KEY
    secret: ENCRYPTION_KEY
```

3. **Deploy**:
```bash
firebase deploy
```

### Deploy Firestore Rules

```bash
./deploy-firestore-rules.sh
```

### Deploy Functions

```bash
firebase deploy --only functions
```

---

## Maintenance

### Checking Service Health

```javascript
// In browser console
const user = firebase.auth().currentUser;
const idToken = await user.getIdToken();

// Check each service
const gmail = await checkServiceAuth('gmail', idToken);
const drive = await checkServiceAuth('drive', idToken);
const calendar = await checkServiceAuth('calendar', idToken);

console.log({ gmail, drive, calendar });
```

### Viewing Logs

```bash
# Firebase Functions logs
firebase functions:log

# Cloud Run logs (App Hosting)
gcloud logging read "resource.type=cloud_run_revision"
```

### Database Backup

Firebase console → Firestore → Export/Import

---

## Quick Reference

### Key Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm start            # Production server
npm run emulators    # Firebase emulators
npm run test         # Run tests

./deploy-firestore-rules.sh  # Deploy rules
./test-credentials.sh        # Test auth
```

### Key Files

- `.env.local` - Environment variables
- `firestore.rules` - Database rules
- `apphosting.yaml` - Production config
- `ecosystem.config.js` - PM2 config

### Key URLs

- Local: http://localhost:3000
- Production: https://bumpy-roads--analyst-server.us-central1.hosted.app
- Firebase Console: https://console.firebase.google.com
- Cloud Console: https://console.cloud.google.com
