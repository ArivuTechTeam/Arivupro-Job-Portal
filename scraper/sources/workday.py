"""Workday CXS API scraper — plain httpx, no Playwright, no CSRF token needed.

Workday's public job search API accepts unauthenticated POST requests:
  POST https://{tenant}.{shard}.myworkdayjobs.com/wday/cxs/{tenant}/{site}/jobs

Each board is verified live before inclusion. Boards that return 422 are removed.
Addresses verified on 2026-11-25:
  accenture.wd103    / AccentureCareers          → 200, ~2000 total, India finance jobs confirmed
  genpact.wd108      / External_Careers          → 200, ~720 total, India finance jobs confirmed
  pwc.wd3            / Global_Experienced_Careers → 200, 49 total, 5 India finance jobs confirmed (2026-11-25)
Boards tested and rejected:
  nvidia.wd5         / NVIDIAExternalCareerSite  → 200 but 0 India finance jobs (all US/global engineering)
  deloitteie.wd3     / experienced_professionals → 200 but Ireland-only (Belfast/Dublin), no India jobs
  collaborative.wd1  / AllOpenings              → 200 but Cognizant Workday-practice board, only 1 job
  wns.wd1/wd3/wd5                               → 422 (WNS uses SmartRecruiters, not Workday)
  cognizant.wd1/wd3  / CognizantCareers         → 422/401
  deloitte.wd1       / DeloitteUSACareers        → 422
  deloittein.wd3     / DeloitteIndiaCareers      → 422
  kpmg.wd3/wd5/wd1   / multiple sites           → 422 (KPMG India uses Oracle Recruiting Cloud)
  Deloitte USI (Avature), EY (SAP SF), KPMG (Oracle RC), Wipro (SAP SF) → no public Workday API
"""
import re
import asyncio
import httpx
import logging
from datetime import datetime, timedelta
from scraper.types import NormalizedJob
from scraper.course_detector import detect_courses

logger = logging.getLogger(__name__)

# Only verified boards — (tenant, shard, site, display_name)
# To add a new company: test POST to /wday/cxs/{tenant}/{site}/jobs first; 200 required.
COMPANY_BOARDS: list[tuple[str, str, str, str]] = [
    ("accenture", "wd103", "AccentureCareers",          "Accenture"),
    ("genpact",   "wd108", "External_Careers",           "Genpact"),
    ("pwc",       "wd3",   "Global_Experienced_Careers", "PwC"),
]

SEARCH_TERMS = ["audit India", "tax India", "payroll India", "finance India"]

FINANCE_RE = re.compile(
    r'\b(accountant|accounting|audit|tax|gst|financ|fp&a|payable|receivable|'
    r'payroll|treasury|controller|articleship|article\s+assistant|ca\b|acca|cfa|cma\b)',
    re.I
)
# "quality audit"/"quality auditing" are operations-QA roles, not finance.
# Exclude them unless the title also contains a finance-specific word.
_QUALITY_AUDIT_RE = re.compile(r'\bquality\s+audit', re.I)
_FINANCE_WORD_RE = re.compile(
    r'\b(accountant|accounting|tax|gst|financ|statutory|internal\s+audit)\b', re.I
)

INDIA_RE = re.compile(
    r'\b(india|bangalore|bengaluru|mumbai|delhi|hyderabad|chennai|pune|kolkata|'
    r'ahmedabad|gurgaon|gurugram|noida|kochi|cochin|jaipur|chandigarh|remote)\b',
    re.I
)

_HDRS = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
}


def _parse_posted_on(text: str) -> datetime | None:
    """Convert Workday 'postedOn' text to a datetime. Returns None if unrecognised."""
    t = (text or "").strip().lower()
    if not t:
        return None
    if "today" in t:
        return datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    if "yesterday" in t:
        return datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=1)
    # "Posted 5 Days Ago" or "5 Days Ago"
    m = re.search(r'(\d+)\+?\s+days?\s+ago', t)
    if m:
        return datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=int(m.group(1)))
    # "30+ Days Ago"
    if "30+" in t:
        return datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=30)
    return None


