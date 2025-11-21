
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const auth = require('./utils/auth');
const { isValidFirstName, isValidLastName } = require('./validation');

const db = admin.firestore();

exports.setUserRole = functions.https.onCall(async (data, context) => {
  if (!context.auth || !(await auth.isAdmin(context.auth.token))) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can set user roles.');
  }

  const adminId = context.auth.uid;
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

  // Log the transaction
  const transactionRef = db.collection('transactions').doc();
  await transactionRef.set({
      type: 'set_user_role',
      initiatorId: adminId,
      initiatorRole: 'admin',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: {
          targetUid: targetUid,
          newRole: newRole
      }
  });

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

exports.deleteUser = functions.https.onCall(async (data, context) => {
    if (!context.auth || !(await auth.isAdmin(context.auth.token))) {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can delete users.');
    }

    const { email } = data;
    if (!email) {
        throw new functions.https.HttpsError('invalid-argument', 'Email is required.');
    }

    try {
        const user = await admin.auth().getUserByEmail(email);
        await admin.auth().deleteUser(user.uid);
        return { status: 'success', message: `User ${email} deleted successfully.` };
    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            throw new functions.https.HttpsError('not-found', `User with email ${email} not found.`);
        }
        throw new functions.https.HttpsError('internal', 'Error deleting user.');
    }
});

exports.updateUserProfile = functions.https.onCall(async (data, context) => {
    if (!context.auth || !(await auth.isAdmin(context.auth.token))) {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can update user profiles.');
    }

    const adminId = context.auth.uid;
    const { targetUid, firstName, lastName } = data;

    if (!targetUid) {
        throw new functions.https.HttpsError('invalid-argument', 'A targetUid is required.');
    }

    const user = await auth.getUserDoc(targetUid);
    if (!user) {
        throw new functions.https.HttpsError('not-found', 'The target user does not exist.');
    }

    const updateData = {};
    if (firstName) {
        if (!isValidFirstName(firstName)) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid first name.');
        }
        updateData.firstName = firstName;
    }

    if (lastName) {
        if (!isValidLastName(lastName)) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid last name.');
        }
        updateData.lastName = lastName;
    }

    if (Object.keys(updateData).length === 0) {
        throw new functions.https.HttpsError('invalid-argument', 'At least one field to update must be provided.');
    }

    const userRef = db.collection('users').doc(targetUid);
    await userRef.update(updateData);

    // Log the transaction
    const transactionRef = db.collection('transactions').doc();
    await transactionRef.set({
        type: 'update_user_profile',
        initiatorId: adminId,
        initiatorRole: 'admin',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        details: {
            targetUid: targetUid,
            updatedFields: updateData
        }
    });

    return { status: 'success', message: 'User profile updated successfully.' };
});
