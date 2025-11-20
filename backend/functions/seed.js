
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'password123';
const ADMIN_UID = 'z41y1GbfZDThFVSBgchVBSRDhJm2';

async function seedAdmin() {
  try {
    // Create the admin user
    const userRecord = await auth.createUser({
      uid: ADMIN_UID,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      displayName: 'Admin User',
    });

    // Set custom claims
    await auth.setCustomUserClaims(userRecord.uid, { admin: true });

    // Create a user document in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      firstName: 'Admin',
      lastName: 'User',
      email: ADMIN_EMAIL,
      role: 'admin',
      isVerified: true,
      points: 0,
      assignedBunkId: 'NA'
    });

    console.log('Successfully seeded admin user.');
  } catch (error) {
    if (error.code === 'auth/uid-already-exists') {
      console.log('Admin user already exists.');
    } else {
      console.error('Error seeding admin user:', error);
    }
  }
}

seedAdmin();
