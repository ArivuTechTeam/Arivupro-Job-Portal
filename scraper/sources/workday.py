"""Workday CXS API scraper — uses Playwright to bypass Cloudflare bot check.

Workday career pages use Cloudflare Bot Management (__cf_bm cookie), which
requires real browser JS execution. We launch a headless Chromium, let the
page load (triggering CF challenge), extract the CSRF token from cookies,
then call the internal CXS JSON API directly with httpx.

Each entry in COMPANY_BOARDS:
  (subdomain, tenant_id, site_path, display_name)

Finding a company's Workday URL:
  Visit their careers page, the URL will look like:
  https://{subdomain}.wd{N}.myworkdayjobs.com/en-US/{site_path}
"""
import re
import asyncio
import httpx
import logging
from datetime import datetime
from scraper.types import NormalizedJob
from scraper.course_detector import detect_courses

logger = logging.getLogger(__name__)

COMPANY_BOARDS: list[tuple[str, str, str, str]] = [
    # (subdomain, tenant, site_path, display_name)
    ("deloitte",   "1", "Deloitte_Career",              "Deloitte"),
    ("ey",         "5", "EY_External_Careers",          "EY"),
    ("kpmg",       "3", "KPMG_External",                "KPMG"),
    ("accenture",  "5", "AccentureCareerOpportunities", "Accenture"),
    ("genpact",    "1", "Genpact",                      "Genpact"),
    ("cognizant",  "5", "CognizantCareer",              "Cognizant"),
    ("wipro",      "5", "Global",                       "Wipro"),
    ("wns",        "1", "WNS",                          "WNS Global"),
]

FINANCE_RE = re.compile(
    r'audit|tax|account|financ|ca\b|cpa|acca|cfa|cma|cs\b|gst|compliance|'
    r'treasury|controller|bookkeep|payable|receivable|payroll|budget|'
    r'forecast|fp&a|risk|analyst|associate|articleship|trainee|intern',
    re.I
)

SEARCH_TERMS = ["finance", "audit", "tax", "accountant", "CA", "compliance"]


async def _get_csrf_and_cookies(subdomain: str, tenant: str, site_path: str) -> tuple[str | None, dict]:
    """Launch headless Chromium, load the Workday page, return CSRF token + cookies.

    KNOWN LIMITATION: Workday's CDN (wday_vps_cookie) detects datacenter/server IPs
    and returns "Workday is currently unavailable." — blocking the page from loading.
    Playwright bypasses Cloudflare bot checks but cannot bypass this VPS IP detection.
    This scraper will only work when run from a residential IP (not Docker/Railway/cloud).
    """
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        logger.warning("[workday] playwright not installed")
        return None, {}

    url = f"https://{subdomain}.wd{tenant}.myworkdayjobs.com/en-US/{site_path}"
    csrf = None
    cookies_dict: dict = {}

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
            ],
        )
        context = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1280, "height": 800},
        )
        page = await context.new_page()

        captured_csrf: list[str] = []

        async def on_request(request):
            token = request.headers.get("x-calypso-csrf-token")
            if token:
                captured_csrf.append(token)

        page.on("request", on_request)

        try:
            await page.goto(url, wait_until="networkidle", timeout=45000)
            await asyncio.sleep(3)
        except Exception as e:
            logger.warning(f"[workday] page load failed for {subdomain}: {e}")

        # Check if Workday blocked us (datacenter IP detection)
        try:
            content = await page.content()
            if "currently unavailable" in content.lower() or "maintenance" in content.lower():
                logger.warning(
                    f"[workday] {subdomain}: blocked by datacenter IP detection — "
                    "Workday requires a residential IP. Run locally to bypass."
                )
                await browser.close()
                return None, {}
        except Exception:
            pass

        all_cookies = await context.cookies()
        for c in all_cookies:
            cookies_dict[c["name"]] = c["value"]

        if captured_csrf:
            csrf = captured_csrf[-1]
        else:
            try:
                content = await page.content()
                m = re.search(r'"csrfToken"\s*:\s*"([A-F0-9a-f]{32})"', content)
                if m:
                    csrf = m.group(1)
            except Exception:
                pass

        await browser.close()

    return csrf, cookies_dict


