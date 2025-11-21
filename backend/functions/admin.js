
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const auth = require('./utils/auth');

const db = admin.firestore();

exports.getAllBunks = functions.https.onCall(async (data, context) => {
    if (!context.auth || !(await auth.isAdmin(context.auth.token))) {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can view all bunks.');
    }

    const bunksSnapshot = await db.collection('bunks').get();
    const bunks = bunksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return { status: 'success', bunks };
});

exports.getAllTransactions = functions.https.onCall(async (data, context) => {
    if (!context.auth || !(await auth.isAdmin(context.auth.token))) {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can view all transactions.');
    }

    const transactionsSnapshot = await db.collection('transactions').orderBy('timestamp', 'desc').get();
    const transactions = transactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return { status: 'success', transactions };
});
