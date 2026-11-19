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
from scraper.parse_utils import extract_stipend, logo_url_from_company

logger = logging.getLogger(__name__)

# ── ArivuPro finance job search queries ──────────────────────────────────────
QUERIES = [
    # ── Articleship (CA / CMA mandatory training) ────────────────────────────
    {'term': 'CA articleship vacancy India',               'courses': ['CA']},
    {'term': 'article assistant CA firm India',            'courses': ['CA']},
    {'term': 'CA Inter articleship training',              'courses': ['CA']},
    {'term': 'CMA industrial training ICMAI',              'courses': ['CMA India']},
    {'term': 'CS executive articleship ICSI',              'courses': ['CS']},

    # ── Internship — finance / accounting ────────────────────────────────────
    {'term': 'finance internship fresher India',           'courses': ['CA']},
    {'term': 'accounting internship B.Com India',          'courses': ['CA']},
    {'term': 'audit internship India',                     'courses': ['CA', 'ACCA']},
    {'term': 'tax internship India',                       'courses': ['CA']},
    {'term': 'investment banking internship India',        'courses': ['CFA']},
    {'term': 'equity research internship India',           'courses': ['CFA']},
    {'term': 'ACCA internship India',                      'courses': ['ACCA']},
    {'term': 'CFA internship finance India',               'courses': ['CFA']},
    {'term': 'US CPA internship India',                    'courses': ['CPA US']},
    {'term': 'FP&A internship India',                      'courses': ['CA', 'CMA India']},
    {'term': 'compliance internship India',                'courses': ['CS']},
    {'term': 'risk management internship India',           'courses': ['CA', 'CFA']},

    # ── Trainee / Graduate roles ──────────────────────────────────────────────
    {'term': 'finance graduate trainee India',             'courses': ['CA']},
    {'term': 'audit trainee Big 4 India',                  'courses': ['CA', 'ACCA']},
    {'term': 'accounts trainee fresher India',             'courses': ['CA']},
    {'term': 'tax trainee India',                          'courses': ['CA']},
    {'term': 'management trainee finance India',           'courses': ['CA', 'CMA India']},
    {'term': 'company secretary trainee India',            'courses': ['CS']},
    {'term': 'cost accountant trainee India',              'courses': ['CMA India']},

    # ── Entry-level jobs (0–2 yrs) ────────────────────────────────────────────
    {'term': 'audit associate fresher India',              'courses': ['CA', 'ACCA']},
    {'term': 'tax associate fresher India',                'courses': ['CA']},
    {'term': 'accounts executive fresher India',           'courses': ['CA']},
    {'term': 'financial analyst fresher India',            'courses': ['CA', 'CFA']},
    {'term': 'GST executive fresher India',                'courses': ['CA']},
    {'term': 'internal audit associate India',             'courses': ['CA']},
    {'term': 'FP&A analyst fresher India',                 'courses': ['CA', 'CMA India']},
    {'term': 'equity research analyst fresher India',      'courses': ['CFA']},
    {'term': 'investment analyst fresher CFA India',       'courses': ['CFA']},
    {'term': 'US CPA accounting fresher India',            'courses': ['CPA US']},
    {'term': 'ACCA affiliate jobs India',                  'courses': ['ACCA']},
    {'term': 'fund accountant fresher India',              'courses': ['CA', 'ACCA']},
    {'term': 'credit analyst fresher India',               'courses': ['CA', 'CFA']},
    {'term': 'B.Com finance fresher jobs India',           'courses': ['CA']},
    {'term': 'BBA finance fresher jobs India',             'courses': ['CA']},
]

DEFAULT_SITES = ['indeed', 'glassdoor', 'linkedin']
NAUKRI_QUERIES = [
    # Articleship
    'CA articleship', 'article assistant', 'CMA industrial training',
    # Internship
    'finance internship fresher', 'audit internship', 'accounting internship',
    'investment banking internship India', 'ACCA internship',
    # Trainee
    'finance trainee fresher', 'audit trainee', 'management trainee finance',
    # Jobs
    'audit associate fresher', 'accounts executive fresher',
    'financial analyst fresher', 'GST executive fresher',
    'CS executive trainee', 'ACCA fresher jobs',
]

SENIOR_RE = re.compile(
    r'\b(senior\s+manager|associate\s+director|deputy\s+manager|'
    r'avp\b|assistant\s+vice\s+president|vice\s+president\b|'
    r'director\b|head\s+of|partner\b|principal\b|'
    r'minimum\s+[3-9]\s*years?|at\s*least\s*[3-9]\s*years?)\b', re.I
)

ARTICLESHIP_RE = re.compile(r'\b(article|articleship|industrial\s+train)\b', re.I)
INTERNSHIP_RE  = re.compile(r'\b(intern(ship)?|summer\s+intern|winter\s+intern)\b', re.I)
TRAINEE_RE     = re.compile(r'\b(trainee|graduate\s+trainee|management\s+trainee|'
                             r'junior\s+trainee|entry.?level\s+trainee)\b', re.I)


def _is_senior(title: str, description: str) -> bool:
    return bool(SENIOR_RE.search(title) or SENIOR_RE.search((description or '')[:600]))


def _exp_level(title: str, desc: str, job_type: str) -> str | None:
    text = f'{title} {desc[:800]}'.lower()
    if re.search(r'fresher|0\s*exp|0[-–]1\s*year|article\s*student|articleship', text):
        return 'fresher'
    if re.search(r'1[-–]2\s*years?|one\s+to\s+two|upto?\s*2\s*years?|up\s+to\s+2\s*years?', text):
        return '1-3 years'
    if re.search(r'0[-–]1\s*years?|up\s+to\s*1\s*year', text):
        return '0-1 year'
    if job_type == 'articleship':
        return 'fresher'
    return None


def _detect_job_type(title: str, desc: str) -> str:
    text = f'{title} {desc[:300]}'
    if ARTICLESHIP_RE.search(text):
        return 'articleship'
    if INTERNSHIP_RE.search(text):
        return 'internship'
    if TRAINEE_RE.search(text):
        return 'trainee'
    return 'job'


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
                job_type = _detect_job_type(title, desc)

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
                    experience_level=_exp_level(title, desc, job_type),
                    logo_url=logo_url_from_company(company, job_url),
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
                job_type = _detect_job_type(title, desc)
                loc_parts = [row.get('location'), row.get('city')]
                location_str = next((str(x) for x in loc_parts if x), 'India')
                stipend = _salary_monthly(row) or extract_stipend(desc)
                company_naukri = str(row.get('company') or 'Unknown')

                jobs.append(NormalizedJob(
                    source='jobspy_naukri',
                    external_id=uid,
                    title=title,
                    company=company_naukri,
                    location=location_str,
                    stipend=stipend,
                    duration='',
                    courses=courses,
                    job_type=job_type,
                    apply_url=job_url,
                    description=desc[:2000] if desc else None,
                    is_remote=bool(row.get('is_remote')),
                    posted_at=_parse_date(row.get('date_posted')),
                    experience_level=_exp_level(title, desc, job_type),
                    logo_url=logo_url_from_company(company_naukri, job_url),
                    raw_data=f'{{"site":"naukri","id":"{str(row.get("id",""))[:40]}"}}'
                ))
            await asyncio.sleep(3)

    logger.info(f'[jobspy] Total fetched: {len(jobs)} jobs')
    return jobs
