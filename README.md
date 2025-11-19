# Fuel Loyalty and Rewards App

This is a full-stack mobile application for a fuel loyalty program, built with a Flutter frontend and a Firebase backend. The app allows customers to earn and redeem loyalty points, while providing a secure role-based system for managers and administrators to manage the program.

---

## ✨ Features

- **Customer Loyalty Program:** Customers earn points based on the amount spent and can redeem them for discounts.
- **Secure User Authentication:** Users register and log in using their email and password. Email verification is required to activate the account.
- **Role-Based Access Control:** The system supports three distinct roles with specific permissions:
  - **Customer:** Can view their points and transaction history.
  - **Manager:** Can credit and redeem points for customers at their assigned bunk.
  - **Admin:** Has full control to manage users, bunks, and system-wide settings.
- **Centralized Admin Panel:** A dedicated screen for administrators to manage the entire system.
- **Secure & Scalable Backend:** Built on Firebase Cloud Functions and Firestore, with business logic and security enforced on the server side.
- **Complete Audit Trail:** Immutable transaction logs are created for all point changes and configuration updates, ensuring data integrity.

---

## 🛠️ Technology Stack

- **Frontend:** Flutter
- **Backend:**
  - Firebase Authentication (for user login)
  - Cloud Firestore (as the primary database)
  - Cloud Functions for Firebase (for server-side logic)
- **Languages:** Dart, JavaScript (Node.js v18)
- **Key Backend Dependencies:**
  - `firebase-admin`: For privileged backend access to the Firebase project.
  - `firebase-functions`: The SDK for writing Cloud Functions.

---

## 🚀 Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites

- [Flutter SDK](https://docs.flutter.dev/get-started/install)
- [Node.js](https://nodejs.org/) (v18, as specified in `functions/package.json`)
- [Firebase CLI](https://firebase.google.com/docs/cli)

### 1. Firebase Project Setup

1.  Create a new project in the [Firebase Console](https://console.firebase.google.com/).
2.  Add an **Android** or **iOS** app to your Firebase project and follow the setup instructions to include the `google-services.json` (Android) or `GoogleService-Info.plist` (iOS) file in your `flutter_app`.
3.  In the console, enable the following services:
    - **Authentication:** Enable the `Email/Password` sign-in provider.
    - **Firestore Database:** Create a new database in production mode.

### 2. Deploy the Backend

1.  Navigate to the `functions` directory: `cd functions`
2.  Install the Node.js dependencies: `npm install`
3.  Deploy the Cloud Functions:
    ```bash
    firebase deploy --only functions
    ```

### 3. Seed the Database

The project includes a script to seed the database with necessary initial data.

1.  **Create Admin User Manually:** In the Firebase Authentication console, manually add a new user (e.g., with an email and password) who will be your administrator. Copy the **User UID** for this new user.
2.  **Update the Seed Script:** Open `seed_database.sh` and replace `REPLACE_WITH_ADMIN_UID` with the UID you just copied.
3.  **Run the Script:** Execute the script from the project root:
    ```bash
    bash seed_database.sh
    ```

### 4. Run the Flutter App

1.  Navigate to the `flutter_app` directory: `cd flutter_app`
2.  Get the Flutter dependencies: `flutter pub get`
3.  Run the application on a connected device or emulator:
    ```bash
    flutter run
    ```

---

## 📁 Project Structure

```
.
├── flutter_app/         # Contains the Flutter frontend application.
├── functions/           # Contains the Node.js backend Cloud Functions.
├── DB_SCHEMA.md         # The database schema documentation.
├── README_ROLES.md      # Detailed documentation of user roles.
├── firestore.rules      # Security rules for the Firestore database.
└── seed_database.sh     # Script to seed the database with initial data.
```
