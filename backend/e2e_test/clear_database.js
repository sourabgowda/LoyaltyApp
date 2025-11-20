
const admin = require('firebase-admin');
const readline = require('readline');

admin.initializeApp();

const db = admin.firestore();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function clearDatabase() {
  try {
    const collections = await db.listCollections();
    const collectionIds = collections.map(col => col.id);

    if (collectionIds.length === 0) {
      console.log('No collections found in the database. Nothing to clear.');
      rl.close();
      return;
    }

    console.log('The following collections will be cleared:');
    collectionIds.forEach(id => console.log(`- ${id}`));

    rl.question('Are you sure you want to clear all these collections? (yes/no) ', async (answer) => {
      if (answer.toLowerCase() === 'yes') {
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
      } else {
        console.log('Database clearing aborted by user.');
      }
      rl.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
}

clearDatabase();
