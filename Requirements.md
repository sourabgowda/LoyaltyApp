# Loyalty App User Requirements

This document outlines the functional requirements for all user roles within the loyalty application.

## Customer

*   **User Registration:** A customer can register for an account by providing their first name (max 40 characters, no spaces), last name (max 80 characters, up to two single spaces between words), email, and a password (at least 6 characters).
*   **Email Verification:** Until the user's email is successfully verified, the user profile will be marked as unverified.
*   **Loyalty Points & History:** After logging in, the customer's dashboard prominently displays their total points. A separate section shows a detailed transaction history, including all credit and redeem actions.
*   **Customer cannot be a Manager:** A user with a customer profile cannot have manager permissions.

## Manager

*   **Bunk-Specific Access:** A manager logs in and is automatically linked to their assigned petrol bunk via the `assignedBunkId`. This grants them permissions limited to that specific bunk.
*   **Loyalty Transactions:** The manager can initiate two types of transactions:
    *   **Credit Points:** The manager enters the amount spent, and the app calculates and adds points based on the global `creditPercentage`. The transaction record will include details of the bunk (name, location, district, state, and pincode).
    *   **Redeem Points:** The manager enters the points to be redeemed. The app calculates the final value in rupees based on the global `redemptionRate`.
*   **No Self-Transactions:** Managers cannot credit points to or redeem points from their own accounts.
*   **No History Editing:** Managers cannot edit or delete past transactions.

## Admin

*   **Bunk Management:**
    *   The admin can create a new petrol bunk by providing its name, location, district, state, and pincode.
    *   The admin can assign a manager to a specific bunk.
*   **User Management:**
    *   The admin can assign and revoke manager permissions for any user.
    *   The admin can set a user's role to 'admin', 'manager', or 'customer'.
    *   The admin can edit user profiles and review account details.
*   **System Configuration:** The admin can set global loyalty rules, including the `creditPercentage` (0-100) and the `redemptionRate` (1 point = X rupees).
*   **Reporting & History:** The admin dashboard provides comprehensive statistics and a complete audit trail of all transactions and configuration changes. All configuration changes are logged in the `transactions` collection.
