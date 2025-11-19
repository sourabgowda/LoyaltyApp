
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
