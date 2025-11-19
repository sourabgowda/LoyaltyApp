
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const auth = require('./utils/auth');

const db = admin.firestore();

exports.setUserRole = functions.https.onCall(async (data, context) => {
  const adminId = context.auth && context.auth.uid ? context.auth.uid : null;
  if (!adminId || !(await auth.isAdmin(adminId))) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can set user roles.');
  }

  const { targetUid, newRole } = data;
  const allowedRoles = ['admin', 'manager', 'customer'];

  if (!targetUid || !newRole || !allowedRoles.includes(newRole)) {
    throw new functions.https.HttpsError('invalid-argument', 'A valid targetUid and newRole are required.');
  }

  const user = await auth.getUserDoc(targetUid);
  if (!user) {
    throw new functions.https.HttpsError('not-found', 'The target user does not exist.');
  }

  // Set custom claims
  const claims = {};
  if (newRole === 'admin') claims.admin = true;
  if (newRole === 'manager') claims.manager = true;
  await admin.auth().setCustomUserClaims(targetUid, claims);

  // Update Firestore document
  const userRef = db.collection('users').doc(targetUid);
  await userRef.update({ role: newRole });

  return { status: 'success', message: `User role updated to ${newRole}.` };
});

exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
    if (user.email && user.emailVerified) {
        const userRef = db.collection('users').doc(user.uid);
        const userDoc = await userRef.get();
        if (userDoc.exists) {
            await userRef.update({ isVerified: true });
        }
    }
});
