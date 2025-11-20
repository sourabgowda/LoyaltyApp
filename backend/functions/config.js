
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const auth = require('./utils/auth');

const db = admin.firestore();

exports.updateGlobalConfig = functions.https.onCall(async (data, context) => {
  const adminId = context.auth && context.auth.uid ? context.auth.uid : null;
  if (!adminId || !(await auth.isAdmin(adminId))) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can update global configuration.');
  }
  const { updateData } = data;
  if (!updateData || typeof updateData !== 'object') {
    throw new functions.https.HttpsError('invalid-argument', 'updateData object is required.');
  }
  const configRef = db.collection('configs').doc('global');
  await configRef.set(updateData, { merge: true }); // Use set with merge to create if not exists

  // Log the transaction
  const transactionRef = db.collection('transactions').doc();
  await transactionRef.set({
      type: 'update_global_config',
      initiatorId: adminId,
      initiatorRole: 'admin',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: {
          updateData: updateData
      }
  });

  return { status: 'success', message: 'Global configuration updated.' };
});
