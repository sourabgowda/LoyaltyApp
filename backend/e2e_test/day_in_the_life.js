
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

const logStream = fs.createWriteStream('day_in_the_life.log', { flags: 'a' });

const testAPI = async (name, url, token, data, expectedStatus = 200) => {
    console.log(`-- Running test: ${name}`);
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

async function runDayInTheLife() {
    console.log('\n--- Starting Day-in-the-Life Scenario ---\n');

    // 1. Admin creates a new bunk
    const newBunk = await testAPI('Admin: Create a new bunk for the test', functionUrls.createBunk, tokens.admin, { name: 'Day in the Life Bunk', location: 'Test Location', district: 'Test District', state: 'Test State', pincode: '555555' });

    if (newBunk) {
        // 2. Admin assigns the manager to the new bunk
        await testAPI('Admin: Assign Manager to Day in the Life Bunk', functionUrls.assignManagerToBunk, tokens.admin, { bunkId: newBunk.bunkId, managerUid: user_data["manager@test.com"] });

        // 3. Manager credits points to the customer at the new bunk
        await testAPI('Manager: Credit points to customer at new bunk', functionUrls.creditPoints, tokens.manager, { bunkId: newBunk.bunkId, customerId: user_data["customer@test.com"], amountSpent: 200 });

        // 4. Manager redeems points for the customer at the new bunk
        await testAPI('Manager: Redeem points for customer at new bunk', functionUrls.redeemPoints, tokens.manager, { bunkId: newBunk.bunkId, customerId: user_data["customer@test.com"], pointsToRedeem: 5 });

        // 5. Customer tries to credit points (and fails)
        await testAPI('Customer: Attempt to credit points', functionUrls.creditPoints, tokens.customer, { bunkId: newBunk.bunkId, customerId: user_data["customer@test.com"], amountSpent: 100 }, 403);

        // 6. Admin cleans up by deleting the bunk
        await testAPI('Admin: Delete the test bunk', functionUrls.deleteBunk, tokens.admin, { bunkId: newBunk.bunkId });
    }

    console.log('\n--- Day-in-the-Life Scenario Complete ---\n');
    logStream.end();
}

runDayInTheLife();
