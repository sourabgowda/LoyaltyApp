
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { isValidFirstName, isValidLastName, isValidEmail, isValidPassword } = require('./validation');

const db = admin.firestore();

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

        await db.collection('users').doc(userRecord.uid).set({
            firstName: firstName,
            lastName: lastName,
            email: email,
            role: 'customer', // Default role
            isVerified: true, // Set to true for e2e testing
            points: 0,
            assignedBunkId: 'NA' // Not applicable for customers
        });

        // Log the transaction
        const transactionRef = db.collection('transactions').doc();
        await transactionRef.set({
            type: 'customer_registration',
            initiatorId: userRecord.uid,
            initiatorRole: 'customer',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            details: {
                email: email,
                firstName: firstName,
                lastName: lastName
            }
        });

        return { status: 'success', message: 'Customer registered successfully.', uid: userRecord.uid };

    } catch (error) {
        if (error.code === 'auth/email-already-exists') {
            throw new functions.https.HttpsError('already-exists', 'The email address is already in use by another account.');
        }
        throw new functions.https.HttpsError('internal', 'An unexpected error occurred.');
    }
});

exports.getCustomerProfile = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to view your profile.');
    }

    const customerUid = context.auth.uid;
    const userRef = db.collection('users').doc(customerUid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Your user profile was not found.');
    }

    return { status: 'success', profile: userDoc.data() };
});

exports.getCustomerTransactions = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to view your transactions.');
    }

    const customerUid = context.auth.uid;

    const transactionsSnapshot = await db.collection('transactions')
        .where('details.targetUid', '==', customerUid)
        .orderBy('timestamp', 'desc')
        .get();

    const transactions = transactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return { status: 'success', transactions };
});
