# End-to-End Testing Guide for LoyaltyApp Backend

This document outlines the process for conducting end-to-end (E2E) tests on the LoyaltyApp backend Cloud Functions. The process involves both automated scripts and manual verification steps.

## 1. Automated Testing

The automated testing process is handled by a series of shell scripts that use `curl` to make HTTP requests to the deployed Cloud Functions. These tests cover the main functionalities of the backend, including user management, points crediting/redeeming, and administrative actions.

### 1.1. Prerequisites

Before running the automated tests, ensure you have the following:

* **Firebase Project:** A configured Firebase project with the LoyaltyApp backend deployed.
* **Service Account Key:** The `serviceAccountKey.json` file for your Firebase project, located in the `backend/functions` directory.
* **Node.js:** Node.js installed to run the `getToken.js` script.
* **curl:** The `curl` command-line tool installed.

### 1.2. Running the Tests

To run the automated tests, execute the `run_all_tests.sh` script from the `backend/functions` directory:

```bash
cd backend/functions
./run_all_tests.sh
```

This script will:

1. **Fetch Authentication Tokens:** Obtain fresh ID tokens for the admin and manager users.
2. **Run E2E Tests:** Execute the `e2e_tests.sh` script, which sends a series of `curl` requests to the Cloud Functions to test their functionality.

### 1.3. Test Cases

The `e2e_tests.sh` script covers the following test cases:

* **Customer Registration:** Registers a new customer.
* **Role Assignment:** Assigns the `admin` and `manager` roles to the respective users.
* **Admin Actions:**
    * Updates the global configuration.
    * Creates a new bunk.
    * Assigns a manager to a bunk.
* **Manager Actions:**
    * Credits points to a customer's account.
    * Redeems points from a customer's account.
* **Negative Test Cases:**
    * Attempts to create a bunk as a manager (should fail).
    * Attempts to credit points with an invalid amount (should fail).
    * Attempts to redeem more points than the customer has (should fail).

## 2. Manual Testing

While the automated tests cover the core functionality, some scenarios require manual verification. These steps should be performed after running the automated tests to ensure the backend is working as expected.

### 2.1. Firebase Console Verification

After the automated tests have been run, manually verify the following in the Firebase console:

* **Authentication:**
    * A new customer account has been created with the email `test.customer@example.com`.
* **Firestore:**
    * A new user document has been created in the `users` collection for the new customer.
    * The `users` collection contains documents for the admin and manager, with the correct roles assigned.
    * The `bunks` collection contains a new bunk document.
    * The `transactions` collection contains documents for all the actions performed by the automated tests.
    * The global config document in the `configs` collection has been updated.

### 2.2. Manual API Testing (Optional)

For more in-depth testing, you can use a tool like Postman or `curl` to manually send requests to the Cloud Functions. This allows you to test a wider range of inputs and scenarios that are not covered by the automated tests.

Here are some examples of manual tests you can perform:

* **Invalid Inputs:** Send requests with missing or invalid parameters to ensure the functions handle errors correctly.
* **Authorization:** Attempt to access protected endpoints with invalid or missing authentication tokens.
* **Edge Cases:** Test scenarios that are not covered by the automated tests, such as creating a bunk with a very long name or crediting a very large number of points.

By combining automated and manual testing, you can ensure that the LoyaltyApp backend is robust, reliable, and secure.
