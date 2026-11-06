"""
Main sync orchestrator — runs all sources, upserts to Supabase.
Ported from articleship: src/lib/sync/index.ts
"""
import os
import asyncio
import logging
import time
from typing import Optional
from supabase import Client

from scraper.types import NormalizedJob, SyncResult, SOURCE_NAMES
from scraper.dedup import build_fingerprint, is_over_experience_cap

# Source fetcher registry
from scraper.sources.caclubindia import fetch as fetch_caclubindia
from scraper.sources.icai_eirc import fetch as fetch_icai_eirc
from scraper.sources.icai_kochi import fetch as fetch_icai_kochi
from scraper.sources.icai_sirc import fetch as fetch_icai_sirc
from scraper.sources.icai_wirc import fetch as fetch_icai_wirc
from scraper.sources.icai_pune import fetch as fetch_icai_pune
from scraper.sources.icai_bangalore import fetch as fetch_icai_bangalore
from scraper.sources.icmai import fetch as fetch_icmai
from scraper.sources.buddingca import fetch as fetch_buddingca
from scraper.sources.jsearch import fetch as fetch_jsearch
from scraper.sources.jobspy_source import fetch as fetch_jobspy
from scraper.sources.apify_multi_board import fetch as fetch_apify_multi_board
from scraper.sources.apify_google_jobs import fetch as fetch_apify_google_jobs
from scraper.sources.apify_career_sites import fetch as fetch_apify_career_sites

logger = logging.getLogger(__name__)

SOURCE_FETCHERS: dict = {
    'caclubindia':    fetch_caclubindia,
    'icai_eirc':      fetch_icai_eirc,
    'icai_kochi':     fetch_icai_kochi,
    'icai_sirc':      fetch_icai_sirc,
    'icai_wirc':      fetch_icai_wirc,
    'icai_pune':      fetch_icai_pune,
    'icai_bangalore': fetch_icai_bangalore,
    'icmai':          fetch_icmai,
    'buddingca':      fetch_buddingca,
    'jsearch':              fetch_jsearch,
    'jobspy':               fetch_jobspy,
    'apify_multi_board':    fetch_apify_multi_board,
    'apify_google_jobs':    fetch_apify_google_jobs,
    'apify_career_sites':   fetch_apify_career_sites,
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
