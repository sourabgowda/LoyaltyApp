
// index.js - Cloud Functions for Loyalty App (CommonJS)
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
admin.initializeApp();
const db = admin.firestore();

const TWOF_API_KEY = functions.config().twofactor?.api_key || 'YOUR_2FACTOR_API_KEY';

// --- Validation Helpers ---
function isValidPhoneNumber(phoneNumber) {
  return typeof phoneNumber === 'string' && /^\d{10}$/.test(phoneNumber);
}
function isValidFirstName(firstName) {
  return typeof firstName === 'string' && /^[A-Za-z]{1,40}$/.test(firstName);
}
function isValidLastName(lastName) {
  return typeof lastName === 'string' && /^[A-Za-z]+(?: [A-Za-z]+){0,2}$/.test(lastName) && lastName.length <= 80;
}

// --- Role & User Helpers ---
async function getUserDoc(userId) {
  if (!userId) return null;
  const doc = await db.collection('users').doc(userId).get();
  return doc.exists ? { ref: doc.ref, data: doc.data() } : null;
}

// Updated to check the 'role' field
async function isManager(userId) {
  const u = await getUserDoc(userId);
  return !!u && u.data.role === 'manager';
}
async function isAdmin(userId) {
  const u = await getUserDoc(userId);
  return !!u && u.data.role === 'admin';
}

// --- Callable Functions ---

// registerCustomer - Updated to use 'role'
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
    role: 'customer', // Use 'role' field
    isVerified: false,
    points: 0,
    assignedBunkId: 'NA'
  };

  const docRef = await db.collection('users').add(newUser);
  return { status: 'success', message: 'User profile created. Please verify phone number.', userId: docRef.id };
});

// createBunk - No changes
exports.createBunk = functions.https.onCall(async (data, context) => {
    const adminId = context.auth && context.auth.uid ? context.auth.uid : null;
    if (!adminId || !(await isAdmin(adminId))) {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can create bunks.');
    }
    const { name, location, district, state, pincode } = data;
    if (!name || !location || !district || !state || !pincode) {
        throw new functions.https.HttpsError('invalid-argument', 'Bunk details are required.');
    }
    const bunkData = { name, location, district, state, pincode };
    const docRef = await db.collection('bunks').add(bunkData);
    return { status: 'success', message: 'Bunk created successfully.', bunkId: docRef.id };
});

// creditPoints - No changes
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
      customerId,
      managerId,
      amountSpent,
      pointsChange: pointsToAdd,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      bunk: { name: bunk.name, location: bunk.location, district: bunk.district, state: bunk.state, pincode: bunk.pincode }
    });
    return { status: 'success', message: 'Points credited successfully.', newPoints };
  });
});

// redeemPoints - No changes
exports.redeemPoints = functions.https.onCall(async (data, context) => {
  const managerId = context.auth && context.auth.uid ? context.auth.uid : null;
  if (!managerId || !(await isManager(managerId))) {
    throw new functions.https.HttpsError('permission-denied', 'Only managers can redeem points.');
  }
  const customerId = data && data.customerId ? String(data.customerId) : null;
  const pointsToRedeem = Number(data && data.pointsToRedeem);
  if (!customerId || isNaN(pointsToRedeem) || pointsToRedeem <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid customerId or pointsToRedeem.');
  }
  return db.runTransaction(async (tx) => {
    const managerSnap = await tx.get(db.collection('users').doc(managerId));
    const customerSnap = await tx.get(db.collection('users').doc(customerId));
    const configSnap = await tx.get(db.collection('configs').doc('global'));
    if (!managerSnap.exists || !customerSnap.exists || !configSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Manager, customer, or global config not found.');
    }
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
    tx.set(txnRef, {
      type: 'redeem',
      customerId,
      managerId,
      pointsChange: -pointsToRedeem,
      redeemedValue,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    return { status: 'success', message: 'Points redeemed successfully.', newPoints, redeemedValue };
  });
});

// setUserRole - Replaces and simplifies previous role-setting logic.
exports.setUserRole = functions.https.onCall(async (data, context) => {
  const adminId = context.auth && context.auth.uid ? context.auth.uid : null;
  if (!adminId || !(await isAdmin(adminId))) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can set user roles.');
  }

  const { targetUid, newRole } = data;
  const allowedRoles = ['admin', 'manager', 'customer'];

  if (!targetUid || !newRole || !allowedRoles.includes(newRole)) {
    throw new functions.https.HttpsError('invalid-argument', 'A valid targetUid and newRole are required.');
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


// updateGlobalConfig - No changes
exports.updateGlobalConfig = functions.https.onCall(async (data, context) => {
  const adminId = context.auth && context.auth.uid ? context.auth.uid : null;
  if (!adminId || !(await isAdmin(adminId))) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can update global configuration.');
  }
  const { updateData } = data;
  if (!updateData || typeof updateData !== 'object') {
    throw new functions.https.HttpsError('invalid-argument', 'updateData object is required.');
  }
  const configRef = db.collection('configs').doc('global');
  await configRef.set(updateData, { merge: true }); // Use set with merge to create if not exists
  return { status: 'success', message: 'Global configuration updated.' };
});

// sendOtp & verifyOtp - No changes
exports.sendOtp = functions.https.onCall(async (data) => {
  const phoneNumber = data && data.phoneNumber ? String(data.phoneNumber).trim() : null;
  if (!isValidPhoneNumber(phoneNumber)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid phone number format.');
  }
  const url = `https://2factor.in/API/V1/${TWOF_API_KEY}/SMS/${phoneNumber}/AUTOGEN`;
  try {
    const response = await axios.get(url);
    if (response.data.Status !== 'Success') {
      throw new functions.https.HttpsError('internal', 'Failed to send OTP.', response.data);
    }
    return { status: 'success', sessionId: response.data.Details };
  } catch (error) {
    console.error('OTP Send Error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send OTP.');
  }
});

exports.verifyOtp = functions.https.onCall(async (data, context) => {
  const userId = context.auth && context.auth.uid ? context.auth.uid : null;
  if (!userId) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to verify an OTP.');
  }
  const { sessionId, otp } = data;
  if (!sessionId || !otp) {
    throw new functions.https.HttpsError('invalid-argument', 'sessionId and otp are required.');
  }
  const url = `https://2factor.in/API/V1/${TWOF_API_KEY}/SMS/VERIFY/${sessionId}/${otp}`;
  try {
    const response = await axios.get(url);
    if (response.data.Status !== 'Success') {
      throw new functions.https.HttpsError('internal', 'OTP verification failed.', response.data);
    }
    await db.collection('users').doc(userId).update({ isVerified: true });
    return { status: 'success', message: 'Phone number verified successfully.' };
  } catch (error) {
    console.error('OTP Verify Error:', error);
    throw new functions.https.HttpsError('internal', 'OTP verification failed.');
  }
});

// onUserUpdate - No changes
exports.onUserUpdate = functions.firestore.document('users/{userId}')
  .onUpdate(async (change) => {
    const { phoneNumber: newPhone, isVerified: newVerified } = change.after.data();
    const { phoneNumber: oldPhone } = change.before.data();
    if (newPhone !== oldPhone && newVerified !== false) {
      return change.after.ref.update({ isVerified: false });
    }
    return null;
  });
