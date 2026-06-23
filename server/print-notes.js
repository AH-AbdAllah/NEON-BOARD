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
    
    const db = admin.firestore();
    const snapshot = await db.collection('whiteboard_notes').get();
    
    console.log(`Found ${snapshot.size} notes:`);
    snapshot.forEach(doc => {
      console.log(`ID: ${doc.id}`);
      console.log(JSON.stringify(doc.data(), null, 2));
      console.log('---');
    });
    
  } else {
    console.error('service-account.json not found');
  }
} catch (error) {
  console.error('Error fetching notes:', error);
}
process.exit(0);
