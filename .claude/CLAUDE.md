---
title: Bumpy Knowledge Management
description: Next.js hierarchical knowledge management with Google Services integration
type: application
status: development
owner: Kai
last_updated: 2025-11-22
---

# Bumpy - Knowledge Management Hub Document

**Type**: Next.js Application (Personal Knowledge Management with Google Services Integration)
**Status**: Active Development
**Location**: `/home/robforee/analyst-server/bumpy`
**Repository**: git@github.com:robforee/bumpy.git

---

## Quick Overview

Bumpy is a **hierarchical knowledge management platform** that integrates with Google Workspace services (Gmail, Drive, Calendar, Chat). It provides:

- **Topic hierarchies** for organizing personal knowledge
- **Per-service OAuth** for Gmail, Drive, Calendar, Chat
- **AI-powered analysis** using OpenAI
- **Encrypted token storage** in Firebase
- **Real-time updates** via Firestore listeners

---

## Knowledge/Methodology/Implementation Structure

This repository uses the unified K/M/I documentation pattern:

### KNOWLEDGE/ (What we know)

| Document | Purpose | Lines |
|----------|---------|-------|
| [FRAMEWORK.md](KNOWLEDGE/FRAMEWORK.md) | Core concepts, design philosophy, mental models | ~300 |
| [SCHEMA.md](KNOWLEDGE/SCHEMA.md) | Data structures, APIs, type definitions | ~250 |
| [DISCOVERY_INDEX.md](KNOWLEDGE/DISCOVERY_INDEX.md) | Queryable reference of all capabilities | ~200 |

### METHODOLOGY/ (How it operates)

| Document | Purpose | Lines |
|----------|---------|-------|
| [PATTERN.md](METHODOLOGY/PATTERN.md) | Abstract design pattern and rationale | ~150 |
| [PROCESS.md](METHODOLOGY/PROCESS.md) | Usage workflows and integration patterns | ~250 |
| [PROCEDURES.md](METHODOLOGY/PROCEDURES.md) | Setup, usage, extension guides | ~300 |
| [CONFIGURATION.md](METHODOLOGY/CONFIGURATION.md) | Environment variables, customization | ~200 |

### IMPLEMENTATION/ (How it's built)

| Document | Purpose | Lines |
|----------|---------|-------|
| [ARCHITECTURE.md](IMPLEMENTATION/ARCHITECTURE.md) | Code organization, modules, data flows | ~300 |

---

## PAI Standards & Integration

**Repository Type**: Web Application Service
**Primary Purpose**: Hierarchical knowledge management platform with Google Workspace integration and AI-powered analysis
**Ecosystem Role**: User-facing application for personal knowledge management in PAI ecosystem

**PAI Standards References**:
- Skill Registry: See `/home/robforee/PAI/.claude/skills/CORE/SKILL.md`
- Documentation Pattern: KNOWLEDGE/METHODOLOGY/IMPLEMENTATION
- Master Hub: `/home/robforee/analyst-server/.claude/CLAUDE.md`
- Documentation Standards: `/home/robforee/analyst-server/.claude/reference/documentation-standards.md`

**Integration Points**:
- **Requires**: `refresh-tokens` (OAuth token refresh), Firebase Auth, OpenAI API
- **Provides to**: End users (knowledge management interface)
- **Depends on**: Firebase (Auth, Firestore, Functions), Google APIs (Gmail, Drive, Calendar, Chat)
- **Shares patterns with**: `gmail-fetch` (token encryption), `refresh-tokens` (Firestore token storage)

**PAI Context**:
- Stores context in: `.claude/` directory (KNOWLEDGE/METHODOLOGY/IMPLEMENTATION structure)
- Uses unified pattern: KNOWLEDGE (app concepts, schema) / METHODOLOGY (user workflows, procedures) / IMPLEMENTATION (code architecture)
- Discoverable via: `.claude/KNOWLEDGE/DISCOVERY_INDEX.md`
- Skills available: Topic management, Google service integration, AI analysis
- Phase Status: Active Development

**Key Shared Patterns**:
- Per-service OAuth with encrypted token storage (same as refresh-tokens)
- Firebase Firestore as data layer
- AES-256-CBC encryption for sensitive data

---

## Core Concepts

### Topic Hierarchy

Everything in Bumpy is organized around **topics**:

```
Root Topic (user's top-level)
    └── Project A (topic)
        ├── Requirements (concept)
        ├── Q4 Deadline (milestone)
        └── Open Questions (question)
```

Topic types: `root`, `topic`, `concept`, `milestone`, `question`, `subtopic`, `Comment`, `Prompt`

### Per-Service OAuth

Instead of requesting all permissions at login, each Google service is authorized independently:

- `service_credentials/{userId}_gmail`
- `service_credentials/{userId}_drive`
- `service_credentials/{userId}_calendar`
- `service_credentials/{userId}_messenger`

Tokens are encrypted with AES-256-CBC before storage.

### Server Actions Pattern

All backend logic uses Next.js 14 Server Actions:

```javascript
'use server'
export async function myAction(param, idToken) {
    const { currentUser } = await getAuthenticatedAppForUser(idToken);
    // ... logic
    return { success: true, data: result };
}
```

---

## Tech Stack

**Frontend**:
- Next.js 14.2.3 (App Router)
- React 18.2.0
- TailwindCSS + Typography
- React Query

**Backend**:
- Firebase (Auth, Firestore, Functions)
- Google APIs (Gmail, Drive, Calendar, Chat)
- OpenAI API

**Security**:
- Firebase Auth for identity
- Google OAuth 2.0 per service
- AES-256-CBC token encryption

---

## Key Files

