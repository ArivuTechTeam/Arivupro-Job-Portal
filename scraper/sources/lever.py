"""Lever public API — free, no auth required.
Fetches jobs from employer boards on Lever (startups, fintech, consulting).
API: https://api.lever.co/v0/postings/{slug}?mode=json
"""
import re
import httpx
import asyncio
from datetime import datetime
from scraper.types import NormalizedJob
from scraper.course_detector import detect_courses
from scraper.parse_utils import logo_url_from_company

# Company slug → display name
# Slugs verified live against api.lever.co/v0/postings/
# Most Indian companies use Greenhouse/Workday; Lever is US-dominant
COMPANY_SLUGS: dict[str, str] = {
    # Confirmed live
    "cred":           "CRED",
    "meesho":         "Meesho",
    # High-probability additional slugs (404s silently skipped)
    "razorpay":       "Razorpay",
    "zerodha":        "Zerodha",
    "groww":          "Groww",
    "phonepe":        "PhonePe",
    "paytm":          "Paytm",
    "slice":          "Slice",
    "navi":           "Navi Technologies",
    "smallcase":      "Smallcase",
    "acko":           "Acko",
    "digit":          "Digit Insurance",
    "cleartax":       "ClearTax",
    "zoho":           "Zoho",
    "freshworks":     "Freshworks",
    "chargebee":      "Chargebee",
    "darwinbox":      "Darwinbox",
    "leadsquared":    "LeadSquared",
    "cashfree":       "Cashfree",
    "perfios":        "Perfios",
    "stripe":         "Stripe",
    "intuit":         "Intuit",
    "visa":           "Visa",
    "mastercard":     "Mastercard",
    "americanexpress":"American Express",
    "synchrony":      "Synchrony Financial",
    "workday":        "Workday",
    "oracle":         "Oracle",
    "sap":            "SAP",
    "bcg":            "BCG",
    "aon":            "Aon",
    "mercer":         "Mercer",
    "accenture":      "Accenture",
    "wipro":          "Wipro",
    "infosys":        "Infosys",
    "genpact":        "Genpact",
    "wns":            "WNS Global Services",
    "exlservice":     "EXL Service",
    # Big 4 / Mid-tier Lever slugs (404s silently skipped)
    "deloitte":       "Deloitte",
    "kpmg":           "KPMG",
    "pwc":            "PwC",
    "ey":             "EY",
    "grantthornton":  "Grant Thornton",
    "bdo":            "BDO India",
    "rsm":            "RSM India",
    "protiviti":      "Protiviti",
}

FINANCE_RE = re.compile(
    r'audit|tax|account|financ|ca\b|cpa|acca|cfa|cma|cs\b|gst|compliance|treasury|'
    r'controller|bookkeep|payable|receivable|payroll|budget|forecast|fp&a|risk|'
    r'analyst|associate|executive|assistant|trainee|intern|articleship',
    re.I
)

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; ArivuPro/1.0; +https://arivupro.com)"}
BASE_URL = "https://api.lever.co/v0/postings/{slug}?mode=json"


def _detect_job_type(title: str, desc: str) -> str:
    text = f"{title} {desc}".lower()
    if re.search(r'articleship|article assistant|article trainee', text):
        return 'articleship'
    if re.search(r'intern|internship', text):
        return 'internship'
    if re.search(r'trainee|graduate trainee|management trainee', text):
        return 'trainee'
    return 'job'


def _parse_location(categories) -> str:
    if not categories:
        return ""
    loc = categories.get("location", "") if isinstance(categories, dict) else ""
    return loc or ""


def _parse_posted_at(created_at) -> datetime:
    if not created_at:
        return datetime.utcnow()
    try:
        # Lever returns ms timestamp
        ts = int(created_at) / 1000
        return datetime.utcfromtimestamp(ts)
    except Exception:
        return datetime.utcnow()


async def _fetch_company(client: httpx.AsyncClient, slug: str, display_name: str) -> list[NormalizedJob]:
    url = BASE_URL.format(slug=slug)
    try:
        resp = await client.get(url, timeout=12)
        if resp.status_code in (404, 403):
            return []
        resp.raise_for_status()
        postings = resp.json()
    except Exception:
        return []

    if not isinstance(postings, list):
        return []

    results: list[NormalizedJob] = []

    for p in postings:
        title = (p.get("text") or "").strip()
        if not title:
            continue

        # Lever description is in p["descriptionPlain"] or p["description"] (HTML)
        desc_plain = p.get("descriptionPlain") or ""
        desc_html = p.get("description") or ""
        desc = (desc_plain or re.sub(r'<[^>]+>', ' ', desc_html)).strip()[:2000]

        # Also check lists (responsibilities, requirements)
        for block in (p.get("lists") or []):
            desc += " " + re.sub(r'<[^>]+>', ' ', block.get("content", ""))
        desc = desc.strip()[:2000]

        combined = f"{title} {desc}"
        if not FINANCE_RE.search(combined):
            continue

        job_id = p.get("id", "")
        apply_url = p.get("hostedUrl") or f"https://jobs.lever.co/{slug}/{job_id}"
        location = _parse_location(p.get("categories"))
        posted_at = _parse_posted_at(p.get("createdAt"))
        job_type = _detect_job_type(title, desc)

        results.append(NormalizedJob(
            source='lever',
            external_id=f'lv-{slug}-{job_id}',
            title=title,
            company=display_name,
            location=location,
            stipend=0,
            duration='',
            courses=[],
            job_type=job_type,
            apply_url=apply_url,
            description=desc,
            is_remote=bool(re.search(r'remote|work from home|wfh', combined, re.I)),
            posted_at=posted_at,
            logo_url=logo_url_from_company(display_name, apply_url),
            raw_data=f'{{"slug":"{slug}","posting_id":"{job_id}"}}',
        ))

    return results


async def fetch() -> list[NormalizedJob]:
    seen: set[str] = set()
    all_jobs: list[NormalizedJob] = []

    async with httpx.AsyncClient(headers=HEADERS, follow_redirects=True) as client:
        slugs = list(COMPANY_SLUGS.items())
        for i in range(0, len(slugs), 10):
            batch = slugs[i:i + 10]
            results = await asyncio.gather(
                *[_fetch_company(client, slug, name) for slug, name in batch],
                return_exceptions=True,
            )
            for r in results:
                if isinstance(r, list):
                    for job in r:
                        if job.external_id not in seen:
                            seen.add(job.external_id)
                            all_jobs.append(job)

    for job in all_jobs:
        job.courses = await detect_courses(job.title, job.description or '')

    return all_jobs
