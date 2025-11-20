#!/bin/bash

set -e

# =====================================================================================
# Master Test Runner for LoyaltyApp
# =====================================================================================
# This script automates the entire testing process:
# 1. Fetches fresh ID tokens for the admin and manager users.
# 2. Creates a temporary, configured version of `e2e_tests.sh`.
# 3. Executes the complete test suite.
#
# USAGE:
# From the project root directory, run:
# bash backend/functions/run_all_tests.sh
# =====================================================================================

# --- Configuration ---
ADMIN_UID="z41y1GbfZDThFVSBgchVBSRDhJm2"
MANAGER_UID="4D8ZfspS1NOYt2p4Y2S6Y2L3g2E3"
CUSTOMER_UID="j9Y3gT4L2s5D8ZfspS1NOYt2p4Y2S6"
CUSTOMER_EMAIL="test.customer@example.com"
CUSTOMER_PASSWORD="password123"
SERVICE_ACCOUNT_KEY="backend/functions/serviceAccountKey.json"

# --- Script Start ---
echo "--- Starting Automated Test Run ---"

# Check for service account key
if [ ! -f "$SERVICE_ACCOUNT_KEY" ]; then
    echo "\nError: Service account key not found at '${SERVICE_ACCOUNT_KEY}'"
    echo "Please ensure the key file is present in the \`backend/functions\` directory."
    exit 1
fi

# Step 1: Get fresh ID tokens
echo "\nFetching authentication tokens..."
ADMIN_TOKEN=$(node backend/functions/getToken.js "$SERVICE_ACCOUNT_KEY" "$ADMIN_UID" --silent)
MANAGER_TOKEN=$(node backend/functions/getToken.js "$SERVICE_ACCOUNT_KEY" "$MANAGER_UID" --silent)

if [ -z "$ADMIN_TOKEN" ] || [ -z "$MANAGER_TOKEN" ]; then
    echo "\nError: Failed to retrieve one or more authentication tokens."
    echo "Please check the output from getToken.js for errors."
    exit 1
fi

echo "Tokens successfully retrieved."

# Step 2: Create a temporary, configured test script
CONFIGURED_TEST_SCRIPT="./temp_e2e_tests.sh"

# Read the template and replace placeholders
cat backend/functions/e2e_tests.sh | \
  sed "s/__ADMIN_AUTH_TOKEN__/${ADMIN_TOKEN}/g" | \
  sed "s/__MANAGER_AUTH_TOKEN__/${MANAGER_TOKEN}/g" | \
  sed "s/__ADMIN_UID__/${ADMIN_UID}/g" | \
  sed "s/__MANAGER_UID__/${MANAGER_UID}/g" | \
  sed "s/__CUSTOMER_UID__/${CUSTOMER_UID}/g" | \
  sed "s/__CUSTOMER_EMAIL__/${CUSTOMER_EMAIL}/g" | \
  sed "s/__CUSTOMER_PASSWORD__/${CUSTOMER_PASSWORD}/g" > "$CONFIGURED_TEST_SCRIPT"

# Make the temporary script executable
chmod +x "$CONFIGURED_TEST_SCRIPT"

# Step 3: Run the tests
echo "\nExecuting tests..."
"$CONFIGURED_TEST_SCRIPT"

# Step 4: Clean up the. temp script
rm "$CONFIGURED_TEST_SCRIPT"

echo "
--- Test Run Complete ---"
