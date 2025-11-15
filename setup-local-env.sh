#!/bin/bash

echo "🔧 Setting up local environment variables"
echo ""
echo "You need to add these values to .env.local:"
echo ""
echo "1. Get Firebase config from:"
echo "   https://console.firebase.google.com/project/analyst-server/settings/general"
echo ""
echo "2. Get Google OAuth credentials from:"
echo "   https://console.cloud.google.com/apis/credentials?project=analyst-server"
echo ""
echo "3. Create/edit .env.local with:"
echo ""
cat << 'EOF'
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=<from Firebase Console>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=analyst-server.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=analyst-server
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=analyst-server.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<from Firebase Console>
NEXT_PUBLIC_FIREBASE_APP_ID=<from Firebase Console>

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback

# Encryption (same as production)
ENCRYPTION_KEY=<your encryption key>
EOF

echo ""
echo "4. After updating .env.local, restart the dev server:"
echo "   Ctrl+C to stop, then: npm run dev"
