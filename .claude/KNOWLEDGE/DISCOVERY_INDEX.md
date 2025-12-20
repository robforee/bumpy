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

# Bumpy Discovery Index

## Overview

This document provides a queryable index of all capabilities, APIs, functions, and integration points in the Bumpy framework. Use this as a reference for discovering what's available.

---

## Server Actions Reference

### Authentication Actions (`src/app/actions/auth-actions.js`)

| Function | Purpose | Parameters | Returns |
|----------|---------|------------|---------|
| `encrypt(text)` | Encrypt string with AES-256-CBC | `text: string` | `iv:encrypted` |
| `decrypt(text)` | Decrypt encrypted string | `text: string` | `plaintext` |
| `storeTokenInfo({...})` | Store OAuth tokens | `{accessToken, refreshToken, scopes, idToken}` | `{success, error?}` |
| `refreshTokenInfo(idToken)` | Refresh expired tokens | `idToken: string` | `{success, error?}` |
| `getTokenInfo(idToken)` | Get current token info | `idToken: string` | `{success, data?, error?}` |
| `getAuthenticatedScopes(userId, idToken)` | Get user's authorized scopes | `userId, idToken` | `{success, scopes, error?}` |
| `addScopes_toPUBLIC(scope, idToken, userId)` | Add scope to public record | `scope, idToken, userId` | `scopeData` |
| `deleteScope(scope, idToken)` | Remove a scope | `scope, idToken` | `{success, error?}` |
| `exchangeCodeForTokens(code)` | Exchange OAuth code | `code: string` | `{success, tokens?, error?}` |
| `storeServiceTokens(service, tokens, uid)` | Store per-service tokens | `service, tokens, uid` | `{success, error?}` |
| `getServiceToken(service, idToken)` | Get service access token | `service, idToken` | `{success, accessToken?, error?}` |
| `checkServiceAuth(service, idToken)` | Check if service is authorized | `service, idToken` | `{success, isAuthorized, scopes?, error?}` |
| `disconnectService(service, idToken)` | Revoke service auth | `service, idToken` | `{success, error?}` |

---

### Google Actions (`src/app/actions/google-actions.js`)

| Function | Purpose | Parameters | Returns |
|----------|---------|------------|---------|
| `queryGmailInbox(userId, idToken)` | Fetch inbox messages | `userId, idToken` | `{success, messages?, error?}` |
| `queryDriveFiles(userId, idToken, maxResults?)` | List Drive files | `userId, idToken, maxResults=10` | `{success, files?, error?}` |
| `queryCalendarEvents(userId, idToken, maxResults?)` | Get calendar events | `userId, idToken, maxResults=10` | `{success, events?, error?}` |
| `queryChatSpaces(userId, idToken, maxResults?)` | Get Chat spaces | `userId, idToken, maxResults=10` | `{success, spaces?, error?}` |
| `queryRecentDriveFiles(userId, idToken)` | Get recent Drive files | `userId, idToken` | `{success, files?, error?}` |
| `queryGoogleCalendar(userId, idToken)` | Get week's events | `userId, idToken` | `{success, events?, error?}` |
| `sendGmailMessage(idToken, to, subject, body)` | Send email | `idToken, to, subject, body` | `{success, messageId?, error?}` |
| `demoGmailToken(idToken)` | Test Gmail connection | `idToken` | `string[]` results |

---

### Topic Actions (`src/app/actions/topic-actions.js`)

| Function | Purpose | Parameters | Returns |
|----------|---------|------------|---------|
| `createTopic(parentId, data, idToken)` | Create new topic | `parentId, data, idToken` | `{success, topicId?, error?}` |
| `updateTopic(topicId, data, idToken)` | Update existing topic | `topicId, data, idToken` | `{success, error?}` |
| `deleteTopic(topicId, idToken)` | Delete topic | `topicId, idToken` | `{success, error?}` |
| `getTopic(topicId, idToken)` | Fetch single topic | `topicId, idToken` | `{success, topic?, error?}` |
| `getTopicChildren(topicId, idToken)` | Get child topics | `topicId, idToken` | `{success, children?, error?}` |

---

### Query Actions (`src/app/actions/query-actions.js`)

| Function | Purpose | Parameters | Returns |
|----------|---------|------------|---------|
| `prepareStructuredQuery_forConceptAnalysis(context, query)` | Prepare AI query | `contextArray, conceptQuery` | `structuredQuery` |
| `runConceptQuery(query, idToken)` | Execute AI analysis | `query, idToken` | `{success, completion?, error?}` |

---

## Client-Side APIs

### UserProvider Context (`src/contexts/UserProvider.js`)

```javascript
const { user, userProfile, loading, refreshUserProfile } = useUser();
```

