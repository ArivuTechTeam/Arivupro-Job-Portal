"""JSearch (OpenWebNinja) API scraper — free tier 200 req/month."""
import os
import re
import httpx
from datetime import datetime
from scraper.types import NormalizedJob
from scraper.course_detector import detect_courses

JSEARCH_BASE = "https://api.openwebninja.com/jsearch"

SEARCH_QUERIES = [
    # CA
    "CA articleship India", "article assistant ICAI India",
    "CA inter articleship India", "CA fresher jobs India",
    "audit associate fresher India", "tax associate fresher CA India",
    # CS
    "CS executive trainee India", "company secretary articleship India",
    "ICSI training vacancy India", "CS fresher jobs India",
    "secretarial compliance trainee India",
    # CMA
    "CMA industrial training India", "cost accountant trainee India",
    "ICMAI training vacancy India", "CMA fresher jobs India",
    # ACCA
    "ACCA trainee India", "ACCA fresher jobs India", "ACCA affiliate jobs India",
    # CFA
    "CFA candidate jobs India", "investment analyst fresher CFA India",
    # CPA
    "US CPA fresher jobs India", "CPA candidate accounting jobs India",
    # General fresher finance
    "GST taxation fresher India", "internal audit associate India",
    "finance analyst fresher India", "accounts executive fresher India",
    "financial reporting analyst fresher India",
]

SENIOR_RE = re.compile(
    r'\b(3\+\s*years?|4\s*years?|five\s+years?|[5-9]\s*years?|'
    r'senior|manager|lead|director|head\s+of|vp\b|vice\s*president|principal|partner)\b',
    re.I
)
OVER_3YR_RE = re.compile(
    r'\b(minimum\s+[3-9]\s*years?|at\s*least\s*[3-9]\s*years?|'
    r'[3-9]\s*years?\s*(of\s+)?(exp|experience|work)|'
    r'[3-9][-–]\d+\s*years?|experience\s*[:\-]?\s*[3-9]\s*years?)\b',
    re.I
)


def _is_senior(title: str, description: str) -> bool:
    snippet = description[:800]
    return bool(
        SENIOR_RE.search(title) or
        SENIOR_RE.search(snippet) or
        OVER_3YR_RE.search(title) or
        OVER_3YR_RE.search(snippet)
    )


def _exp_level(title: str, description: str, job_type: str) -> str | None:
    text = f'{title} {description[:800]}'.lower()
    if re.search(r'fresher|0\s*exp|0[-–]1\s*year|article\s*student|articleship', text):
        return 'fresher'
    if re.search(r'1[-–]2\s*years?|one\s+to\s+two\s+years?|upto?\s*2\s*years?', text):
        return '1-3 years'
    if job_type == 'articleship':
        return '0-1 year'
    return None


def _build_location(item: dict) -> str:
    if item.get('job_city') and item.get('job_state'):
        return f'{item["job_city"]}, {item["job_state"]}'
    return item.get('job_city') or item.get('job_location') or ''


def _avg_salary(item: dict) -> int:
    lo = item.get('job_min_salary') or 0
    hi = item.get('job_max_salary') or 0
    if lo and hi:
        return round((lo + hi) / 2)
    return lo or hi


async def _fetch_page(query: str, api_key: str) -> list[dict]:
    url = f'{JSEARCH_BASE}/search-v2'
    params = {'query': query, 'country': 'in', 'date_posted': 'month', 'num_pages': '1'}
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.get(url, params=params, headers={'x-api-key': api_key})
        resp.raise_for_status()
    return resp.json().get('data', {}).get('jobs') or []


async def fetch() -> list[NormalizedJob]:
    api_key = os.getenv('JSEARCH_API_KEY')
    if not api_key:
        raise RuntimeError('JSEARCH_API_KEY not set')

    seen: set[str] = set()
    jobs: list[NormalizedJob] = []

    for query in SEARCH_QUERIES:
        try:
            items = await _fetch_page(query, api_key)
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f'JSearch query "{query}" failed: {e}')
            continue

        for item in items:
            job_id = item.get('job_id')
            if not job_id or job_id in seen:
                continue
            seen.add(job_id)

            title = item.get('job_title') or ''
            description = item.get('job_description') or ''

            if _is_senior(title, description):
                continue

            courses = await detect_courses(title, description[:500])
            job_type = 'articleship' if re.search(r'article|articleship', f'{title} {description}', re.I) else 'job'
            exp_level = _exp_level(title, description, job_type)

            posted_raw = item.get('job_posted_at_datetime_utc')
            try:
                posted_at = datetime.fromisoformat(posted_raw.replace('Z', '+00:00')).replace(tzinfo=None) if posted_raw else datetime.utcnow()
            except Exception:
                posted_at = datetime.utcnow()

            jobs.append(NormalizedJob(
                source='jsearch',
                external_id=job_id,
                title=title,
                company=item.get('employer_name') or 'Unknown',
                location=_build_location(item),
                stipend=_avg_salary(item),
                duration='',
                courses=courses,
                job_type=job_type,
                experience_level=exp_level,
                apply_url=item.get('job_apply_link') or '',
                description=description[:2000] or None,
                is_remote=bool(item.get('job_is_remote')),
                posted_at=posted_at,
                raw_data=f'{{"job_id":"{job_id}","employer":"{(item.get("employer_name") or "")[:60]}"}}'
            ))

    return jobs
