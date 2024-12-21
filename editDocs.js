const admin = require('firebase-admin');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Initialize Firebase Admin SDK
const serviceAccount = require('/home/user/work/auth/analyst-server-service.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const argv = yargs(hideBin(process.argv))
  .option('newTopic', { type: 'string' })
  .option('category', { type: 'string' })
  .option('city', { type: 'string' })
  .option('seq', { type: 'string' })
  .option('photo', { type: 'string' })
  .option('docId', { type: 'string' })
  .option('setCol', { type: 'string' })
  .option('setValue', { type: 'string' })
  .option('list', { type: 'string' })
  .option('fields', { type: 'string' })
  .option('delete', { type: 'boolean' })
  .argv;

async function createNewDocument(args) {
  const { newTopic, category, city, seq, photo } = args;
  const docData = {
    name: newTopic,
    category,
    city,
    seq,
    photo,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  };

  try {
    const docRef = await db.collection('restaurants').add(docData);
    console.log(`Document created with ID: ${docRef.id}`);
  } catch (error) {
    console.error('Error creating document:', error);
  }
}

async function modifyDocument(docId, setCol, setValue) {
  try {
    await db.collection('restaurants').doc(docId).update({
      [setCol]: setValue
    });
    console.log(`Document ${docId} updated successfully`);
  } catch (error) {
    console.error('Error updating document:', error);
  }
}

async function listDocuments(collection, fields) {
  try {
    const snapshot = await db.collection(collection).get();
    const fieldArray = fields.split(',');
    snapshot.forEach(doc => {
      const data = doc.data();
      const filteredData = fieldArray.reduce((acc, field) => {
        acc[field] = data[field];
        return acc;
      }, {});
      console.log(`ID: ${doc.id}`, filteredData);
    });
  } catch (error) {
    console.error('Error listing documents:', error);
  }
}

async function deleteDocument(docId) {
  try {
    await db.collection('restaurants').doc(docId).delete();
    console.log(`Document ${docId} deleted successfully`);
  } catch (error) {
    console.error('Error deleting document:', error);
  }
}

async function main() {
  if (argv.newTopic) {
    await createNewDocument(argv);
  } else if (argv.docId && argv.setCol && argv.setValue) {
    await modifyDocument(argv.docId, argv.setCol, argv.setValue);
  } else if (argv.list && argv.fields) {
    await listDocuments(argv.list, argv.fields);
  } else if (argv.delete && argv.docId) {
    await deleteDocument(argv.docId);
  } else {
    console.log('Invalid command. Please check your arguments.');
  }
  process.exit(0);
}

main();

