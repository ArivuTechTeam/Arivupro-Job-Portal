"""CAClubIndia RSS feed scraper — free source."""
import re
import httpx
from bs4 import BeautifulSoup
from datetime import datetime
from scraper.types import NormalizedJob
from scraper.parse_utils import extract_stipend, extract_duration, extract_articleship_duration
from scraper.course_detector import detect_courses

RSS_URL = "https://feeds2.feedburner.com/CaclubindiacomJobs"
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; ArivuPro/1.0; +https://arivupro.com)"}

FINANCE_RE = re.compile(r'article|articleship|audit|tax|account|finance|\bca\b|\bcs\b|\bcma\b|gst|income tax|\bmis\b|compliance|secretary', re.I)
ARTICLESHIP_RE = re.compile(r'article|articleship|article trainee|article assistant|article clerk', re.I)


def _slug_to_id(url: str) -> str:
    m = re.search(r'-(\d+)\.asp', url)
    return f'caclub-{m.group(1)}' if m else f'caclub-{url[-20:]}'


async def fetch() -> list[NormalizedJob]:
    async with httpx.AsyncClient(timeout=15, headers=HEADERS) as client:
        resp = await client.get(RSS_URL)
        resp.raise_for_status()

    soup = BeautifulSoup(resp.text, 'lxml-xml')
    jobs: list[NormalizedJob] = []

    for item in soup.find_all('item'):
        title = (item.find('title') or item).get_text().strip()
        link = (item.find('link') or item).get_text().strip()
        pub_date = (item.find('pubDate') or item).get_text().strip()
        desc_raw = (item.find('description') or item).get_text()
        desc = re.sub(r'<[^>]+>', ' ', desc_raw).strip()
        company = (item.find('author') or item).get_text().strip()

        combined = f'{title} {desc}'
        if not FINANCE_RE.search(combined):
            continue

        job_type = 'articleship' if ARTICLESHIP_RE.search(combined) else 'job'

        try:
            posted_at = datetime.strptime(pub_date, '%a, %d %b %Y %H:%M:%S %z').replace(tzinfo=None) if pub_date else datetime.utcnow()
        except Exception:
            posted_at = datetime.utcnow()

        jobs.append(NormalizedJob(
            source='caclubindia',
            external_id=_slug_to_id(link),
            title=title,
            company=company or 'CA Firm',
            location='',
            stipend=extract_stipend(desc),
            duration=extract_articleship_duration(desc) if job_type == 'articleship' else extract_duration(desc),
            courses=[],
            job_type=job_type,
            apply_url=link,
            description=desc[:2000],
            is_remote=bool(re.search(r'remote|work from home|wfh', desc, re.I)),
            posted_at=posted_at,
            raw_data=f'{{"title":"{title[:60]}","link":"{link[:100]}"}}'
        ))

    for j in jobs:
        j.courses = await detect_courses(j.title, j.description or '')

    return jobs
