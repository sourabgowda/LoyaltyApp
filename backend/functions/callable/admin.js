const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { isValidCreditPercentage, isValidPointValue } = require('../lib/validation');
const { isAdmin } = require('../roles');

exports.updateGlobalConfig = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const isAdminUser = await isAdmin(context.auth.uid);
    if (!isAdminUser) {
        throw new functions.https.HttpsError('permission-denied', 'Must be an admin to update the configuration.');
    }

    const { updateData } = data;

    if (updateData.creditPercentage && !isValidCreditPercentage(updateData.creditPercentage)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid credit percentage.');
    }

    if (updateData.pointValue && !isValidPointValue(updateData.pointValue)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid point value.');
    }

    try {
        const configRef = admin.firestore().collection('configs').doc('global');
        await configRef.set(updateData, { merge: true });
        return { status: 'success' };
    } catch (error) {
        console.error("Error updating global config:", error);
        throw new functions.https.HttpsError('internal', 'Could not update global configuration.');
    }
});