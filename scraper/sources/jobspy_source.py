"""
JobSpy multi-board scraper — LinkedIn, Indeed, Glassdoor, Naukri.
Library: python-jobspy (https://github.com/speedyapply/JobSpy)
No API keys required. Free and open source.
"""
import os
import re
import logging
import asyncio
from datetime import datetime, date
from concurrent.futures import ThreadPoolExecutor
from scraper.types import NormalizedJob
from scraper.course_detector import detect_courses
from scraper.parse_utils import extract_stipend

logger = logging.getLogger(__name__)

# ── ArivuPro finance job search queries ──────────────────────────────────────
QUERIES = [
    # CA / Articleship
    {'term': 'CA articleship vacancy',              'courses': ['CA']},
    {'term': 'article assistant CA firm',           'courses': ['CA']},
    {'term': 'CA Inter articleship',                'courses': ['CA']},
    {'term': 'audit associate fresher CA',          'courses': ['CA']},
    {'term': 'tax associate fresher chartered accountant', 'courses': ['CA']},
    # CS
    {'term': 'company secretary trainee CS',        'courses': ['CS']},
    {'term': 'CS executive ICSI articleship',       'courses': ['CS']},
    {'term': 'secretarial compliance trainee',      'courses': ['CS']},
    # CMA India
    {'term': 'CMA industrial training ICMAI',       'courses': ['CMA India']},
    {'term': 'cost accountant trainee fresher',     'courses': ['CMA India']},
    # ACCA
    {'term': 'ACCA fresher jobs India',             'courses': ['ACCA']},
    {'term': 'ACCA affiliate audit India',          'courses': ['ACCA']},
    # CFA
    {'term': 'CFA candidate investment analyst',    'courses': ['CFA']},
    {'term': 'equity research analyst fresher CFA', 'courses': ['CFA']},
    # CPA US
    {'term': 'US CPA accounting fresher India',     'courses': ['CPA US']},
    {'term': 'US tax analyst CPA India',            'courses': ['CPA US']},
    # General finance fresher
    {'term': 'finance fresher accounts executive',  'courses': ['CA']},
    {'term': 'GST taxation fresher accountant',     'courses': ['CA']},
    {'term': 'FP&A analyst fresher India',          'courses': ['CA', 'CMA India']},
    {'term': 'internal audit fresher India',        'courses': ['CA']},
]

# Sites to query — configurable via JOBSPY_SITES env var
DEFAULT_SITES = ['indeed', 'glassdoor']   # LinkedIn rate-limits aggressively; Naukri is in beta
NAUKRI_QUERIES = [
    'CA articleship', 'article assistant', 'audit associate fresher',
    'CMA industrial training', 'CS executive trainee', 'ACCA fresher',
]

SENIOR_RE = re.compile(
    r'\b(senior|manager|lead\b|director|head of|vp\b|vice president|principal|partner|'
    r'[3-9]\+?\s*years?|[1-9]\d+\s*years?)\b', re.I
)


def _is_senior(title: str, description: str) -> bool:
    return bool(SENIOR_RE.search(title) or SENIOR_RE.search((description or '')[:600]))


def _parse_date(d) -> datetime:
    if d is None:
        return datetime.utcnow()
    if isinstance(d, datetime):
        return d.replace(tzinfo=None) if d.tzinfo else d
    if isinstance(d, date):
        return datetime(d.year, d.month, d.day)
    try:
        return datetime.fromisoformat(str(d).replace('Z', '+00:00')).replace(tzinfo=None)
    except Exception:
        return datetime.utcnow()


def _salary_monthly(row) -> int:
    """Convert annual/hourly salary to monthly INR estimate."""
    try:
        lo = float(row.get('min_amount') or 0)
        hi = float(row.get('max_amount') or 0)
        mid = (lo + hi) / 2 if lo and hi else (lo or hi)
        if mid <= 0:
            return 0
        interval = str(row.get('interval') or '').lower()
        currency = str(row.get('currency') or 'INR').upper()
        # Convert to monthly
        if 'year' in interval or 'annual' in interval:
            monthly = mid / 12
        elif 'hour' in interval:
            monthly = mid * 8 * 22  # 8h/day, 22 working days
        else:
            monthly = mid  # assume monthly
        # Rough USD → INR if needed
        if currency == 'USD':
            monthly *= 83
        return round(monthly)
    except Exception:
        return 0


def _run_jobspy_sync(sites: list[str], query: str, location: str, results: int) -> list[dict]:
    """Run jobspy synchronously (it's not async-native)."""
    try:
        from jobspy import scrape_jobs
        import pandas as pd
        df = scrape_jobs(
            site_name=sites,
            search_term=query,
            location=location,
            country_indeed='india',
            results_wanted=results,
            hours_old=168,       # last 7 days
            job_type='fulltime',
            fetch_description=False,
        )
        if df is None or df.empty:
            return []
        # Replace NaN with None for JSON safety
        df = df.where(pd.notnull(df), None)
        return df.to_dict('records')
    except Exception as e:
        logger.warning(f'JobSpy query "{query}" on {sites} failed: {e}')
        return []


