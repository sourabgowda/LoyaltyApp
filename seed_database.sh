#!/bin/bash
#
# seed_database.sh
# This script seeds the Firestore database with initial data required for the loyalty app.
#
# IMPORTANT:
# 1. Make sure you are authenticated with gcloud (`gcloud auth login`).
# 2. Set your project configuration (`gcloud config set project YOUR_PROJECT_ID`).
# 3. You must manually create an Admin user in Firebase Authentication first.
#    Then, replace `REPLACE_WITH_ADMIN_UID` with the UID of that user.

# --- Variables ---
# Replace this placeholder with the UID of the user you created in Firebase Authentication.
ADMIN_UID="REPLACE_WITH_ADMIN_UID"

# --- Seeding Functions ---

# 1. Seed the global configuration
seed_global_config() {
  echo "Seeding global configuration..."
  gcloud firestore documents write "configs/global" \
    --data-file <(cat <<EOF
{
  "creditPercentage": {
    "doubleValue": 1.5
  },
  "pointValue": {
    "doubleValue": 0.5
  }
}
EOF
) || echo "Failed to seed global config."
}

# 2. Seed the initial Admin user
seed_admin_user() {
  if [ "$ADMIN_UID" == "REPLACE_WITH_ADMIN_UID" ]; then
    echo "SKIPPING: Admin user seed. Please replace the placeholder UID in the script."
    return
  fi
  echo "Seeding admin user with UID: $ADMIN_UID..."
  gcloud firestore documents write "users/$ADMIN_UID" \
    --data-file <(cat <<EOF
{
  "firstName": {
    "stringValue": "Admin"
  },
  "lastName": {
    "stringValue": "User"
  },
  "phoneNumber": {
    "stringValue": "0000000000"
  },
  "role": {
    "stringValue": "admin"
  },
  "isVerified": {
    "booleanValue": true
  },
  "points": {
    "integerValue": 0
  },
  "assignedBunkId": {
    "stringValue": "NA"
  }
}
EOF
) || echo "Failed to seed admin user."
}

# 3. Seed some example bunks
seed_bunks() {
  echo "Seeding example bunks..."
  gcloud firestore documents write "bunks/bunk_01" \
    --data-file <(cat <<EOF
{
  "name": {"stringValue": "City Fuel Stop"},
  "location": {"stringValue": "123 Main Street"},
  "district": {"stringValue": "Metro"},
  "state": {"stringValue": "Stateville"},
  "pincode": {"stringValue": "123456"}
}
EOF
) || echo "Failed to seed bunk_01."

  gcloud firestore documents write "bunks/bunk_02" \
    --data-file <(cat <<EOF
{
  "name": {"stringValue": "Highway Gas & Go"},
  "location": {"stringValue": "Route 66"},
  "district": {"stringValue": "County"},
  "state": {"stringValue": "Stateville"},
  "pincode": {"stringValue": "789012"}
}
EOF
) || echo "Failed to seed bunk_02."
}

# --- Main Execution ---
seed_global_config
seed_admin_user
seed_bunks

echo "
Database seeding complete."

