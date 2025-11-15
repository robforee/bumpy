#!/bin/bash
# Deploy Firestore security rules to analyst-server Firebase project

cd "$(dirname "$0")"

echo "Current directory: $(pwd)"
echo "Deploying Firestore security rules..."

firebase deploy --only firestore:rules

if [ $? -eq 0 ]; then
    echo "✅ Firestore rules deployed successfully"
else
    echo "❌ Deployment failed"
    exit 1
fi
