"""ICMAI (CMA India) industrial training vacancy scraper."""
import re
import httpx
from bs4 import BeautifulSoup
from datetime import datetime
from scraper.types import NormalizedJob
from scraper.parse_utils import extract_stipend, extract_articleship_duration

BASE = "https://icmai.in"
LIST_URL = f"{BASE}/ClntStudents/Placement_NewsandUpdates"
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; ArivuPro/1.0; +https://arivupro.com)"}

CITIES = [
    "Mumbai", "Delhi", "Bangalore", "Bengaluru", "Chennai", "Hyderabad",
    "Kolkata", "Pune", "Ahmedabad", "Surat", "Jaipur", "Lucknow",
    "Kanpur", "Nagpur", "Indore", "Bhopal", "Patna", "Vadodara",
    "Coimbatore", "Kochi", "Thiruvananthapuram", "Visakhapatnam",
    "Noida", "Gurgaon", "Gurugram", "Chandigarh", "Bhubaneswar",
]


def _extract_city(text: str) -> str:
    for city in CITIES:
        if re.search(rf'\b{city}\b', text, re.I):
            return city
    return 'India'


def _parse_deadline(text: str) -> datetime:
    m = re.search(r'(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})', text)
    if m:
        d, mo, y = m.group(1), m.group(2), m.group(3)
        year = 2000 + int(y) if len(y) == 2 else int(y)
        try:
            return datetime(year, int(mo), int(d))
        except ValueError:
            pass
    return datetime.utcnow()


def _extract_company(text: str) -> str:
    m = re.search(r'\bat\s+([^._\n]{4,80}?)[\._]', text, re.I)
    if m:
        return m.group(1).strip()
    m2 = re.search(r'for\s+(?:CMA\s+\w+\s+)?(?:candidates?\s+)?at\s+(.+?)(?:[._\n]|$)', text, re.I)
    if m2:
        return m2.group(1).strip()[:80]
    return 'CMA Firm'


def _detect_job_type(text: str) -> tuple[str, str, list[str]]:
    t = text.lower()
    if 'intermediate' in t:
        return 'articleship', 'Industrial Trainee (CMA Intermediate)', ['CMA India']
    if 'qualified' in t or 'experienced' in t:
        return 'job', 'Cost Accountant (CMA Qualified)', ['CMA India']
    return 'articleship', 'Industrial Training (CMA)', ['CMA India']


async def fetch() -> list[NormalizedJob]:
    async with httpx.AsyncClient(headers=HEADERS, timeout=20, follow_redirects=True) as client:
        resp = await client.get(LIST_URL)
        resp.raise_for_status()

    soup = BeautifulSoup(resp.text, 'html.parser')
    jobs: list[NormalizedJob] = []
    seen: set[str] = set()

    # Links that are Google Form / Drive / ICMAI placement links
    links = []
    for a in soup.find_all('a', href=True):
        href = a['href']
        text = a.get_text()
        if (
            'docs.google.com/forms' in href or
            'drive.google.com/file' in href or
            ('icmai.in' in href and re.search(r'invit|vacanc|training|placement', text, re.I))
        ):
            links.append(a)

    # Also plain <li> entries
    all_li = [li for li in soup.find_all('li') if re.search(r'invit|application|CMA|industrial\s+train', li.get_text(), re.I) and len(li.get_text()) > 20]

    def process(text: str, href: str, idx: int):
        text = re.sub(r'\s+', ' ', text).strip()
        if not text or len(text) < 15:
            return

        company = _extract_company(text)
        job_type, title, courses = _detect_job_type(text)
        city = _extract_city(text)
        posted_at = _parse_deadline(text)
        stipend = extract_stipend(text)
        duration = extract_articleship_duration(text) if job_type == 'articleship' else ''

        m = re.search(r'/d/([a-zA-Z0-9_-]{20,})/', href)
        external_id = (
            f'icmai-form-{m.group(1)}' if m else
            f'icmai-{idx}-{re.sub(r"[^a-z0-9]", "-", company[:20].lower())}'
        )
        if external_id in seen:
            return
        seen.add(external_id)

        jobs.append(NormalizedJob(
            source='icmai',
            external_id=external_id,
            title=title,
            company=company,
            location=city,
            stipend=stipend,
            duration=duration,
            courses=courses,
            job_type=job_type,
            apply_url=href or LIST_URL,
            description=text[:1000],
            is_remote=bool(re.search(r'online|remote|work from home|wfh', text, re.I)),
            posted_at=posted_at,
            raw_data=f'{{"text":"{text[:100]}"}}'
        ))

    for idx, a in enumerate(links):
        href = a['href']
        li = a.find_parent('li')
        text = li.get_text() if li else a.get_text()
        process(text, href, idx)

    for idx, li in enumerate(all_li):
        text = li.get_text()
        a_tag = li.find('a', href=True)
        href = a_tag['href'] if a_tag else LIST_URL
        process(text, href, len(links) + idx)

    return jobs
