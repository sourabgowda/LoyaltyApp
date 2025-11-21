
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

async function runNewTests() {
    console.log('\n--- Starting A Day in the Life comprehensive test ---\n');

    const newCustomerEmail = `testcust_${Date.now()}@test.com`;
    const newCustomerPassword = 'password123';
    let newCustomerUid;

    // 1. Register a new customer
    await testAPI('Customer: Register new customer', functionUrls.registerCustomer, null, { 
        firstName: 'Life', 
        lastName: 'Test', 
        email: newCustomerEmail, 
        password: newCustomerPassword 
    }).then(r => newCustomerUid = r ? r.uid : null);
    
    // Quick pause for the create user trigger to fire
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Can't get a token for the new user, so we have to use the admin to make them a manager
    // and then use the manager to credit points. Then we can make the user a customer again.

    // 2. Admin creates a new Bunk
    const newBunk = await testAPI('Admin: Create Bunk for New User', functionUrls.createBunk, tokens.admin, { name: 'New Bunk', location: 'New Location', district: 'New District', state: 'New State', pincode: '555555' });
    if (!newBunk) {
        console.error('STOPPING TEST: Could not create a new bunk, cannot continue Day in the Life test.');
        return;
    }
    
    // 3. Admin makes the customer a manager so they can get a token
    await testAPI('Admin: Set New Customer to Manager', functionUrls.setUserRole, tokens.admin, { targetUid: newCustomerUid, newRole: 'manager' });
    await testAPI('Admin: Assign New Manager to Bunk', functionUrls.assignManagerToBunk, tokens.admin, { bunkId: newBunk.bunkId, managerUid: newCustomerUid });

    // We need to get a new token for the new manager
    console.log('Pausing for 10 seconds to allow for role changes to propagate and to get a new token for the new user.');
    await new Promise(resolve => setTimeout(resolve, 10000));
    console.log('To continue this test, please run the following command in a new terminal, then return here:');
    console.log(`npm run get-single-token -- --email ${newCustomerEmail} --password ${newCustomerPassword}`);
    
    let newManagerToken;
    try {
        const tokenData = fs.readFileSync('./new_user_token.json', 'utf-8');
        newManagerToken = JSON.parse(tokenData).token;
    } catch (error) {
        console.error('Could not read new user token. Please create the file new_user_token.json with the new token.');
        return;
    }

    // 4. New Manager credits points to the original customer
    await testAPI('Manager: Credit points to original customer', functionUrls.creditPoints, newManagerToken, { bunkId: newBunk.bunkId, customerId: user_data["customer@test.com"], amountSpent: 200 });
    
    // 5. Admin revokes manager role from the new user
    await testAPI('Admin: Set New Manager back to Customer', functionUrls.setUserRole, tokens.admin, { targetUid: newCustomerUid, newRole: 'customer' });
    
    // 6. New user (now a customer) tries to credit points (should fail)
    await testAPI('Customer: Attempt to credit points (should fail)', functionUrls.creditPoints, newManagerToken, { bunkId: newBunk.bunkId, customerId: user_data["customer@test.com"], amountSpent: 100 }, 403);
    
    // 7. Manager redeems points for the original customer
    await testAPI('Manager: Redeem points for original customer', functionUrls.redeemPoints, tokens.manager, { bunkId: newBunk.bunkId, customerId: user_data["customer@test.com"], pointsToRedeem: 5 });

    // 8. Admin unassigns the original manager
    await testAPI('Admin: Unassign manager from bunk', functionUrls.unassignManagerFromBunk, tokens.admin, { bunkId: newBunk.bunkId, managerUid: user_data["manager@test.com"] });
    
    // 9. Original manager tries to credit points (should fail)
    await testAPI('Manager: Attempt to credit points from unassigned bunk (should fail)', functionUrls.creditPoints, tokens.manager, { bunkId: newBunk.bunkId, customerId: user_data["customer@test.com"], amountSpent: 100 }, 403);

    // 10. Admin deletes the new user and the new bunk
    await testAPI('Admin: Delete new customer', functionUrls.deleteUser, tokens.admin, { uid: newCustomerUid });
    // There is no delete bunk function, so we can't delete the bunk.
    
    console.log('\n--- A Day in the Life comprehensive test complete ---\n');
}


runNewTests();
