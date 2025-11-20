#!/bin/bash

# =====================================================================================
# End-to-End Tests for LoyaltyApp
# =====================================================================================
# This script is a template for running the e2e tests. It is configured and executed
# by the `run_all_tests.sh` script, which injects the necessary authentication tokens
# and user IDs.
# =====================================================================================

# --- Test Configuration ---
ADMIN_AUTH_TOKEN="eyJhbGciOiJSUzI1NiIsImtpZCI6IjQ1YTZjMGMyYjgwMDcxN2EzNGQ1Y2JiYmYzOWI4NGI2NzYxMjgyNjUiLCJ0eXAiOiJKV1QifQ.eyJhZG1pbiI6dHJ1ZSwiaXNzIjoiaHR0cHM6Ly9zZWN1cmV0b2tlbi5nb29nbGUuY29tL2xveWFsdHktZmlyc3QiLCJhdWQiOiJsb3lhbHR5LWZpcnN0IiwiYXV0aF90aW1lIjoxNzYzNjE4MzgyLCJ1c2VyX2lkIjoiejQxeTFHYmZaRFRoRlZTQmdjaFZCU1JEaEptMiIsInN1YiI6Ino0MXkxR2JmWkRUaEZWU0JnY2hWQlNSRGhKbTIiLCJpYXQiOjE3NjM2MTgzODIsImV4cCI6MTc2MzYyMTk4MiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJhZG1pbkBleGFtcGxlLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6ImN1c3RvbSJ9fQ.FnVkmYcCBZE6HJdwAREkifILiY_xd7MU-f6KK2qlbjT5Mid0y6_yOl2pkbIpjx1_PaFuCtym873p-ECj8lpUePow-LqbwBEMAlWNfRttDZobH4dfJYtPdp6FlwEZxNt5yKwZ68KmYTKflebQRRJRC0931oUjIE3pT6UVJ-GJ6U5Hr_s-qB-J9rkYCWxMYRahebrrSYF09jZcOwFG3e42qZDZdm65NepX_0nmK81lZwQd90_sBv5OGwZavekGb2H8j_hKaRvAUld9aE5ccV1Xm7Lu5PcvzJHyt_joa3ESc2MRhQO1oFN5c3hCE1Rdxbx1i9xOp22-uHbU-kW4GHoQJQ"
MANAGER_AUTH_TOKEN="eyJhbGciOiJSUzI1NiIsImtpZCI6IjQ1YTZjMGMyYjgwMDcxN2EzNGQ1Y2JiYmYzOWI4NGI2NzYxMjgyNjUiLCJ0eXAiOiJKV1QifQ.eyJtYW5hZ2VyIjp0cnVlLCJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vbG95YWx0eS1maXJzdCIsImF1ZCI6ImxveWFsdHktZmlyc3QiLCJhdXRoX3RpbWUiOjE3NjM2MTgzODMsInVzZXJfaWQiOiIzanVPU1BtdEdXTVBzaXFYVThQNlJ0dGhvdDEyIiwic3ViIjoiM2p1T1NQbXRHV01Qc2lxWFU4UDZSdHRob3QxMiIsImlhdCI6MTc2MzYxODM4MywiZXhwIjoxNzYzNjIxOTgzLCJlbWFpbCI6Im1hbmFnZXJAZXhhbXBsZS5jb20iLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZW1haWwiOlsibWFuYWdlckBleGFtcGxlLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6ImN1c3RvbSJ9fQ.iX0Cr9bvK5uVNNwfuW9L0srTL4xZy1QKSM45Xga3cFZyOs7lqQgChiFb3lNjj2r_yl1PbGBqdoZIa4PgrA8ljjwoxnjx9VQDxKXYZCljwBlzL2G1SMkYm-uX9Ryqk4ua7YSHwZ_7FhFF2B59DOdSaQ3bZZPqq1yoUxKNkk5GRrPT9TygxbwvlKC9h6ZutBEQI0x6-zRZFpIPNJSKbAOGSCxCJbsFZiGOetZ_M1m7uGEiqRcZxMNZXzRFj6T5x57PE09zvG7dvDwWAYCLPnh-yghIW99EpGISNRiK48Sw1nF4c7F2CJkVom_AWOs3tDIJIXdMHOffFZ95NGCO2hjoag"
ADMIN_UID="z41y1GbfZDThFVSBgchVBSRDhJm2"
MANAGER_UID="3juOSPmtGWMPsiqXU8P6Rtthot12"
CUSTOMER_UID="i3XrFYYz9wOiE3Ad5rPo8Hy7NCC3"
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

# Test 1: Admin can create a new user
create_user_status=$(make_request "POST" "http://localhost:5001/loyalty-first/us-central1/createUser" "$ADMIN_AUTH_TOKEN" '{"email": "'"$CUSTOMER_EMAIL"'", "password": "'"$CUSTOMER_PASSWORD"'", "displayName": "Test Customer"}')
if [ "$create_user_status" -ne 200 ]; then
    echo "Test 1 Failed: Admin failed to create a new user (HTTP status: $create_user_status)"
    exit 1
else
    echo "Test 1 Passed: Admin successfully created a new user"
fi

# ... (add more test cases here)

echo "\nAll tests passed!"
