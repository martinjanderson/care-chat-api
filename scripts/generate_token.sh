#!/bin/bash

# Check if the user UID is provided as an argument
if [ -z "$1" ]; then
  echo "Usage: ./generate_token.sh <test_user_uid>"
  exit 1
fi

# Set the test user UID from the argument
TEST_USER_UID="$1"

# Load the .env file
export $(grep -v '^#' .env | xargs)

# Generate a custom token using the Firebase CLI
CUSTOM_TOKEN=$(node scripts/create_custom_token.js $TEST_USER_UID)

# Exchange the custom token for an ID token
ID_TOKEN=$(curl -s -X POST -H "Content-Type: application/json" \
  -d "{\"token\": \"$CUSTOM_TOKEN\", \"returnSecureToken\": true}" \
  "https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=$FIREBASE_WEB_API_KEY" \
  | jq -r '.idToken')

# Print the ID token
echo "Bearer $ID_TOKEN"
