"""
Apify — LinkedIn + Indeed Jobs Scraper
Actor: cheap_scraper/linkedin-job-scraper (LinkedIn) + valig/indeed-jobs-scraper (Indeed)
Single module that runs both actors concurrently and merges results.
Pricing: LinkedIn ~$0.35–0.70/1,000 (57,991 users, 99.9% success) · Indeed ~$0.07–0.10/1,000 (42,076 users, 100% success).
Free tier: included on Apify free plan.
Why: Deepest LinkedIn/Indeed coverage — JobSpy has rate-limit issues at scale.
"""
import os
import re
import hashlib
import httpx
import logging
import asyncio
from datetime import datetime
from scraper.types import NormalizedJob
from scraper.course_detector import detect_courses
from scraper.parse_utils import extract_stipend, logo_url_from_company

logger = logging.getLogger(__name__)

LINKEDIN_ACTOR_ID = os.getenv("APIFY_LINKEDIN_ACTOR_ID", "cheap_scraper/linkedin-job-scraper")
INDEED_ACTOR_ID = os.getenv("APIFY_INDEED_ACTOR_ID", "valig/indeed-jobs-scraper")
APIFY_BASE = "https://api.apify.com/v2"

# Shared query list — used for both LinkedIn and Indeed
SEARCH_QUERIES = [
    # ── Full-time roles ────────────────────────────────────────────────────
    {"query": "audit associate fresher",                "courses": ["CA"]},
    {"query": "accounts executive fresher",             "courses": ["CA", "B.Com"]},
    {"query": "financial analyst fresher",              "courses": ["CA", "CFA"]},
    {"query": "tax associate fresher",                  "courses": ["CA"]},
    {"query": "internal audit associate fresher",       "courses": ["CA"]},
    {"query": "FP&A analyst fresher",                   "courses": ["CA", "CMA India"]},
    {"query": "cost accountant fresher",                "courses": ["CMA India"]},
    {"query": "company secretary fresher",              "courses": ["CS"]},
    {"query": "ACCA fresher audit",                     "courses": ["ACCA"]},
    {"query": "CFA level 1 fresher",                    "courses": ["CFA"]},
    {"query": "US CPA fresher GCC India",               "courses": ["CPA US"]},
    {"query": "credit analyst fresher",                 "courses": ["CA", "CFA"]},
    {"query": "compliance officer fresher",             "courses": ["CS", "CA"]},
    {"query": "equity research analyst fresher",        "courses": ["CFA"]},
    {"query": "shared services finance fresher",        "courses": ["CA", "CMA India", "B.Com"]},
    {"query": "audit associate Big 4 India",            "courses": ["CA"]},
    # ── Articleship / internship / trainee ────────────────────────────────
    {"query": "CA articleship vacancy India",           "courses": ["CA"]},
    {"query": "CMA industrial training India",          "courses": ["CMA India"]},
    {"query": "finance internship India",               "courses": ["CA", "CMA India", "ACCA", "B.Com"]},
    {"query": "management trainee finance India",       "courses": ["CA", "CMA India"]},
]

SENIOR_RE = re.compile(
    r'\b(senior|manager|lead\b|director|head of|vp\b|vice president|principal|partner|'
    r'[3-9]\+?\s*years?|[1-9]\d+\s*years?)\b', re.I
)


def _is_senior(title: str, desc: str) -> bool:
    return bool(SENIOR_RE.search(title) or SENIOR_RE.search((desc or "")[:600]))


def _parse_date(val) -> datetime:
    if not val:
        return datetime.utcnow()
    if isinstance(val, datetime):
        return val.replace(tzinfo=None) if val.tzinfo else val
    try:
        return datetime.fromisoformat(str(val).replace("Z", "+00:00")).replace(tzinfo=None)
    except Exception:
        return datetime.utcnow()


def _salary(item: dict) -> int:
    sal_str = str(item.get("salary") or item.get("salaryText") or "")
    if sal_str:
        return extract_stipend(sal_str)
    lo = float(item.get("salaryMin") or item.get("minSalary") or 0)
    hi = float(item.get("salaryMax") or item.get("maxSalary") or 0)
    mid = (lo + hi) / 2 if lo and hi else (lo or hi)
    if mid <= 0:
        return 0
    if mid > 200000:
        mid /= 12
    currency = str(item.get("currency") or "INR").upper()
    if currency == "USD":
        mid *= float(os.getenv("USD_INR_RATE", "85"))
    return round(mid)


