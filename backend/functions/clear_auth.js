const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// List of users to keep (admin and manager)
const usersToKeep = [
  'z41y1GbfZDThFVSBgchVBSRDhJm2', // Admin UID
  '3juOSPmtGWMPsiqXU8P6Rtthot12'  // Manager UID
];

async function deleteAllUsers() {
  try {
    const userRecords = await admin.auth().listUsers();
    const uidsToDelete = userRecords.users
      .map(user => user.uid)
      .filter(uid => !usersToKeep.includes(uid));

    if (uidsToDelete.length > 0) {
      const result = await admin.auth().deleteUsers(uidsToDelete);
      console.log(`Successfully deleted ${result.successCount} users.`);
      if (result.failureCount > 0) {
        console.error(`Failed to delete ${result.failureCount} users.`);
        result.errors.forEach(error => {
          console.error(`  - ${error.error.message}`);
        });
      }
    } else {
      console.log('No users to delete.');
    }
  } catch (error) {
    console.error('Error deleting users:', error);
  }
}

deleteAllUsers();
