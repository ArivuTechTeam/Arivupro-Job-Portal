/**
 * Firestore helpers for ArivuPro ExamApp.
 * Collections mirror the Django models so data can flow both ways.
 *
 * Collections:
 *  users           – student / admin / evaluator profiles
 *  submissions     – answer script uploads
 *  evaluations     – AI evaluation results
 *  notifications   – per-user notification feed
 *  exam_papers     – paper metadata (synced from Django admin)
 */

import {
  collection, doc,
  getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit,
  onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { db, FIREBASE_CONFIGURED } from '../firebase';

// Guard: silently skip if Firebase not configured
function requireFirebase(fnName) {
  if (!FIREBASE_CONFIGURED || !db) {
    console.warn(`[Firestore] ${fnName} skipped — Firebase not configured.`);
    return false;
  }
  return true;
}

// ─── Collection names ────────────────────────────────────────────────────────
export const COLLECTIONS = {
  USERS:         'users',
  SUBMISSIONS:   'submissions',
  EVALUATIONS:   'evaluations',
  NOTIFICATIONS: 'notifications',
  EXAM_PAPERS:   'exam_papers',
};

// ─── Generic helpers ─────────────────────────────────────────────────────────

export async function addDocument(collectionName, data) {
  if (!requireFirebase('addDocument')) return null;
  const ref = await addDoc(collection(db, collectionName), {
    ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function setDocument(collectionName, docId, data, merge = false) {
  if (!requireFirebase('setDocument')) return;
  await setDoc(doc(db, collectionName, docId), {
    ...data, updatedAt: serverTimestamp(),
  }, { merge });
}

export async function getDocument(collectionName, docId) {
  if (!requireFirebase('getDocument')) return null;
  const snap = await getDoc(doc(db, collectionName, docId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateDocument(collectionName, docId, data) {
  if (!requireFirebase('updateDocument')) return;
  await updateDoc(doc(db, collectionName, docId), {
    ...data, updatedAt: serverTimestamp(),
  });
}

export async function deleteDocument(collectionName, docId) {
  if (!requireFirebase('deleteDocument')) return;
  await deleteDoc(doc(db, collectionName, docId));
}

export async function listDocuments(collectionName, constraints = []) {
  if (!requireFirebase('listDocuments')) return [];
  const q = query(collection(db, collectionName), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ─── User helpers ─────────────────────────────────────────────────────────────

/** Sync a Django user into Firestore (call after login/register). */
export async function syncUserToFirestore(user) {
  await setDocument(COLLECTIONS.USERS, String(user.id), {
    username:    user.username,
    email:       user.email,
    fullName:    user.full_name || '',
    role:        user.role,
    examType:    user.exam_type || '',
    examLevel:   user.exam_level || '',
    phone:       user.phone || '',
    institute:   user.institute || '',
    isActive:    user.is_active ?? true,
  }, true);
}

export async function getUserFromFirestore(userId) {
  return getDocument(COLLECTIONS.USERS, String(userId));
}

// ─── Submission helpers ───────────────────────────────────────────────────────

export async function createSubmission(data) {
  return addDocument(COLLECTIONS.SUBMISSIONS, data);
}

export async function getSubmissionsByUser(userId) {
  return listDocuments(COLLECTIONS.SUBMISSIONS, [
    where('studentId', '==', String(userId)),
    orderBy('createdAt', 'desc'),
  ]);
}

export async function updateSubmissionStatus(submissionId, status) {
  await updateDocument(COLLECTIONS.SUBMISSIONS, submissionId, { status });
}

// ─── Evaluation helpers ───────────────────────────────────────────────────────

export async function saveEvaluation(submissionId, evaluationData) {
  await setDocument(COLLECTIONS.EVALUATIONS, submissionId, evaluationData, true);
}

export async function getEvaluationBySubmission(submissionId) {
  return getDocument(COLLECTIONS.EVALUATIONS, submissionId);
}

export async function getEvaluationsByUser(userId, maxResults = 20) {
  return listDocuments(COLLECTIONS.EVALUATIONS, [
    where('studentId', '==', String(userId)),
    orderBy('createdAt', 'desc'),
    limit(maxResults),
  ]);
}

// ─── Notification helpers ─────────────────────────────────────────────────────

export async function sendNotification(userId, message, type = 'info') {
  await addDocument(COLLECTIONS.NOTIFICATIONS, {
    userId: String(userId),
    message,
    type,
    read: false,
  });
}

export async function getUnreadNotifications(userId) {
  return listDocuments(COLLECTIONS.NOTIFICATIONS, [
    where('userId', '==', String(userId)),
    where('read', '==', false),
    orderBy('createdAt', 'desc'),
  ]);
}

export async function markNotificationRead(notificationId) {
  await updateDocument(COLLECTIONS.NOTIFICATIONS, notificationId, { read: true });
}

// ─── Real-time listeners ──────────────────────────────────────────────────────

/**
 * Subscribe to a user's submissions in real time.
 * Returns the unsubscribe function — call it on component unmount.
 *
 * Usage:
 *   const unsub = subscribeToSubmissions(userId, (submissions) => setData(submissions));
 *   return () => unsub();
 */
export function subscribeToSubmissions(userId, callback) {
  if (!requireFirebase('subscribeToSubmissions')) return () => {};
  const q = query(
    collection(db, COLLECTIONS.SUBMISSIONS),
    where('studentId', '==', String(userId)),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

export function subscribeToEvaluation(submissionId, callback) {
  if (!requireFirebase('subscribeToEvaluation')) return () => {};
  return onSnapshot(
    doc(db, COLLECTIONS.EVALUATIONS, submissionId),
    snap => callback(snap.exists() ? { id: snap.id, ...snap.data() } : null),
  );
}

export function subscribeToNotifications(userId, callback) {
  if (!requireFirebase('subscribeToNotifications')) return () => {};
  const q = query(
    collection(db, COLLECTIONS.NOTIFICATIONS),
    where('userId', '==', String(userId)),
    where('read', '==', false),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}
