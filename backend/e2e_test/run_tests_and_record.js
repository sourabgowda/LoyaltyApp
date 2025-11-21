
const axios = require('axios');
const fs = require('fs');
const { functionUrls } = require('./config');

// Helper to read tokens and user data
let tokens, user_data;
try {
    const tokenData = fs.readFileSync('./tokens.json', 'utf-8');
    tokens = JSON.parse(tokenData);
    const userData = fs.readFileSync('./user_data.json', 'utf-8');
    user_data = JSON.parse(userData);
} catch (error) {
    console.error("Error: tokens.json or user_data.json not found. Please run 'npm run get-tokens' or 'npm run e2e' first.");
    process.exit(1);
}

const logStream = fs.createWriteStream('curl_commands.log', { flags: 'a' });

const testAPI = async (testNumber, name, url, token, data, expectedStatus = 200) => {
    console.log(`-- Running test #${testNumber}: ${name}`);
    const curlCommand = `curl -X POST ${url} -H "Authorization: Bearer ${token}" -H "Content-Type: application/json" -d '${JSON.stringify({ data })}'`;
    logStream.write(`Test: ${name}\n`);
    logStream.write(`Request: ${curlCommand}\n`);

    try {
        const config = {};
        if (token) {
            config.headers = { 'Authorization': `Bearer ${token}` };
        }

        const response = await axios.post(url, { data }, config);
        logStream.write(`Response: ${JSON.stringify(response.data)}\n\n`);

        if (response.status === expectedStatus) {
            console.log(`✅ PASSED: ${name}`);
            return response.data.result;
        } else {
            console.error(`❌ FAILED: ${name} - Expected status ${expectedStatus}, but got ${response.status}`);
            return null;
        }
    } catch (error) {
        if (error.response) {
            logStream.write(`Response: ${JSON.stringify(error.response.data)}\n\n`);
        }
        if (error.response && error.response.status === expectedStatus) {
            console.log(`✅ PASSED: ${name} (Negative test as expected)`);
            return null;
        } else {
            const status = error.response ? error.response.status : 'N/A';
            const message = (error.response && error.response.data && error.response.data.error)
                ? error.response.data.error
                : (error.response ? error.response.data : error.message);
            console.error(`❌ FAILED: ${name} - Expected status ${expectedStatus}, got ${status}. Message:`, message);
            return null;
        }
    }
};

