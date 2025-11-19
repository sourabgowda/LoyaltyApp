const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
    // Check if the user has a verified email
    if (user.email && user.emailVerified) {
        try {
            const userRef = admin.firestore().collection('users').doc(user.uid);
            const userDoc = await userRef.get();

            if (userDoc.exists) {
                await userRef.update({ isVerified: true });
                console.log(`User ${user.uid} marked as verified.`);
            }
        } catch (error) {
            console.error("Error updating user verification status:", error);
        }
    }
});