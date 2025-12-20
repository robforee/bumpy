# Bumpy Skills Registry

**Purpose**: Skills that bumpy provides or requires
**Created**: 2025-11-22
**Status**: Active Development

---

## Skills Provided

### topic-knowledge-management

**Type**: Application Skill
**Status**: Available

**Capabilities**:
- Hierarchical topic organization (parent-child)
- Real-time topic updates via Firestore listeners
- Topic caching and offline support
- Categories: concepts, milestones, questions, subtopics

**Data Provided**:
- Topic hierarchies
- Topic metadata
- User topic trees

### google-services-integration

**Type**: Integration Skill
**Status**: Available

**Capabilities**:
- Gmail integration (fetch, send)
- Google Drive operations
- Calendar event queries
- Google Chat messaging
- OAuth 2.0 with scope management

**Commands Exposed**:
- Web UI for topic management
- API routes for Google service access

### ai-concept-analysis

**Type**: AI Skill
**Status**: Available

**Capabilities**:
- OpenAI-powered concept queries
- Structured query preparation
- Markdown response generation
- Topic-based context loading

---

## Skills Required

### From Analyst-Server

| Skill | Purpose | Status |
|-------|---------|--------|
| doc-conformance | Validate documentation structure | Available |
| kb-management | Knowledge base operations | Available |

### From Other Repositories

| Skill | Source | Purpose |
|-------|--------|---------|
| token-refresh | refresh-tokens | OAuth token management | Required |

### External Dependencies

| Service | Purpose | Status |
|---------|---------|--------|
| Firebase | Auth, Firestore, Storage | Required |
| Google APIs | Gmail, Drive, Calendar, Chat | Required |
| OpenAI | AI concept analysis | Required |

---

## Integration Points

### As Data Provider

Bumpy provides:

| Consumer | Data Type | Integration Method |
|----------|-----------|-------------------|
| User | Topic hierarchies | Web UI |
| AI systems | Context for queries | API |

### As Data Consumer

Bumpy consumes:

| Source | Data Type | Format |
|--------|-----------|--------|
| Firebase | User data, topics | Firestore |
| Google APIs | Email, files, events | REST API |
| OpenAI | AI responses | JSON |
| refresh-tokens | OAuth tokens | Firestore |

---

## Master Registry Reference

For the complete PAI skill registry, see:
- `/home/robforee/PAI/.claude/skills/CORE/SKILL.md` - Master skill registry
- `/home/robforee/analyst-server/.claude/SKILLS.md` - Analyst-server skills

---

**Last Updated**: 2025-11-22
**Maintainer**: Bumpy application
**Integration Status**: Active development