async def _fetch_board(
    client: httpx.AsyncClient,
    tenant: str,
    shard: str,
    site: str,
    display_name: str,
) -> list[NormalizedJob]:
    base = f"https://{tenant}.{shard}.myworkdayjobs.com"
    api_url = f"{base}/wday/cxs/{tenant}/{site}/jobs"
    cutoff = datetime.utcnow() - timedelta(days=29)  # Workday's finest grain: "30+ Days Ago" = 30 days; keep everything under 30

    seen: set[str] = set()
    jobs: list[NormalizedJob] = []
    found = kept = skipped = 0

    for term in SEARCH_TERMS:
        body = {"appliedFacets": {}, "limit": 20, "offset": 0, "searchText": term}
        for attempt in range(3):
            try:
                r = await client.post(api_url, json=body, headers=_HDRS)
                if r.status_code == 429 or r.status_code == 503:
                    await asyncio.sleep(2 ** attempt * 2)
                    continue
                if r.status_code != 200:
                    logger.warning(f"[workday] {display_name} term={term!r} → {r.status_code}")
                break
            except httpx.TimeoutException:
                await asyncio.sleep(2 ** attempt)
        else:
            continue

        if r.status_code != 200:
            continue

        for p in r.json().get("jobPostings", []):
            title = (p.get("title") or "").strip()
            path = p.get("externalPath") or ""
            # externalId not in API response — derive from externalPath
            # e.g. /job/Bengaluru/Payroll-Team-Lead_R123456 → R123456
            id_m = re.search(r'_([A-Z0-9-]+)$', path)
            ext_id = id_m.group(1) if id_m else path.rsplit("/", 1)[-1]
            if not ext_id or not title or ext_id in seen:
                continue
            found += 1
            seen.add(ext_id)

            # Date filter — drop unparseable or older than 29 days (Workday's finest grain before "30+ Days Ago")
            posted_at = _parse_posted_on(p.get("postedOn", ""))
            if posted_at is None or posted_at < cutoff:
                skipped += 1
                continue

            # Finance filter
            loc_text = p.get("locationsText") or ""
            combined = f"{title} {loc_text}"
            if not FINANCE_RE.search(combined):
                skipped += 1
                continue
            # Exclude "quality audit" / "quality auditing" unless title also has a finance word
            if _QUALITY_AUDIT_RE.search(title) and not _FINANCE_WORD_RE.search(title):
                skipped += 1
                continue

            # India filter — locationsText is often None; fall back to externalPath city
            india_check = f"{loc_text} {path}"
            if not INDIA_RE.search(india_check):
                skipped += 1
                continue

            apply_url = f"{base}{path}" if path else f"{base}/en-US/{site}/job/{ext_id}"
            # Extract city from externalPath when locationsText is absent
            # e.g. /job/Bengaluru-BDC7C/Title_R123 → "Bengaluru, India"
            if not loc_text and path:
                city_m = re.match(r'/job/([A-Za-z]+)', path)
                loc_text = f"{city_m.group(1)}, India" if city_m else "India"
            kept += 1
            jobs.append(NormalizedJob(
                source="workday",
                external_id=f"wd-{tenant}-{ext_id}",
                title=title,
                company=display_name,
                location=loc_text or "India",
                stipend=0,
                duration="",
                courses=[],
                job_type="job",
                apply_url=apply_url,
                description=f"{title} at {display_name} ({loc_text or 'India'})",
                is_remote=bool(re.search(r'remote|work from home|wfh', combined, re.I)),
                posted_at=posted_at,
                raw_data=f'{{"company":"{display_name}","ext_id":"{ext_id[:40]}"}}',
            ))

        await asyncio.sleep(1)  # 1 req/sec courtesy delay per term

    logger.info(f"[workday] {display_name}: found={found} kept={kept} skipped={skipped}")
    return jobs


async def fetch() -> list[NormalizedJob]:
    all_jobs: list[NormalizedJob] = []

    async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
        for tenant, shard, site, display_name in COMPANY_BOARDS:
            try:
                jobs = await _fetch_board(client, tenant, shard, site, display_name)
                all_jobs.extend(jobs)
            except Exception as e:
                logger.error(f"[workday] {display_name} failed: {e}")
            await asyncio.sleep(1)

    for job in all_jobs:
        job.courses = await detect_courses(job.title, job.description or "")

    return all_jobs
