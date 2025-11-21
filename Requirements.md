# Loyalty App User Requirements

This document outlines the functional requirements and validation boundaries for all user roles within the loyalty application.

## Customer

*   **User Registration:** A customer can register for an account with the following validated fields:
    *   **First Name:** Maximum 40 characters, no spaces.
    *   **Last Name:** Maximum 80 characters, allowing up to two single spaces between words.
    *   **Email:** Must be a valid email format.
    *   **Password:** A minimum of 6 characters.
*   **Email Verification:** Until the user's email is successfully verified, the user profile will be marked as unverified, and they will be unable to earn or redeem points.
*   **View Profile and Points:** After logging in, a customer can view their own profile information and their current points balance. A separate section shows a detailed transaction history, including all credit and redeem actions.
*   **Customer cannot be a Manager:** A user with a customer profile cannot have manager permissions.

## Manager

*   **Bunk-Specific Access & Viewing:** A manager logs in and is automatically linked to their assigned petrol bunk via the `assignedBunkId`. They can view the details of their assigned bunk. This grants them permissions limited to that specific bunk. Managers are explicitly blocked from performing transactions at bunks they are not assigned to.
*   **Loyalty Transactions:** The manager can initiate two types of transactions:
    *   **Credit Points:** The manager enters the amount spent. The amount must be a positive number. The app calculates and adds points based on the global `creditPercentage`. The transaction record will include details of the bunk.
    *   **Redeem Points:** The manager enters the points to be redeemed. The number of points must be positive. The app calculates the final value in rupees based on the global `redemptionRate`.
*   **No Self-Transactions:** Managers cannot credit points to or redeem points from their own accounts.
*   **No History Editing:** Managers cannot edit or delete past transactions.
*   **Role Change Request:** A manager can request to have their role changed to 'customer' by contacting an administrator. This is a manual process and is not handled directly within the application.

## Admin

*   **Bunk Management:**
    *   The admin can create a new petrol bunk by providing its name, location, district, state, and a valid 6-digit pincode.
    *   The admin can assign a manager to a specific bunk.
    *   The admin can also unassign a manager from a bunk.
    *   The admin can view a list of all bunks.
*   **User Management:**
    *   The admin can assign and revoke manager permissions for any user.
    *   The admin can set a user's role to 'admin', 'manager', or 'customer'.
    *   The admin can edit user profiles and review account details.
*   **System Configuration:** The admin can set global loyalty rules with the following constraints:
    *   **`creditPercentage`:** Must be a number between 0 and 100 (inclusive).
    *   **`redemptionRate`:** Must be a positive number.
*   **Reporting & History:** The admin dashboard provides comprehensive statistics and a complete audit trail of all transactions and configuration changes. All configuration changes are logged in the `transactions` collection.
