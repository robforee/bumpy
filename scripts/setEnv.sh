#!/bin/bash

# Loop through each line in the .env.local file
while IFS='=' read -r key value
do
  # Only process lines that start with "FIREBASE"
  if [[ $key == FIREBASE* ]]; then
    # Remove any surrounding double or single quotes from the value
    clean_value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
    
    # Export the environment variable
    export "$key=$clean_value"
  fi
done < .env.local

# Verify the variables are set (optional)
echo "FIREBASE_PROJECT_ID: $FIREBASE_PROJECT_ID"
echo "FIREBASE_API_KEY: $FIREBASE_API_KEY"


