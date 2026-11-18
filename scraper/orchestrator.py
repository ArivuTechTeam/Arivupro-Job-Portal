"""
Main sync orchestrator — runs all sources, upserts to Supabase.
Ported from articleship: src/lib/sync/index.ts
"""
import os
import re
import asyncio
import logging
import time
from typing import Optional
from supabase import Client

from scraper.types import NormalizedJob, SyncResult, SOURCE_NAMES
from scraper.dedup import build_fingerprint, is_over_experience_cap

# ── Relevance filters ──────────────────────────────────────────────────────
_FINANCE_KEYWORDS = {
    'ca', 'chartered accountant', 'cma', 'cs ', 'company secretary',
    'acca', 'cfa', 'audit', 'auditor', 'articleship', 'article assistant',
    'tax', 'taxation', 'gst', 'income tax', 'tds', 'indirect tax',
    'finance', 'financial', 'accounts', 'accountant', 'accounting',
    'bookkeeping', 'book keeping', 'payroll', 'compliance',
    'investment banking', 'equity research', 'valuation', 'treasury',
    'credit', 'risk', 'analyst', 'fp&a', 'management accounting',
    'cost accounting', 'ifrs', 'ind as', 'statutory', 'internal audit',
    'big 4', 'deloitte', 'pwc', 'kpmg', 'ey ', 'ernst', 'grant thornton',
    'bdo', 'icai', 'icmai', 'icsi', 'nifm', 'sebi', 'rbi', 'nbfc',
}

_INDIA_INDICATORS = {
    'india', 'bangalore', 'bengaluru', 'mumbai', 'delhi', 'hyderabad',
    'chennai', 'pune', 'kolkata', 'ahmedabad', 'gurgaon', 'gurugram',
    'noida', 'navi mumbai', 'thane', 'kochi', 'cochin', 'jaipur',
    'chandigarh', 'lucknow', 'bhopal', 'surat', 'coimbatore', 'remote',
    'work from home', 'wfh', 'pan india', 'anywhere in india',
}

_NON_INDIA = {
    'uk', 'united kingdom', 'london', 'manchester', 'leeds', 'birmingham',
    'usa', 'united states', 'new york', 'us ', 'canada', 'australia',
    'singapore', 'dubai', 'uae', 'germany', 'france', 'netherlands',
    'harrogate', 'yorkshire', 'scotland', 'wales', 'ireland',
}

def _is_relevant(job: NormalizedJob) -> bool:
    text = f"{job.title} {job.description or ''} {' '.join(job.courses or [])}".lower()
    loc = (job.location or '').lower()

    # Reject if clearly non-India location
    if any(k in loc for k in _NON_INDIA):
        return False

    # Accept if India location confirmed
    india_loc = any(k in loc for k in _INDIA_INDICATORS)

    # Accept if finance keyword in title/description
    finance_match = any(k in text for k in _FINANCE_KEYWORDS)

    # Must match at least one of: India location OR finance keyword
    return india_loc or finance_match

# ── Title cleaner ──────────────────────────────────────────────────────────
_TITLE_NOISE = re.compile(
    r':\s*apply\s+now[!.]?'       # ": Apply Now!"
    r'|[\[\(][^\]\)]{0,60}[\]\)]' # [Stipend: Rs. 8000] or (Mumbai)
    r'|\bat\s+[A-Z][^,]{3,40}(?:,|$)'  # "at Firm Name,"
    r'|\s*[-–|]\s*.{0,40}$',      # " - some trailing noise"
    re.I
)

def _clean_title(title: str) -> str:
    t = _TITLE_NOISE.sub('', title).strip().rstrip(',:- ')
    # Capitalise first letter, limit length
    return t[:80] if t else title[:80]

# Source fetcher registry
from scraper.sources.caclubindia import fetch as fetch_caclubindia
from scraper.sources.icai_eirc import fetch as fetch_icai_eirc
from scraper.sources.icai_nirc import fetch as fetch_icai_nirc
from scraper.sources.icai_kochi import fetch as fetch_icai_kochi
from scraper.sources.icai_sirc import fetch as fetch_icai_sirc
from scraper.sources.icai_wirc import fetch as fetch_icai_wirc
from scraper.sources.icai_pune import fetch as fetch_icai_pune
from scraper.sources.icai_bangalore import fetch as fetch_icai_bangalore
from scraper.sources.icmai import fetch as fetch_icmai
from scraper.sources.buddingca import fetch as fetch_buddingca
from scraper.sources.jsearch import fetch as fetch_jsearch
from scraper.sources.jobspy_source import fetch as fetch_jobspy
from scraper.sources.apify_all_in_one import fetch as fetch_apify_all_in_one
from scraper.sources.apify_naukri import fetch as fetch_apify_naukri
from scraper.sources.apify_linkedin_indeed import fetch as fetch_apify_linkedin_indeed
from scraper.sources.apify_career_sites import fetch as fetch_apify_career_sites
from scraper.sources.greenhouse import fetch as fetch_greenhouse
from scraper.sources.lever import fetch as fetch_lever
from scraper.sources.workday import fetch as fetch_workday

logger = logging.getLogger(__name__)

