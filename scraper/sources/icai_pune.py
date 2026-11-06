"""ICAI Pune articleship vacancy scraper — card-based HTML."""
import re
import asyncio
import httpx
from bs4 import BeautifulSoup
from datetime import datetime
from scraper.types import NormalizedJob
from scraper.parse_utils import extract_stipend, extract_articleship_duration

BASE = "https://puneicai.org"
LIST_URL = f"{BASE}/vacancies/viewVacancies"
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; ArivuPro/1.0; +https://arivupro.com)"}
PAGE_LIMIT = 10

PUNE_AREAS = [
    "Kothrud", "Shivajinagar", "Deccan", "Hadapsar", "Baner", "Aundh",
    "Pimpri", "Chinchwad", "Wakad", "Hinjewadi", "Viman Nagar", "Koregaon",
    "Narayan Peth", "Sadashiv Peth", "Karve Nagar", "Warje", "Katraj",
]


def _extract_location(text: str) -> str:
    for area in PUNE_AREAS:
        if re.search(area, text, re.I):
            return f'{area}, Pune'
    if re.search('pune', text, re.I):
        return 'Pune'
    return text[:60].strip() or 'Pune'


def _parse_cards(html: str) -> list[dict]:
    soup = BeautifulSoup(html, 'html.parser')
    results = []

    for card in soup.select('.card.jobcard'):
        title = (card.select_one('.card-title, h5') or card).get_text().strip() or 'Article Assistant'

        company_tag = None
        for p in card.find_all('p'):
            if 'firm name' in p.get_text().lower():
                company_tag = p
                break
        company = re.sub(r'firm name\s*:\s*', '', company_tag.get_text(), flags=re.I).strip() if company_tag else 'CA Firm (Pune)'

        loc_li = None
        for li in card.find_all('li'):
            if li.find(class_=re.compile('fa-map')):
                loc_li = li
                break
        loc_raw = loc_li.get_text().strip() if loc_li else ''
        location = _extract_location(loc_raw)

        all_p = card.select('p.mt-2, .card-body p')
        desc = all_p[-1].get_text().strip()[:2000] if all_p else ''

        # Find apply link
        detail_href = ''
        for a in card.find_all('a', href=True):
            if 'vacancy-details' in a['href']:
                detail_href = a['href']
                break
        detail_url = detail_href if detail_href.startswith('http') else (f'{BASE}{detail_href}' if detail_href else LIST_URL)

        m = re.search(r'vacancy-details/(\d+)', detail_url)
        external_id = f'pune-{m.group(1)}' if m else f'pune-{re.sub(r"\\s", "-", company[:15])}-{re.sub(r"\\s", "-", title[:10])}'

        results.append({'title': title, 'company': company, 'location': location, 'description': desc, 'detail_url': detail_url, 'external_id': external_id})

    return results


async def fetch() -> list[NormalizedJob]:
    jobs: list[NormalizedJob] = []
    seen: set[str] = set()

    async with httpx.AsyncClient(headers=HEADERS, timeout=20, follow_redirects=True) as client:
        for page in range(1, PAGE_LIMIT + 1):
            url = LIST_URL if page == 1 else f'{LIST_URL}?page={page}'
            try:
                resp = await client.get(url)
                if not resp.is_success:
                    if page == 1:
                        resp.raise_for_status()
                    break
            except Exception as e:
                if page == 1:
                    raise
                break

            cards = _parse_cards(resp.text)
            if not cards:
                break

            for c in cards:
                if c['external_id'] in seen:
                    continue
                seen.add(c['external_id'])

                jobs.append(NormalizedJob(
                    source='icai_pune',
                    external_id=c['external_id'],
                    title=c['title'],
                    company=c['company'],
                    location=c['location'],
                    stipend=extract_stipend(c['description']),
                    duration=extract_articleship_duration(c['description']),
                    courses=['CA'],
                    job_type='articleship',
                    apply_url=c['detail_url'],
                    description=c['description'] or None,
                    is_remote=False,
                    posted_at=datetime.utcnow(),
                    raw_data=f'{{"company":"{c["company"][:60]}","loc":"{c["location"][:60]}"}}'
                ))

            soup = BeautifulSoup(resp.text, 'html.parser')
            next_link = soup.find('a', string=str(page + 1)) or soup.find('a', href=re.compile(f'page={page + 1}'))
            if not next_link:
                break
            await asyncio.sleep(1.5)

    return jobs
