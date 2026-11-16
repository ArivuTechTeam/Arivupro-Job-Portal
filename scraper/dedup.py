"""
Cross-source deduplication via SHA-256 fingerprint.
Ported from articleship: src/lib/sync/dedup.ts
"""
import re
import hashlib
from scraper.types import NormalizedJob

# Block only clear senior/experienced-only roles — not entry-level jobs that mention 3yr CTC etc.
EXPERIENCE_CAP_RE = re.compile(
    r'\b(minimum\s+[3-9]\s*years?|at\s*least\s*[3-9]\s*years?|'
    r'[3-9]\+\s*years?\s*(of\s+)?(exp|experience|work\s*exp)|'
    r'experience\s*[:\-]?\s*[3-9]\s*years?\s*(and\s+above|minimum|\+)|'
    r'\b(senior\s+manager|associate\s+director|deputy\s+manager|'
    r'avp\b|assistant\s+vice\s+president|vice\s+president|'
    r'director\b|head\s+of|partner\b|principal\b)\b)',
    re.I
)


def _normalize(s: str) -> str:
    return re.sub(r'[^a-z0-9]', '', s.lower())


def build_fingerprint(job: NormalizedJob) -> str:
    raw = f'{_normalize(job.title)}|{_normalize(job.company)}|{_normalize(job.location)}'
    return hashlib.sha256(raw.encode()).hexdigest()


def is_over_experience_cap(job: NormalizedJob) -> bool:
    text = f'{job.title} {(job.description or "")[:800]}'
    return bool(EXPERIENCE_CAP_RE.search(text))
