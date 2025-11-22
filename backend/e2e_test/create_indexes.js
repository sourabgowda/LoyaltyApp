const { v1 } = require('@google-cloud/firestore');

async function createCompositeIndex() {
  const client = new v1.FirestoreAdminClient();
  const project = await client.getProjectId();

  const index = {
    collectionGroup: 'transactions',
    queryScope: 'COLLECTION',
    fields: [
      {
        fieldPath: 'participants',
        order: 'ASCENDING',
        arrayConfig: 'CONTAINS'
      },
      {
        fieldPath: 'timestamp',
        order: 'DESCENDING'
      }
    ]
  };

  try {
    const [operation] = await client.createIndex({ parent: `projects/${project}/databases/(default)`, index });
    await operation.promise();
    console.log('Successfully created composite index.');
  } catch (error) {
    if (error.code === 6) { // 6 = ALREADY_EXISTS
        console.log('Composite index already exists.');
    } else {
        console.error('Error creating composite index:', error);
    }
  }
}

createCompositeIndex();
