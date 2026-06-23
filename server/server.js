import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env relative to server.js directory to support running from any CWD
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize Firebase Admin SDK
let db;

try {
  let serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (serviceAccountPath && !path.isAbsolute(serviceAccountPath)) {
    serviceAccountPath = path.resolve(__dirname, serviceAccountPath);
  }

  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    const rawData = fs.readFileSync(serviceAccountPath);
    const serviceAccount = JSON.parse(rawData);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase initialized using Service Account JSON file.');
  } else if (projectId && clientEmail && privateKey) {
    // Handle escaped newlines in env key
    privateKey = privateKey.replace(/\\n/g, '\n');
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    console.log('Firebase initialized using Environment Variables.');
  } else {
    throw new Error(
      'No Firebase credentials found. Please set FIREBASE_SERVICE_ACCOUNT_PATH or the direct environment credentials.'
    );
  }

  db = admin.firestore();
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error.message);
  console.error('Make sure to configure your .env file with valid Firebase credentials.');
  process.exit(1);
}

// REST Endpoints for CRUD
// 1. Get all notes
app.get('/api/notes', async (req, res) => {
  try {
    const snapshot = await db.collection('whiteboard_notes').orderBy('updatedAt', 'asc').get();
    const notes = [];
    snapshot.forEach((doc) => {
      notes.push({ id: doc.id, ...doc.data() });
    });
    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// 2. Create or Update a note
app.post('/api/notes', async (req, res) => {
  try {
    const { id, content, color, x, y, width, height, lastEditedBy } = req.body;
    
    if (content === undefined || color === undefined || x === undefined || y === undefined) {
      return res.status(400).json({ error: 'Missing required note fields (content, color, x, y)' });
    }

    const noteData = {
      content,
      color,
      x: Number(x),
      y: Number(y),
      width: Number(width) || 220,
      height: Number(height) || 180,
      lastEditedBy: lastEditedBy || 'Anonymous',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (id) {
      // Update existing
      await db.collection('whiteboard_notes').doc(id).set(noteData, { merge: true });
      res.json({ id, ...noteData, status: 'updated' });
    } else {
      // Create new
      const docRef = await db.collection('whiteboard_notes').add(noteData);
      res.status(201).json({ id: docRef.id, ...noteData, status: 'created' });
    }
  } catch (error) {
    console.error('Error saving note:', error);
    res.status(500).json({ error: 'Failed to save note' });
  }
});

// 3. Delete a note
app.delete('/api/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('whiteboard_notes').doc(id).delete();
    res.json({ id, status: 'deleted' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// Server-Sent Events (SSE) Route for real-time synchronization
app.get('/api/notes/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  console.log('Client connected to real-time SSE stream.');

  // Subscribe to changes in the whiteboard_notes collection ordered by updatedAt
  const unsubscribe = db.collection('whiteboard_notes').onSnapshot(
    (snapshot) => {
      const notes = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        notes.push({
          id: doc.id,
          content: data.content,
          color: data.color,
          x: Number(data.x),
          y: Number(data.y),
          width: Number(data.width) || 220,
          height: Number(data.height) || 180,
          lastEditedBy: data.lastEditedBy,
          updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
        });
      });

      // Write data in the SSE format: "data: <JSON_STRING>\n\n"
      res.write(`data: ${JSON.stringify(notes)}\n\n`);
    },
    (error) => {
      console.error('Firestore subscription error:', error);
      res.write(`event: error\ndata: ${JSON.stringify({ message: error.message })}\n\n`);
    }
  );

  // Clean up when the client closes connection
  req.on('close', () => {
    console.log('Client disconnected from SSE stream.');
    unsubscribe();
  });
});

// Serve client static files in production
const clientDistPath = path.resolve(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  
  // SPA fallback for routing
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next(); // API 404s
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
  console.log(`Serving frontend built files from: ${clientDistPath}`);
}

app.listen(PORT, () => {
  console.log(`Whiteboard backend running on port ${PORT}`);
  console.log(`Frontend client URL: http://localhost:5173/`);
});