SOURCE_FETCHERS: dict = {
    'caclubindia':    fetch_caclubindia,
    'icai_eirc':      fetch_icai_eirc,
    'icai_nirc':      fetch_icai_nirc,
    'icai_kochi':     fetch_icai_kochi,
    'icai_sirc':      fetch_icai_sirc,
    'icai_wirc':      fetch_icai_wirc,
    'icai_pune':      fetch_icai_pune,
    'icai_bangalore': fetch_icai_bangalore,
    'icmai':          fetch_icmai,
    'buddingca':      fetch_buddingca,
    'jsearch':                  fetch_jsearch,
    'jobspy':                   fetch_jobspy,
    'apify_all_in_one':         fetch_apify_all_in_one,
    'apify_naukri':             fetch_apify_naukri,
    'apify_linkedin_indeed':    fetch_apify_linkedin_indeed,
    'apify_career_sites':       fetch_apify_career_sites,
    'greenhouse':               fetch_greenhouse,
    'lever':                    fetch_lever,
    'workday':                  fetch_workday,
}


async def upsert_job(supabase: Client, job: NormalizedJob) -> str:
    """Returns 'created' | 'updated' | 'duplicate' | 'capped'"""
    if is_over_experience_cap(job):
        return 'capped'

    fp = build_fingerprint(job)

    # Cross-source dedup check
    cross = supabase.table('external_jobs').select('id').eq('content_fingerprint', fp).neq('source', job.source).limit(1).execute()
    if cross.data:
        return 'duplicate'

    # Check if same-source record exists
    try:
        existing = supabase.table('external_jobs').select('id').eq('source', job.source).eq('external_id', job.external_id).limit(1).execute()
    except Exception:
        existing = type('R', (), {'data': []})()

    record = {
        'source': job.source,
        'external_id': job.external_id,
        'title': job.title,
        'company': job.company,
        'location': job.location,
        'stipend': job.stipend,
        'duration': job.duration,
        'courses': job.courses,
        'job_type': job.job_type,
        'apply_url': job.apply_url,
        'description': job.description,
        'is_remote': job.is_remote,
        'posted_at': job.posted_at.isoformat(),
        'is_active': True,
        'content_fingerprint': fp,
        'raw_data': job.raw_data,
        'experience_level': job.experience_level,
    }

    if existing.data:
        # Update — refresh key fields
        supabase.table('external_jobs').update({
            'title': job.title,
            'company': job.company,
            'location': job.location,
            'stipend': job.stipend,
            'duration': job.duration,
            'description': job.description,
            'job_type': job.job_type,
            'is_remote': job.is_remote,
            'is_active': True,
            'content_fingerprint': fp,
        }).eq('source', job.source).eq('external_id', job.external_id).execute()
        return 'updated'
    else:
        supabase.table('external_jobs').insert(record).execute()
        return 'created'


async def run_source_sync(supabase: Client, source: str) -> SyncResult:
    start = time.time()
    result = SyncResult(source=source)

    # Log sync start
    sync_run = supabase.table('sync_runs').insert({'source': source, 'status': 'running'}).execute()
    run_id = sync_run.data[0]['id'] if sync_run.data else None

    try:
        fetcher = SOURCE_FETCHERS.get(source)
        if not fetcher:
            raise ValueError(f'No fetcher for source: {source}')

        jobs: list[NormalizedJob] = await fetcher()
        result.fetched = len(jobs)

        for job in jobs:
            if not _is_relevant(job):
                result.skipped += 1
                continue
            job.title = _clean_title(job.title)
            try:
                outcome = await upsert_job(supabase, job)
                if outcome == 'created':
                    result.created += 1
                elif outcome == 'updated':
                    result.updated += 1
                elif outcome == 'duplicate':
                    result.duplicates += 1
                else:
                    result.skipped += 1
            except Exception as e:
                result.skipped += 1
                logger.warning(f'[{source}] upsert failed for {job.external_id}: {e}')

        result.duration_ms = round((time.time() - start) * 1000)

        if run_id:
            supabase.table('sync_runs').update({
                'status': 'ok',
                'fetched': result.fetched,
                'created': result.created,
                'updated': result.updated,
                'duplicates': result.duplicates,
                'skipped': result.skipped,
            }).eq('id', run_id).execute()

    except Exception as e:
        result.error = str(e)
        result.duration_ms = round((time.time() - start) * 1000)
        logger.error(f'[{source}] sync failed: {e}')
        if run_id:
            supabase.table('sync_runs').update({
                'status': 'error',
                'error_msg': str(e)[:500],
            }).eq('id', run_id).execute()

    return result


async def run_all_sources(supabase: Client, sources: Optional[list[str]] = None) -> list[SyncResult]:
    env_enabled = os.getenv('SYNC_SOURCES_ENABLED', '')
    default = [s.strip() for s in env_enabled.split(',') if s.strip()] if env_enabled else SOURCE_NAMES
    enabled = sources or default
    tasks = [run_source_sync(supabase, s) for s in enabled]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    final: list[SyncResult] = []
    for i, r in enumerate(results):
        if isinstance(r, Exception):
            final.append(SyncResult(source=enabled[i], error=str(r)))
        else:
            final.append(r)

    return final
