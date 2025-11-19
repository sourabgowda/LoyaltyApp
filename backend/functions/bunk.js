
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const auth = require('./utils/auth');
const { isValidPincode } = require('./validation');

const db = admin.firestore();

exports.createBunk = functions.https.onCall(async (data, context) => {
    const adminId = context.auth && context.auth.uid ? context.auth.uid : null;
    if (!adminId || !(await auth.isAdmin(adminId))) {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can create bunks.');
    }
    const { name, location, district, state, pincode } = data;
    if (!name || !location || !district || !state || !pincode) {
        throw new functions.https.HttpsError('invalid-argument', 'Bunk details are required.');
    }
    if (!isValidPincode(pincode)) {
        throw new functions.https.HttpsError('invalid-argument', 'Pincode must be a 6-digit number and cannot start with 0.');
    }
    const bunkData = { name, location, district, state, pincode };
    const docRef = await db.collection('bunks').add(bunkData);
    return { status: 'success', message: 'Bunk created successfully.', bunkId: docRef.id };
});

exports.assignManagerToBunk = functions.https.onCall(async (data, context) => {
  const adminId = context.auth && context.auth.uid ? context.auth.uid : null;
  if (!adminId || !(await auth.isAdmin(adminId))) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can assign managers to bunks.');
  }
  const { managerUid, bunkId } = data;
  if (!managerUid || !bunkId) {
    throw new functions.https.HttpsError('invalid-argument', 'A managerUid and bunkId are required.');
  }
  const managerRef = db.collection('users').doc(managerUid);
  await managerRef.update({ assignedBunkId: bunkId });
  return { status: 'success', message: 'Manager assigned to bunk successfully.' };
});
