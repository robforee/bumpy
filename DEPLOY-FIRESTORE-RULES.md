# Deploy Firestore Security Rules

## Problem
- Firebase CLI `firebase login` fails because localhost:9005 isn't accessible via SSH port forwarding
- Service account cannot deploy Firestore rules (needs special permissions)
- **Solution**: Deploy via Firebase Console web interface

## Quick Deploy (2 minutes)

### Step 1: Open Firebase Console
Visit: https://console.firebase.google.com/project/analyst-server/firestore/rules

### Step 2: Copy the new rules section
The new rules are in: `/home/robforee/analyst-server/bumpy/firestore.rules` (lines 176-184)

Copy this section:
```javascript
    // Service Credentials (NEW - for separated OAuth service authorization):
    //   - Document ID format: {userId}_{serviceName} (e.g., "CtAyzps80VXRzna32Kdy0NHYcPe2_gmail")
    //   - Stores encrypted access/refresh tokens for individual Google services
    //   - Only the authenticated user can read/write their own service credentials
    //   - Admin can access all service credentials
    match /service_credentials/{credentialId} {
      allow read, write: if request.auth != null &&
        (credentialId.matches(request.auth.uid + '_.*') || isAdmin());
    }
```

### Step 3: Paste into Firebase Console
1. In the Firebase Console rules editor, scroll to the bottom
2. Find the last `match` block (should be `defined_corridors`)
3. **After** that block but **before** the closing `}` and `}`, paste the new section
4. Click "Publish" button

### Step 4: Verify deployment
After publishing, test with the CLI script:
```bash
cd /home/robforee/analyst-server/bumpy
./test-credentials.sh robforee@gmail.com YOUR_PASSWORD gmail
```

## Alternative: Use Full File

If you want to replace all rules at once:

1. Open the full file: `/home/robforee/analyst-server/bumpy/firestore.rules`
2. Copy the entire contents (Ctrl+A, Ctrl+C)
3. Go to Firebase Console: https://console.firebase.google.com/project/analyst-server/firestore/rules
4. Select all existing rules (Ctrl+A)
5. Paste the new rules (Ctrl+V)
6. Click "Publish"

This replaces all rules with the updated version that includes:
- All existing rules (businesses, users, restaurants, etc.) ✓
- New service_credentials collection rules ✓

## What These Rules Do

```javascript
match /service_credentials/{credentialId} {
  allow read, write: if request.auth != null &&
    (credentialId.matches(request.auth.uid + '_.*') || isAdmin());
}
```

**Security**:
- Document ID must match pattern: `{userId}_{serviceName}`
- Users can only access documents starting with their own UID
- Admin (CtAyzps80VXRzna32Kdy0NHYcPe2) can access all

**Example**:
- User UID: `CtAyzps80VXRzna32Kdy0NHYcPe2`
- Service: `gmail`
- Document path: `service_credentials/CtAyzps80VXRzna32Kdy0NHYcPe2_gmail`
- ✅ User can read/write their own document
- ❌ User cannot read/write other users' documents

## Testing After Deployment

### Browser Test
1. Login to app: http://localhost:3000
2. Click "Connect Gmail"
3. Complete OAuth flow
4. Should see: "✅ Success! gmail connected successfully"
5. Should redirect to dashboard
6. Gmail card should show "Connected" status

### CLI Test
```bash
cd /home/robforee/analyst-server/bumpy
./test-credentials.sh robforee@gmail.com YOUR_PASSWORD gmail
```

Expected output:
```
✅ Firebase initialized
✅ User signed in: robforee@gmail.com
✅ Tokens encrypted
✅ Write successful!
✅ Read successful!
✅ Security rules working
✅ ALL TESTS PASSED
```

## Troubleshooting

### If deployment fails with validation error
- Check that all braces `{}` are balanced
- Verify the new section is **inside** the `match /databases/{database}/documents` block
- Ensure no duplicate `match /service_credentials` blocks

### If test still shows "Missing or insufficient permissions"
1. Check Firebase Console shows "Last published: [recent timestamp]"
2. Wait 30 seconds for rules to propagate
3. Hard refresh browser (Ctrl+Shift+R)
4. Try test again

### If rules deploy but test fails for other reason
Run the CLI test script with verbose logging:
```bash
cd /home/robforee/analyst-server/bumpy
node test-service-credentials.mjs robforee@gmail.com YOUR_PASSWORD gmail
```

This will show detailed error messages.

## Files Changed

1. `/home/robforee/analyst-server/bumpy/firestore.rules` - Updated with service_credentials rules
2. `/home/robforee/PAI/.claude/skills/db-manager/SKILL.md` - Documented new token location

## Next Steps After Successful Deployment

1. ✅ Test Gmail authorization works end-to-end
2. ✅ Test Drive, Calendar, Messenger authorization
3. Update remaining Google API functions to use new `getServiceToken()` pattern
4. Clean up old code (deprecated server actions, old collections)
