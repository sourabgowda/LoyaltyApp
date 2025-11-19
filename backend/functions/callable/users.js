const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { isValidFirstName, isValidLastName, isValidEmail, isValidPassword, isValidPhoneNumber, isValidRole } = require('../lib/validation');
const { isAdmin } = require('../roles');

admin.initializeApp();

exports.registerCustomer = functions.https.onCall(async (data, context) => {
    // Validate user input
    if (!isValidFirstName(data.firstName) || !isValidLastName(data.lastName) || !isValidEmail(data.email) || !isValidPassword(data.password) || !isValidPhoneNumber(data.phoneNumber)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid user data provided.');
    }

    try {
        const userRecord = await admin.auth().createUser({
            email: data.email,
            password: data.password,
            displayName: `${data.firstName} ${data.lastName}`,
            phoneNumber: data.phoneNumber
        });

        // Create a user document in Firestore
        await admin.firestore().collection('users').doc(userRecord.uid).set({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phoneNumber: data.phoneNumber,
            role: 'customer', // Default role
            isVerified: false, // Email verification status
            points: 0,
            assignedBunkId: null
        });

        return { status: 'success', userId: userRecord.uid };
    } catch (error) {
        console.error("Error creating new user:", error);
        throw new functions.https.HttpsError('internal', 'Could not create new user.');
    }
});

exports.setUserRole = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const isAdminUser = await isAdmin(context.auth.uid);
    if (!isAdminUser) {
        throw new functions.https.HttpsError('permission-denied', 'Must be an admin to set user roles.');
    }

    const { targetUid, newRole } = data;
    if (!isValidRole(newRole)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid role specified.');
    }

    try {
        await admin.auth().setCustomUserClaims(targetUid, { [newRole]: true });
        await admin.firestore().collection('users').doc(targetUid).update({ role: newRole });
        return { status: 'success' };
    } catch (error) {
        console.error("Error setting user role:", error);
        throw new functions.https.HttpsError('internal', 'Could not set user role.');
    }
});