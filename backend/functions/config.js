
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const auth = require('./utils/auth');

const db = admin.firestore();

exports.updateGlobalConfig = functions.https.onCall(async (data, context) => {
  if (!context.auth || !(await auth.isAdmin(context.auth.token))) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can update global configuration.');
  }
  const adminId = context.auth.uid;
  const { updateData } = data;
  if (!updateData || typeof updateData !== 'object') {
    throw new functions.https.HttpsError('invalid-argument', 'updateData object is required.');
  }

  // Validate creditPercentage
  if (updateData.creditPercentage !== undefined) {
      if (typeof updateData.creditPercentage !== 'number' || updateData.creditPercentage < 0) {
          throw new functions.https.HttpsError('invalid-argument', 'creditPercentage must be a non-negative number.');
      }
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
