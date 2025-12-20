---
source_type: theory
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

# Bumpy Framework - Core Concepts

## Purpose & Problem Domain

Bumpy is a **hierarchical knowledge management platform** with integrated Google Workspace services. It solves the problem of fragmented personal information across Gmail, Drive, Calendar, and Chat by providing a unified interface centered around hierarchical topics.

### Problems Bumpy Solves

1. **Information Fragmentation**: Personal knowledge scattered across multiple Google services
2. **Context Loss**: Difficulty connecting emails, files, and events to relevant topics
3. **Token Management Complexity**: OAuth 2.0 token lifecycle management across multiple services
4. **Concept Analysis**: Need for AI-powered analysis of concepts within topic hierarchies
5. **Real-time Collaboration**: Synchronizing state across browser sessions

### Core Value Proposition

Bumpy provides a single interface where users can:
- Organize knowledge hierarchically using topics
- Query AI to analyze and expand concepts
- Access Gmail, Drive, Calendar, and Chat from topic context
- Maintain encrypted, auto-refreshing OAuth tokens per service

---

## Core Concepts & Terminology

### Topic Hierarchy

**Topics** are the fundamental unit of organization. Each topic can contain:
- **Title**: Primary identifier
- **Subtitle**: Secondary description
- **Text**: Rich content (markdown supported)
- **Category/Type**: Classification (concept, milestone, question, subtopic, root)
- **Children**: Nested sub-topics
- **Parents**: Ancestor reference (supports single parent currently)

**Topic Types**:
- `root` - User's top-level topic (one per user, ID matches userId)
- `topic` - General-purpose container
- `concept` - AI-analyzed idea or definition
- `milestone` - Progress marker or achievement
- `question` - Inquiry to be answered
- `subtopic` - Subordinate topic
- `Comment` - User annotation
- `Prompt` - AI query template

**Topic Lifecycle**:
```
User Login -> Root Topic Created -> Add Children -> AI Analysis -> Save Concepts
```

### Service-Specific Authentication

Bumpy implements **per-service OAuth authorization**. Instead of requesting all scopes at login, each Google service (Gmail, Drive, Calendar, Chat) is authorized independently.

**Service Credentials Model**:
```
service_credentials/{userId}_{serviceName}
  - accessToken (encrypted)
  - refreshToken (encrypted)
  - scopes
  - grantedAt
  - lastRefreshed
  - expiresAt
```

**Supported Services**:
- `gmail` - Email access (read, compose, labels)
- `drive` - File operations (list, view)
- `calendar` - Event queries
- `messenger` - Google Chat spaces and messages

### Authentication Layers

1. **Firebase Authentication**: Primary user identity (email/password, Google Sign-In)
2. **Google OAuth 2.0**: Service-specific API access
3. **ID Token Verification**: Server-side user validation via `getAuthenticatedAppForUser()`

### Token Encryption

All OAuth tokens are encrypted using AES-256-CBC before storage in Firestore:
```javascript
encrypt(text): iv:hex + ':' + encryptedHex
decrypt(text): Reverse of encrypt
```

The encryption key is stored in environment variables (`ENCRYPTION_KEY`).

---

## Design Philosophy

### 1. Separation of Authentication Concerns

**User Auth** vs **Service Auth** are distinct:
- User auth establishes identity (Firebase Auth)
- Service auth grants API access (Google OAuth per service)

This allows incremental permission granting - users don't need to approve all scopes at signup.

### 2. Server Actions Pattern

Bumpy uses Next.js 14 Server Actions for all backend logic:
- `auth-actions.js` - Token management, encryption, service auth
- `google-actions.js` - Gmail, Drive, Calendar, Chat API calls
- `topic-actions.js` - CRUD operations on topics
- `query-actions.js` - AI concept analysis

Benefits:
- Type-safe client-server boundary
- Built-in serialization
- Automatic code splitting

### 3. Encrypted Token Storage

All sensitive tokens are encrypted at rest in Firestore:
- Prevents credential exposure in database exports
- Adds defense-in-depth beyond Firestore rules

### 4. Auto-Refresh Token Pattern

Every API call that uses tokens checks expiration and refreshes automatically:
```javascript
async function getValidAccessToken(db, currentUser, service, tokens) {
    if (tokens.expiresAt < Date.now()) {
        // Refresh and update Firestore
        return { accessToken: newToken, refreshed: true };
    }
    return { accessToken: decryptedToken, refreshed: false };
}
```

### 5. Topic-Centric UI

Everything flows through topics:
- Dashboard shows widgets (Gmail, Drive, Calendar, Chat)
- Topic pages show hierarchy with AI query capabilities
- Concept analysis results become child topics

---

## When to Use Bumpy

### Use Bumpy When:

1. **Building personal knowledge bases** with topic hierarchies
2. **Integrating multiple Google services** with unified auth management
3. **Needing AI-powered concept analysis** of your topics
4. **Requiring encrypted token storage** in Firebase
5. **Wanting per-service authorization** without monolithic scope grants

### Consider Alternatives When:

1. **Simple single-service integration** - Use direct Google API client
2. **No hierarchical data structure needed** - Use flat database
3. **Enterprise multi-tenant** - Bumpy is designed for personal/small team use
4. **Real-time collaboration** - Bumpy has basic real-time via Firestore listeners
5. **Mobile-first** - Bumpy is web-optimized (responsive but not PWA)

---

## Mental Models for Understanding Bumpy

### Model 1: Topic Tree as File System

Think of topics like a file system:
- Root Topic = Home Directory
- Topics = Folders
- Concepts/Milestones = Files
- Parents/Children = Directory hierarchy

Unlike files, topics can have AI-generated content and link to external services.

### Model 2: Service Auth as Plugin System

Each Google service is a "plugin" with its own:
- Credentials (separate OAuth tokens)
- Scopes (granular permissions)
- State (authorized/unauthorized)

Plugins are enabled independently via ServiceAuthCard components.

### Model 3: Server Actions as API Layer

Server Actions replace traditional REST APIs:
```javascript
// Instead of: POST /api/auth/store-tokens
// Use:        import { storeTokenInfo } from './auth-actions'
```

The mental model is "calling functions on the server" rather than "making HTTP requests."

### Model 4: Firestore as State Machine

Firestore collections represent system state:
- `users/` - User profiles
- `user_tokens/` - Legacy unified tokens
- `service_credentials/` - Per-service tokens (current)
- `topics/` - Hierarchical data

State transitions happen via Server Actions that update these documents.

---

## Architectural Principles

### Principle 1: Security by Default

- All tokens encrypted before storage
- Firestore rules enforce ownership
- Admin access requires explicit flag
- Service credentials isolated per service

### Principle 2: Graceful Degradation

- If one service is unauthorized, others still work
- Token refresh failures don't crash the app
- Missing env vars produce clear errors

### Principle 3: Explicit Over Implicit

- No magic string parsing (structured topic types)
- Clear separation of client/server code ('use server' directive)
- Explicit encryption/decryption calls

### Principle 4: Developer Experience

- Detailed console logging with emoji prefixes
- Structured JSON logging for debugging
- Template files for environment setup

---

## Framework Evolution

### Current State (v0.1.0)

- Per-service OAuth working
- Topic hierarchy functional
- AI concept analysis operational
- Dashboard widgets for all services

### Planned Features

- Offline caching with IndexedDB
- Email swipe interface
- Document comparison
- Calendar swimlanes
- Voice input
- Enhanced real-time collaboration

### Migration Notes

**From unified tokens to service credentials**:
The system transitioned from storing all tokens in `user_tokens/{userId}` to per-service storage in `service_credentials/{userId}_{service}`. Both patterns exist in code for backward compatibility.

---

## Dependency Philosophy

Bumpy takes a **curated dependencies** approach:

### Core Dependencies
- **Next.js 14**: App Router, Server Actions
- **Firebase SDK**: Auth, Firestore, Functions
- **Google APIs**: Official googleapis package
- **OpenAI**: AI analysis

### UI Dependencies
- **TailwindCSS**: Utility-first styling
- **Lucide React**: Icon system
- **React Query**: Server state management

### Utility Dependencies
- **date-fns / moment-timezone**: Date handling
- **react-markdown**: Content rendering
- **zod**: Schema validation

The philosophy is to use established, well-maintained packages rather than rolling custom implementations.

---

## Key Abstractions

### 1. TopicModel

Client-side ORM-like abstraction for topics:
```javascript
const topic = await TopicModel.getTopic(id);
await topic.changeParent(newParentId);
await topic.addComment(commentData);
```

### 2. UserProvider Context

Global user state management:
```javascript
const { user, userProfile, loading, refreshUserProfile } = useUser();
```

### 3. UserService

User lifecycle operations:
```javascript
await userService.initializeNewUserIfNeeded(user);
await userService.getUserProfile(userId);
```

### 4. Server Action Pattern

Consistent return format:
```javascript
return { success: true, data: {...} };
return { success: false, error: 'message' };
```

---

## Security Considerations

### Token Security
- AES-256-CBC encryption with random IV
- Encryption key in environment variables
- Never log decrypted tokens

### Firestore Security
- Rules enforce `request.auth.uid == userId`
- Admin override for debugging
- No public write access to sensitive collections

### OAuth Security
- Tokens stored encrypted, not plaintext
- Refresh tokens rotated on use when provided by Google
- Scope minimization per service

### Environment Security
- `.env.local` not committed
- Production secrets in Secret Manager
- Template files for developers

---

## Summary

Bumpy is a personal knowledge management framework that:
1. Organizes information hierarchically through topics
2. Integrates Google Workspace services with per-service auth
3. Provides AI-powered concept analysis
4. Stores encrypted tokens in Firebase
5. Uses Next.js Server Actions for type-safe backend logic

The core innovation is the combination of:
- Hierarchical topics as the organizing principle
- Per-service OAuth authorization
- Encrypted token storage
- AI concept expansion

This creates a unified personal information hub that respects user privacy while providing powerful integration capabilities.
