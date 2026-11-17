"""
Apify — Naukri Jobs Scraper
Actor: vaclavrut/naukri-jobs-scraper
Covers: Naukri.com — largest Indian job board, dominant for CA/CMA/CS/ACCA fresher roles
Pricing: ~$0.75–1/1,000 results. Free plan included.
Docs: https://apify.com/vaclavrut/naukri-jobs-scraper
Why dedicated: JobSpy Naukri scraping is unreliable/slow; this hits Naukri API directly.
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
from scraper.parse_utils import extract_stipend

logger = logging.getLogger(__name__)

ACTOR_ID = os.getenv("APIFY_NAUKRI_ACTOR_ID", "vaclavrut/naukri-jobs-scraper")
APIFY_BASE = "https://api.apify.com/v2"

SEARCH_QUERIES = [
    # ── Finance / CA / audit ──────────────────────────────────────────────
    {"query": "CA articleship",                     "courses": ["CA"]},
    {"query": "audit associate 0-1 years",          "courses": ["CA"]},
    {"query": "accounts executive fresher",         "courses": ["CA", "B.Com"]},
    {"query": "tax associate fresher",              "courses": ["CA"]},
    {"query": "GST executive fresher",              "courses": ["CA"]},
    {"query": "internal audit fresher",             "courses": ["CA"]},
    {"query": "statutory audit CA firm",            "courses": ["CA"]},
    {"query": "financial analyst fresher",          "courses": ["CA", "CFA"]},
    {"query": "FP&A analyst fresher",               "courses": ["CA", "CMA India"]},
    {"query": "credit analyst fresher",             "courses": ["CA", "CFA"]},
    # ── CMA / cost ────────────────────────────────────────────────────────
    {"query": "CMA industrial training",            "courses": ["CMA India"]},
    {"query": "cost accountant fresher",            "courses": ["CMA India"]},
    {"query": "management accountant fresher",      "courses": ["CMA India", "US CMA"]},
    # ── CS / compliance ───────────────────────────────────────────────────
    {"query": "company secretary fresher",          "courses": ["CS"]},
    {"query": "CS executive articleship",           "courses": ["CS"]},
    {"query": "compliance officer fresher",         "courses": ["CS", "CA"]},
    # ── International ─────────────────────────────────────────────────────
    {"query": "ACCA fresher audit",                 "courses": ["ACCA"]},
    {"query": "CFA level 1 fresher analyst",        "courses": ["CFA"]},
    {"query": "US CPA fresher GCC",                 "courses": ["CPA US"]},
    {"query": "equity research analyst fresher",    "courses": ["CFA"]},
    # ── Banking / BFSI ────────────────────────────────────────────────────
    {"query": "banking operations fresher",         "courses": ["CA", "B.Com"]},
    {"query": "risk analyst fresher NBFC",          "courses": ["CA", "CFA"]},
    {"query": "KYC AML analyst fresher",            "courses": ["CA", "B.Com"]},
    # ── GCC / shared services ─────────────────────────────────────────────
    {"query": "P2P O2C R2R analyst fresher",        "courses": ["CA", "CMA India", "B.Com"]},
    {"query": "shared services finance fresher",    "courses": ["CA", "CMA India", "B.Com"]},
    # ── Internship / trainee ──────────────────────────────────────────────
    {"query": "finance internship fresher",         "courses": ["CA", "CMA India", "ACCA", "B.Com"]},
    {"query": "management trainee finance",         "courses": ["CA", "CMA India"]},
    {"query": "B.Com accounts executive fresher",   "courses": ["B.Com"]},
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
    sal_str = str(item.get("salary") or item.get("salaryLabel") or "")
    if sal_str:
        return extract_stipend(sal_str)
    lo = float(item.get("minSalary") or item.get("salaryMin") or 0)
    hi = float(item.get("maxSalary") or item.get("salaryMax") or 0)
    mid = (lo + hi) / 2 if lo and hi else (lo or hi)
    if mid > 100000:
        mid /= 12
    return round(mid) if mid > 0 else 0


async def _run_actor(api_token: str, payload: dict, timeout_secs: int = 120) -> list[dict]:
    headers = {"Authorization": f"Bearer {api_token}", "Content-Type": "application/json"}
    async with httpx.AsyncClient(timeout=30) as client:
        run_resp = await client.post(
            f"{APIFY_BASE}/acts/{ACTOR_ID}/runs",
            headers=headers,
            json=payload,
        )
        run_resp.raise_for_status()
        run_data = run_resp.json().get("data", {})
        run_id = run_data.get("id")
        dataset_id = run_data.get("defaultDatasetId")
        if not run_id:
            raise RuntimeError("Apify run start returned no run ID")

        logger.info(f"[apify_naukri] Run {run_id} started, polling…")

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
            logger.warning(f"[apify_naukri] Run {run_id} ended: {status}")
            return []

        items_resp = await client.get(
            f"{APIFY_BASE}/datasets/{dataset_id}/items",
            headers=headers,
            params={"format": "json", "clean": "true"},
        )
        items_resp.raise_for_status()
        return items_resp.json() or []


async def _fetch_query(api_token: str, q: dict, max_results: int) -> tuple[dict, list[dict]]:
    payload = {
        "keyword": q["query"],
        "location": "India",
        "experience": "0-2",
        "maxResults": max_results,
        "includeDescription": True,
    }
    try:
        items = await _run_actor(api_token, payload)
        return q, items
    except Exception as e:
        logger.warning(f"[apify_naukri] Query '{q['query']}' failed: {e}")
        return q, []


async def fetch() -> list[NormalizedJob]:
    api_token = os.getenv("APIFY_API_TOKEN")
    if not api_token or api_token == "your-apify-api-token":
        raise RuntimeError("APIFY_API_TOKEN not set")

    max_results = int(os.getenv("APIFY_NAUKRI_MAX_RESULTS", "40"))
    sem = asyncio.Semaphore(int(os.getenv("APIFY_CONCURRENCY", "5")))

    async def _bounded(q: dict) -> tuple[dict, list[dict]]:
        async with sem:
            return await _fetch_query(api_token, q, max_results)

    all_results = await asyncio.gather(*[_bounded(q) for q in SEARCH_QUERIES])

    seen: set[str] = set()
    jobs: list[NormalizedJob] = []

    for q, items in all_results:
        for item in items:
            raw_id = str(item.get("jobId") or item.get("id") or item.get("url") or "")
            uid = hashlib.md5(raw_id.encode()).hexdigest()[:32] if raw_id else ""
            if not uid or uid in seen:
                continue
            seen.add(uid)

            title = str(item.get("title") or item.get("jobTitle") or "")
            desc = str(item.get("description") or item.get("jobDescription") or "")
            company = str(item.get("company") or item.get("companyName") or "Unknown")
            apply_url = str(item.get("jdURL") or item.get("url") or item.get("applyUrl") or "")

            if not title or _is_senior(title, desc):
                continue

            location_str = str(item.get("location") or item.get("city") or "India")

            courses = await detect_courses(title, desc[:400]) or q["courses"]
            text = f"{title} {desc[:300]}"
            if re.search(r"\b(article|articleship|industrial\s+train)\b", text, re.I):
                job_type = "articleship"
            elif re.search(r"\b(intern(ship)?)\b", text, re.I):
                job_type = "internship"
            elif re.search(r"\b(trainee|graduate\s+trainee|management\s+trainee)\b", text, re.I):
                job_type = "trainee"
            else:
                job_type = "job"

            jobs.append(NormalizedJob(
                source="apify_naukri",
                external_id=f"apify-naukri-{uid}",
                title=title,
                company=company,
                location=location_str,
                stipend=_salary(item),
                duration="",
                courses=courses,
                job_type=job_type,
                apply_url=apply_url,
                description=desc[:2000] if desc else None,
                is_remote=bool(item.get("isRemote") or item.get("remote") or
                               re.search(r'\bremote\b', location_str, re.I)),
                posted_at=_parse_date(item.get("postedAt") or item.get("createdDate")),
                raw_data=f'{{"source":"apify_naukri","id":"{uid}"}}'
            ))

    logger.info(f"[apify_naukri] Total fetched: {len(jobs)} jobs")
    return jobs
