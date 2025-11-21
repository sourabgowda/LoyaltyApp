
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const auth = require('./utils/auth');

const db = admin.firestore();

exports.getAssignedBunk = functions.https.onCall(async (data, context) => {
    if (!context.auth || !(await auth.isManager(context.auth.token))) {
        throw new functions.https.HttpsError('permission-denied', 'Only managers can view their assigned bunk.');
    }

    const managerUid = context.auth.uid;
    const userDoc = await auth.getUserDoc(managerUid);

    if (!userDoc || !userDoc.data.assignedBunkId || userDoc.data.assignedBunkId === 'NA') {
        throw new functions.https.HttpsError('not-found', 'You are not assigned to any bunk.');
    }

    const bunkRef = db.collection('bunks').doc(userDoc.data.assignedBunkId);
    const bunkDoc = await bunkRef.get();

    if (!bunkDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'The assigned bunk does not exist.');
    }

    return { status: 'success', bunk: { id: bunkDoc.id, ...bunkDoc.data() } };
});

exports.getManagerTransactions = functions.https.onCall(async (data, context) => {
    if (!context.auth || !(await auth.isManager(context.auth.token))) {
        throw new functions.https.HttpsError('permission-denied', 'Only managers can view their transactions.');
    }

    const managerUid = context.auth.uid;

    const transactionsSnapshot = await db.collection('transactions')
        .where('initiatorId', '==', managerUid)
        .orderBy('timestamp', 'desc')
        .get();

    const transactions = transactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return { status: 'success', transactions };
});
