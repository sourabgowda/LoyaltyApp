
const admin = require('firebase-admin');
const db = admin.firestore();

async function getUserDoc(userId) {
  if (!userId) return null;
  const doc = await db.collection('users').doc(userId).get();
  return doc.exists ? { ref: doc.ref, data: doc.data() } : null;
}

async function isManager(userId) {
  const u = await getUserDoc(userId);
  return !!u && u.data.role === 'manager';
}

async function isAdmin(userId) {
  const u = await getUserDoc(userId);
  return !!u && u.data.role === 'admin';
}

module.exports = {
    getUserDoc,
    isManager,
    isAdmin
};
