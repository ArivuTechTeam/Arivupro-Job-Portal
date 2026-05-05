"""Firebase Admin SDK client — call get_db() to get a Firestore client."""

import os
import firebase_admin
from firebase_admin import credentials, firestore
from django.conf import settings

_db = None


def _initialize():
    """Initialize Firebase app once."""
    if firebase_admin._apps:
        return

    cred_path = getattr(settings, 'FIREBASE_CREDENTIALS_PATH', None)
    if cred_path and os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
    else:
        raise RuntimeError(
            "Firebase credentials not found. "
            "Set FIREBASE_CREDENTIALS_PATH in your .env pointing to the "
            "service-account JSON downloaded from Firebase Console → "
            "Project Settings → Service Accounts."
        )


def get_db():
    """Return a Firestore client, initializing Firebase on first call."""
    global _db
    if _db is None:
        _initialize()
        _db = firestore.client()
    return _db


# ---------------------------------------------------------------------------
# Firestore collection helpers
# ---------------------------------------------------------------------------

def col(name: str):
    """Return a Firestore CollectionReference."""
    return get_db().collection(name)


def doc_ref(collection_name: str, doc_id: str):
    """Return a Firestore DocumentReference."""
    return get_db().collection(collection_name).document(doc_id)


def add_doc(collection_name: str, data: dict) -> str:
    """Add a document and return its auto-generated ID."""
    _, ref = get_db().collection(collection_name).add(data)
    return ref.id


def set_doc(collection_name: str, doc_id: str, data: dict, merge: bool = False):
    """Create or overwrite a document (merge=True for partial update)."""
    get_db().collection(collection_name).document(doc_id).set(data, merge=merge)


def get_doc(collection_name: str, doc_id: str) -> dict | None:
    """Fetch a single document; returns None if it does not exist."""
    snap = get_db().collection(collection_name).document(doc_id).get()
    return snap.to_dict() if snap.exists else None


def update_doc(collection_name: str, doc_id: str, data: dict):
    """Partially update a document."""
    get_db().collection(collection_name).document(doc_id).update(data)


def delete_doc(collection_name: str, doc_id: str):
    """Delete a document."""
    get_db().collection(collection_name).document(doc_id).delete()


def list_docs(collection_name: str, filters: list | None = None) -> list[dict]:
    """
    List documents in a collection.
    filters: list of (field, op, value) tuples, e.g. [('role', '==', 'student')]
    """
    ref = get_db().collection(collection_name)
    if filters:
        for field, op, value in filters:
            ref = ref.where(field, op, value)
    return [{'id': s.id, **s.to_dict()} for s in ref.stream()]