def _run_naukri_sync(query: str, location: str, results: int) -> list[dict]:
    try:
        from jobspy import scrape_jobs
        import pandas as pd
        df = scrape_jobs(
            site_name=['naukri'],
            search_term=query,
            location=location,
            results_wanted=results,
            hours_old=168,
            fetch_description=False,
        )
        if df is None or df.empty:
            return []
        df = df.where(pd.notnull(df), None)
        return df.to_dict('records')
    except Exception as e:
        logger.warning(f'JobSpy Naukri query "{query}" failed: {e}')
        return []


async def _run_in_thread(fn, *args) -> list[dict]:
    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor(max_workers=1) as pool:
        return await loop.run_in_executor(pool, fn, *args)


async def fetch() -> list[NormalizedJob]:
    sites_env = os.getenv('JOBSPY_SITES', ','.join(DEFAULT_SITES))
    sites = [s.strip() for s in sites_env.split(',') if s.strip()]
    results_per_query = int(os.getenv('JOBSPY_RESULTS_PER_QUERY', '15'))
    location = os.getenv('JOBSPY_LOCATION', 'India')
    enable_naukri = os.getenv('JOBSPY_NAUKRI', 'true').lower() == 'true'

    seen: set[str] = set()
    jobs: list[NormalizedJob] = []

    # ── Run main queries on Indeed/Glassdoor/LinkedIn ─────────────────────
    main_sites = [s for s in sites if s != 'naukri']
    if main_sites:
        for q in QUERIES:
            rows = await _run_in_thread(_run_jobspy_sync, main_sites, q['term'], location, results_per_query)
            for row in rows:
                job_url = str(row.get('job_url') or row.get('job_url_direct') or '')
                if not job_url:
                    continue
                uid = f'jobspy-{row.get("site","")}-{row.get("id") or job_url[-30:]}'
                if uid in seen:
                    continue
                seen.add(uid)

                title = str(row.get('title') or '')
                desc = str(row.get('description') or '')
                company = str(row.get('company') or 'Unknown')

                if _is_senior(title, desc):
                    continue

                courses = await detect_courses(title, desc[:400]) or q['courses']
                job_type = 'articleship' if re.search(r'article|articleship|industrial train|trainee', f'{title} {desc}', re.I) else 'job'

                loc_parts = [row.get('location'), row.get('city'), row.get('state')]
                location_str = next((str(x) for x in loc_parts if x), location)

                posted_at = _parse_date(row.get('date_posted'))
                stipend = _salary_monthly(row) or extract_stipend(desc)

                site = str(row.get('site') or 'jobspy')
                source_key = f'jobspy_{site}'

                jobs.append(NormalizedJob(
                    source=source_key,
                    external_id=uid,
                    title=title,
                    company=company,
                    location=location_str,
                    stipend=stipend,
                    duration='',
                    courses=courses,
                    job_type=job_type,
                    apply_url=job_url,
                    description=desc[:2000] if desc else None,
                    is_remote=bool(row.get('is_remote')),
                    posted_at=posted_at,
                    raw_data=f'{{"site":"{site}","id":"{str(row.get("id",""))[:40]}"}}'
                ))
            # Polite delay between queries
            await asyncio.sleep(2)

    # ── Naukri queries ────────────────────────────────────────────────────
    if enable_naukri:
        for nq in NAUKRI_QUERIES:
            rows = await _run_in_thread(_run_naukri_sync, nq, location, results_per_query)
            for row in rows:
                job_url = str(row.get('job_url') or row.get('job_url_direct') or '')
                if not job_url:
                    continue
                uid = f'jobspy-naukri-{row.get("id") or job_url[-30:]}'
                if uid in seen:
                    continue
                seen.add(uid)

                title = str(row.get('title') or '')
                desc = str(row.get('description') or '')

                if _is_senior(title, desc):
                    continue

                courses = await detect_courses(title, desc[:400]) or ['CA']
                job_type = 'articleship' if re.search(r'article|articleship|industrial train|trainee', f'{title} {desc}', re.I) else 'job'
                loc_parts = [row.get('location'), row.get('city')]
                location_str = next((str(x) for x in loc_parts if x), 'India')
                stipend = _salary_monthly(row) or extract_stipend(desc)

                jobs.append(NormalizedJob(
                    source='jobspy_naukri',
                    external_id=uid,
                    title=title,
                    company=str(row.get('company') or 'Unknown'),
                    location=location_str,
                    stipend=stipend,
                    duration='',
                    courses=courses,
                    job_type=job_type,
                    apply_url=job_url,
                    description=desc[:2000] if desc else None,
                    is_remote=bool(row.get('is_remote')),
                    posted_at=_parse_date(row.get('date_posted')),
                    raw_data=f'{{"site":"naukri","id":"{str(row.get("id",""))[:40]}"}}'
                ))
            await asyncio.sleep(3)

    logger.info(f'[jobspy] Total fetched: {len(jobs)} jobs')
    return jobs
