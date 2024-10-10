#!/bin/bash

while IFS='=' read -r key value; do
    # Convert key to lowercase and remove any leading/trailing whitespace
    # secret_name="rf."$(echo "$key" | tr '[:upper:]' '[:lower:]' | xargs)
    secret_name=$(echo "$key" | tr '[:upper:]' '[:lower:]' | xargs)
    
    # Remove any leading/trailing whitespace from the value
    secret_value=$(echo "$value" | xargs)
    
    echo $secret_name
    # Create the secret
    echo -n "$secret_value" | gcloud secrets create "$secret_name" --replication-policy="automatic" --data-file=-
done

