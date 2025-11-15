#!/bin/bash
# Show the new Firestore rules section to copy/paste into Firebase Console

cat << 'EOF'

╔═══════════════════════════════════════════════════════════════════════════╗
║                     FIRESTORE RULES - NEW SECTION                         ║
╚═══════════════════════════════════════════════════════════════════════════╝

Copy the text between the lines below and paste into Firebase Console:
https://console.firebase.google.com/project/analyst-server/firestore/rules

━━━━━━━━━━━━━━━━━━━━━━━━ COPY FROM HERE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Service Credentials (NEW - for separated OAuth service authorization):
    //   - Document ID format: {userId}_{serviceName} (e.g., "CtAyzps80VXRzna32Kdy0NHYcPe2_gmail")
    //   - Stores encrypted access/refresh tokens for individual Google services
    //   - Only the authenticated user can read/write their own service credentials
    //   - Admin can access all service credentials
    match /service_credentials/{credentialId} {
      allow read, write: if request.auth != null &&
        (credentialId.matches(request.auth.uid + '_.*') || isAdmin());
    }

━━━━━━━━━━━━━━━━━━━━━━━━━ COPY TO HERE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHERE TO PASTE:
1. Open: https://console.firebase.google.com/project/analyst-server/firestore/rules
2. Scroll to the bottom of the rules editor
3. Find the last "match" block (should be "defined_corridors")
4. Paste the new section AFTER that block but BEFORE the closing } }
5. Click "Publish"

EXAMPLE PLACEMENT:

    match /defined_corridors/{corridorId} {
      allow read, write: if true;
    }

    // Service Credentials (NEW...)     ← PASTE HERE
    match /service_credentials/{credentialId} {
      allow read, write: if request.auth != null &&
        (credentialId.matches(request.auth.uid + '_.*') || isAdmin());
    }
  }  ← Must be before these closing braces
}

AFTER DEPLOYMENT, TEST WITH:
  cd /home/robforee/analyst-server/bumpy
  ./test-credentials.sh robforee@gmail.com YOUR_PASSWORD gmail

EOF
