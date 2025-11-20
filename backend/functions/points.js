
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const auth = require('./utils/auth');
const db = admin.firestore();

exports.creditPoints = functions.https.onCall(async (data, context) => {
  const managerId = context.auth && context.auth.uid ? context.auth.uid : null;
  if (!managerId || !(await auth.isManager(managerId))) {
    throw new functions.https.HttpsError('permission-denied', 'Only managers can credit points.');
  }
  const { customerId, amountSpent } = data;
  if (managerId === customerId) {
    throw new functions.https.HttpsError('permission-denied', 'Managers cannot credit points to their own accounts.');
  }
  if (!customerId || !amountSpent || typeof amountSpent !== 'number' || amountSpent <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid customerId or amountSpent.');
  }
  return db.runTransaction(async (tx) => {
    const managerSnap = await tx.get(db.collection('users').doc(managerId));
    const customerSnap = await tx.get(db.collection('users').doc(customerId));
    const configSnap = await tx.get(db.collection('configs').doc('global'));
    if (!managerSnap.exists || !customerSnap.exists || !configSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Manager, customer, or global config not found.');
    }
    const manager = managerSnap.data();
    const customer = customerSnap.data();
    const config = configSnap.data();
    if (!manager.assignedBunkId || manager.assignedBunkId === 'NA') {
      throw new functions.https.HttpsError('failed-precondition', 'Manager has no assigned bunk.');
    }
    if (!customer.isVerified) {
      throw new functions.https.HttpsError('failed-precondition', 'Customer not verified.');
    }
    const bunkSnap = await tx.get(db.collection('bunks').doc(manager.assignedBunkId));
    if (!bunkSnap.exists) throw new functions.https.HttpsError('not-found', 'Assigned bunk not found.');
    const bunk = bunkSnap.data();
    const creditPercentage = Number(config.creditPercentage);
    if (isNaN(creditPercentage) || creditPercentage < 0 || creditPercentage > 100) {
      throw new functions.https.HttpsError('failed-precondition', 'Invalid creditPercentage configured.');
    }
    const rawPoints = amountSpent * (creditPercentage / 100);
    const pointsToAdd = Math.floor(rawPoints);
    if (pointsToAdd <= 0) {
      throw new functions.https.HttpsError('failed-precondition', 'Configured credit yields 0 points for this amount.');
    }
    const newPoints = (customer.points || 0) + pointsToAdd;
    tx.update(customerSnap.ref, { points: newPoints });
    const txnRef = db.collection('transactions').doc();
    tx.set(txnRef, {
        type: 'credit',
        initiatorId: managerId,
        initiatorRole: 'manager',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        details: {
            customerId: customerId,
            amountSpent: amountSpent,
            pointsChange: pointsToAdd,
            bunk: { name: bunk.name, location: bunk.location, district: bunk.district, state: bunk.state, pincode: bunk.pincode }
        }
    });
    return { status: 'success', message: 'Points credited successfully.', newPoints, pointsAdded: pointsToAdd };
  });
});

exports.redeemPoints = functions.https.onCall(async (data, context) => {
  const managerId = context.auth && context.auth.uid ? context.auth.uid : null;
  if (!managerId || !(await auth.isManager(managerId))) {
    throw new functions.https.HttpsError('permission-denied', 'Only managers can redeem points.');
  }
  const { customerId, pointsToRedeem } = data;
  if (managerId === customerId) {
    throw new functions.https.HttpsError('permission-denied', 'Managers cannot redeem their own points.');
  }
  if (!customerId || !pointsToRedeem || typeof pointsToRedeem !== 'number' || pointsToRedeem <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid customerId or pointsToRedeem.');
  }
  return db.runTransaction(async (tx) => {
    const managerSnap = await tx.get(db.collection('users').doc(managerId));
    const customerSnap = await tx.get(db.collection('users').doc(customerId));
    const configSnap = await tx.get(db.collection('configs').doc('global'));
    if (!managerSnap.exists || !customerSnap.exists || !configSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Manager, customer, or global config not found.');
    }
    const manager = managerSnap.data();
    const customer = customerSnap.data();
    const config = configSnap.data();
    if (!customer.isVerified) {
      throw new functions.https.HttpsError('failed-precondition', 'Customer not verified.');
    }
    if ((customer.points || 0) < pointsToRedeem) {
      throw new functions.https.HttpsError('failed-precondition', 'Insufficient points.');
    }
    if (!manager.assignedBunkId || manager.assignedBunkId === 'NA') {
      throw new functions.https.HttpsError('failed-precondition', 'Manager has no assigned bunk.');
    }
    const bunkSnap = await tx.get(db.collection('bunks').doc(manager.assignedBunkId));
    if (!bunkSnap.exists) throw new functions.https.HttpsError('not-found', 'Assigned bunk not found.');
    const bunk = bunkSnap.data();
    const redemptionRate = Number(config.redemptionRate);
    if (isNaN(redemptionRate) || redemptionRate <= 0) {
      throw new functions.https.HttpsError('failed-precondition', 'Invalid redemptionRate configured.');
    }
    const redeemedValue = pointsToRedeem * redemptionRate;
    const newPoints = customer.points - pointsToRedeem;
    tx.update(customerSnap.ref, { points: newPoints });
    const txnRef = db.collection('transactions').doc();
    tx.set(txnRef, {
        type: 'redeem',
        initiatorId: managerId,
        initiatorRole: 'manager',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        details: {
            customerId: customerId,
            pointsChange: -pointsToRedeem,
            redeemedValue: redeemedValue,
            bunk: { name: bunk.name, location: bunk.location, district: bunk.district, state: bunk.state, pincode: bunk.pincode }
        }
    });
    return { status: 'success', message: 'Points redeemed successfully.', newPoints, redeemedValue };
  });
});