| Property | Type | Description |
|----------|------|-------------|
| `user` | `User | null` | Firebase auth user |
| `userProfile` | `UserProfile | null` | Firestore user data |
| `loading` | `boolean` | Auth state loading |
| `refreshUserProfile()` | `() => Promise<void>` | Reload profile |

---

### UserService (`src/services/userService.js`)

| Method | Purpose | Parameters |
|--------|---------|------------|
| `initializeNewUserIfNeeded(user)` | Create user profile | `user: FirebaseUser` |
| `initializeTopicRoot(userId)` | Create root topic | `userId: string` |
| `getUserProfile(userId)` | Fetch user profile | `userId: string` |
| `updateUserPhotoURL(userId, photoURL)` | Update photo | `userId, photoURL` |
| `updateUserTopicRoot(userId, topicRootId)` | Set root topic | `userId, topicRootId` |

---

### TopicModel (`src/lib/TopicModel.js`)

| Method | Type | Purpose |
|--------|------|---------|
| `TopicModel.getTopic(id)` | Static | Fetch topic by ID |
| `TopicModel.addTopic(parentId, data)` | Static | Create topic |
| `changeParent(newParentId)` | Instance | Move topic |
| `updatePhoto(newPhotoUrl)` | Instance | Update photo |
| `runPrompts(options)` | Instance | Execute prompts (stub) |
| `addComment(commentData)` | Instance | Add comment child |
| `addPrompt(promptData)` | Instance | Add prompt child |

---

### Firebase Auth (`src/lib/firebase/firebaseAuth.js`)

| Function | Purpose |
|----------|---------|
| `signInWithGoogle()` | Google OAuth sign-in |
| `signOut()` | Sign out user |
| `onAuthStateChanged(callback)` | Auth state listener |

---

## Components Reference

### Layout & Navigation

| Component | Path | Purpose |
|-----------|------|---------|
| `Header` | `src/components/Header.jsx` | Navigation header with sign-in |
| `Navigation` | `src/components/Navigation.jsx` | Navigation links |
| `MenuItems` | `src/components/MenuItems.jsx` | Menu item list |

### Topic Components

| Component | Path | Purpose |
|-----------|------|---------|
| `TopicTableContainer` | `src/components/TopicTableContainer.jsx` | Topic table logic |
| `TopicHeaderRow` | `src/components/TopicHeaderRow.jsx` | Topic header with actions |
| `TopicModals` | `src/components/TopicModals.jsx` | Modal dialogs |
| `TopicSearch` | `src/components/TopicSearch.jsx` | Topic search |
| `AddTopicModal` | `src/components/AddTopicModal.jsx` | Create topic modal |
| `EditPropertyModal` | `src/components/EditPropertyModal.jsx` | Edit property modal |
| `CreateRootTopic` | `src/components/CreateRootTopic.jsx` | Root topic creation |

### Service Widgets

| Component | Path | Purpose |
|-----------|------|---------|
| `GmailInbox` | `src/components/GmailInbox.jsx` | Gmail messages |
| `GoogleDriveFiles` | `src/components/GoogleDriveFiles.jsx` | Drive files |
| `GoogleCalendar` | `src/components/GoogleCalendar.jsx` | Calendar events |
| `EmailWidget` | `src/components/widgets/EmailWidget.jsx` | Email widget |
| `DriveWidget` | `src/components/widgets/DriveWidget.jsx` | Drive widget |
| `CalendarWidget` | `src/components/widgets/CalendarWidget.jsx` | Calendar widget |
| `MessengerWidget` | `src/components/widgets/MessengerWidget.jsx` | Chat widget |
| `BigQueryWidget` | `src/components/widgets/BigQueryWidget.jsx` | BigQuery widget |

### Utility Components

| Component | Path | Purpose |
|-----------|------|---------|
| `ScopeManager` | `src/components/ScopeManager.jsx` | Manage OAuth scopes |
| `PromptEditor` | `src/components/PromptEditor.jsx` | Edit AI prompts |
| `PromptEditModal` | `src/components/PromptEditModal.jsx` | Prompt editing modal |
| `QueryOpenAi` | `src/components/QueryOpenAi.jsx` | OpenAI query UI |
| `ServerTime` | `src/components/ServerTime.jsx` | Server time display |
| `UnderConstruction` | `src/components/UnderConstruction.jsx` | Placeholder |

### UI Primitives (`src/components/ui/`)

| Component | Purpose |
|-----------|---------|
| `Button` | Styled button |
| `Input` | Form input |
| `Select` | Dropdown select |
| `Textarea` | Text area |
| `Dialog` | Modal dialog |
| `Card` | Card container |
| `Alert` | Alert message |

---

## Page Routes

### Public Routes

| Route | File | Purpose |
|-------|------|---------|
| `/` | `src/app/page.jsx` | Landing page |
| `/auth/callback` | `src/app/auth/callback/page.jsx` | OAuth callback |

### Protected Routes

