#!/bin/bash

# Quick local testing script for bumpy

echo "🚀 Starting Bumpy Development Server..."
echo ""
echo "📍 Server will run at: http://localhost:3000"
echo ""
echo "⚠️  IMPORTANT: Make sure you've added this to Google OAuth Console:"
echo "   http://localhost:3000/auth/callback"
echo ""
echo "🔧 Environment:"
echo "   - Using .env.local if present"
echo "   - Falls back to production env vars"
echo ""
echo "🧪 To test auth:"
echo "   1. Go to http://localhost:3000"
echo "   2. Sign in (simple login)"
echo "   3. Connect Gmail (service auth)"
echo "   4. Test demo button"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""
echo "────────────────────────────────────────"
echo ""

npm run dev
