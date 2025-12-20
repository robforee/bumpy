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

# Bumpy Design Pattern

## Abstract Pattern: Hierarchical Information Hub with Federated Service Authorization

Bumpy implements a **Hierarchical Information Hub** pattern that federates access to multiple external services while maintaining a unified user experience centered around a topic tree structure.

---

## Pattern Definition

### Core Principle

Information should be organized hierarchically around user-defined concepts (topics), with external services providing contextual data that flows into this hierarchy. Each service maintains independent authorization, preventing scope creep and respecting the principle of least privilege.

### Pattern Components

1. **Central Hierarchy**: A tree structure (topics) that serves as the organizing principle
2. **Federated Services**: Independent OAuth connections to external APIs
3. **Unified Identity**: Single user identity (Firebase Auth) across all services
4. **Encrypted Credential Store**: Secure token storage per service
5. **Auto-Refresh Gateway**: Transparent token lifecycle management

---

## Design Rationale

### Why Hierarchical Organization?

**Problem**: Information exists in silos (email, files, calendar, chat) with no inherent relationships.

**Solution**: A topic hierarchy provides user-defined context that can link disparate information sources.

**Benefits**:
- Natural mental model (folders, outlines)
- Flexible categorization (topics can be concepts, milestones, questions)
- AI-enhanced (topics can be expanded with analysis)
- Context preservation (related items stay together)

### Why Federated Service Auth?

**Problem**: Traditional apps request all permissions upfront, creating user anxiety and unused scopes.

**Solution**: Per-service authorization allows incremental permission granting.

**Benefits**:
- Users grant only what they need
- Services can be disconnected independently
- Cleaner OAuth consent screens
- Easier security audits

### Why Encrypted Token Storage?

**Problem**: OAuth tokens in databases are high-value targets.

**Solution**: Encrypt tokens at rest using AES-256-CBC.

**Benefits**:
- Defense in depth beyond Firestore rules
- Credentials protected in database exports
- Meets security compliance requirements

---

## Pattern Implementation in Bumpy

### Layer 1: Identity (Firebase Auth)

```
User Identity
    ↓
Firebase Auth UID
    ↓
All downstream authorization
```

- Single sign-on via Google
- UID used as document keys
- ID token passed to all server actions

### Layer 2: Service Authorization

```
User wants Gmail access
    ↓
Check service_credentials/{uid}_gmail
    ↓
If not found → Show ServiceAuthCard → OAuth flow
    ↓
If found → Decrypt token → Check expiration
    ↓
If expired → Refresh → Update credentials
    ↓
Use token for API call
```

Each service follows this pattern independently.

### Layer 3: Data Organization

```
Root Topic (uid)
    ├── Project A (topic)
    │   ├── Requirements (concept)
    │   ├── Deadlines (milestone)
    │   └── Open Questions (question)
    ├── Project B (topic)
    └── Personal (topic)
```

Topics provide context for all integrated data.

### Layer 4: Service Integration

```
Topic Context → AI Query → External Service
    ↓                           ↓
Concept Analysis          Gmail/Drive/Calendar data
    ↓                           ↓
New Child Topics        Widget display in Dashboard
```

---

## Key Design Decisions

### Decision 1: Server Actions over REST

**Rationale**: Next.js Server Actions provide type-safe, co-located server code without API route boilerplate.

**Tradeoffs**:
- (+) Simpler mental model
- (+) Automatic code splitting
- (+) Built-in serialization
- (-) Tightly coupled to Next.js

### Decision 2: Firestore over PostgreSQL

**Rationale**: Hierarchical document model matches topic tree structure naturally.

**Tradeoffs**:
- (+) Real-time listeners
- (+) Firebase ecosystem integration
- (+) Schemaless flexibility
- (-) Limited query capabilities
- (-) No JOINs

### Decision 3: Per-Service Credentials

**Rationale**: Separation of concerns for authorization.

**Tradeoffs**:
- (+) Granular permission control
- (+) Independent service lifecycle
- (+) Cleaner revocation
- (-) More complex auth flow
- (-) Multiple OAuth consent screens

### Decision 4: Client-Side Topic Model

**Rationale**: ORM-like abstraction for common operations.

**Tradeoffs**:
- (+) Encapsulated logic
- (+) Instance methods for operations
- (+) Cleaner component code
- (-) Another abstraction layer
- (-) Potential for stale state

---

## Pattern Variants

### Variant A: Monolithic Auth

All services authorized at once with combined scopes.

**When to use**: Simple apps with fixed functionality.

**Bumpy approach**: Rejected in favor of per-service for better UX.

### Variant B: External Token Service

Dedicated microservice for token management.

**When to use**: Multi-application environments.

**Bumpy approach**: Uses Firestore for simplicity in single-app context.

### Variant C: Flat Data Model

No hierarchy, just tagged items.

**When to use**: When relationships are many-to-many.

**Bumpy approach**: Uses hierarchy for clearer organization.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Storing Raw Tokens

Never store OAuth tokens without encryption.

**Problem**: Database compromise exposes all user credentials.

**Solution**: Always encrypt with per-environment key.

### Anti-Pattern 2: Monolithic Scope Requests

Requesting all scopes at signup.

**Problem**: Users reject or don't understand why permissions needed.

**Solution**: Request scopes when feature is first used.

### Anti-Pattern 3: Mixing Client/Server Auth

Confusing client-side Firebase Auth with server-side service auth.

**Problem**: Security vulnerabilities and unclear code.

**Solution**: Clear separation: Firebase Auth for identity, service tokens for APIs.

### Anti-Pattern 4: Flat Topic Structure

All topics at same level with no hierarchy.

**Problem**: Loses context and organization.

**Solution**: Enforce parent-child relationships.

---

## Extension Guidelines

### Adding New Services

Follow the federated pattern:
1. Create scope definition file
2. Add `checkServiceAuth()` call
3. Implement encrypted credential storage
4. Add auto-refresh logic
5. Create widget component

### Adding New Topic Types

Follow the hierarchy pattern:
1. Add to TopicType enum
2. Define specific behavior
3. Update UI rendering
4. Consider AI integration

### Adding New Features

Follow the Server Action pattern:
1. Create action file with 'use server'
2. Accept idToken for auth
3. Return `{success, data?, error?}`
4. Handle in client components

---

## Pattern Benefits

1. **Separation of Concerns**: Auth, data, UI cleanly separated
2. **Security by Design**: Encrypted storage, per-service auth
3. **User Empowerment**: Incremental permissions, hierarchical organization
4. **Developer Experience**: Clear patterns, consistent APIs
5. **Scalability**: New services follow existing pattern

---

## Summary

The **Hierarchical Information Hub with Federated Service Authorization** pattern provides:

- A topic tree as the central organizing principle
- Independent OAuth for each Google service
- Encrypted token storage with auto-refresh
- Server Actions for type-safe backend logic
- Clear extension points for new capabilities

This pattern balances security, usability, and developer experience while providing a flexible foundation for personal information management.
