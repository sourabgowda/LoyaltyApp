const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { isValidBunkName, isValidPincode, isValidCoordinates } = require('../lib/validation');
const { isAdmin } = require('../roles');

exports.createBunk = functions.https.onCall(async (data, context) => {
    // Check for authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    // Check if the user is an admin
    const isAdminUser = await isAdmin(context.auth.uid);
    if (!isAdminUser) {
        throw new functions.https.HttpsError('permission-denied', 'Must be an admin to create a bunk.');
    }

    // Validate the input data
    if (!isValidBunkName(data.name) || !isValidPincode(data.pincode) || !isValidCoordinates(data.location)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid bunk data provided.');
    }

    // Create a new bunk document in Firestore
    try {
        const bunkRef = await admin.firestore().collection('bunks').add({
            name: data.name,
            pincode: data.pincode,
            location: new admin.firestore.GeoPoint(data.location.latitude, data.location.longitude),
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return { status: 'success', bunkId: bunkRef.id };
    } catch (error) {
        console.error("Error creating bunk:", error);
        throw new functions.https.HttpsError('internal', 'Could not create bunk.');
    }
});