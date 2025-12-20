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

# Bumpy Usage Process

## Overview

This document describes how to use Bumpy in typical workflows, including integration with other services and common usage patterns.

---

## User Workflows

### Workflow 1: Initial Setup

**Goal**: Set up Bumpy for first-time use.

```
1. Access Bumpy URL
   └── https://bumpy-roads--analyst-server.us-central1.hosted.app/

2. Sign In with Google
   └── Click "Sign In" → Google OAuth popup
   └── Grant profile and email permissions

3. Automatic User Initialization
   └── User profile created in Firestore
   └── Root topic created (ID = userId)
   └── Empty token/scope documents created

4. Navigate to Dashboard
   └── View empty widgets (no services authorized)
   └── Click widget → Authorize individual services

5. Start Creating Topics
   └── Navigate to root topic
   └── Add child topics for projects/areas
```

---

### Workflow 2: Authorizing Google Services

**Goal**: Connect Gmail, Drive, Calendar, or Chat.

```
1. Click Widget (e.g., "Connect Gmail")
   └── ServiceAuthCard shows authorization button

2. Initiate OAuth Flow
   └── Click "Authorize" → OAuth popup
   └── Google consent screen with service-specific scopes

3. Grant Permission
   └── User clicks "Allow"
   └── Redirect to callback with authorization code

4. Token Exchange
   └── Code exchanged for access + refresh tokens
   └── Tokens encrypted and stored in service_credentials

5. Widget Displays Data
   └── Gmail: Inbox messages
   └── Drive: Recent files
   └── Calendar: Upcoming events
   └── Chat: Spaces and messages

6. Auto-Refresh Active
   └── Tokens refresh automatically when expired
```

---

### Workflow 3: Creating Topic Hierarchies

**Goal**: Organize information hierarchically.

```
1. Navigate to Parent Topic
   └── Dashboard → Topics → Select parent

2. Add Child Topic
   └── Click "Add Topic" button
   └── Fill in title, subtitle, text
   └── Select topic type (concept, milestone, question)

3. Topic Created
   └── Child added to parent's children array
   └── Parent added to child's parents array
   └── Real-time listeners update UI

4. Navigate Hierarchy
   └── Click child to view details
   └── Breadcrumb shows path
   └── Back button returns to parent

5. Edit Topics
   └── Click topic to edit inline
   └── Changes saved to Firestore
   └── Version history maintained
```

---

### Workflow 4: AI Concept Analysis

**Goal**: Use AI to analyze and expand topics.

```
1. Select Topic for Analysis
   └── Navigate to topic with content

2. Enter Concept Query
   └── TopicHeaderRow has query input
   └── Enter question or analysis request

3. Prepare Structured Query
   └── Context gathered from topic hierarchy
   └── Query formatted with context

4. Execute AI Analysis
   └── Server action calls OpenAI API
   └── Response parsed and formatted

5. Save Results
   └── Completion converted to markdown
   └── Results become child topics (concepts, milestones, questions)
   └── Hierarchy expands with AI-generated content

6. Review and Refine
   └── Edit generated topics
   └── Run additional queries
   └── Build out analysis
```

---

### Workflow 5: Dashboard Monitoring

**Goal**: Quick overview of all services.

```
1. Navigate to Dashboard
   └── /dashboard route

2. View Service Widgets
   └── Gmail: Recent emails with snippets
   └── Drive: Recent files with links
   └── Calendar: Upcoming events
   └── Chat: Active spaces

3. Interact with Items
   └── Click email → External Gmail link
   └── Click file → External Drive link
   └── Click event → Event details

4. Check Authorization Status
   └── Unauthorized services show connect button
   └── Authorized services show data
   └── Error states show retry options
```

---

## Integration Patterns

### Pattern: Topic-Centric Email

Link emails to topics for context.

```
Topic: "Project Alpha"
    └── Child: "Q4 Planning"
        └── Attached: Email about Q4 timeline
```

**Current Implementation**: Manual reference via topic text.
**Future**: Direct email embedding in topics.

### Pattern: Document Context

Associate Drive files with topics.

```
Topic: "Research Notes"
    └── Referenced: "Literature Review.docx"
    └── Referenced: "Data Analysis.xlsx"
```

**Current Implementation**: Links in topic text.
**Future**: Drive picker integration.

### Pattern: Event Milestones

Link calendar events to topic milestones.

```
Topic: "Product Launch"
    └── Milestone: "Beta Release"
        └── Event: March 15, 2025
    └── Milestone: "GA Release"
        └── Event: April 30, 2025
```

**Current Implementation**: Manual event references.
**Future**: Calendar event embedding.

---

## Common Usage Scenarios

