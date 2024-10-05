#!/bin/bash

# File to store exported variables
tmp_env_file=$(mktemp)

# Read .env.local and export variables
while IFS='=' read -r key value
do
    # Ignore comments and empty lines
    if [[ ! $key =~ ^# && -n $key ]]; then
        # Remove surrounding quotes if they exist
        value=$(echo $value | sed -e 's/^"//' -e 's/"$//')
        echo "export $key='$value'" >> $tmp_env_file
    fi
done < ../.env.local

# Source the temporary file to export the variables
source $tmp_env_file

# Remove the temporary file
rm $tmp_env_file

# Run the Node.js script with the exported environment variables
node test-firebase-gmail.cjs

# Optionally, unset the variables after running the script
# while IFS='=' read -r key value
# do
#     if [[ ! $key =~ ^# && -n $key ]]; then
#         unset $key
#     fi
# done < .env.local

