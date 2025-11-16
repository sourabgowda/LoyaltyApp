
# Loyalty App Database Schema

This document outlines the Firestore collections and the fields within the documents for the loyalty application's backend.

## 1. Users Collection

| Field          | Type    | Description                                                                       |
|----------------|---------|-----------------------------------------------------------------------------------|
| `firstName`      | string  | The customer's first name (max 40 chars, no spaces).                             |
| `lastName`       | string  | The customer's last name (max 80 chars, up to two spaces).                       |
| `phoneNumber`    | string  | The user's 10-digit phone number.                                                |
| `role`           | string  | The user's role (`customer`, `manager`, or `admin`). Defaults to `customer`.       |
| `isVerified`     | boolean | Indicates if the user's phone number has been verified via OTP.                  |
| `points`         | number  | The user's total loyalty points (initial value: 0).                              |
| `assignedBunkId` | string  | The ID of the bunk a manager is assigned to (`NA` for customers/admins).          |

## 2. Bunks Collection

| Field      | Type   | Description                                                     |
|------------|--------|-----------------------------------------------------------------|
| `name`     | string | The name of the petrol bunk (max 100 chars).                    |
| `location` | string | The physical location of the bunk (max 50 chars).               |
| `district` | string | The district where the bunk is located (max 50 chars).          |
| `state`    | string | The state where the bunk is located (max 50 chars).             |
| `pincode`  | string | The 6-digit pincode of the bunk.                                |

## 3. Transactions Collection

| Field           | Type      | Description                                                                       |
|-----------------|-----------|-----------------------------------------------------------------------------------|
| `type`          | string    | Type of transaction (`credit`, `redeem`, `config_update`).                        |
| `customerId`    | string    | Reference to the customer's user ID.                                             |
| `managerId`     | string    | Reference to the manager's user ID.                                              |
| `adminId`       | string    | Reference to the admin's user ID (for `config_update`).                          |
| `amountSpent`   | number    | Amount spent by the customer.                                                     |
| `pointsChange`  | number    | Points credited (`+`) or redeemed (`-`).                                        |
| `redeemedValue` | number    | Rupee value of redeemed points.                                                   |
| `timestamp`     | timestamp | The time the transaction was recorded.                                            |
| `bunk`          | map       | A map containing details of the bunk where the transaction occurred.              |

## 4. Configs Collection

This collection contains a single document with the ID `global`.

| Field              | Type   | Description                                                                       |
|--------------------|--------|-----------------------------------------------------------------------------------|
| `creditPercentage` | number | Percentage of amount spent converted to points (0-100).                           |
| `pointValue`       | number | Rupee value of a single loyalty point.                                            |

