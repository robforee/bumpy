# Authentication Flow Analysis & Redesign Proposal

## Current Authentication Flow (The Problem)

### Overview
The current implementation attempts to handle **two separate concerns in one flow**:
1. **Website Authentication**: Proving user identity to access the website
2. **Google Service Authorization**: Getting OAuth tokens with broad scopes for Gmail/Drive/Calendar access

This creates a confusing double-loop that results in poor UX and brittle authentication logic.

### Current Flow Breakdown

```
User clicks "Sign In"
    ↓
1. Header.jsx checks if user needs refresh token
    - Queries user_tokens collection
    - Sets forceConsent = true for new users or expired tokens
    ↓
2. signInWithGoogle(scopes, forceConsent) in firebaseAuth.js
    - Creates GoogleAuthProvider (Firebase)
    - Adds requested scopes to provider
    - Calls signInWithPopup (Firebase Auth) ← FIRST AUTH
    - Gets Firebase user credential
    ↓
3. THEN immediately redirects to Google OAuth consent
    - Builds manual OAuth URL with all scopes
    - Sets window.location.href to Google consent screen ← SECOND AUTH
    - User already signed into Firebase at this point
    ↓
4. Google redirects to /auth/callback with code
    ↓
5. Server exchanges code for tokens (auth-actions.js)
    - exchangeCodeForTokens(code)
    - Gets access_token + refresh_token
    ↓
6. ClientCallback.jsx waits for Firebase auth state
    - Waits for auth.currentUser to exist
    - Gets idToken from Firebase user
    - Calls storeTokenInfo with Google tokens
    ↓
7. Redirects to home page
```

### Problems with Current Approach

#### 1. **Double Authentication Confusion**
- User goes through Firebase popup (clicks account)
- THEN immediately sees another Google consent screen
- Unclear why two separate auth flows are needed
- Feels broken - "Why am I authenticating twice?"

#### 2. **Race Conditions**
```javascript
// ClientCallback.jsx lines 27-41
if (!auth.currentUser) {
  await new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        unsubscribe();
        resolve();
      }
    });
    setTimeout(() => {  // ← 10 second timeout!
      unsubscribe();
      resolve();
    }, 10000);
  });
}
```
- Waiting for Firebase auth state to propagate
- 10-second timeout as fallback
- Brittle and unpredictable

#### 3. **Confusing Code Paths**
```javascript
// firebaseAuth.js lines 74-86
// Sign in with Firebase first
const signInWithPopup_result = await signInWithPopup(auth, provider);
console.log('Firebase sign in result:', ...);

// Then redirect to Google's consent page
window.location.href = authUrl;  // ← Abandons the popup result!
return;
```
- The `signInWithPopup` result contains tokens
- But we throw them away and redirect to manual OAuth
- Why do the popup at all?

#### 4. **Scope Management Complexity**
- Scopes stored in multiple places:
  - `public_data/scopes.default_scopes` (global defaults)
  - `users/{uid}.request_scopes` (user-requested)
  - `user_tokens/{uid}.authorizedScopes` (actually authorized)
  - `authorized_scopes/{uid}.authorizedScopes` (duplicate?)
- Hard to track what user actually has access to
- No clear way to request incremental scopes

#### 5. **Token Storage Issues**
```javascript
// auth-actions.js lines 48-100
const tokenData = {
  __last_token_update: now,
  __web_token_update: nowFormatted,
  __web_refresh_token_update: refreshToken ? nowFormatted : null,
  __error_time: null,
  __last_error: null,
  accessToken: encryptedAccessToken,
  refreshToken: encryptedRefreshToken,
  expirationTime: now + 3600000,
  userEmail: currentUser.email,
  authorizedScopes: scopes,
  errors: [],
  consecutiveFailures: 0,
  requiresUserAction: false,
  requiresRefreshToken: false
};
```
- Mixes operational metadata with credentials
- Multiple timestamp formats (epoch vs formatted strings)
- Error tracking mixed with token data
- Flags like `requiresRefreshToken` control auth flow behavior

---

## Proposed Solution: Separate Authentication from Authorization

### Design Principles

1. **Website Login ≠ Google Service Access**
   - These are two separate concerns
   - Should have separate flows
   - Should be independently manageable