| File | Purpose |
|------|---------|
| `src/app/actions/auth-actions.js` | Token management, encryption |
| `src/app/actions/google-actions.js` | Gmail, Drive, Calendar, Chat APIs |
| `src/app/actions/topic-actions.js` | Topic CRUD operations |
| `src/contexts/UserProvider.js` | Global user state |
| `src/lib/firebase/serverApp.js` | Server-side Firebase |
| `src/lib/TopicModel.js` | Topic ORM |
| `firestore.rules` | Security rules |
| `.env.local` | Environment configuration |

---

## Quick Start

### Development

```bash
# Clone and setup
git clone git@github.com:robforee/bumpy.git
cd bumpy
npm install
cp .env.local.template .env.local
# Configure .env.local with your credentials

# Run
npm run dev
```

### Key Commands

```bash
npm run dev               # Development server
npm run build             # Production build
npm run emulators         # Firebase emulators
./deploy-firestore-rules.sh  # Deploy rules
./test-credentials.sh     # Test auth
```

---

## Common Tasks

### Authorize a Google Service

1. Navigate to Dashboard
2. Click service widget
3. Click "Connect" / "Authorize"
4. Complete OAuth flow
5. Widget displays service data

### Create a Topic Hierarchy

1. Go to `/topics/{rootId}`
2. Click "Add Topic"
3. Fill in title, subtitle, text
4. Select topic type
5. Save

### Run AI Analysis

1. Navigate to topic
2. Enter query in header
3. Click analyze
4. Results become child topics

---

## Environment Variables

**Required for development**:

```env
# Firebase (client)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...

# Firebase (server)
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...

# OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Security
ENCRYPTION_KEY=...

# AI
OPENAI_API_KEY=...
```

See [CONFIGURATION.md](METHODOLOGY/CONFIGURATION.md) for full details.

---

## Firestore Collections

| Collection | Purpose |
|------------|---------|
| `users` | User profiles |
| `user_tokens` | Legacy unified tokens |
| `service_credentials` | Per-service OAuth tokens |
| `topics` | Hierarchical topics |
| `authorized_scopes` | Public scope display |

See [SCHEMA.md](KNOWLEDGE/SCHEMA.md) for full schema documentation.

---

## Deployment

### Firebase App Hosting

1. Configure secrets in Secret Manager
2. Update `apphosting.yaml`
3. Push to GitHub (triggers deploy)

### Production URLs

- Main: https://bumpy-roads--analyst-server.us-central1.hosted.app/
- Beta: https://bumpy-beta--analyst-server.us-central1.hosted.app/

---

## Current Status

### Working Features

- User authentication (Google Sign-In)
- Per-service OAuth (Gmail, Drive, Calendar, Chat)
- Topic hierarchy CRUD
- Dashboard widgets
- AI concept analysis

### In Development

- Offline caching
- Email swipe interface
- Document comparison
- Calendar swimlanes
- Voice input

### Known Issues

- Token refresh occasionally needs manual reconnection
- Some legacy `user_tokens` code alongside new `service_credentials`

---

## Troubleshooting

### "Missing required Firebase environment variables"

Check `.env.local` has all `FIREBASE_*` variables and restart dev server.

### Service authorization fails

Verify `NEXT_PUBLIC_GOOGLE_REDIRECT_URI` matches Cloud Console exactly.

### Firestore permission denied

Review `firestore.rules` and ensure user owns the document.

See [PROCEDURES.md](METHODOLOGY/PROCEDURES.md) for more troubleshooting.

---

## Integration with PAI

Bumpy is part of the analyst-server orchestrator within PAI:

- **Location**: `/home/robforee/analyst-server/bumpy`
- **Parent**: analyst-server (integration hub)
- **Related**: gmail-fetch, refresh-tokens (shared token patterns)

---

## Documentation Updates

When updating this repository:

1. **Code changes**: Update [ARCHITECTURE.md](IMPLEMENTATION/ARCHITECTURE.md)
2. **New features**: Update [DISCOVERY_INDEX.md](KNOWLEDGE/DISCOVERY_INDEX.md)
3. **Config changes**: Update [CONFIGURATION.md](METHODOLOGY/CONFIGURATION.md)
4. **New patterns**: Update [PATTERN.md](METHODOLOGY/PATTERN.md)
5. **Workflows**: Update [PROCESS.md](METHODOLOGY/PROCESS.md)

---

## Contact & Support

**Project Owner**: Rob Foree
**Type**: Personal AI Infrastructure Integration

For issues:
- Firebase/Firestore → Check rules and auth state
- Google APIs → Verify tokens and scopes
- Environment → Review `.env.local` and `apphosting.yaml`

---

## Document Index

### This Directory (.claude/)

```
.claude/
├── CLAUDE.md                    # This hub document
├── KNOWLEDGE/
│   ├── FRAMEWORK.md            # Core concepts
│   ├── SCHEMA.md               # Data structures
│   └── DISCOVERY_INDEX.md      # Capabilities reference
├── METHODOLOGY/
│   ├── PATTERN.md              # Design pattern
│   ├── PROCESS.md              # Usage workflows
│   ├── PROCEDURES.md           # Setup & integration
│   └── CONFIGURATION.md        # Configuration guide
└── IMPLEMENTATION/
    └── ARCHITECTURE.md         # Code organization
```

### Root Directory

| File | Purpose |
|------|---------|
| `CLAUDE.md` (root) | Quick reference (alias to this) |
| `README.md` | Original project readme |
| `CHANGELOG.md` | Version history |
| `DEPLOY-FIRESTORE-RULES.md` | Rules deployment guide |

---

**Last Updated**: 2025-11-21
**K/M/I Migration**: Complete
**Documentation Coverage**: ~90%
