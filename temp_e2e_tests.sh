#!/bin/bash

# =====================================================================================
# End-to-End Tests for LoyaltyApp
# =====================================================================================
# This script is a template for running the e2e tests. It is configured and executed
# by the `run_all_tests.sh` script, which injects the necessary authentication tokens
# and user IDs.
# =====================================================================================

# --- Test Configuration ---
ADMIN_AUTH_TOKEN="eyJhbGciOiJSUzI1NiIsImtpZCI6IjQ1YTZjMGMyYjgwMDcxN2EzNGQ1Y2JiYmYzOWI4NGI2NzYxMjgyNjUiLCJ0eXAiOiJKV1QifQ.eyJhZG1pbiI6dHJ1ZSwiaXNzIjoiaHR0cHM6Ly9zZWN1cmV0b2tlbi5nb29nbGUuY29tL2xveWFsdHktZmlyc3QiLCJhdWQiOiJsb3lhbHR5LWZpcnN0IiwiYXV0aF90aW1lIjoxNzYzNjE5NDAwLCJ1c2VyX2lkIjoiejQxeTFHYmZaRFRoRlZTQmdjaFZCU1JEaEptMiIsInN1YiI6Ino0MXkxR2JmWkRUaEZWU0JnY2hWQlNSRGhKbTIiLCJpYXQiOjE3NjM2MTk0MDAsImV4cCI6MTc2MzYyMzAwMCwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJhZG1pbkBleGFtcGxlLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6ImN1c3RvbSJ9fQ.aCfDK0YW15iiQom40rcBxIGxK81_mqFdBFO1RhW_9PMxNr_6qTi3agZyybo2pgdPQicXXb7g7OUtBZFC2b-3L1xc2-93KjmyfXi9dLVHtWIbWVahOQFoj_pBWkaz29Jx-mlN7Mm1HwuRMeDrqJIJToKCEU6nLS-rcbW2JcXSFQ-JTZOzoVkaBYnp9OKZuWf7tHrEEdwKES0OFhVt1PWpRK0-Z7o8eYQabpRQad1xpvwGKWQL08CW_s54yGvT-eaEFLzjKJ8L1kpthVe4ljQsyeJwyoD-r7TfVN4pIJihy5XFU7aNDGa_2lJBKWKAEaDSQSsgTc0ebbEGMZCJnHE2mA"
MANAGER_AUTH_TOKEN="eyJhbGciOiJSUzI1NiIsImtpZCI6IjQ1YTZjMGMyYjgwMDcxN2EzNGQ1Y2JiYmYzOWI4NGI2NzYxMjgyNjUiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vbG95YWx0eS1maXJzdCIsImF1ZCI6ImxveWFsdHktZmlyc3QiLCJhdXRoX3RpbWUiOjE3NjM2MTk0MDIsInVzZXJfaWQiOiI0RDhaZnNwUzFOT1l0MnA0WTJTNlkyTDNnMkUzIiwic3ViIjoiNEQ4WmZzcFMxTk9ZdDJwNFkyUzZZMkwzZzJFMyIsImlhdCI6MTc2MzYxOTQwMiwiZXhwIjoxNzYzNjIzMDAyLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7fSwic2lnbl9pbl9wcm92aWRlciI6ImN1c3RvbSJ9fQ.wCJoHD4bCufIv1fGHLH1DzS1xddZJldqdpBzS0o5xhrf85Si3lduOQzBd8if2AJB_kMx2BO1LcU1kS0yt2Dlzt0xdRb9nMTMpmKuIZlA_M56pDieVaQwSI5qK3L69jw-eGQa1XUqohuBuh16c1MxAmZZDCkPAQ3hcV9UaCM4pzJGuRb5ZQ1uB1kUTrUKrCmcAxPiVy-zGmXgIgAXn7vbvwuHxd9KEEpVNtRdwRCupc3TjZd_l93PjqggiP3D8bCqpit0naLTF1B_Hf7NNeGi3YySrp8WP13byOhQ3Or-iM4-lw0WUyIEaNn0ZxNhJIMXoPHao1B7uV3Epq17VNY-RA"
ADMIN_UID="z41y1GbfZDThFVSBgchVBSRDhJm2"
MANAGER_UID="4D8ZfspS1NOYt2p4Y2S6Y2L3g2E3"
CUSTOMER_UID="j9Y3gT4L2s5D8ZfspS1NOYt2p4Y2S6"
CUSTOMER_EMAIL="test.customer@example.com"
CUSTOMER_PASSWORD="password123"

# --- Pre-Test Checks ---

# Check if a process is listening on port 5001
if ! lsof -i:5001 -sTCP:LISTEN -t >/dev/null; then
    echo "Error: No process is listening on port 5001."
    echo "Please ensure the Firebase emulator is running and that it is configured to use port 5001."
    echo "You can start the emulator with the command: firebase emulators:start"
    exit 1
fi

# --- Helper Functions ---

# Function to make a cURL request and capture the HTTP status code
make_request() {
    local method=$1
    local url=$2
    local auth_token=$3
    local data=$4

    if [ -z "$data" ]; then
        curl -s -o /dev/null -w "%{http_code}" -X "$method" -H "Authorization: Bearer $auth_token" -H "Content-Type: application/json" "$url"
    else
        curl -s -o /dev/null -w "%{http_code}" -X "$method" -H "Authorization: Bearer $auth_token" -H "Content-Type: application/json" -d "$data" "$url"
    fi
}

# --- Test Cases ---

# Test 1: Admin can register a new customer
create_user_status=$(make_request "POST" "http://localhost:5001/loyalty-first/us-central1/api/registerCustomer" "$ADMIN_AUTH_TOKEN" '{"email": "'"$CUSTOMER_EMAIL"'", "password": "'"$CUSTOMER_PASSWORD"'", "displayName": "Test Customer"}')
if [ "$create_user_status" -ne 200 ]; then
    echo "Test 1 Failed: Admin failed to register a new customer (HTTP status: $create_user_status)"
    exit 1
else
    echo "Test 1 Passed: Admin successfully registered a new customer"
fi

# ... (add more test cases here)

echo "\nAll tests passed!"
