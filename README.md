# 🌌 NEON BOARD — Collaborative Real-Time Whiteboard

NEON BOARD is a premium, high-fidelity real-time collaborative project whiteboard. Built with a modern glassmorphic aesthetic, neon glow accents, and responsive animations, it provides a seamless visual workspace for distributed teams.

The application leverages **React** and **Vite** on the frontend, powered by a **Node.js/Express** backend, and uses **Google Firestore** as its database with **Server-Sent Events (SSE)** for zero-latency, real-time collaboration without WebSockets.

---

## ✨ Features

- 🎨 **Adaptive Glassmorphic UI**: Sleek and modern user interface supporting Light, Dark, and System-Adaptive theme modes with smooth, high-fidelity CSS transitions.
- ⚡ **Infinite Zoom & Pan Canvas**: Navigable $50000 \times 50000$ canvas. Left/middle-click drag to pan across the board, and scroll to zoom smoothly.
- 🔄 **Real-Time Synchronization**: Native Server-Sent Events (SSE) route syncs sticky notes updates to all connected clients immediately.
- 📝 **Responsive Sticky Notes**: Fully draggable, editable, and resizable notes. Supports five vibrant neon color tags.
- 🗑️ **Interactive Trash Zone**: Seamless drag-and-drop boundary detection to delete notes via a glowing neon trash bin.
- 👥 **Presence & Author Attribution**: Every note tracks who created or last modified it, showing live ownership details.

---

## 🛠️ Tech Stack

- **Client**: [React](https://react.dev/) (v18), [Vite](https://vitejs.dev/) (for fast build times), Vanilla CSS (tailored for modern design, glow animations, and variables).
- **Server**: [Express](https://expressjs.com/), [dotenv](https://www.npmjs.com/package/dotenv), [cors](https://www.npmjs.com/package/cors).
- **Database**: [Google Cloud Firestore](https://firebase.google.com/docs/firestore) using `firebase-admin`.

---

## 📁 Directory Structure

```text
NEON-BOARD/
├── client/              # React frontend
│   ├── dist/            # Production built static assets
│   ├── src/             # Application source files
│   │   ├── components/  # React Components (Whiteboard, StickyNote, TrashBin, etc.)
│   │   ├── App.jsx      # Main application core
│   │   ├── main.jsx     # Frontend entrypoint
│   │   └── index.css    # Core stylesheet (Design tokens & animations)
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/              # Node.js backend
│   ├── .env.example     # Environment template
│   ├── server.js        # Core Express app & SSE logic
│   ├── test-firestore.js# DB connectivity check tool
│   ├── print-notes.js   # CLI utility to dump current notes database
│   └── package.json
│
├── package.json         # Workspace root manager scripts
└── README.md            # You are here
```

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed (v16+ recommended).

### 2. Setup Firebase Credentials
You will need a Firebase Firestore database.
1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a project.
2. Initialize Cloud Firestore in your project.
3. Go to **Project Settings** > **Service Accounts** tab.
4. Click **Generate New Private Key**, then download the `.json` file.

### 3. Installation
Clone the workspace or navigate to the directory and run the following command from the root to install all dependencies:
```bash
npm run install-all
```

### 4. Configuration
Create a `.env` file inside the `server/` directory:
```bash
cp server/.env.example server/.env
```

Open `server/.env` and choose one of the following methods to authorize:

#### **Option A: Service Account File (Recommended for Local Dev)**
Move the downloaded service account private key JSON file into the `server/` directory under the name `service-account.json`, then point to it:
```env
PORT=5000
FIREBASE_SERVICE_ACCOUNT_PATH=./service-account.json
```

#### **Option B: Environment Variables (Recommended for Deployments)**
Provide Firebase fields directly:
```env
PORT=5000
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQ..."
```

---

## 🧪 Testing Firestore Connection

To make sure your credentials are set up and working properly, you can run the built-in diagnostic test utility:
```bash
cd server
node test-firestore.js
```
This script will authenticate, query the `whiteboard_notes` collection, insert a sample note, and clean it up automatically.

To output all current notes from the database directly in your console, run:
```bash
node print-notes.js
```

---

## 🏃 Running the Application

### Development Mode (Concurrent)
You can run the backend API server and Vite client server in parallel.

1. **Start Backend Server** (Port `5000`):
   ```bash
   npm run dev:server
   ```
2. **Start Frontend Client** (Port `5173`):
   ```bash
   npm run dev:client
   ```

Open [http://localhost:5173/](http://localhost:5173/) in your web browser.

### Production Mode (Single Process)
In production, the backend server serves the client static assets directly from `client/dist`.

1. **Build the client app & install dependencies**:
   ```bash
   npm run build
   ```
2. **Start production server**:
   ```bash
   npm run start
   ```

The application will run on [http://localhost:5000/](http://localhost:5000/).
