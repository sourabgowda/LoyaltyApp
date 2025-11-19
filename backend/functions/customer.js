
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { isValidFirstName, isValidLastName, isValidEmail, isValidPassword } = require('./validation');

exports.registerCustomer = functions.https.onCall(async (data, context) => {
    const { firstName, lastName, email, password } = data;

    if (!firstName || !lastName || !email || !password) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields.');
    }
    if (!isValidFirstName(firstName)) {
        throw new functions.https.HttpsError('invalid-argument', 'First name must be 1-40 characters long and contain no spaces.');
    }
    if (!isValidLastName(lastName)) {
        throw new functions.https.HttpsError('invalid-argument', 'Last name must be 1-80 characters long and can have up to two spaces.');
    }
    if (!isValidEmail(email)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid email format.');
    }
    if (!isValidPassword(password)) {
        throw new functions.https.HttpsError('invalid-argument', 'Password must be at least 6 characters long.');
    }

    try {
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
            displayName: `${firstName} ${lastName}`
        });

        await admin.firestore().collection('users').doc(userRecord.uid).set({
            firstName: firstName,
            lastName: lastName,
            email: email,
            role: 'customer', // Default role
            isVerified: false, // Set to false until email is verified
            points: 0,
            assignedBunkId: 'NA' // Not applicable for customers
        });

        return { status: 'success', message: 'Customer registered successfully.', uid: userRecord.uid };

    } catch (error) {
        if (error.code === 'auth/email-already-exists') {
            throw new functions.https.HttpsError('already-exists', 'The email address is already in use by another account.');
        }
        throw new functions.https.HttpsError('internal', 'An unexpected error occurred.');
    }
});
