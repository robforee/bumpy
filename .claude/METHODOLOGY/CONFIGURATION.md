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

# Bumpy Configuration Guide

## Overview

Bumpy uses a multi-layered configuration system with environment variables, Firebase settings, and runtime configuration. This document covers all configuration options.

---

## Environment Variables

### Client-Side Variables (NEXT_PUBLIC_*)

These are exposed to the browser and must not contain secrets.

```env
# Firebase Client Config
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyB...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abc123def456

# Google OAuth (public info)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
```

**Where to find these**:
- Firebase Console → Project Settings → Your apps → Firebase SDK snippet
- Google Cloud Console → APIs & Services → Credentials

### Server-Side Variables

These remain on the server and can contain secrets.

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=abc123...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=123456789012345678901
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project.iam.gserviceaccount.com

# OAuth Secret
GOOGLE_CLIENT_SECRET=GOCSPX-...

# Security
ENCRYPTION_KEY=32-character-key-for-token-encryption

# AI
OPENAI_API_KEY=sk-...
```

**Where to find these**:
- Firebase Console → Project Settings → Service Accounts → Generate new private key
- Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs

### Important Notes

1. **Private Key Format**: Must include literal `\n` characters
2. **Encryption Key**: Exactly 32 characters for AES-256
3. **Redirect URI**: Must match OAuth client configuration exactly

---

## Configuration Files

### .env.local

Local development environment. Not committed to git.

```bash
# Location
bumpy/.env.local

# Create from template
cp .env.local.template .env.local
```

### .env.local.template

Template for developers. Committed to git.

```bash
# Contains placeholder values
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
```

### apphosting.yaml

Firebase App Hosting configuration for production.

```yaml
# Runtime configuration
runConfig:
  cpu: 1
  memoryMiB: 512
  concurrency: 80

# Environment variables from Secret Manager
env:
  - variable: NEXT_PUBLIC_FIREBASE_API_KEY
    value: "actual-value"

  - variable: FIREBASE_PRIVATE_KEY
    secret: firebase-private-key

  - variable: ENCRYPTION_KEY
    secret: encryption-key

  - variable: GOOGLE_CLIENT_SECRET
    secret: google-client-secret

  - variable: OPENAI_API_KEY
    secret: openai-api-key
```

### firebase.json

Firebase project configuration.

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": {
    "source": "functions"
  },
  "hosting": {
    "public": ".next",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"]
  },
  "storage": {
    "rules": "storage.rules"
  }
}
```

### .firebaserc

Firebase project aliases.

```json
{
  "projects": {
    "default": "analyst-server"
  }
}
```

---

## Google Cloud Secret Manager

### Creating Secrets

```bash
# Create secret
gcloud secrets create SECRET_NAME --replication-policy="automatic"

# Add secret value
echo -n "secret-value" | gcloud secrets versions add SECRET_NAME --data-file=-

# Or from file
gcloud secrets versions add SECRET_NAME --data-file=./secret.txt
```

### Required Secrets

| Secret Name | Description |
|-------------|-------------|
| `firebase-private-key` | Firebase Admin SDK private key |
| `encryption-key` | Token encryption key |
| `google-client-secret` | OAuth client secret |
| `openai-api-key` | OpenAI API key |

### Granting Access

App Hosting service account needs access:

```bash
gcloud secrets add-iam-policy-binding SECRET_NAME \
    --member="serviceAccount:firebase-apphosting-compute@analyst-server.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

---

## Firebase Configuration

### Authentication

Firebase Console → Authentication → Settings

1. **Sign-in providers**: Enable Google
2. **Authorized domains**: Add production domain
3. **OAuth redirect domains**: Add callback URL

### Firestore

Firebase Console → Firestore Database

1. **Rules**: Deploy via `firestore.rules`
2. **Indexes**: Auto-created for most queries
3. **Location**: Choose region (us-central, etc.)

### Storage

Firebase Console → Storage

1. **Rules**: Deploy via `storage.rules`
2. **CORS**: Configure if needed

---

## OAuth Configuration

### Google Cloud Console Setup

1. **APIs & Services → Credentials**
2. **Create OAuth 2.0 Client ID**
3. **Application type**: Web application

### Authorized Redirect URIs

```
http://localhost:3000/auth/callback       # Development
https://your-domain.com/auth/callback     # Production
```

### OAuth Consent Screen

1. **User type**: External (for testing) or Internal (Workspace)
2. **App information**: Name, logo, links
3. **Scopes**: Add required Google API scopes
4. **Test users**: Add test user emails

---

## OAuth Scopes Configuration

### Scope Files Location

```
public/data/scopes/
    gmail.json
    drive.json
    calendar.json
    chat.json
```

### Gmail Scopes

```json
[
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.labels",
  "https://www.googleapis.com/auth/gmail.settings.basic"
]
```

### Drive Scopes

```json
[
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.appdata"
]
```

### Calendar Scopes

```json
[
  "https://www.googleapis.com/auth/calendar"
]
```

### Chat Scopes

```json
[
  "https://www.googleapis.com/auth/chat.spaces",
  "https://www.googleapis.com/auth/chat.messages"
]
```

---

## Development Configuration

### next.config.mjs

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
```

### jsconfig.json

