"""
Apify — Google Jobs Scraper
Actor: automationnation/google-jobs-scraper
Covers: Google for Jobs index (company career pages + all major boards via Google crawl)
Pricing: $2/1,000 results ($1.50 on paid plan). Free plan ≈ 2,000 jobs/month.
Docs: https://apify.com/automationnation/google-jobs-scraper
"""
import os
import re
import httpx
import logging
import asyncio
from datetime import datetime
from scraper.types import NormalizedJob
from scraper.course_detector import detect_courses
from scraper.parse_utils import extract_stipend

logger = logging.getLogger(__name__)

ACTOR_ID = os.getenv("APIFY_GOOGLE_JOBS_ACTOR_ID", "automationnation/google-jobs-scraper")
APIFY_BASE = "https://api.apify.com/v2"

# Daily focused queries — keep tight to avoid burning credit
SEARCH_QUERIES = [
    {"query": "CA articleship vacancy India site:naukri.com OR site:linkedin.com", "courses": ["CA"]},
    {"query": "article assistant CA firm India",         "courses": ["CA"]},
    {"query": "audit associate fresher chartered accountant India", "courses": ["CA"]},
    {"query": "CMA industrial training ICMAI India",     "courses": ["CMA India"]},
    {"query": "cost accountant trainee fresher India",   "courses": ["CMA India"]},
    {"query": "CS executive trainee ICSI India",         "courses": ["CS"]},
    {"query": "company secretary articleship India",     "courses": ["CS"]},
    {"query": "ACCA fresher audit jobs India",           "courses": ["ACCA"]},
    {"query": "CFA analyst fresher investment India",    "courses": ["CFA"]},
    {"query": "US CPA accounting fresher India",         "courses": ["CPA US"]},
    {"query": "GST taxation fresher accountant India",   "courses": ["CA"]},
    {"query": "internal audit associate fresher India",  "courses": ["CA"]},
    {"query": "FP&A analyst fresher India",              "courses": ["CA", "CMA India"]},
    {"query": "B.Com accounts executive fresher India",  "courses": ["CA"]},
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
    try:
        return datetime.fromisoformat(str(val).replace("Z", "+00:00")).replace(tzinfo=None)
    except Exception:
        return datetime.utcnow()


def _extract_salary(item: dict) -> int:
    # Google Jobs actor returns salary_range or salary string
    sal = item.get("salary") or item.get("salary_range") or ""
    if sal:
        return extract_stipend(str(sal))
    # Also check structured salary
    lo = float(item.get("min_salary") or 0)
    hi = float(item.get("max_salary") or 0)
    mid = (lo + hi) / 2 if lo and hi else (lo or hi)
    if mid > 0:
        period = str(item.get("salary_period") or "").lower()
        if "year" in period or "annual" in period:
            mid /= 12
        elif "hour" in period:
            mid = mid * 8 * 22
        return round(mid)
    return 0


async def _run_actor(api_token: str, payload: dict, timeout_secs: int = 90) -> list[dict]:
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

        logger.info(f"[apify_google] Run {run_id} started, polling…")

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
            logger.warning(f"[apify_google] Run {run_id} ended: {status}")
            return []

        items_resp = await client.get(
            f"{APIFY_BASE}/datasets/{dataset_id}/items",
            headers=headers,
            params={"format": "json", "clean": "true"},
        )
        items_resp.raise_for_status()
        return items_resp.json() or []


async def fetch() -> list[NormalizedJob]:
    api_token = os.getenv("APIFY_API_TOKEN")
    if not api_token or api_token == "your-apify-api-token":
        raise RuntimeError("APIFY_API_TOKEN not set")

    max_results = int(os.getenv("APIFY_GOOGLE_MAX_RESULTS", "25"))

    seen: set[str] = set()
    jobs: list[NormalizedJob] = []

    for q in SEARCH_QUERIES:
        payload = {
            "queries": [q["query"]],
            "maxConcurrency": 1,
            "maxResults": max_results,
            "country": "IN",
            "language": "en",
        }

        try:
            items = await _run_actor(api_token, payload)
        except Exception as e:
            logger.warning(f"[apify_google] Query '{q['query']}' failed: {e}")
            continue

        for item in items:
            uid = str(item.get("id") or item.get("job_id") or item.get("url") or "")[-50:]
            if not uid or uid in seen:
                continue
            seen.add(uid)

            title = str(item.get("title") or item.get("job_title") or "")
            desc = str(item.get("description") or item.get("job_description") or "")
            company = str(item.get("company") or item.get("company_name") or "Unknown")
            apply_url = str(item.get("url") or item.get("apply_link") or item.get("job_url") or "")

            if not title or _is_senior(title, desc):
                continue

            location_parts = [item.get("location"), item.get("city"), item.get("state")]
            location_str = next((str(x) for x in location_parts if x), "India")

            courses = await detect_courses(title, desc[:400]) or q["courses"]
            job_type = (
                "articleship"
                if re.search(r"article|articleship|industrial train|trainee", f"{title} {desc}", re.I)
                else "job"
            )

            jobs.append(NormalizedJob(
                source="apify_google_jobs",
                external_id=f"apify-google-{uid}",
                title=title,
                company=company,
                location=location_str,
                stipend=_extract_salary(item),
                duration="",
                courses=courses,
                job_type=job_type,
                apply_url=apply_url,
                description=desc[:2000] if desc else None,
                is_remote=bool(item.get("isRemote") or item.get("remote")),
                posted_at=_parse_date(item.get("postedAt") or item.get("date_posted")),
                raw_data=f'{{"source":"google_jobs","id":"{uid[:40]}"}}'
            ))

        await asyncio.sleep(2)

    logger.info(f"[apify_google] Total fetched: {len(jobs)} jobs")
    return jobs
