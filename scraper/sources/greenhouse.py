"""Greenhouse public API — free, no auth required.
Fetches jobs from employer boards on Greenhouse (Big 4, banks, GCCs, fintech).
API: https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true
"""
import re
import httpx
import asyncio
from datetime import datetime
from scraper.types import NormalizedJob
from scraper.course_detector import detect_courses

# Company slug → display name
# Slugs verified live against boards-api.greenhouse.io
COMPANY_SLUGS: dict[str, str] = {
    # Confirmed live (verified)
    "groww":        "Groww",
    "tcs":          "TCS",
    "stripe":       "Stripe",
    "slice":        "Slice",
    # Additional high-probability slugs to try (404s are silently skipped)
    "razorpay":     "Razorpay",
    "zerodha":      "Zerodha",
    "phonepe":      "PhonePe",
    "paytm":        "Paytm",
    "cred":         "CRED",
    "navi":         "Navi Technologies",
    "jupiter":      "Jupiter",
    "fi":           "Fi Money",
    "acko":         "Acko",
    "digit":        "Digit Insurance",
    "policybazaar": "Policybazaar",
    "cleartax":     "ClearTax",
    "zoho":         "Zoho",
    "freshworks":   "Freshworks",
    "chargebee":    "Chargebee",
    "postman":      "Postman",
    "browserstack": "BrowserStack",
    "innovaccer":   "Innovaccer",
    "darwinbox":    "Darwinbox",
    "leadsquared":  "LeadSquared",
    "kapture":      "Kapture CRM",
    "razorpayX":    "RazorpayX",
    "cashfree":     "Cashfree",
    "setu":         "Setu",
    "m2p":          "M2P Fintech",
    "perfios":      "Perfios",
    "yubi":         "Yubi",
    "credavenue":   "CredAvenue",
    "accenture":    "Accenture",
    "wipro":        "Wipro",
    "infosys":      "Infosys",
    "capgemini":    "Capgemini",
    "cognizant":    "Cognizant",
    "hexaware":     "Hexaware",
    "mphasis":      "Mphasis",
    "genpact":      "Genpact",
    "wns":          "WNS Global Services",
    "exlservice":   "EXL Service",
    "americanexpress": "American Express",
    "synchrony":    "Synchrony Financial",
    "visa":         "Visa",
    "mastercard":   "Mastercard",
    "intuit":       "Intuit",
    "oracle":       "Oracle",
    "sap":          "SAP",
    "workday":      "Workday",
    "goldmansachs": "Goldman Sachs",
    "morganstanley":"Morgan Stanley",
    "barclays":     "Barclays",
    "citi":         "Citi",
    "hsbc":         "HSBC",
    "protiviti":    "Protiviti",
    "aon":          "Aon",
    "mercer":       "Mercer",
    "bcg":          "BCG",
    "icra":         "ICRA",
    "crisil":       "CRISIL",
}

FINANCE_RE = re.compile(
    r'audit|tax|account|financ|ca\b|cpa|acca|cfa|cma|cs\b|gst|compliance|treasury|'
    r'controller|bookkeep|payable|receivable|payroll|budget|forecast|fp&a|risk|'
    r'analyst|associate|executive|assistant|trainee|intern|articleship',
    re.I
)

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; ArivuPro/1.0; +https://arivupro.com)"}
BASE_URL = "https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true"


def _parse_location(loc_obj) -> str:
    if not loc_obj:
        return ""
    name = loc_obj.get("name", "") if isinstance(loc_obj, dict) else str(loc_obj)
    return name or ""


def _detect_job_type(title: str, desc: str) -> str:
    text = f"{title} {desc}".lower()
    if re.search(r'articleship|article assistant|article trainee', text):
        return 'articleship'
    if re.search(r'intern|internship', text):
        return 'internship'
    if re.search(r'trainee|graduate trainee|management trainee', text):
        return 'trainee'
    return 'job'


def _parse_posted_at(updated_at: str | None) -> datetime:
    if not updated_at:
        return datetime.utcnow()
    try:
        return datetime.fromisoformat(updated_at.replace('Z', '+00:00')).replace(tzinfo=None)
    except Exception:
        return datetime.utcnow()


async def _fetch_company(client: httpx.AsyncClient, slug: str, display_name: str) -> list[NormalizedJob]:
    url = BASE_URL.format(slug=slug)
    try:
        resp = await client.get(url, timeout=12)
        if resp.status_code == 404:
            return []  # Company not on Greenhouse or slug changed
        resp.raise_for_status()
        data = resp.json()
    except Exception:
        return []

    jobs_raw = data.get("jobs", [])
    results: list[NormalizedJob] = []

    for j in jobs_raw:
        title = (j.get("title") or "").strip()
        if not title:
            continue

        # Pull description from content block
        content = j.get("content") or ""
        desc = re.sub(r'<[^>]+>', ' ', content).strip()[:2000]

        combined = f"{title} {desc}"
        if not FINANCE_RE.search(combined):
            continue

        location = _parse_location(j.get("location"))
        job_id = str(j.get("id", ""))
        apply_url = j.get("absolute_url") or f"https://boards.greenhouse.io/{slug}/jobs/{job_id}"
        posted_at = _parse_posted_at(j.get("updated_at"))
        job_type = _detect_job_type(title, desc)

        results.append(NormalizedJob(
            source='greenhouse',
            external_id=f'gh-{slug}-{job_id}',
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
            raw_data=f'{{"slug":"{slug}","job_id":"{job_id}"}}',
        ))

    return results


async def fetch() -> list[NormalizedJob]:
    all_jobs: list[NormalizedJob] = []

    async with httpx.AsyncClient(headers=HEADERS, follow_redirects=True) as client:
        # Fetch all companies concurrently in batches of 10
        slugs = list(COMPANY_SLUGS.items())
        for i in range(0, len(slugs), 10):
            batch = slugs[i:i + 10]
            results = await asyncio.gather(
                *[_fetch_company(client, slug, name) for slug, name in batch],
                return_exceptions=True,
            )
            for r in results:
                if isinstance(r, list):
                    all_jobs.extend(r)

    # AI course detection in batches
    for job in all_jobs:
        job.courses = await detect_courses(job.title, job.description or '')

    return all_jobs