Path aliases configuration:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### tailwind.config.mjs

```javascript
export default {
  content: [
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
```

### postcss.config.mjs

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

---

## Customization Points

### Token Encryption

To change encryption settings, modify `auth-actions.js`:

```javascript
// Current: AES-256-CBC with scrypt
const key = crypto.scryptSync(encryptionKey, 'salt', 32);
const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

// Customization options:
// - Change algorithm (aes-256-gcm for authenticated encryption)
// - Change key derivation (argon2)
// - Change salt (don't use static 'salt' in production)
```

### Token Expiration

Default is 1 hour. To change:

```javascript
// In storeTokenInfo()
expirationTime: now + 3600000  // 1 hour
// Change to:
expirationTime: now + 7200000  // 2 hours
```

### Query Limits

Default max results:

```javascript
// Gmail inbox
maxResults: 10

// Drive files
maxResults: 10

// Calendar events
maxResults: 10

// Chat spaces
pageSize: 10
```

### Timezone

Default is America/Chicago:

```javascript
moment().tz('America/Chicago').format('YYYY-MM-DD HH:mm')
```

Change to user's timezone for personalization.

---

## Performance Tuning

### Firestore Caching

TopicCache available in `src/utils/TopicCache.js`:

```javascript
// Enable topic caching
const cache = new TopicCache();
const topic = await cache.get(topicId) || await fetchTopic(topicId);
cache.set(topicId, topic);
```

### API Rate Limits

Google APIs have quotas. Consider:

```javascript
// Batch requests
const batchSize = 5;
for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(batch.map(processItem));
    await sleep(100); // Rate limit
}
```

### Memory Configuration

In `apphosting.yaml`:

```yaml
runConfig:
  memoryMiB: 512  # Increase for larger payloads
  cpu: 1
```

---

## Security Configuration

### Firestore Rules

Edit `firestore.rules` and deploy:

```bash
./deploy-firestore-rules.sh
```

### Admin Detection

Current admin check:

```javascript
function isAdmin() {
    return request.auth != null &&
           (request.auth.token.admin == true ||
            request.auth.uid == 'CtAyzps80VXRzna32Kdy0NHYcPe2');
}
```

To add admins:
1. Set custom claim `admin: true` on user
2. Or add UID to hardcoded list

### CORS Configuration

If needed, create `cors.json`:

```json
[
  {
    "origin": ["*"],
    "method": ["GET"],
    "maxAgeSeconds": 3600
  }
]
```

Apply to Storage:
```bash
gsutil cors set cors.json gs://your-bucket
```

---

## Environment-Specific Configuration

### Development

```env
NODE_ENV=development
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
```

### Production

```env
NODE_ENV=production
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://your-domain.com/auth/callback
```

### Testing

Use Firebase emulators:

```bash
npm run emulators
```

Emulator data persists in `./emulator-data/`.

---

## Monitoring & Debugging

### Console Logging

Bumpy uses emoji prefixes for log categories:

- `[BUMPY_AUTH]` - Authentication
- `📧` - Gmail
- `📁` - Drive
- `📅` - Calendar
- `💬` - Chat
- `🔐` - Token storage
- `🔓` - Disconnection
- `✅` - Success
- `❌` - Error
- `⚠️` - Warning
- `🔄` - Refresh

### Cloud Logging

View in Google Cloud Console:
```
resource.type="cloud_run_revision"
resource.labels.service_name="bumpy-roads"
```

---

## Configuration Checklist

### Initial Setup

- [ ] `.env.local` created from template
- [ ] All NEXT_PUBLIC_* variables set
- [ ] All FIREBASE_* variables set
- [ ] GOOGLE_CLIENT_SECRET set
- [ ] ENCRYPTION_KEY generated (32 chars)
- [ ] OPENAI_API_KEY set

### Firebase Setup

- [ ] Project created
- [ ] Authentication enabled
- [ ] Firestore database created
- [ ] Rules deployed
- [ ] Service account key downloaded

### Google Cloud Setup

- [ ] APIs enabled (Gmail, Drive, Calendar, Chat)
- [ ] OAuth consent screen configured
- [ ] OAuth credentials created
- [ ] Redirect URIs added

### Production Deployment

- [ ] Secrets in Secret Manager
- [ ] apphosting.yaml configured
- [ ] Production redirect URI added
- [ ] Domain authorized in Firebase

---

## Troubleshooting Configuration

### Issue: Environment Variables Not Loading

```bash
# Check if .env.local exists
ls -la .env.local

# Verify values
grep FIREBASE .env.local

# Restart dev server after changes
npm run dev
```

### Issue: Secrets Not Available in Production

```bash
# Check secret exists
gcloud secrets list

# Check IAM permissions
gcloud secrets get-iam-policy SECRET_NAME

# Verify apphosting.yaml mapping
cat apphosting.yaml | grep SECRET_NAME
```

### Issue: OAuth Redirect Mismatch

1. Check `NEXT_PUBLIC_GOOGLE_REDIRECT_URI`
2. Check Cloud Console authorized URIs
3. Verify exact match (no trailing slash differences)

### Issue: Firebase Admin Fails

1. Check `FIREBASE_PRIVATE_KEY` format
2. Verify `\n` characters are literal
3. Confirm service account email correct