### Scenario 1: Project Planning

```
1. Create project topic
2. Add concept topics for major areas
3. Add milestone topics for deadlines
4. Add question topics for open items
5. Use AI to expand concepts
6. Reference emails and files
```

### Scenario 2: Research Organization

```
1. Create research area topic
2. Add source topics with links
3. Add concept topics for findings
4. Use AI to analyze and synthesize
5. Create summary topics
```

### Scenario 3: Task Management

```
1. Create project topic
2. Add subtopics for task areas
3. Add milestones for deadlines
4. Check calendar for conflicts
5. Reference related emails
```

---

## Service-Specific Workflows

### Gmail Workflow

```
View Inbox
    └── Dashboard widget shows recent emails
    └── Subject, from, snippet visible

Read Email
    └── Click opens in Gmail
    └── No in-app email viewing yet

Send Email
    └── sendGmailMessage() server action
    └── API compose and send
```

### Drive Workflow

```
View Files
    └── Dashboard widget shows recent files
    └── Name, type, modified date visible

Open File
    └── Click webViewLink
    └── Opens in Google Drive

List Files
    └── queryDriveFiles() returns metadata
    └── No content preview yet
```

### Calendar Workflow

```
View Events
    └── Dashboard widget shows upcoming
    └── Title, time, attendees visible

Event Details
    └── Click opens in Google Calendar
    └── Full event editing there
```

### Chat Workflow

```
View Spaces
    └── Dashboard widget shows spaces
    └── Recent messages visible

Space Interaction
    └── Click opens in Google Chat
    └── Full chat there
```

---

## Error Handling Workflows

### Token Expiration

```
1. API call fails with invalid_grant
2. System attempts token refresh
3. If refresh succeeds → Retry operation
4. If refresh fails → Show "Reconnect" option
5. User reauthorizes service
```

### Missing Authorization

```
1. User clicks service widget
2. No credentials found
3. ServiceAuthCard shows "Connect"
4. User clicks → OAuth flow
5. Service now authorized
```

### Network Errors

```
1. API call times out
2. Error message shown
3. User clicks "Retry"
4. Operation retried
```

---

## Admin Workflows

### Checking Auth State

```javascript
// Browser console
firebase.auth().currentUser
// Returns user object or null
```

### Checking Service Credentials

```javascript
// Via server action
const result = await checkServiceAuth('gmail', idToken);
console.log(result.isAuthorized, result.scopes);
```

### Debugging Token Issues

```bash
# Test credentials
./test-credentials.sh

# Test service credentials
node test-service-credentials.mjs
```

---

## Best Practices

### Topic Organization

1. **Use clear titles**: Descriptive, searchable
2. **Appropriate types**: concept vs milestone vs question
3. **Reasonable depth**: Not too flat, not too deep
4. **Regular review**: Archive completed topics

### Service Authorization

1. **Authorize as needed**: Don't pre-authorize everything
2. **Review scopes**: Understand what you're granting
3. **Disconnect unused**: Remove unneeded services
4. **Monitor errors**: Check for auth issues

### Security

1. **Don't share tokens**: Keep credentials private
2. **Check URLs**: Verify OAuth redirects
3. **Review permissions**: Regular scope audit
4. **Log out**: On shared devices

---

## Performance Considerations

### Firestore Queries

- Use indexed queries for large datasets
- Limit query results (maxResults)
- Use real-time listeners sparingly

### Token Management

- Tokens cached in credentials document
- Refresh only when expired
- Auto-refresh is synchronous (blocks API call)

### UI Rendering

- Topic hierarchy can be deep
- Use virtualization for long lists
- Lazy load child topics

---

## Troubleshooting Process

### Issue: Service Not Working

```
1. Check if authorized
   └── checkServiceAuth() returns false?
   └── Reauthorize

2. Check token expiration
   └── expiresAt < now?
   └── Refresh should happen automatically

3. Check scopes
   └── Has required scopes?
   └── Reauthorize with correct scopes

4. Check API errors
   └── Look at console logs
   └── Check error message
```

### Issue: Topic Not Saving

```
1. Check authentication
   └── User signed in?
   └── idToken valid?

2. Check permissions
   └── Firestore rules allow write?
   └── User owns topic?

3. Check data
   └── Required fields present?
   └── Data types correct?
```

---

## Summary

Bumpy workflows center around:
1. **Authentication**: Sign in, authorize services
2. **Organization**: Create and manage topic hierarchies
3. **Integration**: View Gmail, Drive, Calendar, Chat data
4. **Analysis**: Use AI to expand and analyze concepts

The process is designed to be incremental (authorize as needed) and organized (topics provide context for everything).
