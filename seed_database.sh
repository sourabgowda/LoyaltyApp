
#!/bin/bash

# --- Firebase Project Configuration ---
# Get your project ID from the Firebase console.
PROJECT_ID="your-firebase-project-id"
ADMIN_UID="REPLACE_WITH_ADMIN_UID"

# --- 1. Seed Global Configuration ---
# This sets the initial loyalty program rules.

# Firestore URL for the global config document.
CONFIG_URL="https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/configs/global"

# The configuration data.
CONFIG_DATA='{
  "fields": {
    "creditPercentage": {"doubleValue": 10.0},
    "redemptionRate": {"doubleValue": 0.5}
  }
}'

echo "Seeding global configuration..."

# Use curl to send a PATCH request to create/update the document.
curl -X PATCH "${CONFIG_URL}" \
     -H "Content-Type: application/json" \
     -d "${CONFIG_DATA}"


# --- 2. Seed a Sample Bunk ---
# This creates an initial bunk for managers to be assigned to.

# Firestore URL for the bunks collection.
BUNKS_URL="https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/bunks"

# The sample bunk data.
BUNK_DATA='{
  "fields": {
    "name": {"stringValue": "Main Street Fuel"},
    "location": {"stringValue": "123 Main Street"},
    "district": {"stringValue": "Central District"},
    "state": {"stringValue": "Some State"},
    "pincode": {"stringValue": "123456"}
  }
}'

echo "\n\nSeeding sample bunk..."

curl -X POST "${BUNKS_URL}" \
     -H "Content-Type: application/json" \
     -d "${BUNK_DATA}"


# --- 3. Set the Admin User Role ---
# This gives the specified user admin privileges.

# Firestore URL for the admin user's document.
USER_URL="https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${ADMIN_UID}"

# The role update data.
USER_DATA='{
  "fields": {
    "role": {"stringValue": "admin"}
  }
}'

echo "\n\nSetting admin role..."

# Use curl to update the user's role.
curl -X PATCH "${USER_URL}" \
     -H "Content-Type: application/json" \
     -d "${USER_DATA}"

echo "\n\nDatabase seeding complete!"
