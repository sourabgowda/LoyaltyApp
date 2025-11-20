
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

const testAPI = async (name, url, token, data, expectedStatus = 200) => {
    console.log(`-- Running test: ${name}`);
    try {
        const config = {};
        if (token) {
            config.headers = { 'Authorization': `Bearer ${token}` };
        }

        // Wrap payload in 'data' object for callable functions
        const response = await axios.post(url, { data }, config);

        if (response.status === expectedStatus) {
            console.log(`✅ PASSED: ${name}`);
            // Callable functions return data in a 'result' object
            return response.data.result;
        } else {
            console.error(`❌ FAILED: ${name} - Expected status ${expectedStatus}, but got ${response.status}`);
            return null;
        }
    } catch (error) {
        if (error.response && error.response.status === expectedStatus) {
            console.log(`✅ PASSED: ${name} (Negative test as expected)`);
            return null;
        } else {
            const status = error.response ? error.response.status : 'N/A';
            // Extract the specific error message from the callable function's response
            const message = (error.response && error.response.data && error.response.data.error)
                ? error.response.data.error
                : (error.response ? error.response.data : error.message);
            console.error(`❌ FAILED: ${name} - Expected status ${expectedStatus}, got ${status}. Message:`, message);
            return null;
        }
    }
};

async function runTests() {
    console.log('\n--- Starting Admin Scenarios ---\n');
    // Admin tests

    await testAPI('Admin: Set Manager Role', functionUrls.setUserRole, tokens.admin, { targetUid: user_data["manager@test.com"], newRole: 'manager' });
    await testAPI('Admin: Set non-existent user role', functionUrls.setUserRole, tokens.admin, { targetUid: 'non-existent-uid', newRole: 'manager' }, 404);
    const bunkA = await testAPI('Admin: Create Bunk A', functionUrls.createBunk, tokens.admin, { name: 'Test Bunk A', location: 'Test Location', district: 'Test District', state: 'Test State', pincode: '111111' });
    const bunkB = await testAPI('Admin: Create Bunk B', functionUrls.createBunk, tokens.admin, { name: 'Test Bunk B', location: 'Test Location', district: 'Test District', state: 'Test State', pincode: '222222' });
    if (bunkA) {
        await testAPI('Admin: Assign Manager to Bunk A', functionUrls.assignManagerToBunk, tokens.admin, { bunkId: bunkA.bunkId, managerUid: user_data["manager@test.com"] });
        await testAPI('Admin: Assign manager to non-existent bunk', functionUrls.assignManagerToBunk, tokens.admin, { bunkId: 'non-existent-bunk', managerUid: user_data["manager@test.com"] }, 404);
        await testAPI('Admin: Assign non-manager to bunk', functionUrls.assignManagerToBunk, tokens.admin, { bunkId: bunkA.bunkId, managerUid: user_data["customer@test.com"] }, 400);
    }
    await testAPI('Admin: Update Global Config', functionUrls.updateGlobalConfig, tokens.admin, { updateData: { creditPercentage: 10, redemptionRate: 1 } });
    await testAPI('Admin: Update Global Config with invalid data', functionUrls.updateGlobalConfig, tokens.admin, { updateData: { creditPercentage: 'ten' } }, 400);
    await testAPI('Admin: Call manager function (creditPoints)', functionUrls.creditPoints, tokens.admin, { customerId: user_data["customer@test.com"], amountSpent: 100 }, 403);
    await testAPI('Admin: Invalid Bunk Data', functionUrls.createBunk, tokens.admin, { name: 'Incomplete Bunk' }, 400);
    await testAPI('Admin: Invalid Role', functionUrls.setUserRole, tokens.admin, { targetUid: user_data["customer@test.com"], newRole: 'superadmin' }, 400);


    console.log('\n--- Starting Manager Scenarios ---\n');
    // Manager tests
    await testAPI('Manager: Credit Points at assigned bunk (Bunk A)', functionUrls.creditPoints, tokens.manager, { bunkId: bunkA.bunkId, customerId: user_data["customer@test.com"], amountSpent: 100 });
    await testAPI('Manager: Attempt to credit points at unassigned bunk (Bunk B)', functionUrls.creditPoints, tokens.manager, { bunkId: bunkB.bunkId, customerId: user_data["customer@test.com"], amountSpent: 100 }, 403);
    await testAPI('Manager: Credit points to non-existent customer', functionUrls.creditPoints, tokens.manager, { bunkId: bunkA.bunkId, customerId: 'non-existent-uid', amountSpent: 100 }, 404);
    await testAPI('Manager: Credit points with negative amount', functionUrls.creditPoints, tokens.manager, { bunkId: bunkA.bunkId, customerId: user_data["customer@test.com"], amountSpent: -50 }, 400);
    await testAPI('Manager: Redeem Points at assigned bunk (Bunk A)', functionUrls.redeemPoints, tokens.manager, { bunkId: bunkA.bunkId, customerId: user_data["customer@test.com"], pointsToRedeem: 10 });
    await testAPI('Manager: Redeem more points than available', functionUrls.redeemPoints, tokens.manager, { bunkId: bunkA.bunkId, customerId: user_data["customer@test.com"], pointsToRedeem: 10000 }, 400);
    await testAPI('Manager: Redeem negative points', functionUrls.redeemPoints, tokens.manager, { bunkId: bunkA.bunkId, customerId: user_data["customer@test.com"], pointsToRedeem: -20 }, 400);
    await testAPI('Manager: Credit Points to self', functionUrls.creditPoints, tokens.manager, { bunkId: bunkA.bunkId, customerId: user_data["manager@test.com"], amountSpent: 100 }, 403);
    await testAPI('Manager: Try to create bunk', functionUrls.createBunk, tokens.manager, { name: 'Manager Bunk', location: 'Test Location', district: 'Test District', state: 'Test State', pincode: '222222' }, 403);
    await testAPI('Manager: Try to set user role', functionUrls.setUserRole, tokens.manager, { targetUid: user_data["customer@test.com"], newRole: 'manager' }, 403);
    await testAPI('Manager: Try to update global config', functionUrls.updateGlobalConfig, tokens.manager, { updateData: { creditPercentage: 20 } }, 403);


    console.log('\n--- Starting Customer Scenarios ---\n');
    // Customer tests
    await testAPI('Customer: Try to credit points', functionUrls.creditPoints, tokens.customer, { bunkId: bunkA.bunkId, customerId: user_data["customer@test.com"], amountSpent: 100 }, 403);
    await testAPI('Customer: Try to redeem points for self', functionUrls.redeemPoints, tokens.customer, { bunkId: bunkA.bunkId, customerId: user_data["customer@test.com"], pointsToRedeem: 10 }, 403);
    await testAPI('Customer: Try to create bunk', functionUrls.createBunk, tokens.customer, { name: 'Customer Bunk', location: 'Test Location', district: 'Test District', state: 'Test State', pincode: '333333' }, 403);
    await testAPI('Customer: Try to set user role', functionUrls.setUserRole, tokens.customer, { targetUid: user_data["manager@test.com"], newRole: 'admin' }, 403);
    if (bunkA) {
        await testAPI('Customer: Try to assign manager', functionUrls.assignManagerToBunk, tokens.customer, { bunkId: bunkA.bunkId, managerUid: user_data["manager@test.com"] }, 403);
    }
    await testAPI('Customer: Try to update global config', functionUrls.updateGlobalConfig, tokens.customer, { updateData: { creditPercentage: 50 } }, 403);

    console.log('\n--- Starting Unauthenticated Scenarios ---\n');
    // Unauthenticated tests
    await testAPI('Unauthenticated: Try to create bunk', functionUrls.createBunk, null, { name: 'No Auth Bunk', location: 'Test Location', district: 'Test District', state: 'Test State', pincode: '444444' }, 403);
    await testAPI('Unauthenticated: Try to credit points', functionUrls.creditPoints, null, { bunkId: bunkA.bunkId, customerId: user_data["customer@test.com"], amountSpent: 100 }, 403);

    console.log('\n--- E2E Tests Complete ---\n');
}

runTests();
