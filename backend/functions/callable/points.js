const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { isManager } = require('../roles');

exports.creditPoints = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const isManagerUser = await isManager(context.auth.uid);
    if (!isManagerUser) {
        throw new functions.https.HttpsError('permission-denied', 'Must be a manager to credit points.');
    }

    const { customerId, amountSpent } = data;

    try {
        const result = await admin.firestore().runTransaction(async (transaction) => {
            const customerRef = admin.firestore().collection('users').doc(customerId);
            const customerDoc = await transaction.get(customerRef);

            if (!customerDoc.exists || !customerDoc.data().isVerified) {
                throw new functions.https.HttpsError('not-found', 'Customer not found or not verified.');
            }

            const globalConfigRef = admin.firestore().collection('configs').doc('global');
            const globalConfigDoc = await transaction.get(globalConfigRef);
            const creditPercentage = globalConfigDoc.data().creditPercentage;

            const pointsToCredit = Math.floor(amountSpent * (creditPercentage / 100));
            const newPoints = (customerDoc.data().points || 0) + pointsToCredit;

            transaction.update(customerRef, { points: newPoints });

            return { newPoints: newPoints };
        });

        return result;
    } catch (error) {
        console.error('Error crediting points:', error);
        throw new functions.https.HttpsError('internal', 'An error occurred while crediting points.');
    }
});

exports.redeemPoints = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const isManagerUser = await isManager(context.auth.uid);
    if (!isManagerUser) {
        throw new functions.https.HttpsError('permission-denied', 'Must be a manager to redeem points.');
    }

    const { customerId, pointsToRedeem } = data;

    try {
        const result = await admin.firestore().runTransaction(async (transaction) => {
            const customerRef = admin.firestore().collection('users').doc(customerId);
            const customerDoc = await transaction.get(customerRef);

            if (!customerDoc.exists || !customerDoc.data().isVerified) {
                throw new functions.https.HttpsError('not-found', 'Customer not found or not verified.');
            }

            const currentPoints = customerDoc.data().points || 0;
            if (currentPoints < pointsToRedeem) {
                throw new functions.https.HttpsError('failed-precondition', 'Insufficient points.');
            }

            const globalConfigRef = admin.firestore().collection('configs').doc('global');
            const globalConfigDoc = await transaction.get(globalConfigRef);
            const pointValue = globalConfigDoc.data().pointValue;

            const redeemedValue = pointsToRedeem * pointValue;
            const newPoints = currentPoints - pointsToRedeem;

            transaction.update(customerRef, { points: newPoints });

            return { newPoints: newPoints, redeemedValue: redeemedValue };
        });

        return result;
    } catch (error) {
        console.error('Error redeeming points:', error);
        throw new functions.https.HttpsError('internal', 'An error occurred while redeeming points.');
    }
});