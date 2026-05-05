/**
 * Firebase connection test — call this once to verify Firestore is reachable.
 */
import { collection, getDocs, limit, query, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, FIREBASE_CONFIGURED } from '../firebase';

export async function testFirebaseConnection() {
  if (!FIREBASE_CONFIGURED || !db) {
    return { ok: false, error: 'Firebase credentials not configured in .env' };
  }
  try {
    // Try a lightweight read (0 docs) to verify connectivity
    const q = query(collection(db, '_connection_test'), limit(1));
    await getDocs(q);
    return { ok: true, projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function writeTestDocument() {
  if (!FIREBASE_CONFIGURED || !db) {
    return { ok: false, error: 'Firebase not configured.' };
  }
  try {
    const ref = await addDoc(collection(db, '_connection_test'), {
      message: 'ArivuPro Firebase connected ✓',
      timestamp: serverTimestamp(),
    });
    return { ok: true, docId: ref.id };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
