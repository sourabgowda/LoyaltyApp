
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

admin.initializeApp();

const app = express();
app.use(cors({ origin: true }));

// Import functions from their respective files
const { registerCustomer } = require('./customer');
const { createBunk, assignManagerToBunk } = require('./bunk');
const { creditPoints, redeemPoints } = require('./points');
const { setUserRole, onUserCreate } = require('./user');
const { updateGlobalConfig } = require('./config');

// Define API routes
app.post('/registerCustomer', registerCustomer);
app.post('/createBunk', createBunk);
app.post('/assignManagerToBunk', assignManagerToBunk);
app.post('/creditPoints', creditPoints);
app.post('/redeemPoints', redeemPoints);
app.post('/setUserRole', setUserRole);
app.post('/updateGlobalConfig', updateGlobalConfig);

// Expose the Express API as a single Cloud Function
exports.api = functions.https.onRequest(app);

// Export other functions, like database triggers
exports.onUserCreate = onUserCreate;
