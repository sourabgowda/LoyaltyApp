
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const auth = require('./utils/auth');
const { isValidPincode } = require('./validation');

const db = admin.firestore();

exports.createBunk = functions.https.onCall(async (data, context) => {
    if (!context.auth || !(await auth.isAdmin(context.auth.token))) {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can create bunks.');
    }
    const adminId = context.auth.uid;
    const { name, location, district, state, pincode } = data;
    if (!name || !location || !district || !state || !pincode) {
        throw new functions.https.HttpsError('invalid-argument', 'Bunk details are required.');
    }
    if (!isValidPincode(pincode)) {
        throw new functions.https.HttpsError('invalid-argument', 'Pincode must be a 6-digit number and cannot start with 0.');
    }
    const bunkData = { name, location, district, state, pincode, managerIds: [] };
    const docRef = await db.collection('bunks').add(bunkData);

    // Log the transaction
    const transactionRef = db.collection('transactions').doc();
    await transactionRef.set({
        type: 'create_bunk',
        initiatorId: adminId,
        initiatorRole: 'admin',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        details: {
            bunkId: docRef.id,
            bunkData: bunkData
        }
    });

    return { status: 'success', message: 'Bunk created successfully.', bunkId: docRef.id };
});

exports.assignManagerToBunk = functions.https.onCall(async (data, context) => {
  if (!context.auth || !(await auth.isAdmin(context.auth.token))) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can assign managers to bunks.');
  }
  const adminId = context.auth.uid;
  const { managerUid, bunkId } = data;
  if (!managerUid || !bunkId) {
    throw new functions.https.HttpsError('invalid-argument', 'A managerUid and bunkId are required.');
  }

  // Check if bunk exists
  const bunkRef = db.collection('bunks').doc(bunkId);
  const bunkDoc = await bunkRef.get();
  if (!bunkDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Bunk not found.');
  }

  // Check if user exists and is a manager
  try {
      const userRecord = await admin.auth().getUser(managerUid);
      if (!userRecord.customClaims || !userRecord.customClaims.manager) {
          throw new functions.https.HttpsError('invalid-argument', 'User is not a manager.');
      }
  } catch (error) {
      if (error.code === 'auth/user-not-found') {
          throw new functions.https.HttpsError('not-found', 'Manager user not found.');
      }
      // Re-throw other errors for debugging
      throw error;
  }
  
  const managerRef = db.collection('users').doc(managerUid);
  await managerRef.update({ assignedBunkId: bunkId });

  await bunkRef.update({
    managerIds: admin.firestore.FieldValue.arrayUnion(managerUid)
  });

  // Log the transaction
  const transactionRef = db.collection('transactions').doc();
  await transactionRef.set({
      type: 'assign_manager',
      initiatorId: adminId,
      initiatorRole: 'admin',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: {
          managerUid: managerUid,
          bunkId: bunkId
      }
  });

  return { status: 'success', message: 'Manager assigned to bunk successfully.' };
});

exports.unassignManagerFromBunk = functions.https.onCall(async (data, context) => {
    if (!context.auth || !(await auth.isAdmin(context.auth.token))) {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can unassign managers from bunks.');
    }
    const adminId = context.auth.uid;
    const { managerUid, bunkId } = data;
    if (!managerUid || !bunkId) {
        throw new functions.https.HttpsError('invalid-argument', 'A managerUid and bunkId are required.');
    }

    // Check if bunk exists
    const bunkRef = db.collection('bunks').doc(bunkId);
    const bunkDoc = await bunkRef.get();
    if (!bunkDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Bunk not found.');
    }

    // Check if user exists
    try {
        await admin.auth().getUser(managerUid);
    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            throw new functions.https.HttpsError('not-found', 'Manager user not found.');
        }
        // Re-throw other errors for debugging
        throw error;
    }
    
    const managerRef = db.collection('users').doc(managerUid);
    await managerRef.update({ assignedBunkId: 'NA' });

    await bunkRef.update({
        managerIds: admin.firestore.FieldValue.arrayRemove(managerUid)
    });

    // Log the transaction
    const transactionRef = db.collection('transactions').doc();
    await transactionRef.set({
        type: 'unassign_manager',
        initiatorId: adminId,
        initiatorRole: 'admin',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        details: {
            managerUid: managerUid,
            bunkId: bunkId
        }
    });

    return { status: 'success', message: 'Manager unassigned from bunk successfully.' };
});