| Route | File | Purpose |
|-------|------|---------|
| `/dashboard` | `src/app/dashboard/page.jsx` | User dashboard |
| `/topics/[id]` | `src/app/topics/[id]/page.jsx` | Topic detail |

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/gmail` | GET | Gmail operations |
| `/api/storeTokens` | POST | Store OAuth tokens |

---

## Firebase Functions

Located in `functions/index.js`:

| Function | Trigger | Purpose |
|----------|---------|---------|
| `addTopic` | HTTPS Callable | Create topic |
| `updateUser` | HTTPS Callable | Update user |
| `storeTokens` | HTTPS Callable | Store tokens |

---

## Extension Points

### Adding New Google Services

1. **Create scopes file**: `public/data/scopes/{service}.json`
2. **Add auth check**: Use `checkServiceAuth('{service}', idToken)`
3. **Create action**: Add query function in `google-actions.js`
4. **Create widget**: Add widget component
5. **Update Dashboard**: Add widget to dashboard

### Adding New Topic Types

1. **Add to enum**: Update `TopicType` type
2. **Update validation**: Add to zod schema
3. **Handle in UI**: Update TopicTableContainer rendering
4. **Update rules**: Modify Firestore rules if needed

### Custom Server Actions

1. **Create action file**: `src/app/actions/{name}-actions.js`
2. **Add 'use server' directive**: Top of file
3. **Export async functions**: With standard response format
4. **Import in components**: Use in client components

### Custom Components

1. **Create in components/**: Follow naming convention
2. **Export properly**: Named or default export
3. **Use hooks**: `useUser()` for auth state
4. **Handle loading**: Check loading state before rendering

---

## Common Patterns

### Pattern: Service Authorization Check

```javascript
const result = await checkServiceAuth('gmail', idToken);
if (!result.isAuthorized) {
    // Show ServiceAuthCard to authorize
}
```

### Pattern: API Call with Token Refresh

```javascript
const { accessToken, refreshed } = await getValidAccessToken(db, user, 'service', tokens);
if (refreshed) {
    console.log('Token was refreshed');
}
// Use accessToken for API call
```

### Pattern: Error Handling

```javascript
const result = await someAction();
if (!result.success) {
    console.error('Error:', result.error);
    // Show error to user
    return;
}
// Use result.data
```

### Pattern: Topic CRUD

```javascript
// Create
const { topicId } = await createTopic(parentId, { title, text, topic_type }, idToken);

// Read
const { topic } = await getTopic(topicId, idToken);

// Update
await updateTopic(topicId, { title: 'New Title' }, idToken);

// Delete
await deleteTopic(topicId, idToken);
```

---

## Integration Points

### Firebase Integration

- **Auth**: `src/lib/firebase/firebaseAuth.js`
- **Client Firestore**: `src/lib/firebase/clientApp.js`
- **Server Firestore**: `src/lib/firebase/serverApp.js`
- **Admin SDK**: `src/lib/firebase/adminApp.js`

### Google APIs Integration

- **Gmail**: `google.gmail({ version: 'v1' })`
- **Drive**: `google.drive({ version: 'v3' })`
- **Calendar**: `google.calendar({ version: 'v3' })`
- **Chat**: `google.chat({ version: 'v1' })`

### OpenAI Integration

- **Client**: `src/lib/openai/`
- **Usage**: Via `query-actions.js`

---

## Available Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| Dev server | `npm run dev` | Start development |
| Build | `npm run build` | Production build |
| Start | `npm start` | Start production |
| Emulators | `npm run emulators` | Firebase emulators |
| Build SW | `npm run build-service-worker` | Build service worker |

---

## Shell Scripts

| Script | Purpose |
|--------|---------|
| `deploy-firestore-rules.sh` | Deploy Firestore rules |
| `show-new-rules.sh` | Show rule differences |
| `setup-local-env.sh` | Setup local environment |
| `test-credentials.sh` | Test credentials |
| `test-local.sh` | Run local tests |
| `test-service-credentials.mjs` | Test service creds |

---

## Environment Files

| File | Purpose |
|------|---------|
| `.env.local` | Local development secrets |
| `.env.local.template` | Template for .env.local |
| `apphosting.yaml` | Firebase App Hosting config |

---

## Quick Reference: What Can I Do With Bumpy?

### Authentication
- Sign in with Google
- Manage per-service OAuth
- Store encrypted tokens
- Auto-refresh expired tokens

### Topics
- Create hierarchical topics
- Categorize as concept/milestone/question
- Add child topics
- Move topics between parents

### Gmail
- List inbox messages
- Read message details
- Send emails
- View snippets

### Drive
- List recent files
- View file metadata
- Access file links

### Calendar
- View upcoming events
- See event details
- Get attendee lists

### Chat
- List spaces
- View recent messages
- See sender info

### AI Analysis
- Query concepts
- Generate sub-topics
- Analyze ideas
- Expand on topics
