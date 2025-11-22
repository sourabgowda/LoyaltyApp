# Backend Cloud Functions API

This document provides a detailed overview of the callable Cloud Functions used by the loyalty application frontend.

---

## 1. `admin.js`

### `getAllBunks()`
- **Description:** Retrieves a list of all petrol bunks in the system.
- **Auth:** Requires Admin privileges.
- **Returns:** An object containing a `bunks` array.

### `getAllTransactions()`
- **Description:** Retrieves a complete log of all transactions across the system.
- **Auth:** Requires Admin privileges.
- **Returns:** An object containing a `transactions` array.

---

## 2. `bunk.js`

### `createBunk(data)`
- **Description:** Creates a new petrol bunk.
- **Auth:** Requires Admin privileges.
- **Data:** 
  ```json
  {
    "name": "String",
    "location": "String",
    "district": "String",
    "state": "String",
    "pincode": "String" 
  }
  ```
- **Returns:** A success message and the new `bunkId`.

### `assignManagerToBunk(data)`
- **Description:** Assigns a manager to a specific bunk.
- **Auth:** Requires Admin privileges.
- **Data:**
  ```json
  {
    "managerUid": "String",
    "bunkId": "String"
  }
  ```

### `unassignManagerFromBunk(data)`
- **Description:** Unassigns a manager from a specific bunk.
- **Auth:** Requires Admin privileges.
- **Data:**
  ```json
  {
    "managerUid": "String",
    "bunkId": "String"
  }
  ```

### `deleteBunk(data)`
- **Description:** Deletes a bunk from the system. This also unassigns any associated managers.
- **Auth:** Requires Admin privileges.
- **Data:**
  ```json
  {
    "bunkId": "String"
  }
  ```
---

## 3. `config.js`

### `updateGlobalConfig(data)`
- **Description:** Updates the global loyalty system rules.
- **Auth:** Requires Admin privileges.
- **Data:**
  ```json
  {
    "updateData": {
      "creditPercentage": "Number (0-100)",
      "redemptionRate": "Number (>0)"
    }
  }
  ```

---

## 4. `customer.js`

### `registerCustomer(data)`
- **Description:** Registers a new customer account.
- **Auth:** Public.
- **Data:**
  ```json
  {
    "firstName": "String",
    "lastName": "String",
    "email": "String",
    "password": "String"
  }
  ```

### `getCustomerProfile()`
- **Description:** Retrieves the profile information and points balance for the currently logged-in customer.
- **Auth:** Requires logged-in Customer.
- **Returns:** An object containing the user's `profile` data.

### `getCustomerTransactions()`
- **Description:** Retrieves the transaction history for the currently logged-in customer.
- **Auth:** Requires logged-in Customer.
- **Returns:** An object containing a `transactions` array.

---

## 5. `manager.js`

### `getAssignedBunk()`
- **Description:** Retrieves the details of the bunk assigned to the currently logged-in manager.
- **Auth:** Requires Manager privileges.
- **Returns:** An object containing the `bunk` data.

### `getManagerTransactions()`
- **Description:** Retrieves the transaction history for the currently logged-in manager.
- **Auth:** Requires Manager privileges.
- **Returns:** An object containing a `transactions` array.

---

## 6. `points.js`

### `creditPoints(data)`
- **Description:** Credits loyalty points to a customer's account.
- **Auth:** Requires Manager privileges.
- **Data:**
  ```json
  {
    "customerId": "String",
    "amountSpent": "Number",
    "bunkId": "String"
  }
  ```

### `redeemPoints(data)`
- **Description:** Redeems loyalty points from a customer's account.
- **Auth:** Requires Manager privileges.
- **Data:**
  ```json
  {
    "customerId": "String",
    "pointsToRedeem": "Number",
    "bunkId": "String"
  }
  ```

---

## 7. `user.js`

### `setUserRole(data)`
- **Description:** Sets the role for a target user.
- **Auth:** Requires Admin privileges.
- **Data:**
  ```json
  {
    "targetUid": "String",
    "newRole": "String ('admin', 'manager', or 'customer')"
  }
  ```

### `deleteUser(data)`
- **Description:** Deletes a user from the system.
- **Auth:** Requires Admin privileges.
- **Data:**
  ```json
  {
    "uid": "String"
  }
  ```

### `updateUserProfile(data)`
- **Description:** Allows a user to update their own profile information.
- **Auth:** Requires any logged-in user.
- **Data:**
  ```json
  {
    "firstName": "String",
    "lastName": "String"
  }
  ```