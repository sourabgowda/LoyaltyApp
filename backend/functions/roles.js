const admin = require('firebase-admin');

/**
 * Checks if a user has the 'admin' role.
 *
 * @param {string} uid The user's ID.
 * @returns {Promise<boolean>} A promise that resolves to true if the user is an admin, false otherwise.
 */
async function isAdmin(uid) {
    try {
        const user = await admin.auth().getUser(uid);
        return user.customClaims !== undefined && user.customClaims.admin === true;
    } catch (error) {
        console.error('Error fetching user data:', error);
        return false;
    }
}

/**
 * Checks if a user has the 'manager' role for a specific bunk.
 *
 * This function first checks the user's custom claims for the 'manager' role.
 * If the user has the claim, it then verifies that the user is assigned to the correct bunk.
 *
 * @param {string} uid The user's ID.
 * @param {string} bunkId The ID of the bunk to check against.
 * @returns {Promise<boolean>} A promise that resolves to true if the user is a manager of the specified bunk, false otherwise.
 */
async function isManager(uid, bunkId) {
    try {
        const user = await admin.auth().getUser(uid);
        if (user.customClaims === undefined || !user.customClaims.manager) {
            return false; // Not a manager
        }

        const userDoc = await admin.firestore().collection('users').doc(uid).get();
        if (!userDoc.exists) {
            return false; // User document doesn't exist
        }

        return userDoc.data().assignedBunkId === bunkId;
    } catch (error) {
        console.error('Error fetching user data or document:', error);
        return false;
    }
}

module.exports = { isAdmin, isManager };