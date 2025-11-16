// index.js - Cloud Functions for Loyalty App (CommonJS)
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
admin.initializeApp();
const db = admin.firestore();

const TWOF_API_KEY = functions.config().twofactor?.api_key || 'YOUR_2FACTOR_API_KEY';

function isValidPhoneNumber(phoneNumber) {
  return typeof phoneNumber === 'string' && /^\d{10}$/.test(phoneNumber);
}
function isValidFirstName(firstName) {
  return typeof firstName === 'string' && /^[A-Za-z]{1,40}$/.test(firstName);
}
function isValidLastName(lastName) {
  return typeof lastName === 'string' && /^[A-Za-z]+(?: [A-Za-z]+){0,2}$/.test(lastName) && lastName.length <= 80;
}
async function getUserDoc(userId) {
  if (!userId) return null;
  const doc = await db.collection('users').doc(userId).get();
  return doc.exists ? { ref: doc.ref, data: doc.data() } : null;
}
async function isManager(userId) { const u = await getUserDoc(userId); return !!u && u.data.isManager === true; }
async function isAdmin(userId) { const u = await getUserDoc(userId); return !!u && u.data.isAdmin === true; }

// registerCustomer
exports.registerCustomer = functions.https.onCall(async (data, context) => {
  const firstName = data && data.firstName ? String(data.firstName).trim() : null;
  const lastName = data && data.lastName ? String(data.lastName).trim() : null;
  const phoneNumber = data && data.phoneNumber ? String(data.phoneNumber).trim() : null;

  if (!isValidFirstName(firstName) || !isValidLastName(lastName)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid first or last name format.');
  }
  if (!isValidPhoneNumber(phoneNumber)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid phone number format.');
  }

  const existing = await db.collection('users').where('phoneNumber', '==', phoneNumber).limit(1).get();
  if (!existing.empty) {
    throw new functions.https.HttpsError('already-exists', 'User with this phone number already exists.');
  }

  const newUser = {
    firstName,
    lastName,
    phoneNumber,
    isManager: false,
    isAdmin: false,
    isVerified: true,
    points: 0,
    assignedBunkId: 'NA'
  };

  const docRef = await db.collection('users').add(newUser);
  return { status: 'success', message: 'User profile created. Create Firebase Auth user with email/password for login.', userId: docRef.id };
});

// creditPoints (same as before)
exports.creditPoints = functions.https.onCall(async (data, context) => {
  const managerId = context.auth && context.auth.uid ? context.auth.uid : null;
  if (!managerId || !(await isManager(managerId))) {
    throw new functions.https.HttpsError('permission-denied', 'Only managers can credit points.');
  }

  const customerId = data && data.customerId ? String(data.customerId) : null;
  const amountSpent = Number(data && data.amountSpent);
  if (!customerId || isNaN(amountSpent) || amountSpent <= 0) {
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
    if (!bunkSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Assigned bunk not found.');
    }
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
    const txn = {
      type: 'credit',
      customerId,
      managerId,
      amountSpent,
      pointsChange: pointsToAdd,
      redeemedValue: null,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      bunk: {
        name: bunk.name || null,
        location: bunk.location || null,
        district: bunk.district || null,
        state: bunk.state || null,
        pincode: bunk.pincode || null
      }
    };
    tx.set(txnRef, txn);

    return { status: 'success', message: 'Points credited successfully.', newPoints };
  });
});

// redeemPoints (same as before)
exports.redeemPoints = functions.https.onCall(async (data, context) => {
  const managerId = context.auth && context.auth.uid ? context.auth.uid : null;
  if (!managerId || !(await isManager(managerId))) {
    throw new functions.https.HttpsError('permission-denied', 'Only managers can redeem points.');
  }

  const customerId = data && data.customerId ? String(data.customerId) : null;
  const pointsToRedeem = Number(data && data.pointsToRedeem);
  const amountSpent = Number(data && data.amountSpent);

  if (!customerId || isNaN(pointsToRedeem) || pointsToRedeem <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid customerId or pointsToRedeem.');
  }
  if (isNaN(amountSpent) || amountSpent <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid amountSpent.');
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

    const currentPoints = Number(customer.points || 0);
    if (currentPoints < pointsToRedeem) {
      throw new functions.https.HttpsError('failed-precondition', 'Insufficient loyalty points.');
    }

    const pointValue = Number(config.pointValue);
    if (isNaN(pointValue) || pointValue <= 0) {
      throw new functions.https.HttpsError('failed-precondition', 'Invalid pointValue configured.');
    }

    const redeemedValue = pointsToRedeem * pointValue;
    const newPoints = currentPoints - pointsToRedeem;

    tx.update(customerSnap.ref, { points: newPoints });

    const txnRef = db.collection('transactions').doc();
    const txn = {
      type: 'redeem',
      customerId,
      managerId,
      amountSpent,
      pointsChange: -pointsToRedeem,
      redeemedValue,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      bunk: null
    };

    if (manager.assignedBunkId && manager.assignedBunkId !== 'NA') {
      const bunkSnap = await tx.get(db.collection('bunks').doc(manager.assignedBunkId));
      if (bunkSnap.exists) {
        const bunk = bunkSnap.data();
        txn.bunk = {
          name: bunk.name || null,
          location: bunk.location || null,
          district: bunk.district || null,
          state: bunk.state || null,
          pincode: bunk.pincode || null
        };
      }
    }

    tx.set(txnRef, txn);

    return { status: 'success', message: 'Points redeemed successfully.', newPoints, redeemedValue };
  });
});

