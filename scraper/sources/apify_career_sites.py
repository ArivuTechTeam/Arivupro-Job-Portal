"""
Apify — ATS Career Site Scraper
Actor: rowcraft/career-site-jobs-scraper
Covers: Greenhouse, Lever, Ashby, Workday, Workable, iCIMS — direct employer career pages
Pricing: ~$3.13/1,000 results. Free plan ≈ 1,600 jobs/month.
Docs: https://apify.com/rowcraft/career-site-jobs-scraper

Target companies: Big 4, mid-tier CA firms, banks, GCCs, asset managers.
These post on Workday/Greenhouse/Lever — not on Naukri/Indeed — so this is unique coverage.
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

ACTOR_ID = os.getenv("APIFY_CAREER_SITES_ACTOR_ID", "rowcraft/career-site-jobs-scraper")
APIFY_BASE = "https://api.apify.com/v2"

# Finance / CA-relevant keywords to filter at the query stage
SEARCH_KEYWORDS = [
    "articleship", "article assistant", "audit associate",
    "CA inter", "chartered accountant", "CMA", "cost accountant",
    "company secretary", "CS executive", "ACCA", "CFA analyst",
    "US CPA", "tax associate", "GST", "FP&A", "internal audit",
    "accounts executive", "finance analyst", "financial reporting",
]

# Target employer career pages — Big 4 + major CA/finance employers in India
# ATS type: workday, greenhouse, lever, ashby, workable, icims
TARGET_EMPLOYERS = [
    # Big 4
    {"name": "Deloitte India",         "url": "https://jobs.deloitte.com",         "ats": "workday"},
    {"name": "EY India",               "url": "https://careers.ey.com",            "ats": "workday"},
    {"name": "KPMG India",             "url": "https://kpmg.com/in/en/careers",    "ats": "workday"},
    {"name": "PwC India",              "url": "https://pwc.in/careers",            "ats": "workday"},
    # Mid-tier
    {"name": "Grant Thornton India",   "url": "https://careers.grantthornton.in",  "ats": "greenhouse"},
    {"name": "BDO India",              "url": "https://bdo.in/careers",            "ats": "workday"},
    {"name": "RSM India",              "url": "https://rsm.in/careers",            "ats": "lever"},
    {"name": "Mazars India",           "url": "https://mazars.in/careers",         "ats": "greenhouse"},
    # Banks / BFSI
    {"name": "HDFC Bank",              "url": "https://www.hdfcbank.com/personal/about-us/careers", "ats": "workday"},
    {"name": "Axis Bank",              "url": "https://careers.axisbank.com",      "ats": "workday"},
    {"name": "ICICI Bank",             "url": "https://careers.icicibank.com",     "ats": "workday"},
    # GCCs / MNCs
    {"name": "Goldman Sachs India",    "url": "https://www.goldmansachs.com/careers", "ats": "workday"},
    {"name": "JP Morgan India",        "url": "https://careers.jpmorgan.com",      "ats": "workday"},
    {"name": "Barclays India",         "url": "https://home.barclays/careers",     "ats": "workday"},
    {"name": "Morgan Stanley India",   "url": "https://careers.morganstanley.com", "ats": "workday"},
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

        logger.info(f"[apify_career] Run {run_id} started for {payload.get('urls', ['?'])[0]}, polling…")

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


async def fetch() -> list[NormalizedJob]:
    api_token = os.getenv("APIFY_API_TOKEN")
    if not api_token or api_token == "your-apify-api-token":
        raise RuntimeError("APIFY_API_TOKEN not set")

    # Allow restricting targets via env (comma-separated company names)
    targets_env = os.getenv("APIFY_CAREER_TARGETS", "")
    if targets_env:
        allowed = {t.strip().lower() for t in targets_env.split(",")}
        targets = [e for e in TARGET_EMPLOYERS if e["name"].lower() in allowed]
    else:
        targets = TARGET_EMPLOYERS

    seen: set[str] = set()
    jobs: list[NormalizedJob] = []

    for employer in targets:
        payload = {
            "urls": [employer["url"]],
            "atsType": employer.get("ats", "workday"),
            "maxItems": int(os.getenv("APIFY_CAREER_MAX_PER_EMPLOYER", "50")),
            "includeDescription": True,
        }

        try:
            items = await _run_actor(api_token, payload)
        except Exception as e:
            logger.warning(f"[apify_career] {employer['name']} failed: {e}")
            continue

        for item in items:
            uid = str(item.get("id") or item.get("jobId") or item.get("url") or "")[-50:]
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
            job_type = (
                "articleship"
                if re.search(r"article|articleship|industrial train|trainee", f"{title} {desc}", re.I)
                else "job"
            )

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
                raw_data=f'{{"employer":"{employer["name"][:40]}","ats":"{employer["ats"]}"}}'
            ))

        await asyncio.sleep(3)

    logger.info(f"[apify_career] Total fetched: {len(jobs)} jobs from {len(targets)} employers")
    return jobs