async function runTests() {
    let testCounter = 1;
    console.log('\n--- Starting Admin Scenarios ---\n');
    await testAPI(testCounter++, 'Admin: Set Manager Role', functionUrls.setUserRole, tokens.admin, { targetUid: user_data["manager@test.com"], newRole: 'manager' });
    await testAPI(testCounter++, 'Admin: Set non-existent user role', functionUrls.setUserRole, tokens.admin, { targetUid: 'non-existent-uid', newRole: 'manager' }, 404);
    const bunkA = await testAPI(testCounter++, 'Admin: Create Bunk A', functionUrls.createBunk, tokens.admin, { name: 'Test Bunk A', location: 'Test Location', district: 'Test District', state: 'Test State', pincode: '111111' });
    const bunkB = await testAPI(testCounter++, 'Admin: Create Bunk B', functionUrls.createBunk, tokens.admin, { name: 'Test Bunk B', location: 'Test Location', district: 'Test District', state: 'Test State', pincode: '222222' });
    // New test
    await testAPI(testCounter++, 'Admin: Get All Bunks', functionUrls.getAllBunks, tokens.admin, {});
    if (bunkA) {
        await testAPI(testCounter++, 'Admin: Assign Manager to Bunk A', functionUrls.assignManagerToBunk, tokens.admin, { bunkId: bunkA.bunkId, managerUid: user_data["manager@test.com"] });
        // New test
        await testAPI(testCounter++, 'Admin: Unassign Manager from Bunk A', functionUrls.unassignManagerFromBunk, tokens.admin, { bunkId: bunkA.bunkId, managerUid: user_data["manager@test.com"] });
        await testAPI(testCounter++, 'Admin: Assign manager to non-existent bunk', functionUrls.assignManagerToBunk, tokens.admin, { bunkId: 'non-existent-bunk', managerUid: user_data["manager@test.com"] }, 404);
        await testAPI(testCounter++, 'Admin: Assign non-manager to bunk', functionUrls.assignManagerToBunk, tokens.admin, { bunkId: bunkA.bunkId, managerUid: user_data["customer@test.com"] }, 400);
    }
    await testAPI(testCounter++, 'Admin: Update Global Config', functionUrls.updateGlobalConfig, tokens.admin, { updateData: { creditPercentage: 10, redemptionRate: 1 } });
    await testAPI(testCounter++, 'Admin: Update Global Config with invalid data', functionUrls.updateGlobalConfig, tokens.admin, { updateData: { creditPercentage: 'ten' } }, 400);
    await testAPI(testCounter++, 'Admin: Call manager function (creditPoints)', functionUrls.creditPoints, tokens.admin, { customerId: user_data["customer@test.com"], amountSpent: 100 }, 403);
    await testAPI(testCounter++, 'Admin: Invalid Bunk Data', functionUrls.createBunk, tokens.admin, { name: 'Incomplete Bunk' }, 400);
    await testAPI(testCounter++, 'Admin: Invalid Role', functionUrls.setUserRole, tokens.admin, { targetUid: user_data["customer@test.com"], newRole: 'superadmin' }, 400);

    console.log('\n--- Starting Manager Scenarios ---\n');
    // Re-assign manager to Bunk A for manager tests
    await testAPI(testCounter++, 'Admin: (SETUP) Assign Manager to Bunk A', functionUrls.assignManagerToBunk, tokens.admin, { bunkId: bunkA.bunkId, managerUid: user_data["manager@test.com"] });
    // New test
    await testAPI(testCounter++, 'Manager: Get Assigned Bunk', functionUrls.getAssignedBunk, tokens.manager, {});
    await testAPI(testCounter++, 'Manager: Credit Points at assigned bunk (Bunk A)', functionUrls.creditPoints, tokens.manager, { bunkId: bunkA.bunkId, customerId: user_data["customer@test.com"], amountSpent: 100 });
    await testAPI(testCounter++, 'Manager: Attempt to credit points at unassigned bunk (Bunk B)', functionUrls.creditPoints, tokens.manager, { bunkId: bunkB.bunkId, customerId: user_data["customer@test.com"], amountSpent: 100 }, 403);
    await testAPI(testCounter++, 'Manager: Credit points to non-existent customer', functionUrls.creditPoints, tokens.manager, { bunkId: bunkA.bunkId, customerId: 'non-existent-uid', amountSpent: 100 }, 404);
    await testAPI(testCounter++, 'Manager: Credit points with negative amount', functionUrls.creditPoints, tokens.manager, { bunkId: bunkA.bunkId, customerId: user_data["customer@test.com"], amountSpent: -50 }, 400);
    await testAPI(testCounter++, 'Manager: Redeem Points at assigned bunk (Bunk A)', functionUrls.redeemPoints, tokens.manager, { bunkId: bunkA.bunkId, customerId: user_data["customer@test.com"], pointsToRedeem: 10 });
    await testAPI(testCounter++, 'Manager: Redeem more points than available', functionUrls.redeemPoints, tokens.manager, { bunkId: bunkA.bunkId, customerId: user_data["customer@test.com"], pointsToRedeem: 10000 }, 400);
    await testAPI(testCounter++, 'Manager: Redeem negative points', functionUrls.redeemPoints, tokens.manager, { bunkId: bunkA.bunkId, customerId: user_data["customer@test.com"], pointsToRedeem: -20 }, 400);
    await testAPI(testCounter++, 'Manager: Credit Points to self', functionUrls.creditPoints, tokens.manager, { bunkId: bunkA.bunkId, customerId: user_data["manager@test.com"], amountSpent: 100 }, 403);
    await testAPI(testCounter++, 'Manager: Try to create bunk', functionUrls.createBunk, tokens.manager, { name: 'Manager Bunk', location: 'Test Location', district: 'Test District', state: 'Test State', pincode: '222222' }, 403);
    await testAPI(testCounter++, 'Manager: Try to set user role', functionUrls.setUserRole, tokens.manager, { targetUid: user_data["customer@test.com"], newRole: 'manager' }, 403);
    await testAPI(testCounter++, 'Manager: Try to update global config', functionUrls.updateGlobalConfig, tokens.manager, { updateData: { creditPercentage: 20 } }, 403);

    console.log('\n--- Starting Customer Scenarios ---\n');
    // New test
    await testAPI(testCounter++, 'Customer: Update User Profile', functionUrls.updateUserProfile, tokens.customer, { firstName: 'Test', lastName: 'Customer' });
    // New test
    await testAPI(testCounter++, 'Customer: Get Customer Profile', functionUrls.getCustomerProfile, tokens.customer, {});
    await testAPI(testCounter++, 'Customer: Try to credit points', functionUrls.creditPoints, tokens.customer, { bunkId: bunkA.bunkId, customerId: user_data["customer@test.com"], amountSpent: 100 }, 403);
    await testAPI(testCounter++, 'Customer: Try to redeem points for self', functionUrls.redeemPoints, tokens.customer, { bunkId: bunkA.bunkId, customerId: user_data["customer@test.com"], pointsToRedeem: 10 }, 403);
    await testAPI(testCounter++, 'Customer: Try to create bunk', functionUrls.createBunk, tokens.customer, { name: 'Customer Bunk', location: 'Test Location', district: 'Test District', state: 'Test State', pincode: '333333' }, 403);
    await testAPI(testCounter++, 'Customer: Try to set user role', functionUrls.setUserRole, tokens.customer, { targetUid: user_data["manager@test.com"], newRole: 'admin' }, 403);
    if (bunkA) {
        await testAPI(testCounter++, 'Customer: Try to assign manager', functionUrls.assignManagerToBunk, tokens.customer, { bunkId: bunkA.bunkId, managerUid: user_data["manager@test.com"] }, 403);
    }
    await testAPI(testCounter++, 'Customer: Try to update global config', functionUrls.updateGlobalConfig, tokens.customer, { updateData: { creditPercentage: 50 } }, 403);

    console.log('\n--- Starting Unauthenticated Scenarios ---\n');
    await testAPI(testCounter++, 'Unauthenticated: Try to create bunk', functionUrls.createBunk, null, { name: 'No Auth Bunk', location: 'Test Location', district: 'Test District', state: 'Test State', pincode: '444444' }, 403);
    await testAPI(testCounter++, 'Unauthenticated: Try to credit points', functionUrls.creditPoints, null, { bunkId: bunkA.bunkId, customerId: user_data["customer@test.com"], amountSpent: 100 }, 403);

    console.log('\n--- Starting Teardown Scenarios ---\n');
    await testAPI(testCounter++, 'Admin: Delete User', functionUrls.deleteUser, tokens.admin, { uid: user_data["customer@test.com"] });

    console.log('\n--- Starting Known Failing Scenarios ---\n');
    await testAPI(testCounter++, 'Admin: Get All Transactions', functionUrls.getAllTransactions, tokens.admin, {});
    await testAPI(testCounter++, 'Manager: Get Manager Transactions', functionUrls.getManagerTransactions, tokens.manager, {});
    await testAPI(testCounter++, 'Customer: Get Customer Transactions', functionUrls.getCustomerTransactions, tokens.customer, {});

    console.log('\n--- E2E Tests Complete ---\n');
    logStream.end();
}

runTests();
