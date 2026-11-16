"""
Apify — Multi Job Board Scraper
Actor: iskoren/multi-job-board-scraper (also vero-api/multi-job-board-scraper-linkedin-indeed-glassdoor-more)
Covers: Naukri, Google Jobs, LinkedIn, Indeed, Glassdoor, ZipRecruiter, Bayt, BDJobs
Pricing: $5/1,000 results. Free plan = $5/month ≈ 1,000 jobs.
Docs: https://apify.com/vero-api/multi-job-board-scraper-linkedin-indeed-glassdoor-more
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

ACTOR_ID = os.getenv("APIFY_MULTI_BOARD_ACTOR_ID", "vero-api/multi-job-board-scraper-linkedin-indeed-glassdoor-more")
APIFY_BASE = "https://api.apify.com/v2"

# Finance queries tuned for India — keep count low to control cost
SEARCH_QUERIES = [
    # ── Full-time jobs 0–2 yrs (80%) ─────────────────────────────────────────
    {"query": "audit associate fresher India",             "courses": ["CA"]},
    {"query": "accounts executive fresher India",          "courses": ["CA"]},
    {"query": "financial analyst fresher India",           "courses": ["CA", "CFA"]},
    {"query": "tax associate fresher India",               "courses": ["CA"]},
    {"query": "GST executive fresher India",               "courses": ["CA"]},
    {"query": "internal audit associate fresher India",    "courses": ["CA"]},
    {"query": "FP&A analyst fresher India",                "courses": ["CA", "CMA India"]},
    {"query": "credit analyst fresher India",              "courses": ["CA", "CFA"]},
    {"query": "cost accountant fresher India",             "courses": ["CMA India"]},
    {"query": "ACCA fresher jobs India",                   "courses": ["ACCA"]},
    {"query": "CFA level 1 fresher analyst India",         "courses": ["CFA"]},
    {"query": "US CPA fresher accounting India",           "courses": ["CPA US"]},
    {"query": "company secretary fresher jobs India",      "courses": ["CS"]},
    {"query": "B.Com finance fresher jobs India",          "courses": ["B.Com", "M.Com"]},
    {"query": "M.Com finance fresher jobs India",           "courses": ["M.Com"]},
    {"query": "compliance officer fresher India",          "courses": ["CS", "CA"]},
    {"query": "equity research analyst fresher India",     "courses": ["CFA"]},
    {"query": "US CMA fresher management accountant India",      "courses": ["US CMA"]},
    {"query": "IMA certified management accountant fresher India", "courses": ["US CMA"]},
    {"query": "B.Com finance fresher accounts executive India",  "courses": ["B.Com"]},
    {"query": "banking operations fresher HDFC ICICI Axis India", "courses": ["CA", "B.Com"]},
    {"query": "risk analyst fresher bank NBFC India",            "courses": ["CA", "CFA"]},
    {"query": "P2P O2C R2R analyst fresher GCC India",           "courses": ["CA", "CMA India"]},
    {"query": "shared services finance analyst fresher Genpact EXL India", "courses": ["CA", "CMA India", "B.Com"]},
    # ── Articleship + Internship + Trainee (20%) ──────────────────────────────
    {"query": "CA articleship vacancy India",              "courses": ["CA"]},
    {"query": "CMA industrial training India",             "courses": ["CMA India"]},
    {"query": "finance internship fresher India",          "courses": ["CA", "CMA India", "ACCA", "B.Com"]},
    {"query": "management trainee finance India",          "courses": ["CA", "CMA India"]},
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
    # Actor returns salaryMin/salaryMax or salary string
    lo = item.get("salaryMin") or item.get("salary_min") or 0
    hi = item.get("salaryMax") or item.get("salary_max") or 0
    try:
        lo, hi = float(lo or 0), float(hi or 0)
        mid = (lo + hi) / 2 if lo and hi else (lo or hi)
        if mid <= 0:
            return 0
        interval = str(item.get("salaryInterval") or item.get("salary_interval") or "").lower()
        currency = str(item.get("currency") or "INR").upper()
        if "year" in interval or "annual" in interval:
            mid /= 12
        elif "hour" in interval:
            mid = mid * 8 * 22
        if currency == "USD":
            mid *= float(os.getenv("USD_INR_RATE", "85"))
        return round(mid)
    except Exception:
        return extract_stipend(str(item.get("salary") or ""))


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

        logger.info(f"[apify_multi] Run {run_id} started, polling…")

        for _ in range(timeout_secs // 5):
            await asyncio.sleep(5)
            status_resp = await client.get(
                f"{APIFY_BASE}/actor-runs/{run_id}",
                headers=headers,
            )
            status_resp.raise_for_status()
            status = status_resp.json().get("data", {}).get("status", "")
            if status in ("SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"):
                break

        if status != "SUCCEEDED":
            logger.warning(f"[apify_multi] Run {run_id} ended with status: {status}")
            return []

        items_resp = await client.get(
            f"{APIFY_BASE}/datasets/{dataset_id}/items",
            headers=headers,
            params={"format": "json", "clean": "true"},
        )
        items_resp.raise_for_status()
        return items_resp.json() or []


async def _fetch_query(api_token: str, q: dict, boards: list, max_per_board: int):
    payload = {
        "searchQueries": [q["query"]],
        "location": "India",
        "boards": boards,
        "maxResultsPerBoard": max_per_board,
        "includeFullDescription": True,
    }
    try:
        items = await _run_actor(api_token, payload)
    except Exception as e:
        logger.warning(f"[apify_multi] Query '{q['query']}' failed: {e}")
        return (q, [])
    await asyncio.sleep(2)
    return (q, items)


async def fetch() -> list[NormalizedJob]:
    api_token = os.getenv("APIFY_API_TOKEN")
    if not api_token or api_token == "your-apify-api-token":
        raise RuntimeError("APIFY_API_TOKEN not set")

    boards_env = os.getenv("APIFY_MULTI_BOARDS", "naukri,googleJobs")
    boards = [b.strip() for b in boards_env.split(",") if b.strip()]
    max_per_board = int(os.getenv("APIFY_MULTI_MAX_PER_BOARD", "20"))

    seen: set[str] = set()
    jobs: list[NormalizedJob] = []

    sem = asyncio.Semaphore(int(os.getenv("APIFY_CONCURRENCY", "5")))

    async def _bounded(q):
        async with sem:
            return await _fetch_query(api_token, q, boards, max_per_board)

    all_results = await asyncio.gather(*[_bounded(q) for q in SEARCH_QUERIES])

    for q, items in all_results:
        for item in items:
            raw_id = str(item.get("id") or item.get("jobId") or item.get("url") or "")
            uid = hashlib.md5(raw_id.encode()).hexdigest()[:32] if raw_id else ""
            if not uid or uid in seen:
                continue
            seen.add(uid)

            title = str(item.get("title") or item.get("jobTitle") or "")
            desc = str(item.get("description") or item.get("jobDescription") or "")
            company = str(item.get("company") or item.get("companyName") or "Unknown")
            apply_url = str(item.get("url") or item.get("applyUrl") or item.get("jobUrl") or "")

            if not title or _is_senior(title, desc):
                continue

            location_parts = [item.get("location"), item.get("city"), item.get("state"), item.get("country")]
            location_str = next((str(x) for x in location_parts if x), "India")

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
                source="apify_multi_board",
                external_id=f"apify-multi-{uid}",
                title=title,
                company=company,
                location=location_str,
                stipend=_salary(item),
                duration="",
                courses=courses,
                job_type=job_type,
                apply_url=apply_url,
                description=desc[:2000] if desc else None,
                is_remote=bool(item.get("isRemote") or item.get("remote")),
                posted_at=_parse_date(item.get("postedAt") or item.get("datePosted")),
                raw_data=f'{{"source":"apify_multi_board","id":"{uid}"}}'
            ))

    logger.info(f"[apify_multi] Total fetched: {len(jobs)} jobs")
    return jobs
