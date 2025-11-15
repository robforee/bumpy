#!/bin/bash
# Sync environment from ~/auth/.env.master to .env.local for Next.js

echo "🔄 Syncing environment from ~/auth/.env.master..."

# Source the master env file
if [ -f ~/auth/.env.master ]; then
  source ~/auth/.env.master
else
  echo "❌ Error: ~/auth/.env.master not found"
  exit 1
fi

# Create .env.local with NEXT_PUBLIC_ prefixed vars for Next.js
cat > .env.local << ENVEOF
# Auto-generated from ~/auth/.env.master
# Generated at: $(date)

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=${FIREBASE_API_KEY}
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${FIREBASE_AUTH_DOMAIN:-analyst-server.firebaseapp.com}
NEXT_PUBLIC_FIREBASE_PROJECT_ID=${GOOGLE_PROJECT_ID:-analyst-server}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${FIREBASE_STORAGE_BUCKET:-analyst-server.appspot.com}
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${FIREBASE_MESSAGING_SENDER_ID}
NEXT_PUBLIC_FIREBASE_APP_ID=${FIREBASE_APP_ID}

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=${GOOGLE_REDIRECT_URI:-http://localhost:3000/auth/callback}

# Encryption
ENCRYPTION_KEY=${ENCRYPTION_KEY}
ENVEOF

echo "✅ Generated .env.local"
echo ""
echo "📋 Variables loaded:"
grep -v "^#" .env.local | grep -v "^$" | while read line; do
  key=$(echo $line | cut -d= -f1)
  value=$(echo $line | cut -d= -f2-)
  
  # Mask sensitive values
  if [[ $key == *"SECRET"* ]] || [[ $key == *"KEY"* ]]; then
    echo "   $key=${value:0:10}..."
  else
    echo "   $key=$value"
  fi
done

echo ""
echo "🚀 Ready to start: npm run dev"