// updateUserProfile - enforce role exclusivity (user cannot be both manager and customer)
exports.updateUserProfile = functions.https.onCall(async (data, context) => {
  const adminId = context.auth && context.auth.uid ? context.auth.uid : null;
  if (!adminId || !(await isAdmin(adminId))) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can update user profiles.');
  }

  const userId = data && data.userId ? String(data.userId) : null;
  const updateData = data && data.updateData ? data.updateData : null;

  if (!userId || !updateData || typeof updateData !== 'object') {
    throw new functions.https.HttpsError('invalid-argument', 'userId and updateData are required.');
  }

  // Enforce role exclusivity: if setting isManager true, ensure isAdmin is not true and vice versa.
  if (updateData.isManager === true && updateData.isAdmin === true) {
    throw new functions.https.HttpsError('invalid-argument', 'User cannot be both manager and admin.');
  }

  // Prevent creating both customer & manager via flags: treat a 'customer' as neither manager nor admin.
  if (('isManager' in updateData && updateData.isManager === true) && ('assignedBunkId' in updateData && !updateData.assignedBunkId)) {
    throw new functions.https.HttpsError('invalid-argument', 'Manager must have assignedBunkId.');
  }

  // Prevent negative points
  if ('points' in updateData && (isNaN(Number(updateData.points)) || Number(updateData.points) < 0)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid points value.');
  }

  // Apply update
  await db.collection('users').doc(userId).update(updateData);

  // If role changed to manager/admin, also set custom claims for quicker rule checks
  // Fetch current user doc to see role flags
  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.exists ? userDoc.data() : {};
  const claims = {};
  if (userData.isAdmin) claims.admin = true;
  if (userData.isManager) claims.manager = true;
  // remove claims if flags false
  await admin.auth().setCustomUserClaims(userId, claims);

  return { status: 'success', message: 'User profile updated and custom claims adjusted.' };
});

// setCustomClaims - admin only, to explicitly set custom claims on a user (safer admin operation)
exports.setCustomClaims = functions.https.onCall(async (data, context) => {
  const adminId = context.auth && context.auth.uid ? context.auth.uid : null;
  if (!adminId || !(await isAdmin(adminId))) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can set custom claims.');
  }
  const targetUid = data && data.uid ? String(data.uid) : null;
  const claims = data && data.claims ? data.claims : null;
  if (!targetUid || !claims || typeof claims !== 'object') {
    throw new functions.https.HttpsError('invalid-argument', 'uid and claims are required.');
  }
  // Ensure claims only contain allowed keys
  const allowed = ['admin', 'manager'];
  for (const k of Object.keys(claims)) {
    if (!allowed.includes(k)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid claim key: ' + k);
    }
  }
  await admin.auth().setCustomUserClaims(targetUid, claims);
  // Also keep Firestore user doc flags in sync if user exists
  const userRef = db.collection('users').doc(targetUid);
  const snap = await userRef.get();
  if (snap.exists) {
    const update = {};
    if ('admin' in claims) update.isAdmin = claims.admin;
    if ('manager' in claims) update.isManager = claims.manager;
    await userRef.update(update);
  }
  return { status: 'success', message: 'Custom claims set.' };
});

// updateGlobalConfig (same as before)
exports.updateGlobalConfig = functions.https.onCall(async (data, context) => {
  const adminId = context.auth && context.auth.uid ? context.auth.uid : null;
  if (!adminId || !(await isAdmin(adminId))) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can update global configuration.');
  }

  const updateData = data && data.updateData ? data.updateData : null;
  if (!updateData || typeof updateData !== 'object') {
    throw new functions.https.HttpsError('invalid-argument', 'updateData object is required.');
  }

  const configRef = db.collection('configs').doc('global');
  const oldConfigSnap = await configRef.get();
  const oldConfig = oldConfigSnap.exists ? oldConfigSnap.data() : {};

  const changes = [];
  for (const key of Object.keys(updateData)) {
    changes.push({
      key,
      oldValue: Object.prototype.hasOwnProperty.call(oldConfig, key) ? oldConfig[key] : null,
      newValue: updateData[key]
    });
  }

  await configRef.update(updateData);

  const txn = {
    type: 'config_update',
    adminId,
    change: changes,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  };
  await db.collection('transactions').add(txn);

  let message = 'Global configuration updated successfully.';
  if (updateData.creditPercentage !== undefined) {
    message += ` Example: For creditPercentage=${updateData.creditPercentage}, 100 rupees => ${Math.floor(100 * (Number(updateData.creditPercentage) / 100))} points (using floor).`;
  } else if (updateData.pointValue !== undefined) {
    message += ` Example: pointValue=${updateData.pointValue} means 1 point = ${updateData.pointValue} rupees.`;
  }

  return { status: 'success', message, changes };
});
