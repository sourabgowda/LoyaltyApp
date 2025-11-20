
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const axios = require('axios');
const { functionUrls } = require('./config');

const users = {
    admin: {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@test.com',
        password: 'password123'
    },
    manager: {
        firstName: 'Manager',
        lastName: 'User',
        email: 'manager@test.com',
        password: 'password123'
    },
    customer: {
        firstName: 'Customer',
        lastName: 'User',
        email: 'customer@test.com',
        password: 'password123'
    }
};

// Initialize Firebase Admin SDK
admin.initializeApp();

async function deleteUsers() {
    console.log('--- Deleting existing test users ---');
    for (const role in users) {
        try {
            const userRecord = await admin.auth().getUserByEmail(users[role].email);
            await admin.auth().deleteUser(userRecord.uid);
            console.log(`Successfully deleted ${role}: ${users[role].email}`);
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                console.log(`User ${users[role].email} not found, nothing to delete.`);
            } else {
                console.error(`Error deleting ${role}:`, error.message);
            }
        }
    }
}

async function registerUsers() {
    console.log('--- Registering new test users ---');
    for (const role in users) {
        try {
            // The registerCustomer function can be used for all roles initially
            const response = await axios.post(functionUrls.registerCustomer, { data: users[role] });
            console.log(`Successfully registered ${role}:`, response.data.result);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.error) 
                ? error.response.data.error 
                : (error.response ? error.response.data : error.message);
            console.error(`Error registering ${role}:`, message);
        }
    }
}

async function setup() {
    // Write the users to a JSON file so other scripts can use it
    fs.writeFileSync(path.join(__dirname, 'users.json'), JSON.stringify(users, null, 2));
    console.log('Successfully created users.json');
    
    await deleteUsers();
    await registerUsers();
}

setup();
