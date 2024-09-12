#!/bin/bash

# Path list extracted from eco-system.txt
file_paths=(
  "src/app/actions.js"
  "src/components/restaurant/ReviewDialog.jsx"
  "src/components/restaurant/RatingPicker.jsx"
  "src/components/restaurant/Restaurant.jsx"
  "src/components/restaurant/RestaurantDetails.jsx"
  "src/components/restaurant/Stars.jsx"
  "src/components/restaurant/Tag.jsx"
  "src/lib/getUser.js"
  "src/lib/firebase/storage.js"
  "src/lib/firebase/clientApp.js"
  "src/lib/firebase/config.js"
  "src/lib/firebase/firestore.js"
  "src/lib/firebase/serverApp.js"
)

# Loop through each file path and create the necessary directories and files
for file in "${file_paths[@]}"; do
  # Create directory if it doesn't exist
  mkdir -p "$(dirname "$file")"
  # Create the file
  touch "$file"
  
  echo "touched: $file"
done