2. **Simple Login First**
   - Get user authenticated quickly
   - Minimal scopes (just profile + email)
   - Standard Firebase Auth popup

3. **Explicit Service Authorization**
   - After login, user sees dashboard
   - Clear UI cards: "Connect Gmail", "Connect Drive", etc.
   - Each service requests its specific scopes
   - User explicitly grants or denies each service

4. **Incremental Scope Grants**
   - Start with minimal permissions
   - Add more as needed
   - Each scope group is a separate authorization

---

## Proposed Flow

### Phase 1: Simple Website Login

```
User clicks "Sign In"
    ↓
signInWithGoogle([]) // No extra scopes!
    ↓
Firebase signInWithPopup
    ↓
User authenticated with Firebase
    ↓
Redirect to dashboard
    ↓
User sees their profile, basic UI
```

**Firebase Auth automatically provides:**
- `openid`
- `profile`
- `email`

**No Google API tokens stored at this stage!**

---

### Phase 2: Service-Specific Authorization

User dashboard shows service cards:

```
┌─────────────────────────────────┐
│  Gmail Integration              │
│  Status: Not Connected          │
│  [Connect Gmail]                │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  Google Drive Integration       │
│  Status: Not Connected          │
│  [Connect Drive]                │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  Calendar Integration           │
│  Status: Not Connected          │
│  [Connect Calendar]             │
└─────────────────────────────────┘
```

When user clicks "Connect Gmail":

```
User clicks "Connect Gmail"
    ↓
requestServiceAuth('gmail')
    ↓
Build OAuth URL with Gmail-specific scopes:
  - gmail.readonly
  - gmail.compose
  - gmail.modify
    ↓
Redirect to Google consent (or popup)
    ↓
User grants Gmail permissions
    ↓
Callback receives code
    ↓
Exchange code for tokens
    ↓
Store tokens in service_credentials/{uid}/gmail
    ↓
Update UI: Gmail card shows "Connected ✓"
```

---

## New Data Model

### Firestore Structure

```
users/
  {uid}/
    email: string
    displayName: string
    photoURL: string
    createdAt: timestamp
    lastLogin: timestamp

service_credentials/
  {uid}/
    gmail/
      accessToken: encrypted_string
      refreshToken: encrypted_string
      scopes: string[]
      grantedAt: timestamp
      lastRefreshed: timestamp
      expiresAt: timestamp

    drive/
      accessToken: encrypted_string
      refreshToken: encrypted_string
      scopes: string[]
      grantedAt: timestamp
      lastRefreshed: timestamp
      expiresAt: timestamp

    calendar/
      accessToken: encrypted_string
      refreshToken: encrypted_string
      scopes: string[]
      grantedAt: timestamp
      lastRefreshed: timestamp
      expiresAt: timestamp

service_errors/  # Optional: track auth failures
  {uid}/
    gmail/
      errors: array<{ timestamp, error, code }>
      consecutiveFailures: number
      requiresUserAction: boolean
```

### Benefits of New Structure

1. **Clear Separation**
   - User identity in `users/`
   - Service credentials in `service_credentials/`
   - No mixing concerns

2. **Per-Service Management**
   - Revoke Gmail without affecting Drive
   - Refresh tokens independently
   - Track errors per service

3. **Simple Authorization Checks**
   ```javascript
   // Check if user has Gmail access
   const gmailCreds = await getDoc(
     doc(db, 'service_credentials', uid, 'gmail')
   );
   const hasGmail = gmailCreds.exists();
   ```

4. **Easy Scope Expansion**
   - User wants more Gmail permissions?
   - Just re-authorize Gmail service
   - Doesn't affect other services

---

## Implementation Plan

### Step 1: Implement Simple Login (No Breaking Changes)

Create new login function alongside old one:

