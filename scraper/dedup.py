"""
Cross-source deduplication via SHA-256 fingerprint.
Ported from articleship: src/lib/sync/dedup.ts
"""
import re
import hashlib
from scraper.types import NormalizedJob

EXPERIENCE_CAP_RE = re.compile(
    r'\b(3\+\s*years?|4\s*years?|five\s+years?|[5-9]\s*years?|\d{2,}\s*years?|'
    r'minimum\s+[3-9]\s*years?|at\s*least\s*[3-9]\s*years?|'
    r'[3-9]\s*years?\s*(of\s+)?(exp|experience|work)|'
    r'[3-9][-–]\d+\s*years?|experience\s*[:\-]?\s*[3-9]\s*years?|'
    r'senior|manager|lead\b|director|head\s+of|vp\b|vice\s*president|principal|partner)\b',
    re.I
)


def _normalize(s: str) -> str:
    return re.sub(r'[^a-z0-9]', '', s.lower())


def build_fingerprint(job: NormalizedJob) -> str:
    raw = f'{_normalize(job.title)}|{_normalize(job.company)}|{_normalize(job.location)}|{_normalize(job.external_id)}'
    return hashlib.sha256(raw.encode()).hexdigest()


def is_over_experience_cap(job: NormalizedJob) -> bool:
    text = f'{job.title} {(job.description or "")[:800]}'
    return bool(EXPERIENCE_CAP_RE.search(text))
