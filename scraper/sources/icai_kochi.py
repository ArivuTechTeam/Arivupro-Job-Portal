"""ICAI Kochi articleship vacancy scraper — paginated HTML table."""
import re
import asyncio
import httpx
from bs4 import BeautifulSoup
from datetime import datetime
from scraper.types import NormalizedJob
from scraper.parse_utils import extract_stipend, extract_articleship_duration

BASE = "https://kochiicai.org"
LIST_URL = f"{BASE}/vacancies.php"
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; ArivuPro/1.0; +https://arivupro.com)"}
PAGE_LIMIT = 10


def _parse_date(text: str) -> datetime:
    for fmt in ('%d-%b-%Y', '%Y-%m-%d', '%d/%m/%Y'):
        try:
            return datetime.strptime(text.strip(), fmt)
        except ValueError:
            pass
    return datetime.utcnow()


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
                html = resp.text
            except Exception as e:
                if page == 1:
                    raise
                break

            soup = BeautifulSoup(html, 'html.parser')
            rows = soup.select('table tbody tr, .vacancy-list tr, .table tbody tr')
            if not rows:
                break

            parsed_any = False
            for idx, row in enumerate(rows):
                cells = row.find_all('td')
                if len(cells) < 2:
                    continue
                first = cells[0].get_text().strip()
                if not first or re.search(r'sl\.?\s*no|s\.?\s*no|#', first, re.I):
                    continue

                a_tag = row.find('a', href=True)
                href = a_tag['href'] if a_tag else ''
                detail_url = href if href.startswith('http') else (f'{BASE}/{href.lstrip("/")}' if href else '')

                employer = cells[1].get_text().strip() or first
                posted = cells[-1].get_text().strip()
                qual = cells[3].get_text().strip() if len(cells) > 3 else 'CA'

                parts = [p for p in re.split(r'[/?#]', detail_url) if p]
                external_id = (
                    f'kochi-{parts[-1]}' if detail_url else
                    f'kochi-p{page}-r{idx}-{re.sub(r"\\s", "-", employer[:10])}'
                )
                if external_id in seen:
                    continue
                seen.add(external_id)
                parsed_any = True

                jobs.append(NormalizedJob(
                    source='icai_kochi',
                    external_id=external_id,
                    title='Article Assistant',
                    company=employer or 'CA Firm (Kochi)',
                    location='Kochi, Kerala',
                    stipend=extract_stipend(qual),
                    duration=extract_articleship_duration(qual),
                    courses=['CA'],
                    job_type='articleship',
                    apply_url=detail_url or LIST_URL,
                    description=f'Qualification: {qual}' if qual else None,
                    is_remote=False,
                    posted_at=_parse_date(posted),
                    raw_data=f'{{"employer":"{employer[:60]}","page":{page}}}'
                ))

            if not parsed_any:
                break

            # Check for next page link
            next_link = soup.find('a', string=str(page + 1)) or soup.find('a', href=re.compile(f'page={page + 1}'))
            if not next_link:
                break
            await asyncio.sleep(1.5)

    return jobs