```javascript
// firebaseAuth.js
export async function signInBasic() {
  try {
    const provider = new GoogleAuthProvider();
    // NO extra scopes - just basic profile
    const result = await signInWithPopup(auth, provider);
    return { success: true, user: result.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

Update Header.jsx to use new function:
```javascript
// For new users or testing, use basic login
const signInResult = await signInBasic();
```

### Step 2: Create Service Authorization System

New component: `ServiceAuthCard.jsx`
```javascript
export default function ServiceAuthCard({
  serviceName,  // 'gmail', 'drive', 'calendar'
  displayName,  // 'Gmail', 'Google Drive', etc.
  scopes,       // Array of required scopes
  description   // What this service enables
}) {
  const [status, setStatus] = useState('disconnected');

  const handleConnect = async () => {
    // Request service-specific auth
    const result = await requestServiceAuth(serviceName, scopes);
    if (result.success) {
      setStatus('connected');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{displayName}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Status: {status}</p>
        {status === 'disconnected' && (
          <Button onClick={handleConnect}>
            Connect {displayName}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
```

New auth action: `requestServiceAuth`
```javascript
// auth-actions.js
export async function requestServiceAuth(service, scopes) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    state: JSON.stringify({ service }) // Track which service this is for
  });

  // Redirect or open popup
  window.location.href = authUrl;
}
```

### Step 3: Update Callback Handler

```javascript
// auth/callback/page.js
export default async function OAuth2Callback({ searchParams }) {
  const code = searchParams.code;
  const state = searchParams.state ? JSON.parse(searchParams.state) : {};
  const service = state.service; // Which service is this for?

  // Exchange code for tokens
  const result = await exchangeCodeForTokens(code);

  // Store in service-specific location
  if (service) {
    await storeServiceTokens(service, result.tokens);
  }

  return <ClientCallback result={result} service={service} />;
}
```

### Step 4: Update Token Storage

```javascript
// auth-actions.js
export async function storeServiceTokens(service, tokens) {
  const { firebaseServerApp, currentUser } =
    await getAuthenticatedAppForUser(tokens.idToken);

  const db = getFirestore(firebaseServerApp);
  const serviceCredsRef = doc(
    db,
    'service_credentials',
    currentUser.uid,
    service
  );

  const encryptedAccessToken = await encrypt(tokens.accessToken);
  const encryptedRefreshToken = tokens.refreshToken
    ? await encrypt(tokens.refreshToken)
    : null;

  await setDoc(serviceCredsRef, {
    accessToken: encryptedAccessToken,
    refreshToken: encryptedRefreshToken,
    scopes: tokens.scopes,
    grantedAt: Date.now(),
    expiresAt: Date.now() + 3600000
  });

  return { success: true };
}
```

### Step 5: Update Dashboard

```javascript
// dashboard/page.jsx
export default function DashboardPage() {
  return (
    <div>
      <h1>Welcome, {user.displayName}!</h1>

      <h2>Connect Your Services</h2>
      <div className="grid grid-cols-3 gap-4">
        <ServiceAuthCard
          serviceName="gmail"
          displayName="Gmail"
          scopes={[
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.compose',
            'https://www.googleapis.com/auth/gmail.modify'
          ]}
          description="Send and read emails"
        />

        <ServiceAuthCard
          serviceName="drive"
          displayName="Google Drive"
          scopes={[
            'https://www.googleapis.com/auth/drive.readonly',
            'https://www.googleapis.com/auth/drive.file'
          ]}
          description="Access your files"
        />

        <ServiceAuthCard
          serviceName="calendar"
          displayName="Google Calendar"
          scopes={[
            'https://www.googleapis.com/auth/calendar.readonly',
            'https://www.googleapis.com/auth/calendar.events'
          ]}
          description="View and create events"
        />
      </div>
    </div>
  );
}
```

---

## Migration Strategy (Since No Active Users)

### Option A: Clean Slate (Recommended)

Since you mentioned **no active users on beta or deployed site**:

1. **Delete old auth collections:**
   ```javascript
   // One-time migration script
   const collections = [
     'user_tokens',
     'authorized_scopes',
     'public_data'  // if only used for scopes
   ];

   for (const coll of collections) {
     const docs = await getDocs(collection(db, coll));
     for (const doc of docs.docs) {
       await deleteDoc(doc.ref);
     }
   }
   ```

2. **Deploy new auth system**
   - Replace `signInWithGoogle` with `signInBasic`
   - Add service authorization UI
   - Update token storage to new structure

3. **Update API functions**
   - Change from `getTokenInfo(idToken)`
   - To `getServiceToken(service, idToken)`

4. **Test flow:**
   - Sign in with Google (basic)
   - Connect Gmail service
   - Send test email
   - Verify token refresh works

### Option B: Gradual Migration

If you want to support both flows temporarily:

1. **Add feature flag:**
   ```javascript
   const USE_NEW_AUTH = process.env.NEXT_PUBLIC_USE_NEW_AUTH === 'true';
   ```

2. **Implement new system alongside old**
3. **Test thoroughly with new system**
4. **Switch feature flag**
5. **Remove old code**

But since **no active users**, Option A is cleaner.

---

## Benefits Summary

### User Experience
- ✅ Simple, fast login
- ✅ Clear what they're authorizing
- ✅ Can grant/revoke individual services
- ✅ No confusing double-auth loop

### Code Quality
- ✅ Clear separation of concerns
- ✅ Easy to understand and debug
- ✅ No race conditions
- ✅ Simpler error handling

### Maintainability
- ✅ Add new services easily
- ✅ Update service scopes independently
- ✅ Clear data model
- ✅ Testable components

### Security
- ✅ Principle of least privilege
- ✅ Granular token management
- ✅ Easy to audit what user authorized
- ✅ Simple revocation per service

---

## Next Steps

1. **Review this proposal** - Confirm approach makes sense
2. **Choose migration strategy** - Clean slate vs gradual
3. **Implement signInBasic** - Get simple login working
4. **Build ServiceAuthCard** - Create reusable component
5. **Update callback handler** - Support service-specific storage
6. **Test complete flow** - Login → Authorize Service → Use API
7. **Deploy and verify** - Test on beta environment

---

## Questions to Consider

1. **Popup vs Redirect for Service Auth?**
   - Popup: Better UX (stay on page), but can be blocked
   - Redirect: Always works, but leaves page temporarily
   - Recommendation: Try popup with redirect fallback

2. **Pre-authorize common services?**
   - Could auto-request Gmail during first login
   - Or require explicit user action
   - Recommendation: Explicit is clearer

3. **Show all services or just relevant ones?**
   - Could hide services user hasn't requested
   - Or show all with "Coming Soon" status
   - Recommendation: Show all for transparency

4. **Service groups?**
   - Bundle related scopes? (e.g., "Gmail Full Access")
   - Or individual scope toggles?
   - Recommendation: Start with service-level, add granularity later

---

## Files to Modify

### Core Auth
- ✏️ `src/lib/firebase/firebaseAuth.js` - Add `signInBasic`, `requestServiceAuth`
- ✏️ `src/app/actions/auth-actions.js` - Add `storeServiceTokens`, `getServiceToken`
- ✏️ `src/app/auth/callback/page.js` - Handle service parameter
- ✏️ `src/app/auth/callback/ClientCallback.jsx` - Simplify (no waiting for auth state)

### UI Components
- ➕ `src/components/ServiceAuthCard.jsx` - New component
- ➕ `src/components/ServicesList.jsx` - Dashboard container
- ✏️ `src/components/Header.jsx` - Use `signInBasic`
- ✏️ `src/app/dashboard/dashboard-page.jsx` - Add service cards

### API Actions
- ✏️ `src/app/actions/google-actions.js` - Use `getServiceToken('gmail')`
- ✏️ All components using Google APIs - Update token retrieval

### Cleanup (After Migration)
- 🗑️ `src/components/ScopeManager.jsx` - Old scope management
- 🗑️ Old token collections in Firestore

---

## Estimated Effort

- **Phase 1** (Simple Login): 2-3 hours
- **Phase 2** (Service Auth UI): 3-4 hours
- **Phase 3** (Token Storage): 2-3 hours
- **Phase 4** (Update API calls): 2-3 hours
- **Testing & Refinement**: 3-4 hours

**Total: ~12-17 hours**

But since no active users, can iterate quickly without worrying about breaking changes.

---

## Conclusion

The current authentication flow conflates website login with Google service authorization, resulting in a confusing UX and complex code. By separating these concerns:

1. Users first **log in** to the website (simple, fast)
2. Then **explicitly authorize** individual Google services (clear, controllable)

This approach is:
- More intuitive for users
- Easier to implement and maintain
- Better aligned with OAuth2 best practices
- More flexible for future expansion

**Recommendation: Proceed with clean slate migration since no active users.**
