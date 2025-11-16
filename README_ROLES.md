# Application Roles & Permissions

This document outlines the user roles within the loyalty application, their capabilities, and the security model that governs their access.

## Overview

The application uses a role-based access control (RBAC) model to manage user permissions. Each user is assigned a single `role` in their user document in Firestore. This `role` determines which actions they can perform and what data they can access.

There are three roles available:
1.  **Customer**
2.  **Manager**
3.  **Admin**

Roles are managed exclusively by Admins through the Admin Panel. When a role is changed, a secure Cloud Function (`setUserRole`) updates both the user's document in Firestore and their custom authentication claims, ensuring that the security rules are enforced consistently.

---

## 1. Customer

The `Customer` is the default role for all new users who register in the application.

**Capabilities:**
- View their own loyalty point balance.
- View their personal transaction history (credits and redemptions).
- View public information like the list of petrol bunks.

**Limitations:**
- Cannot access any other user's data.
- Cannot credit or redeem points.
- Cannot modify system configurations or user roles.

---

## 2. Manager

A `Manager` is typically an employee at a specific petrol bunk who is responsible for awarding and redeeming points for customers.

**Capabilities:**
- Perform all actions of a `Customer`.
- Credit loyalty points to a customer after a purchase (`creditPoints` function).
- Redeem loyalty points for a customer (`redeemPoints` function).
- View details of the bunk they are assigned to.

**Limitations:**
- Can only perform actions related to the bunk they are assigned to.
- Cannot view the full transaction history of the entire system.
- Cannot manage users or change system configurations.

---

## 3. Admin

The `Admin` role has the highest level of permissions and is responsible for the overall management and configuration of the system.

**Capabilities:**
- Perform all actions of a `Customer` and `Manager`.
- **User Management:** View all users and change any user's role (e.g., promote a user to Manager) via the Admin Panel (`setUserRole` function).
- **System Configuration:** Update global settings like the credit percentage and point redemption value (`updateGlobalConfig` function).
- **Bunk Management:** Create, view, and manage petrol bunk information (`createBunk` function).
- **Audit & History:** View the complete, system-wide transaction history for all users and bunks (the Audit Trail).

**Security:**
- The Admin role is granted via custom authentication claims. These claims are checked by the Firestore security rules to grant privileged access, ensuring that only a verified Admin can perform sensitive operations.
