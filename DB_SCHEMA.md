# Database Schema

This document outlines the schema for the Firestore database used in the loyalty application.

## 1. Users Collection

| Field          | Type    | Description                                                                      |
|----------------|---------|----------------------------------------------------------------------------------|
| \`firstName\`    | string  | The user's first name (max 40 chars, no spaces).                                 |
| \`lastName\`     | string  | The user's last name (max 80 chars, up to two single spaces).                    |
| \`email\`        | string  | The user's email address.                                                        |
| \`role\`         | string  | The user's role (\`customer\`, \`manager\`, or \`admin\`). Defaults to \`customer\`.    |
| \`isVerified\`   | boolean | Indicates if the user's email has been verified.                                 |
| \`points\`       | number  | The user's total loyalty points (initial value: 0).                              |
| \`assignedBunkId\` | string  | The ID of the bunk a manager is assigned to (\`NA\` for customers/admins).          |

## 2. Bunks Collection

| Field      | Type           | Description                                       |
|------------|----------------|---------------------------------------------------|
| \`name\`       | string         | The name of the petrol bunk.                      |
| \`location\`   | string         | The location of the bunk.                         |
| \`district\`   | string         | The district where the bunk is located.           |
| \`state\`      | string         | The state where the bunk is located.              |
| \`pincode\`    | string         | The 6-digit pincode of the bunk.                  |
| \`managerIds\` | array<string>  | An array of user IDs for the managers of the bunk. |

## 3. Configs Collection

This collection contains a single document with the ID \`global\`.

| Field              | Type   | Description                                            |
|--------------------|--------|--------------------------------------------------------|
| \`creditPercentage\` | number | The percentage of the transaction amount credited as points. |
| \`redemptionRate\`   | number | The value of one point in rupees.                      |

## 4. Transactions Collection

| Field         | Type      | Description                                                                                                                                            |
|---------------|-----------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| \`type\`        | string    | The type of transaction (e.g., \`credit\`, \`redeem\`, \`create_bunk\`, \`assign_manager\`, \`set_role\`, \`update_config\`, \`create_user\`).                                         |
| \`initiatorId\` | string    | The UID of the user who initiated the transaction.                                                                                                     |
| \`initiatorRole\`| string    | The role of the user who initiated the transaction.                                                                                                    |
| \`timestamp\`   | timestamp | The server-side timestamp of when the transaction was recorded.                                                                                        |
| \`details\`     | map       | A map containing transaction-specific details. For example, a \`credit\` transaction would include the customer's UID, the amount, and the points credited. A \`create_user\` transaction would include the new user's UID. |
