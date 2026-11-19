"""
Cross-source deduplication via SHA-256 fingerprint.
Ported from articleship: src/lib/sync/dedup.ts
"""
import re
import hashlib
from scraper.types import NormalizedJob

# Strictly block roles requiring 3+ years experience or senior designations.
# Covers: "3+ years", "3-5 years", "minimum 3 years", "4 years experience", "5+ yrs", etc.
EXPERIENCE_CAP_RE = re.compile(
    r'\b('
    # Explicit year ranges starting at 3+
    r'[3-9]\s*[\+\-–]\s*\d*\s*years?'                        # 3+ years, 3-5 years
    r'|[3-9]\+\s*yrs?'                                        # 3+ yrs
    r'|\d*[3-9]\s*years?\s*(of\s+)?(exp|experience|work)'    # 3 years experience
    r'|minimum\s+[3-9]\s*years?'                              # minimum 3 years
    r'|at\s*least\s*[3-9]\s*years?'                          # at least 3 years
    r'|experience\s*[:\-]?\s*[3-9]\+?\s*years?'              # experience: 3 years
    r'|[3-9]\s*to\s*\d+\s*years?\s*(of\s+)?(exp|experience)' # 3 to 5 years experience
    r'|above\s+[2-9]\s*years?'                               # above 2 years
    # Senior designations (title-level block)
    r'|senior\s+manager|associate\s+director|deputy\s+manager'
    r'|avp\b|assistant\s+vice\s+president|vice\s+president'
    r'|director\b|head\s+of\b|partner\b|principal\b'
    r')',
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
