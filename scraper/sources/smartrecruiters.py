"""SmartRecruiters public jobs API — free, no auth required.
API: GET https://api.smartrecruiters.com/v1/companies/{slug}/postings

Verified live on 2026-11-25:
  WNSGlobalServices144 → 354 jobs (Pune, Mumbai, Chennai, Gurugram, Bengaluru)
"""
import re
import httpx
import asyncio
import logging
from datetime import datetime
from scraper.types import NormalizedJob
from scraper.course_detector import detect_courses

logger = logging.getLogger(__name__)

# (slug, display_name) — only slugs verified to return >0 jobs
COMPANY_SLUGS: list[tuple[str, str]] = [
    ("WNSGlobalServices144", "WNS Global Services"),
]

FINANCE_RE = re.compile(
    r'\b(accountant|accounting|audit|tax|gst|financ|fp&a|payable|receivable|'
    r'payroll|treasury|controller|articleship|article\s+assistant|ca\b|acca|cfa|cma\b|'
    r'general\s+ledger|record\s+to\s+report|r2r|rtr|order\s+to\s+cash|o2c|'
    r'procure\s+to\s+pay|p2p|ifrs|gaap|statutory|compliance)\b',
    re.I
)

INDIA_RE = re.compile(
    r'\b(india|bangalore|bengaluru|mumbai|delhi|hyderabad|chennai|pune|kolkata|'
    r'ahmedabad|gurgaon|gurugram|noida|kochi|cochin|jaipur|chandigarh|thane|'
    r'navi\s+mumbai|remote)\b',
    re.I
)

_HDRS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json",
}

_BASE = "https://api.smartrecruiters.com/v1/companies/{slug}/postings"


def _parse_date(date_str: str) -> datetime:
    if not date_str:
        return datetime.utcnow()
    try:
        return datetime.fromisoformat(date_str.replace("Z", "+00:00")).replace(tzinfo=None)
    except Exception:
        return datetime.utcnow()


def _detect_job_type(title: str) -> str:
    t = title.lower()
    if re.search(r'articleship|article assistant|article trainee', t):
        return 'articleship'
    if re.search(r'intern|internship', t):
        return 'internship'
    if re.search(r'trainee|graduate trainee|management trainee', t):
        return 'trainee'
    return 'job'


async def _fetch_company(client: httpx.AsyncClient, slug: str, display_name: str) -> list[NormalizedJob]:
    url = _BASE.format(slug=slug)
    jobs: list[NormalizedJob] = []
    offset = 0
    limit = 100
    seen: set[str] = set()

    while True:
        params = {"limit": limit, "offset": offset}
        for attempt in range(3):
            try:
                r = await client.get(url, params=params, headers=_HDRS)
                if r.status_code in (429, 503):
                    await asyncio.sleep(2 ** attempt * 2)
                    continue
                break
            except httpx.TimeoutException:
                await asyncio.sleep(2 ** attempt)
        else:
            break

        if r.status_code != 200:
            logger.warning(f"[smartrecruiters] {display_name} → {r.status_code}")
            break

        data = r.json()
        postings = data.get("content") or []
        if not postings:
            break

        for p in postings:
            job_id = p.get("id") or p.get("uuid") or ""
            title = (p.get("name") or "").strip()
            if not job_id or not title or job_id in seen:
                continue
            seen.add(job_id)

            loc = p.get("location") or {}
            city = loc.get("city") or ""
            country_code = (loc.get("country") or "").lower()
            full_loc = loc.get("fullLocation") or f"{city}, India"

            # India filter
            if country_code not in ("in", "") and not INDIA_RE.search(full_loc):
                continue
            if country_code and country_code != "in":
                continue

            # Finance filter
            if not FINANCE_RE.search(title):
                continue

            apply_url = (
                f"https://jobs.smartrecruiters.com/{slug}/{job_id}"
            )
            released = p.get("releasedDate") or p.get("createdOnDate") or ""
            posted_at = _parse_date(released)

            jobs.append(NormalizedJob(
                source="smartrecruiters",
                external_id=f"sr-{slug}-{job_id}",
                title=title,
                company=display_name,
                location=full_loc,
                stipend=0,
                duration="",
                courses=[],
                job_type=_detect_job_type(title),
                apply_url=apply_url,
                description=f"{title} at {display_name} ({full_loc})",
                is_remote=loc.get("remote", False),
                posted_at=posted_at,
                raw_data=f'{{"slug":"{slug}","id":"{job_id[:40]}"}}',
            ))

        total = data.get("totalFound") or 0
        offset += limit
        if offset >= total:
            break
        await asyncio.sleep(0.5)

    logger.info(f"[smartrecruiters] {display_name}: {len(jobs)} India finance jobs")
    return jobs


async def fetch() -> list[NormalizedJob]:
    all_jobs: list[NormalizedJob] = []

    async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
        for slug, display_name in COMPANY_SLUGS:
            try:
                jobs = await _fetch_company(client, slug, display_name)
                all_jobs.extend(jobs)
            except Exception as e:
                logger.error(f"[smartrecruiters] {display_name} failed: {e}")
            await asyncio.sleep(1)

    for job in all_jobs:
        job.courses = await detect_courses(job.title, job.description or "")

    return all_jobs
