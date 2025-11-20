#!/bin/bash

# =====================================================================================
# Test Script Template for LoyaltyApp Cloud Functions
# =====================================================================================
# This script is a TEMPLATE. It is designed to be populated and run by the 
# `run_all_tests.sh` master script. The following placeholders will be replaced
# automatically:
#   ADMIN_UID, MANAGER_UID, CUSTOMER_UID
#   ADMIN_AUTH_TOKEN, MANAGER_AUTH_TOKEN
# =====================================================================================

# --- Configuration ---
PROJECT_ID="loyalty-first"
BASE_URL="https://us-central1-${PROJECT_ID}.cloudfunctions.net"

# These placeholders will be replaced by the master script.
ADMIN_AUTH_TOKEN="__ADMIN_AUTH_TOKEN__"
MANAGER_AUTH_TOKEN="__MANAGER_AUTH_TOKEN__"
ADMIN_UID="__ADMIN_UID__"
MANAGER_UID="__MANAGER_UID__"
CUSTOMER_UID="__CUSTOMER_UID__"

# =====================================================================================
# STEP 1: SET USER ROLES (Requires Admin privileges)
# =====================================================================================

echo "\n\n--- [Step 1.1] Setting ADMIN Role ---"
curl -X POST "${BASE_URL}/setUserRole" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer ${ADMIN_AUTH_TOKEN}" \
     -d '{ "data": { "userId": "'${ADMIN_UID}'", "role": "admin" }}'

echo "\n\n--- [Step 1.2] Setting MANAGER Role ---"
curl -X POST "${BASE_URL}/setUserRole" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer ${ADMIN_AUTH_TOKEN}" \
     -d '{ "data": { "userId": "'${MANAGER_UID}'", "role": "manager" }}'

# =====================================================================================
# STEP 2: ADMIN-ONLY ACTIONS
# =====================================================================================

echo "\n\n--- [Step 2.1] Updating Global Config (as Admin) ---"
curl -X POST "${BASE_URL}/updateGlobalConfig" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer ${ADMIN_AUTH_TOKEN}" \
     -d '{ "data": { "creditPercentage": 12.0, "redemptionRate": 0.6 }}'

echo "\n\n--- [Step 2.2] Creating a Bunk (as Admin) ---"
BUNK_ID=$(curl -s -X POST "${BASE_URL}/createBunk" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer ${ADMIN_AUTH_TOKEN}" \
     -d '{ "data": { "name": "Main Street Fuel", "location": "123 Main St", "pincode": "123456" }}' | grep -o '"id": *"[^"]*"' | cut -d'"' -f4)
echo "Created Bunk with ID: ${BUNK_ID}"

echo "\n\n--- [Step 2.3] Assigning Manager to Bunk (as Admin) ---"
curl -X POST "${BASE_URL}/assignManagerToBunk" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer ${ADMIN_AUTH_TOKEN}" \
     -d '{ "data": { "managerId": "'${MANAGER_UID}'", "bunkId": "'${BUNK_ID}'" }}'

# =====================================================================================
# STEP 3: MANAGER-ONLY ACTIONS
# =====================================================================================

echo "\n\n--- [Step 3.1] Crediting Points (as Manager) ---"
curl -X POST "${BASE_URL}/creditPoints" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer ${MANAGER_AUTH_TOKEN}" \
     -d '{ "data": { "customerId": "'${CUSTOMER_UID}'", "purchaseAmount": 150.00 }}'

echo "\n\n--- [Step 3.2] Redeeming Points (as Manager) ---"
curl -X POST "${BASE_URL}/redeemPoints" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer ${MANAGER_AUTH_TOKEN}" \
     -d '{ "data": { "customerId": "'${CUSTOMER_UID}'", "pointsToRedeem": 10 }}'

# =====================================================================================
# STEP 4: NEGATIVE TEST CASES
# =====================================================================================

echo "\n\n--- [Negative 4.1] createBunk: Attempt by Manager (Should Fail) ---"
curl -X POST "${BASE_URL}/createBunk" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer ${MANAGER_AUTH_TOKEN}" \
     -d '{ "data": { "name": "Unauthorized Bunk", "location": "789 Fail St", "pincode": "654321" }}'

echo "\n\n--- All tests complete! ---"