async def _run_actor(api_token: str, actor_id: str, payload: dict, timeout_secs: int = 120) -> list[dict]:
    headers = {"Authorization": f"Bearer {api_token}", "Content-Type": "application/json"}
    async with httpx.AsyncClient(timeout=30) as client:
        run_resp = await client.post(
            f"{APIFY_BASE}/acts/{actor_id}/runs",
            headers=headers,
            json=payload,
        )
        run_resp.raise_for_status()
        run_data = run_resp.json().get("data", {})
        run_id = run_data.get("id")
        dataset_id = run_data.get("defaultDatasetId")
        if not run_id:
            raise RuntimeError("Apify run start returned no run ID")

        logger.info(f"[apify_li_indeed] actor={actor_id} run={run_id} started, polling…")

        for _ in range(timeout_secs // 5):
            await asyncio.sleep(5)
            status_resp = await client.get(
                f"{APIFY_BASE}/actor-runs/{run_id}", headers=headers
            )
            status_resp.raise_for_status()
            status = status_resp.json().get("data", {}).get("status", "")
            if status in ("SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"):
                break

        if status != "SUCCEEDED":
            logger.warning(f"[apify_li_indeed] actor={actor_id} run={run_id} ended: {status}")
            return []

        items_resp = await client.get(
            f"{APIFY_BASE}/datasets/{dataset_id}/items",
            headers=headers,
            params={"format": "json", "clean": "true"},
        )
        items_resp.raise_for_status()
        return items_resp.json() or []


async def _fetch_linkedin(api_token: str, q: dict, max_results: int) -> tuple[dict, list[dict], str]:
    payload = {
        "keywords": q["query"],
        "location": "India",
        "maxItems": max_results,
        "includeDescription": True,
        "experienceLevel": "ENTRY_LEVEL",
    }
    try:
        items = await _run_actor(api_token, LINKEDIN_ACTOR_ID, payload)
        return q, items, "linkedin"
    except Exception as e:
        logger.warning(f"[apify_li_indeed] LinkedIn query '{q['query']}' failed: {e}")
        return q, [], "linkedin"


async def _fetch_indeed(api_token: str, q: dict, max_results: int) -> tuple[dict, list[dict], str]:
    payload = {
        "keyword": q["query"],
        "location": "India",
        "maxItems": max_results,
        "includeDescription": True,
    }
    try:
        items = await _run_actor(api_token, INDEED_ACTOR_ID, payload)
        return q, items, "indeed"
    except Exception as e:
        logger.warning(f"[apify_li_indeed] Indeed query '{q['query']}' failed: {e}")
        return q, [], "indeed"


def _normalize(item: dict, q: dict, platform: str) -> NormalizedJob | None:
    raw_id = str(item.get("id") or item.get("jobId") or item.get("url") or "")
    uid = hashlib.md5(raw_id.encode()).hexdigest()[:32] if raw_id else ""
    if not uid:
        return None

    title = str(item.get("title") or item.get("jobTitle") or "")
    desc = str(item.get("description") or item.get("jobDescription") or "")
    company = str(item.get("company") or item.get("companyName") or "Unknown")
    apply_url = str(item.get("url") or item.get("applyUrl") or item.get("jobUrl") or "")

    if not title or _is_senior(title, desc):
        return None

    location_parts = [item.get("location"), item.get("city"), item.get("state")]
    location_str = next((str(x) for x in location_parts if x), "India")

    text = f"{title} {desc[:300]}"
    if re.search(r"\b(article|articleship|industrial\s+train)\b", text, re.I):
        job_type = "articleship"
    elif re.search(r"\b(intern(ship)?)\b", text, re.I):
        job_type = "internship"
    elif re.search(r"\b(trainee|graduate\s+trainee|management\s+trainee)\b", text, re.I):
        job_type = "trainee"
    else:
        job_type = "job"

    return NormalizedJob(
        source="apify_linkedin_indeed",
        external_id=f"apify-li-{platform}-{uid}",
        title=title,
        company=company,
        location=location_str,
        stipend=_salary(item),
        duration="",
        courses=q["courses"],
        job_type=job_type,
        apply_url=apply_url,
        description=desc[:2000] if desc else None,
        is_remote=bool(item.get("isRemote") or item.get("remote") or
                       re.search(r'\bremote\b', location_str, re.I)),
        posted_at=_parse_date(item.get("postedAt") or item.get("datePosted")),
        logo_url=item.get("companyLogo") or item.get("logoUrl") or logo_url_from_company(company, apply_url),
        raw_data=f'{{"source":"apify_linkedin_indeed","platform":"{platform}","id":"{uid}"}}'
    )


async def fetch() -> list[NormalizedJob]:
    api_token = os.getenv("APIFY_API_TOKEN")
    if not api_token or api_token == "your-apify-api-token":
        raise RuntimeError("APIFY_API_TOKEN not set")

    max_results = int(os.getenv("APIFY_LI_INDEED_MAX_RESULTS", "25"))
    sem = asyncio.Semaphore(int(os.getenv("APIFY_CONCURRENCY", "5")))

    async def _bounded_li(q):
        async with sem:
            return await _fetch_linkedin(api_token, q, max_results)

    async def _bounded_indeed(q):
        async with sem:
            return await _fetch_indeed(api_token, q, max_results)

    li_results, indeed_results = await asyncio.gather(
        asyncio.gather(*[_bounded_li(q) for q in SEARCH_QUERIES]),
        asyncio.gather(*[_bounded_indeed(q) for q in SEARCH_QUERIES]),
    )

    all_raw = list(li_results) + list(indeed_results)

    seen: set[str] = set()
    jobs: list[NormalizedJob] = []

    for q, items, platform in all_raw:
        for item in items:
            job = _normalize(item, q, platform)
            if not job:
                continue
            if job.external_id in seen:
                continue
            seen.add(job.external_id)
            # course detection (async, run after dedup)
            jobs.append(job)

    # AI course detection
    for job in jobs:
        job.courses = await detect_courses(job.title, job.description or '') or job.courses

    logger.info(f"[apify_li_indeed] Total fetched: {len(jobs)} jobs")
    return jobs
