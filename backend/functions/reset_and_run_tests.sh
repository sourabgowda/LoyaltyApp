#!/bin/bash

# =====================================================================================
# Reset and Test Runner for LoyaltyApp
# =====================================================================================
# This script automates the entire process of resetting the database and running tests:
# 1. Clears all users from Firebase Authentication except for the admin and manager.
# 2. Deletes all data from the Firestore database.
# 3. Seeds the database with an admin user.
# 4. Runs the end-to-end test suite.
#
# USAGE:
# From the project root directory, run:
# bash backend/functions/reset_and_run_tests.sh
# =====================================================================================

# --- Script Start ---
echo "--- Starting Database Reset and Automated Test Run ---"

# Step 1: Clear Firebase Authentication
echo "
Clearing Firebase Authentication..."
node backend/functions/clear_auth.js

# Step 2: Clear Firestore Database
echo "
Clearing Firestore database..."
firebase firestore:delete -r --all-collections

# Step 3: Seed the database
echo "
Seeding the database..."
node backend/functions/seed.js

# Step 4: Run the end-to-end tests
echo "
Running end-to-end tests..."
bash backend/functions/run_all_tests.sh

echo "
--- Reset and Test Run Complete ---"
