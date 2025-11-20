# End-to-End Tests

This folder contains scripts for running end-to-end tests against the deployed Firebase Functions.

## Prerequisites

1.  Node.js and npm installed.
2.  Firebase CLI installed and configured.

## Setup

1.  **Deploy Functions:** Deploy your functions to a Firebase project:
    ```bash
    firebase deploy --only functions
    ```

2.  **Update Configuration:**
    *   Open `e2e_test/config.js`.
    *   Fill in your Firebase project's `firebaseConfig`. You can get this from the Firebase console.
    *   Fill in the `functionUrls` with the HTTP trigger URLs for your deployed functions.

3.  **Install Dependencies:**
    ```bash
    cd e2e_test
    npm install
    ```

## Running the Tests

The tests are run in a specific sequence.

### 1. Register Users

This script registers the test users (admin, manager, customer).

```bash
node setup_users.js
```

After running this, you **MUST** manually set a custom claim on the admin user in the Firebase Console to make them an admin.
- Go to the Authentication -> Users tab in your Firebase project.
- Find the `admin@test.com` user.
- Click the three dots and select "Edit user".
- Add a custom claim with key `admin` and value `true`.

### 2. Get Authentication Tokens

This script signs in as each test user and saves their auth tokens.

```bash
node get_tokens.js
```

### 3. Run the E2E Tests

This script executes the actual end-to-end tests for various scenarios.

```bash
node run_tests.js
```

This will run all tests and print the results to the console.