async def _fetch_jobs_for_board(
    subdomain: str, tenant: str, site_path: str, display_name: str
) -> list[NormalizedJob]:
    """Get CSRF via Playwright, then call the CXS API for all finance terms."""
    csrf, cookies = await _get_csrf_and_cookies(subdomain, tenant, site_path)
    if not csrf:
        logger.warning(f"[workday] no CSRF for {subdomain} — skipping")
        return []

    base = f"https://{subdomain}.wd{tenant}.myworkdayjobs.com"
    api_url = f"{base}/wday/cxs/{subdomain}/{site_path}/jobs"
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Calypso-CSRF-Token": csrf,
        "Origin": base,
        "Referer": f"{base}/en-US/{site_path}",
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ),
    }

    seen_ids: set = set()
    all_jobs: list[NormalizedJob] = []

    async with httpx.AsyncClient(
        timeout=20,
        follow_redirects=True,
        cookies=cookies,
    ) as client:
        for term in SEARCH_TERMS:
            try:
                resp = await client.post(
                    api_url,
                    json={"appliedFacets": {}, "limit": 20, "offset": 0, "searchText": term},
                    headers=headers,
                )
                if resp.status_code != 200:
                    logger.warning(f"[workday] {subdomain} term={term} → HTTP {resp.status_code}")
                    continue
                data = resp.json()
            except Exception as e:
                logger.warning(f"[workday] {subdomain} term={term} error: {e}")
                continue

            for posting in data.get("jobPostings", []):
                title = (posting.get("title") or "").strip()
                ext_id = posting.get("externalId") or posting.get("bulletFields", [""])[0]
                if not title or not ext_id:
                    continue
                if ext_id in seen_ids:
                    continue

                combined = f"{title} {posting.get('locationsText', '')}"
                if not FINANCE_RE.search(combined):
                    continue

                seen_ids.add(ext_id)
                posted_on = posting.get("postedOn") or ""
                try:
                    posted_at = datetime.strptime(posted_on, "%m/%d/%Y")
                except Exception:
                    posted_at = datetime.utcnow()

                path = posting.get("externalPath") or ""
                apply_url = f"{base}{path}" if path else f"{base}/en-US/{site_path}/job/{ext_id}"
                location = (posting.get("locationsText") or "India").strip()

                all_jobs.append(NormalizedJob(
                    source="workday",
                    external_id=f"wd-{subdomain}-{ext_id}",
                    title=title,
                    company=display_name,
                    location=location,
                    stipend=0,
                    duration="",
                    courses=[],
                    job_type="job",
                    apply_url=apply_url,
                    description=f"{title} at {display_name} ({location})",
                    is_remote=bool(re.search(r"remote|work from home|wfh", combined, re.I)),
                    posted_at=posted_at,
                    raw_data=f'{{"company":"{display_name}","ext_id":"{ext_id}"}}',
                ))

    return all_jobs


async def fetch() -> list[NormalizedJob]:
    all_jobs: list[NormalizedJob] = []

    # Run boards sequentially — each needs a Playwright browser launch
    # Parallel launches would exhaust memory in the container
    for subdomain, tenant, site_path, display_name in COMPANY_BOARDS:
        logger.info(f"[workday] fetching {display_name} ({subdomain}.wd{tenant})")
        try:
            jobs = await _fetch_jobs_for_board(subdomain, tenant, site_path, display_name)
            logger.info(f"[workday] {display_name}: {len(jobs)} finance jobs")
            all_jobs.extend(jobs)
        except Exception as e:
            logger.error(f"[workday] {display_name} failed: {e}")

    for job in all_jobs:
        job.courses = await detect_courses(job.title, job.description or "")

    return all_jobs
