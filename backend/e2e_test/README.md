# End-to-End Tests

This folder contains the scripts for running automated end-to-end (E2E) tests against the Firebase Functions backend.

## Prerequisites

- Node.js and npm installed.
- You must have a Firebase project with the functions deployed.
- You must have a `serviceAccountKey.json` file in the `backend/e2e_test` directory. This is required for the admin actions in the tests. You can generate this file in your Firebase project settings.

## Setup

1.  **Update Configuration:**
    *   Open `backend/e2e_test/config.js`.
    *   Fill in your Firebase project's `firebaseConfig`. You can get this from the Firebase console.
    *   Fill in the `functionUrls` with the HTTP trigger URLs for your deployed functions.

2.  **Install Dependencies:**
    ```bash
    cd backend/e2e_test
    npm install
    ```

## Running the Tests

To run the entire E2E test suite, simply run the following command from the `backend/e2e_test` directory:

```bash
npm run e2e
```

This single command will perform all the necessary steps in the correct order:

1.  **`setup_users.js`**: Registers the test users (admin, manager, customer).
2.  **`set_custom_claims.js`**: Sets the appropriate custom claims for each test user, granting them their roles (admin, manager).
3.  **`get_tokens.js`**: Signs in as each test user and saves their authentication tokens to `tokens.json`.
4.  **`run_tests.js`**: Executes the actual end-to-end tests for various user roles and scenarios. This now includes a specific test to verify that managers can only interact with their assigned bunk.

The results will be printed to the console. The tests are designed to be self-contained and will clean up and create the necessary test data.
