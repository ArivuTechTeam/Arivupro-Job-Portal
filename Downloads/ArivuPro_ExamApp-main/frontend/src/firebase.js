import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.REACT_APP_FIREBASE_APP_ID,
};

// Check if credentials are real (not placeholders or empty)
export const FIREBASE_CONFIGURED =
  !!firebaseConfig.apiKey &&
  !firebaseConfig.apiKey.startsWith('your-') &&
  firebaseConfig.apiKey.length > 10 &&
  !!firebaseConfig.projectId &&
  !firebaseConfig.projectId.startsWith('your-') &&
  firebaseConfig.projectId.length > 3;

let app, db, auth, storage;

if (FIREBASE_CONFIGURED) {
  // Avoid duplicate app initialization (React Fast Refresh / HMR)
  app     = getApps().length ? getApp() : initializeApp(firebaseConfig);
  db      = getFirestore(app);
  auth    = getAuth(app);
  storage = getStorage(app);
} else {
  console.warn(
    '[ArivuPro] Firebase not configured — add REACT_APP_FIREBASE_* keys to frontend/.env'
  );
  // Provide null stubs so imports never crash
  app = auth = storage = null;
  db  = null;
}

export { app, db, auth, storage };
export default app;
