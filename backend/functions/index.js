
// index.js - Cloud Functions for Loyalty App (CommonJS)
const functions = require('firebase-functions');
const admin = require('firebase-admin');
// const axios = require('axios'); // Commented out for email/password auth
admin.initializeApp();
const db = admin.firestore();

// const TWOF_API_KEY = functions.config().twofactor?.api_key || 'YOUR_2FACTOR_API_KEY'; // Commented out for email/password auth

// --- Validation Helpers ---
function isValidEmail(email) {
    return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function isValidPassword(password) {
    return typeof password === 'string' && password.length >= 6;
}
function isValidFirstName(firstName) {
  return typeof firstName === 'string' && /^[A-Za-z]{1,40}$/.test(firstName);
}
function isValidLastName(lastName) {
  return typeof lastName === 'string' && /^[A-Za-z]+(?: [A-Za-z]+){0,2}$/.test(lastName) && lastName.length <= 80;
}
function isValidPincode(pincode) {
    return typeof pincode === 'string' && /^[1-9][0-9]{5}$/.test(pincode);
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

// registerCustomer - Updated for email/password authentication
exports.registerCustomer = functions.https.onCall(async (data, context) => {
    const firstName = data && data.firstName ? String(data.firstName).trim() : null;
    const lastName = data && data.lastName ? String(data.lastName).trim() : null;
    const email = data && data.email ? String(data.email).trim() : null;
    const password = data && data.password ? String(data.password).trim() : null;

    if (!firstName || !lastName || !email || !password) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields.');
    }
    if (!isValidFirstName(firstName) || !isValidLastName(lastName)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid first or last name format.');
    }
    if (!isValidEmail(email)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid email format.');
    }
    if (!isValidPassword(password)) {
        throw new functions.https.HttpsError('invalid-argument', 'Password must be at least 6 characters long.');
    }

    try {
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
            displayName: `${firstName} ${lastName}`
        });

        const newUser = {
            firstName,
            lastName,
            email,
            role: 'customer',
            isVerified: false, // User needs to verify their email
            points: 0,
            assignedBunkId: 'NA'
        };

        await db.collection('users').doc(userRecord.uid).set(newUser);
        return { status: 'success', message: 'User profile created. Please verify your email.', userId: userRecord.uid };

    } catch (error) {
        if (error.code === 'auth/email-already-exists') {
            throw new functions.https.HttpsError('already-exists', 'User with this email already exists.');
        }
        throw new functions.https.HttpsError('internal', 'Error creating user.', error);
    }
});


// createBunk - No changes
exports.createBunk = functions.https.onCall(async (data, context) => {
    const adminId = context.auth && context.auth.uid ? context.auth.uid : null;
    if (!adminId || !(await module.exports.isAdmin(adminId))) {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can create bunks.');
    }
    const { name, location, district, state, pincode } = data;
    if (!name || !location || !district || !state || !pincode) {
        throw new functions.https.HttpsError('invalid-argument', 'Bunk details are required.');
    }
    if (!isValidPincode(pincode)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid pincode format.');
    }
    const bunkData = { name, location, district, state, pincode };
    const docRef = await db.collection('bunks').add(bunkData);
    return { status: 'success', message: 'Bunk created successfully.', bunkId: docRef.id };
});

// creditPoints
exports.creditPoints = functions.https.onCall(async (data, context) => {
  const managerId = context.auth && context.auth.uid ? context.auth.uid : null;
  if (!managerId || !(await module.exports.isManager(managerId))) {
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

// redeemPoints
exports.redeemPoints = functions.https.onCall(async (data, context) => {
  const managerId = context.auth && context.auth.uid ? context.auth.uid : null;
  if (!managerId || !(await module.exports.isManager(managerId))) {
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
  if (!adminId || !(await module.exports.isAdmin(adminId))) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can set user roles.');
  }

  const { targetUid, newRole } = data;
  const allowedRoles = ['admin', 'manager', 'customer'];

  if (!targetUid || !newRole || !allowedRoles.includes(newRole)) {
    throw new functions.https.HttpsError('invalid-argument', 'A valid targetUid and newRole are required.');
  }

  const user = await module.exports.getUserDoc(targetUid);
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


// updateGlobalConfig
exports.updateGlobalConfig = functions.https.onCall(async (data, context) => {
  const adminId = context.auth && context.auth.uid ? context.auth.uid : null;
  if (!adminId || !(await module.exports.isAdmin(adminId))) {
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

// onUserCreate
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
    if (user.email && user.emailVerified) {
        const userRef = db.collection('users').doc(user.uid);
        const userDoc = await userRef.get();
        if (userDoc.exists) {
            await userRef.update({ isVerified: true });
        }
    }
});

// Export helper functions for testing
module.exports.isAdmin = isAdmin;
module.exports.isManager = isManager;
module.exports.getUserDoc = getUserDoc;
