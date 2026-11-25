"""
Apify — ATS Career Site Scraper
Actor: openclawai/career-site-ats-jobs-scraper
Covers: Greenhouse, Lever, Ashby, Workday, Workable, iCIMS — direct employer career pages
Pricing: PAY_PER_EVENT per job (~$0.50–2.00/1k). Price rises 2026-12-06 — keep maxJobsPerCompany capped.
Docs: https://apify.com/openclawai/career-site-ats-jobs-scraper

Target companies: Big 4, mid-tier CA firms, banks, GCCs, asset managers.
These post on Workday/Greenhouse/Lever — not on Naukri/Indeed — so this is unique coverage.
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

ACTOR_ID = os.getenv("APIFY_CAREER_SITES_ACTOR_ID", "openclawai/career-site-ats-jobs-scraper").replace("~", "/")
APIFY_BASE = "https://api.apify.com/v2"

# Finance / CA-relevant keywords to filter at the query stage
SEARCH_KEYWORDS = [
    "articleship", "article assistant", "audit associate",
    "CA inter", "chartered accountant", "CMA", "cost accountant",
    "company secretary", "CS executive", "ACCA", "CFA analyst",
    "US CPA", "tax associate", "GST", "FP&A", "internal audit",
    "accounts executive", "finance analyst", "financial reporting",
]

# Target employer career pages (10 companies, monthly run).
# Accenture and Genpact removed — now covered by the free Workday scraper (workday.py).
# PwC removed — pwc.in/careers is a marketing page; SAP SuccessFactors underneath (not supported).
# URLs changed from marketing pages to real ATS-system addresses where known.
# IMPORTANT: addresses marked UNVERIFIED have not been tested with a live actor run.
# User must approve a test run (maxJobsPerCompany: 5) before activating this source.
TARGET_EMPLOYERS = [
    # Big 4 India — UNVERIFIED addresses; test before activating
    # Deloitte India uses southasiacareers.deloitte.com (marketing, underlying ATS unknown)
    {"name": "Deloitte India",         "url": "https://southasiacareers.deloitte.com/"},  # UNVERIFIED
    # EY India uses SAP SuccessFactors (may not be supported by actor); test first
    {"name": "EY India",               "url": "https://careers.ey.com/ey/jobs"},          # UNVERIFIED
    # KPMG India removed — uses Oracle Recruiting Cloud (no public API, all Workday variants return 422).
    # Big 4 KPMG India jobs covered via Naukri (apify_naukri.py SEARCH_QUERIES).
    # Mid-tier (Greenhouse / Lever — well-supported by actor)
    {"name": "Grant Thornton India",   "url": "https://jobs.lever.co/grantthorntonin"},   # UNVERIFIED
    {"name": "RSM India",              "url": "https://jobs.lever.co/rsm"},               # UNVERIFIED
    # Banks / GCCs — Lever / Greenhouse addresses (well-supported)
    {"name": "Groww",                  "url": "https://jobs.lever.co/groww"},
    {"name": "Razorpay",               "url": "https://jobs.lever.co/razorpay"},
    {"name": "PhonePe",                "url": "https://jobs.lever.co/phonepe"},
    # Banks using iCIMS / Workday — UNVERIFIED
    {"name": "Deutsche Bank India",    "url": "https://careers.db.com"},                  # UNVERIFIED
    {"name": "Kotak Mahindra Bank",    "url": "https://careers.kotak.com"},               # UNVERIFIED
]

SENIOR_RE = re.compile(
    r'\b(senior|manager|lead\b|director|head of|vp\b|vice president|principal|partner|'
    r'[3-9]\+?\s*years?|[1-9]\d+\s*years?)\b', re.I
)


def _is_senior(title: str, desc: str) -> bool:
    return bool(SENIOR_RE.search(title) or SENIOR_RE.search((desc or "")[:600]))


def _is_finance_relevant(title: str, desc: str) -> bool:
    """Quick check — only keep jobs relevant to CA/ACCA/CMA/CS/CFA/CPA audience."""
    text = f"{title} {desc[:300]}".lower()
    return any(kw.lower() in text for kw in SEARCH_KEYWORDS)


def _parse_date(val) -> datetime:
    if not val:
        return datetime.utcnow()
    try:
        return datetime.fromisoformat(str(val).replace("Z", "+00:00")).replace(tzinfo=None)
    except Exception:
        return datetime.utcnow()


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

        queries_preview = (payload.get('queries') or ['?'])[:1]
        logger.info(f"[apify_career] Run {run_id} started for {queries_preview[0]}, polling…")

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
            logger.warning(f"[apify_career] Run {run_id} ended: {status}")
            return []

        items_resp = await client.get(
            f"{APIFY_BASE}/datasets/{dataset_id}/items",
            headers=headers,
            params={"format": "json", "clean": "true"},
        )
        items_resp.raise_for_status()
        return items_resp.json() or []


async def _fetch_employer(api_token: str, employer: dict) -> tuple[dict, list[dict]]:
    # Actor input schema: queries/keywords/locations/maxJobsPerCompany/includeDescription
    # ATS type is auto-detected from the URL — do NOT pass atsType.
    # Cap is critical: default is 500/company = ~16,500 jobs/run at $2/1k after 2026-12-06.
    payload = {
        "queries": [employer["url"]],
        "keywords": SEARCH_KEYWORDS,
        "locations": ["India"],
        "maxJobsPerCompany": int(os.getenv("APIFY_CAREER_MAX_PER_EMPLOYER", "25")),
        "includeDescription": True,
    }
    try:
        items = await _run_actor(api_token, payload)
        return employer, items
    except Exception as e:
        logger.warning(f"[apify_career] {employer['name']} failed: {e}")
        return employer, []


async def fetch() -> list[NormalizedJob]:
    api_token = os.getenv("APIFY_API_TOKEN")
    if not api_token or api_token == "your-apify-api-token":
        raise RuntimeError("APIFY_API_TOKEN not set")

    targets_env = os.getenv("APIFY_CAREER_TARGETS", "")
    if targets_env:
        allowed = {t.strip().lower() for t in targets_env.split(",")}
        targets = [e for e in TARGET_EMPLOYERS if e["name"].lower() in allowed]
    else:
        targets = TARGET_EMPLOYERS

    # Concurrency capped so we don't exceed Apify's parallel run limit on the free plan
    sem = asyncio.Semaphore(int(os.getenv("APIFY_CONCURRENCY", "5")))

    async def _bounded(employer: dict) -> tuple[dict, list[dict]]:
        async with sem:
            return await _fetch_employer(api_token, employer)

    all_results = await asyncio.gather(*[_bounded(e) for e in targets])

    seen: set[str] = set()
    jobs: list[NormalizedJob] = []

    for employer, items in all_results:
        for item in items:
            raw_id = str(item.get("id") or item.get("jobId") or item.get("url") or "")
            uid = hashlib.md5(raw_id.encode()).hexdigest()[:32] if raw_id else ""
            if not uid or uid in seen:
                continue
            seen.add(uid)

            title = str(item.get("title") or item.get("jobTitle") or "")
            desc = str(item.get("description") or item.get("jobDescription") or "")

            if not title:
                continue
            if not _is_finance_relevant(title, desc):
                continue
            if _is_senior(title, desc):
                continue

            location_parts = [item.get("location"), item.get("city"), item.get("country")]
            location_str = next((str(x) for x in location_parts if x), "India")

            apply_url = str(item.get("url") or item.get("applyUrl") or item.get("jobUrl") or "")

            courses = await detect_courses(title, desc[:400]) or ["CA"]
            text = f"{title} {desc[:300]}"
            if re.search(r"\b(article|articleship|industrial\s+train)\b", text, re.I):
                job_type = "articleship"
            elif re.search(r"\b(intern(ship)?)\b", text, re.I):
                job_type = "internship"
            elif re.search(r"\b(trainee|graduate\s+trainee|management\s+trainee)\b", text, re.I):
                job_type = "trainee"
            else:
                job_type = "job"

            stipend = extract_stipend(str(item.get("salary") or ""))

            jobs.append(NormalizedJob(
                source="apify_career_sites",
                external_id=f"apify-career-{uid}",
                title=title,
                company=employer["name"],
                location=location_str,
                stipend=stipend,
                duration="",
                courses=courses,
                job_type=job_type,
                apply_url=apply_url,
                description=desc[:2000] if desc else None,
                is_remote=bool(item.get("isRemote") or item.get("remote")),
                posted_at=_parse_date(item.get("postedAt") or item.get("datePosted")),
                logo_url=logo_url_from_company(employer["name"], employer.get("url", "")),
                raw_data=f'{{"employer":"{employer["name"][:40]}"}}'
            ))

    logger.info(f"[apify_career] Total fetched: {len(jobs)} jobs from {len(targets)} employers")
    return jobs
