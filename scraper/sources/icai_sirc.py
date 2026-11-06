"""ICAI SIRC (Southern Region) articleship vacancy scraper."""
import re
import asyncio
import httpx
from bs4 import BeautifulSoup
from datetime import datetime
from scraper.types import NormalizedJob
from scraper.parse_utils import extract_stipend, extract_articleship_duration

BASE = "https://sirc-icai.org"
LIST_URL = f"{BASE}/vacancy-advertisement.php"
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; ArivuPro/1.0; +https://arivupro.com)"}

SOUTH_CITIES = [
    "Chennai", "Bangalore", "Bengaluru", "Hyderabad", "Coimbatore",
    "Kochi", "Thiruvananthapuram", "Madurai", "Visakhapatnam", "Vijayawada",
    "Mysore", "Mangalore", "Salem", "Tiruchirappalli", "Trichy",
]


def _extract_city(text: str) -> str:
    for city in SOUTH_CITIES:
        if re.search(city, text, re.I):
            return city
    return 'South India'


def _parse_date(text: str) -> datetime:
    if not text:
        return datetime.utcnow()
    try:
        return datetime.strptime(text.strip(), '%d-%b-%Y')
    except ValueError:
        pass
    try:
        return datetime.strptime(text.strip(), '%Y-%m-%d')
    except ValueError:
        pass
    return datetime.utcnow()


async def fetch() -> list[NormalizedJob]:
    async with httpx.AsyncClient(headers=HEADERS, timeout=20, follow_redirects=True) as client:
        resp = await client.get(LIST_URL)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, 'html.parser')

        jobs: list[NormalizedJob] = []
        rows = soup.select('table tbody tr, .vacancy-table tbody tr, .table tr')

        for idx, row in enumerate(rows):
            cells = row.find_all('td')
            if len(cells) < 2:
                continue
            first = cells[0].get_text().strip()
            if not first or re.search(r'sl\.?\s*no|s\.?\s*no', first, re.I):
                continue

            employer = cells[1].get_text().strip() or first
            loc_text = cells[2].get_text().strip() if len(cells) > 2 else ''
            date_text = cells[-1].get_text().strip()

            a_tag = row.find('a', href=True)
            href = a_tag['href'] if a_tag else ''
            detail_url = href if href.startswith('http') else (f'{BASE}/{href.lstrip("/")}' if href else '')

            parts = [p for p in (detail_url.split('?')[0].split('#')[0].split('/')) if p]
            external_id = (
                f'sirc-{parts[-1]}' if detail_url else
                f'sirc-{idx}-{re.sub(r"\\s", "-", employer[:15])}'
            )

            jobs.append(NormalizedJob(
                source='icai_sirc',
                external_id=external_id,
                title='Article Assistant',
                company=employer or 'CA Firm (SIRC)',
                location=_extract_city(loc_text) if loc_text else 'South India',
                stipend=extract_stipend(loc_text),
                duration=extract_articleship_duration(loc_text),
                courses=['CA'],
                job_type='articleship',
                apply_url=detail_url or LIST_URL,
                description=f'Location: {loc_text}' if loc_text else None,
                is_remote=False,
                posted_at=_parse_date(date_text),
                raw_data=f'{{"employer":"{employer[:60]}","loc":"{loc_text[:60]}"}}'
            ))

        # Enrich top 10
        for job in jobs[:10]:
            if not job.apply_url or job.apply_url == LIST_URL:
                continue
            try:
                dr = await client.get(job.apply_url, timeout=10)
                if dr.is_success:
                    body = BeautifulSoup(dr.text, 'html.parser').get_text(separator=' ')
                    body_clean = re.sub(r'\s+', ' ', body).strip()
                    s = extract_stipend(body)
                    if s > 0:
                        job.stipend = s
                    job.duration = extract_articleship_duration(body)
                    if body_clean:
                        job.description = body_clean[:2000]
                    city = _extract_city(body)
                    if city != 'South India':
                        job.location = city
            except Exception:
                pass
            await asyncio.sleep(1.5)

    return jobs
