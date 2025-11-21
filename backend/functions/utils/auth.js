
const admin = require('firebase-admin');
const db = admin.firestore();

async function getUserDoc(userId) {
  if (!userId) return null;
  const doc = await db.collection('users').doc(userId).get();
  return doc.exists ? { ref: doc.ref, data: doc.data() } : null;
}

async function isManager(decodedToken) {
  return !!(decodedToken && decodedToken.manager);
}

async function isAdmin(decodedToken) {
  return !!(decodedToken && decodedToken.admin);
}

module.exports = {
    getUserDoc,
    isManager,
    isAdmin
};
