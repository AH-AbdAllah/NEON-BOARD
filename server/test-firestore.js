import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

try {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './service-account.json';
  
  if (fs.existsSync(serviceAccountPath)) {
    const rawData = fs.readFileSync(serviceAccountPath);
    const serviceAccount = JSON.parse(rawData);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase initialized successfully.');
    
    const db = admin.firestore();
    
    console.log('1. Trying to fetch from whiteboard_notes without order...');
    const snap1 = await db.collection('whiteboard_notes').get();
    console.log(`Success! Found ${snap1.size} documents.`);
    
    console.log('2. Trying to fetch from whiteboard_notes ordered by updatedAt...');
    const snap2 = await db.collection('whiteboard_notes').orderBy('updatedAt', 'asc').get();
    console.log(`Success! Found ${snap2.size} documents ordered.`);
    
    console.log('3. Trying to create a sample note...');
    const docRef = await db.collection('whiteboard_notes').add({
      content: 'Debug Note',
      color: 'neon-green',
      x: 100,
      y: 100,
      lastEditedBy: 'Tester',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('Success! Created document with ID:', docRef.id);
    
    console.log('4. Trying to clean up sample note...');
    await db.collection('whiteboard_notes').doc(docRef.id).delete();
    console.log('Success! Cleaned up.');
    
  } else {
    console.error('service-account.json not found at:', serviceAccountPath);
  }
} catch (error) {
  console.error('Test failed!');
  console.error('Error Name:', error.name);
  console.error('Error Message:', error.message);
  if (error.stack) {
    console.error(error.stack);
  }
}
process.exit(0);
