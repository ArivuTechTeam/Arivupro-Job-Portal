"""JSearch (OpenWebNinja) API scraper — free tier 200 req/month."""
import os
import re
import httpx
from datetime import datetime
from scraper.types import NormalizedJob
from scraper.course_detector import detect_courses
from scraper.parse_utils import logo_url_from_company

JSEARCH_BASE = "https://api.openwebninja.com/jsearch"

SEARCH_QUERIES = [
    # ── Full-time jobs 0–2 yrs (80%) ─────────────────────────────────────────
    "audit associate 0 experience India",
    "accounts executive fresher India",
    "financial analyst fresher India",
    "tax associate fresher India",
    "GST executive fresher India",
    "internal audit associate fresher India",
    "statutory audit associate fresher India",
    "FP&A analyst fresher India",
    "equity research analyst fresher India",
    "credit analyst fresher India",
    "fund accountant fresher India",
    "accounts payable fresher India",
    "finance executive fresher India",
    "cost accountant fresher India",
    "ACCA fresher jobs India",
    "US CPA fresher jobs India",
    "CFA level 1 fresher jobs India",
    "B.Com finance jobs fresher India",
    "BBA finance jobs fresher India",
    "company secretary fresher jobs India",
    "compliance officer fresher India",
    "treasury analyst fresher India",
    "risk analyst fresher India",
    "financial reporting analyst fresher India",
    "Big 4 audit associate fresher India",
    "US CMA management accountant fresher India",
    "IMA certified management accountant fresher India",
    "B.Com accounts executive fresher India",
    "banking operations associate fresher India",
    "P2P O2C analyst fresher GCC India",
    "shared services finance fresher India",
    "management trainee consulting Big 4 India",

    # ── Articleship + Internship + Trainee (20%) ──────────────────────────────
    "CA articleship vacancy India",
    "CMA industrial training India",
    "CS executive articleship India",
    "finance internship fresher India",
    "audit internship fresher India",
    "management trainee finance India",
    "finance graduate trainee India",
]

SENIOR_RE = re.compile(
    r'\b(senior\s+manager|associate\s+director|deputy\s+manager|'
    r'avp\b|assistant\s+vice\s+president|vice\s+president\b|'
    r'director\b|head\s+of|partner\b|principal\b|'
    r'minimum\s+[3-9]\s*years?|at\s*least\s*[3-9]\s*years?)\b',
    re.I
)


def _detect_job_type(title: str, desc: str) -> str:
    text = f'{title} {desc[:300]}'
    if re.search(r'\b(article|articleship|industrial\s+train)\b', text, re.I):
        return 'articleship'
    if re.search(r'\b(intern(ship)?|summer\s+intern|winter\s+intern)\b', text, re.I):
        return 'internship'
    if re.search(r'\b(trainee|graduate\s+trainee|management\s+trainee)\b', text, re.I):
        return 'trainee'
    return 'job'


def _is_senior(title: str, description: str) -> bool:
    return bool(SENIOR_RE.search(title) or SENIOR_RE.search(description[:800]))


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
            job_type = _detect_job_type(title, description)
            exp_level = _exp_level(title, description, job_type)

            posted_raw = item.get('job_posted_at_datetime_utc')
            try:
                posted_at = datetime.fromisoformat(posted_raw.replace('Z', '+00:00')).replace(tzinfo=None) if posted_raw else datetime.utcnow()
            except Exception:
                posted_at = datetime.utcnow()

            company_name = item.get('employer_name') or 'Unknown'
            apply_link = item.get('job_apply_link') or ''
            jobs.append(NormalizedJob(
                source='jsearch',
                external_id=job_id,
                title=title,
                company=company_name,
                location=_build_location(item),
                stipend=_avg_salary(item),
                duration='',
                courses=courses,
                job_type=job_type,
                experience_level=exp_level,
                apply_url=apply_link,
                description=description[:2000] or None,
                is_remote=bool(item.get('job_is_remote')),
                posted_at=posted_at,
                logo_url=item.get('employer_logo') or logo_url_from_company(company_name, apply_link),
                raw_data=f'{{"job_id":"{job_id}","employer":"{company_name[:60]}"}}'
            ))

    return jobs
