"""
Apify — Google Jobs Scraper
Actor: automationnation/google-jobs-scraper
Covers: Google for Jobs index (company career pages + all major boards via Google crawl)
Pricing: $2/1,000 results ($1.50 on paid plan). Free plan ≈ 2,000 jobs/month.
Docs: https://apify.com/automationnation/google-jobs-scraper
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

ACTOR_ID = os.getenv("APIFY_GOOGLE_JOBS_ACTOR_ID", "automationnation/google-jobs-scraper")
APIFY_BASE = "https://api.apify.com/v2"

SEARCH_QUERIES = [
    # ── Full-time jobs — Big 4 & mid-tier audit firms (80%) ──────────────
    {"query": "audit associate fresher Deloitte EY KPMG PwC India",        "courses": ["CA"]},
    {"query": "tax associate fresher Big 4 India",                          "courses": ["CA"]},
    {"query": "audit associate fresher Grant Thornton BDO RSM India",       "courses": ["CA"]},
    {"query": "financial reporting analyst fresher Big 4 India",            "courses": ["CA"]},

    # ── Full-time jobs — South India cities ───────────────────────────────
    {"query": "audit associate fresher Chennai",                            "courses": ["CA"]},
    {"query": "accounts executive fresher Chennai",                         "courses": ["CA"]},
    {"query": "financial analyst fresher Bengaluru",                        "courses": ["CA", "CFA"]},
    {"query": "audit associate fresher Hyderabad",                          "courses": ["CA"]},
    {"query": "finance executive fresher Coimbatore Tamil Nadu",            "courses": ["CA"]},
    {"query": "accounts executive fresher Kochi Kerala",                    "courses": ["CA"]},
    {"query": "audit associate fresher Mumbai",                             "courses": ["CA"]},
    {"query": "financial analyst fresher Mumbai",                           "courses": ["CA", "CFA"]},
    {"query": "CA articleship vacancy Mumbai",                              "courses": ["CA"]},
    {"query": "audit associate fresher Delhi NCR",                          "courses": ["CA"]},
    {"query": "financial analyst fresher Delhi NCR",                        "courses": ["CA", "CFA"]},
    {"query": "CA articleship vacancy Delhi Noida Gurugram",                "courses": ["CA"]},

    # ── Full-time jobs — GCCs & MNCs ──────────────────────────────────────
    {"query": "FP&A analyst fresher GCC Bengaluru Hyderabad",               "courses": ["CA", "CMA India"]},
    {"query": "financial reporting fresher MNC Hyderabad",                  "courses": ["CA"]},
    {"query": "accounts payable fresher Bengaluru MNC",                     "courses": ["CA", "CMA India"]},
    {"query": "internal audit fresher Goldman Sachs JP Morgan India",        "courses": ["CA"]},
    {"query": "audit associate fresher Cognizant TCS Infosys India",        "courses": ["CA"]},

    # ── Full-time jobs — Banks & NBFC ─────────────────────────────────────
    {"query": "finance analyst fresher HDFC ICICI Axis Bank India",         "courses": ["CA", "CMA India"]},
    {"query": "audit fresher Federal Bank South Indian Bank Kerala",         "courses": ["CA"]},
    {"query": "finance executive fresher City Union Bank Karur Vysya",       "courses": ["CA"]},
    {"query": "accounts fresher Muthoot Manappuram Cholamandalam India",     "courses": ["CA"]},

    # ── Full-time jobs — Fintech & Startups ───────────────────────────────
    {"query": "finance analyst fresher Razorpay Zerodha Groww India",       "courses": ["CA", "CFA"]},
    {"query": "accounts fresher PhonePe CRED Juspay Bengaluru",             "courses": ["CA"]},

    # ── Full-time jobs — Specialised roles ────────────────────────────────
    {"query": "GST executive fresher India",                                "courses": ["CA"]},
    {"query": "cost accountant fresher manufacturing India",                "courses": ["CMA India"]},
    {"query": "equity research analyst fresher India",                      "courses": ["CFA"]},
    {"query": "credit analyst fresher NBFC bank India",                     "courses": ["CA", "CFA"]},
    {"query": "treasury analyst fresher India",                             "courses": ["CA"]},
    {"query": "compliance officer fresher India",                           "courses": ["CS", "CA"]},
    {"query": "company secretary fresher listed company India",             "courses": ["CS"]},
    {"query": "ACCA fresher audit jobs India",                              "courses": ["ACCA"]},
    {"query": "US CPA fresher accounting GCC India",                        "courses": ["CPA US"]},
    {"query": "CFA level 1 fresher investment analyst India",               "courses": ["CFA"]},
    {"query": "risk analyst fresher India",                                 "courses": ["CA", "CFA"]},
    {"query": "statutory audit fresher CA firm India",                      "courses": ["CA"]},
    {"query": "US CMA fresher management accountant GCC India",  "courses": ["US CMA"]},
    {"query": "IMA CMA fresher FP&A analyst India",              "courses": ["US CMA"]},
    {"query": "B.Com accounts executive fresher India",          "courses": ["B.Com"]},
    {"query": "M.Com finance fresher accounts India",            "courses": ["M.Com"]},
    {"query": "banking operations associate fresher India",      "courses": ["CA", "B.Com"]},
    {"query": "P2P procure to pay analyst fresher GCC Bengaluru Hyderabad", "courses": ["CA", "CMA India", "B.Com"]},
    {"query": "R2R record to report analyst fresher India",      "courses": ["CA", "CMA India", "B.Com"]},
    {"query": "shared services finance fresher Genpact EXL WNS India", "courses": ["CA", "CMA India", "B.Com"]},
    {"query": "management consulting analyst fresher Big 4 India", "courses": ["CA", "CFA"]},
    {"query": "transaction advisory analyst fresher India",      "courses": ["CA", "CFA"]},
    {"query": "investment banking analyst fresher India",        "courses": ["CA", "CFA"]},
    {"query": "transfer pricing associate fresher India",        "courses": ["CA"]},
    {"query": "O2C order to cash analyst fresher GCC India",     "courses": ["CA", "CMA India", "B.Com"]},
    {"query": "direct tax fresher India",                        "courses": ["CA"]},
    {"query": "KYC AML analyst fresher India",                   "courses": ["CA", "B.Com"]},

    # ── Articleship + Internship + Trainee (20%) ──────────────────────────
    {"query": "CA articleship vacancy India",                               "courses": ["CA"]},
    {"query": "CA articleship Deloitte EY KPMG PwC India",                  "courses": ["CA"]},
    {"query": "CMA industrial training India",                              "courses": ["CMA India"]},
    {"query": "CS executive articleship ICSI India",                        "courses": ["CS"]},
    {"query": "finance internship fresher India",                           "courses": ["CA"]},
    {"query": "audit internship fresher India",                             "courses": ["CA", "ACCA"]},
    {"query": "management trainee finance India",                           "courses": ["CA", "CMA India"]},
    {"query": "graduate trainee Big 4 finance India",                       "courses": ["CA"]},
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


async def _fetch_query(api_token: str, q: dict, max_results: int) -> list[dict]:
    payload = {
        "queries": [q["query"]],
        "maxConcurrency": 1,
        "maxResults": max_results,
        "country": "IN",
        "language": "en",
    }
    try:
        return await _run_actor(api_token, payload)
    except Exception as e:
        logger.warning(f"[apify_google] Query '{q['query']}' failed: {e}")
        return []


async def fetch() -> list[NormalizedJob]:
    api_token = os.getenv("APIFY_API_TOKEN")
    if not api_token or api_token == "your-apify-api-token":
        raise RuntimeError("APIFY_API_TOKEN not set")

    max_results = int(os.getenv("APIFY_GOOGLE_MAX_RESULTS", "25"))
    # Concurrency capped so we don't exceed Apify's parallel run limit on the free plan
    sem = asyncio.Semaphore(int(os.getenv("APIFY_CONCURRENCY", "5")))

    async def _bounded(q: dict) -> list[dict]:
        async with sem:
            return await _fetch_query(api_token, q, max_results)

    all_results = await asyncio.gather(*[_bounded(q) for q in SEARCH_QUERIES])

    seen: set[str] = set()
    jobs: list[NormalizedJob] = []

    for q, items in zip(SEARCH_QUERIES, all_results):
        for item in items:
            raw_id = str(item.get("id") or item.get("job_id") or item.get("url") or "")
            uid = hashlib.md5(raw_id.encode()).hexdigest()[:32] if raw_id else ""
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
                raw_data=f'{{"source":"google_jobs","id":"{uid}"}}'
            ))

    logger.info(f"[apify_google] Total fetched: {len(jobs)} jobs")
    return jobs
