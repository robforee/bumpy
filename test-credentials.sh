#!/bin/bash
# Test service_credentials Firestore permissions
# Usage: ./test-credentials.sh <email> <password> [service]

cd "$(dirname "$0")"

# Load environment variables
if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | xargs)
fi

# Check arguments
if [ $# -lt 2 ]; then
    echo "Usage: ./test-credentials.sh <email> <password> [service]"
    echo "Example: ./test-credentials.sh robforee@gmail.com mypassword gmail"
    exit 1
fi

EMAIL="$1"
PASSWORD="$2"
SERVICE="${3:-gmail}"

echo "Testing Firestore service_credentials permissions..."
echo "Email: $EMAIL"
echo "Service: $SERVICE"
echo ""

# Run the test
node test-service-credentials.mjs "$EMAIL" "$PASSWORD" "$SERVICE"
