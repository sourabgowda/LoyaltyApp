
# Loyalty App Database Schema

This document outlines the Firestore collections and the fields within the documents for the loyalty application's backend.

## 1. Users Collection

| Field          | Type    | Description                                                                       |
|----------------|---------|-----------------------------------------------------------------------------------|
| `firstName`      | string  | The customer's first name (max 40 chars, no spaces).                             |
| `lastName`       | string  | The customer's last name (max 80 chars, up to two spaces).                       |
| `email`          | string  | The user's email address.                                                        |
| `role`           | string  | The user's role (`customer`, `manager`, or `admin`). Defaults to `customer`.       |
| `isVerified`     | boolean | Indicates if the user's email has been verified.                                 |
| `points`         | number  | The user's total loyalty points (initial value: 0).                              |
| `assignedBunkId` | string  | The ID of the bunk a manager is assigned to (`NA` for customers/admins).          |

## 2. Bunks Collection

| Field      | Type   | Description                             |
|------------|--------|-----------------------------------------|
| `name`       | string | The name of the petrol bunk.            |
| `location`   | string | The location of the bunk.               |
| `district`   | string | The district where the bunk is located. |
| `state`      | string | The state where the bunk is located.    |
| `pincode`    | string | The 6-digit pincode of the bunk.        |

## 3. Configs Collection

This collection contains a single document with the ID `global`.

| Field              | Type   | Description                                                     |
|--------------------|--------|-----------------------------------------------------------------|
| `creditPercentage` | number | The percentage of the amount spent that is converted to points. |
| `redemptionRate`   | number | The value of one point in the local currency.                   |

## 4. Transactions Collection

This collection serves as a comprehensive audit trail for all significant events within the system.

| Field           | Type      | Description                                                                                                 |
|-----------------|-----------|-------------------------------------------------------------------------------------------------------------|
| `type`          | string    | The type of event (e.g., `credit`, `redeem`, `create_bunk`, `assign_manager`, `set_user_role`, `update_global_config`). |
| `initiatorId`   | string    | The UID of the user who initiated the event (an admin or a manager).                                        |
| `initiatorRole` | string    | The role of the user who initiated the event (`admin` or `manager`).                                        |
| `timestamp`     | timestamp | The timestamp of when the event occurred.                                                                   |
| `details`       | object    | A flexible object containing data specific to the event type, providing context for the audit trail.        |
