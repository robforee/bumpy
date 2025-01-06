# Token Validation Layers Proposal
- a change to bump

## Current Validation Points

### 1. Server-Side (node-ops)
- **Token Refresh Service**
  - Runs every 30 minutes via cron
  - Validates tokens and attempts refresh
  - Sets `requiresUserAction` flag if refresh fails
  - Updates Firestore with token status

### 2. Client-Side (web-bumpy)
- **Manual Validation**
  ```javascript
  ensureFreshTokens_fromClient(idToken, userId, forceRefresh)
  ```
  - Called before API operations
  - Checks token expiration
  - Attempts refresh if expired
  - Sets `requiresUserAction` on failure

## Identified Gaps

### 1. Route Protection
- No middleware validation on route changes
- Protected routes can be accessed with invalid tokens
- No automatic redirect to auth flow

### 2. Client-Side Monitoring
- No periodic validation while user is active
- No pre-emptive refresh before expiration
- No validation when tab becomes active
- No validation after network reconnection

### 3. Error Recovery
- Reactive rather than proactive handling
- User might hit API errors before refresh attempt
- No graceful degradation path

## Proposed Solutions

### 1. Next.js Route Middleware
```javascript
// middleware.ts
export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  
  if (!token && isProtectedRoute(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token) {
    const validation = await validateToken(token);
    if (!validation.valid && isProtectedRoute(request.nextUrl.pathname)) {
      // Store return URL and redirect to auth
      return NextResponse.redirect(new URL('/auth/refresh?return=' + 
        encodeURIComponent(request.nextUrl.pathname), request.url));
    }
  }
}
```

### 2. Client-Side Token Monitor
```javascript
// hooks/useTokenMonitor.ts
export function useTokenMonitor() {
  useEffect(() => {
    let checkInterval;
    
    // Check when tab becomes active
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        await validateAndRefresh();
      }
    };

    // Check when online status changes
    const handleOnline = async () => {
      await validateAndRefresh();
    };

    // Periodic check while active
    const startMonitoring = () => {
      checkInterval = setInterval(async () => {
        const timeToExpiry = await getTimeToExpiry();
        if (timeToExpiry < 5 * 60 * 1000) { // 5 minutes
          await validateAndRefresh();
        }
      }, 60000); // Check every minute
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    startMonitoring();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      clearInterval(checkInterval);
    };
  }, []);
}
```

### 3. Pre-emptive Refresh Strategy
```javascript
// utils/token-refresh.ts
export async function validateAndRefresh() {
  try {
    const timeToExpiry = await getTimeToExpiry();
    
    // Pre-emptive refresh if less than 5 minutes remaining
    if (timeToExpiry < 5 * 60 * 1000) {
      await ensureFreshTokens_fromClient(
        await getCurrentUser().getIdToken(),
        getCurrentUser().uid,
        true // Force refresh
      );
    }
    
    return { valid: true };
  } catch (error) {
    if (error.message === 'REAUTH_REQUIRED') {
      redirectToAuth();
    }
    return { valid: false, error };
  }
}
```

## Implementation Priority

### Phase 1: Critical Protection
1. Implement Next.js middleware for route protection
2. Add basic token validation before API calls
3. Set up error boundaries for auth failures

### Phase 2: Proactive Monitoring
1. Implement client-side token monitor
2. Add pre-emptive refresh logic
3. Handle tab visibility and network changes

### Phase 3: Enhanced Recovery
1. Add graceful degradation paths
2. Implement retry strategies
3. Enhance error reporting

### Phase 4: User Experience
1. Add loading states during refresh
2. Implement transparent refresh when possible
3. Add clear user messaging for auth issues

## Questions to Resolve

1. How aggressive should pre-emptive refresh be?
2. Should we cache API responses for offline/invalid token scenarios?
3. How to handle multiple tabs/windows?
4. What metrics should we track for token health?
5. How to handle refresh failures in background tasks?
