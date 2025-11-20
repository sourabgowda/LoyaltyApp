# Fuel Loyalty and Rewards App - Backend

This is the backend for a fuel loyalty program, built on Firebase. It provides a secure and scalable foundation for a loyalty application, with a role-based system for customers, managers, and administrators.

---

## ✨ Features

- **Customer Loyalty Program:** Logic for earning points based on the amount spent and redeeming them for discounts.
- **Secure User Authentication:** Manages user registration and login. Email verification is required to activate accounts.
- **Role-Based Access Control:** The system supports three distinct roles with specific permissions:
  - **Customer:** Can view their points and transaction history.
  - **Manager:** Can credit and redeem points for customers at their assigned bunk. A critical security fix prevents managers from accessing bunks to which they are not assigned.
  - **Admin:** Has full control to manage users, bunks, and system-wide settings.
- **Centralized Admin Panel:** Endpoints for administrators to manage the entire system. The global configuration includes validation to ensure that the `creditPercentage` is always between 0 and 100.
- **Secure & Scalable Backend:** Built on Firebase Cloud Functions and Firestore, with business logic and security enforced on the server side.
- **Complete Audit Trail:** Immutable transaction logs are created for all point changes and configuration updates, ensuring data integrity.

---

## 🛠️ Technology Stack

- **Backend:**
  - Firebase Authentication (for user login)
  - Cloud Firestore (as the primary database)
  - Cloud Functions for Firebase (for server-side logic)
- **Language:** JavaScript (Node.js v20)
- **Key Backend Dependencies:**
  - `firebase-admin`: For privileged backend access to the Firebase project.
  - `firebase-functions`: The SDK for writing Cloud Functions.

---

## 🚀 Getting Started

Follow these steps to set up and run the backend services locally.

### Prerequisites

- [Node.js](https://nodejs.org/) (v20, as specified in `backend/functions/package.json`)
- [Firebase CLI](https://firebase.google.com/docs/cli)

### 1. Firebase Project Setup

1.  Create a new project in the [Firebase Console](https://console.firebase.google.com/).
2.  In the console, enable the following services:
    - **Authentication:** Enable the `Email/Password` sign-in provider.
    - **Firestore Database:** Create a new database in production mode.
3.  **Create an Admin User:** To manage the application, you'll need an admin user.
    1.  In the Firebase Authentication console, manually add a new user (e.g., with an email and password).
    2.  You will need to set a custom user claim for this user to have the `admin` role. The E2E tests in `backend/e2e_test/set_custom_claims.js` provide a clear example of how to programmatically set custom claims for a user. You can adapt this script for your own administrative use.

### 2. Deploy the Backend

To deploy the Firebase Cloud Functions, follow these steps:

1.  **Navigate to the Backend Directory:**
    Open your terminal and navigate to the `backend/functions` directory:
    ```bash
    cd backend/functions
    ```

2.  **Install Dependencies:**
    Install the required Node.js packages using npm:
    ```bash
    npm install
    ```

3.  **Deploy to Firebase:**
    Deploy the functions to your Firebase project:
    ```bash
    firebase deploy --only functions
    ```
    This command will upload and activate your backend logic on Firebase.

---

## 🧪 Testing the Backend

The backend includes both unit and end-to-end (E2E) tests to ensure its functionality and security.

### Backend Unit Tests

Unit tests for the Cloud Functions are located in `backend/functions/test`.

1.  **Navigate to the Functions Directory:**
    ```bash
    cd backend/functions
    ```

2.  **Install Dependencies (if you haven't already):**
    ```bash
    npm install
    ```

3.  **Run the Unit Tests:**
    ```bash
    npm test
    ```
    This will execute the test suite and provide a report on the results.

### Backend End-to-End (E2E) Tests

The E2E tests simulate real user scenarios and require a configured Firebase project.

1.  **Navigate to the E2E Test Directory:**
    ```bash
    cd backend/e2e_test
    ```

2.  **Install Test Dependencies:**
    ```bash
    npm install
    ```

3.  **Run the E2E Test Suite:**
    ```bash
    npm run e2e
    ```
    This command will:
    - Create temporary test users (admin, manager, customer).
    - Assign the necessary custom roles for testing.
    - Generate authentication tokens for these users.
    - Execute a series of automated tests that verify the backend's behavior in a live environment.

---

## 📁 Project Structure

```
.
├── backend/             # Contains all the backend-related code
│   ├── functions/       # Contains the Node.js backend Cloud Functions.
│   └── e2e_test/        # End-to-end tests for the backend.
├── DB_SCHEMA.md         # The database schema documentation.
├── README_ROLES.md      # Detailed documentation of user roles.
└── firestore.rules      # Security rules for the Firestore database.
```
