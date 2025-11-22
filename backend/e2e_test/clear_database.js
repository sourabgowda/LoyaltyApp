
const admin = require('firebase-admin');

// process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

admin.initializeApp();

const db = admin.firestore();

async function clearDatabase() {
  try {
    const collections = await db.listCollections();
    const collectionIds = collections.map(col => col.id);

    if (collectionIds.length === 0) {
      console.log('No collections found in the database. Nothing to clear.');
      return;
    }

    console.log('--- Clearing database ---');
    for (const collectionId of collectionIds) {
      const collectionRef = db.collection(collectionId);
      const snapshot = await collectionRef.get();

      if (snapshot.empty) {
        console.log(`Collection ${collectionId} is already empty.`);
        continue;
      }

      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`✅ Successfully cleared collection: ${collectionId}`);
    }
    console.log('--- Database cleared successfully ---');

  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
}

async function main() {
    await clearDatabase();
    process.exit(0);
}

main();
