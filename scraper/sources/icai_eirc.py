"""ICAI EIRC (Eastern Region) articleship vacancy scraper."""
import re
import asyncio
import httpx
from bs4 import BeautifulSoup
from datetime import datetime
from scraper.types import NormalizedJob
from scraper.parse_utils import extract_stipend, extract_articleship_duration

BASE = "https://eirc-icai.org"
LIST_URL = f"{BASE}/vacancy/list"
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; ArivuPro/1.0; +https://arivupro.com)"}


def _parse_date(text: str) -> datetime:
    if not text:
        return datetime.utcnow()
    for fmt in ('%d-%b-%Y', '%Y-%m-%d', '%d/%m/%Y'):
        try:
            return datetime.strptime(text.strip(), fmt)
        except ValueError:
            pass
    return datetime.utcnow()


async def _fetch_detail(client: httpx.AsyncClient, url: str) -> dict:
    try:
        resp = await client.get(url, timeout=10)
        if not resp.is_success:
            return {'stipend': 0, 'location': 'East India', 'description': ''}
        soup = BeautifulSoup(resp.text, 'html.parser')
        body = soup.get_text(separator=' ')
        m = re.search(r'(?:city|location|address)[:\s]+([A-Za-z\s]+)', body, re.I)
        return {
            'stipend': extract_stipend(body),
            'location': m.group(1).strip()[:80] if m else 'East India',
            'description': re.sub(r'\s+', ' ', body).strip()[:2000],
        }
    except Exception:
        return {'stipend': 0, 'location': 'East India', 'description': ''}


async def fetch() -> list[NormalizedJob]:
    async with httpx.AsyncClient(headers=HEADERS, timeout=20, follow_redirects=True) as client:
        resp = await client.get(LIST_URL)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, 'html.parser')

        jobs: list[NormalizedJob] = []
        rows = soup.select('#article-tab tbody tr, .vacancy-table tbody tr, table tbody tr')

        for row in rows:
            cells = row.find_all('td')
            if len(cells) < 2:
                continue
            date_text = cells[0].get_text().strip()
            employer = cells[1].get_text().strip()
            if not employer or employer.lower() == 'employer':
                continue

            a_tag = row.find('a', href=True)
            href = a_tag['href'] if a_tag else ''
            detail_url = href if href.startswith('http') else (f'{BASE}{href}' if href else '')
            external_id = (
                f'eirc-{detail_url.rstrip("/").split("/")[-1]}'
                if detail_url else
                f'eirc-{re.sub(r"\\s", "-", employer[:20])}-{date_text}'
            )

            jobs.append(NormalizedJob(
                source='icai_eirc',
                external_id=external_id,
                title='Article Assistant',
                company=employer,
                location='East India',
                stipend=0,
                duration='2 years',
                courses=['CA'],
                job_type='articleship',
                apply_url=detail_url or LIST_URL,
                description=None,
                is_remote=False,
                posted_at=_parse_date(date_text),
                raw_data=f'{{"employer":"{employer[:60]}","date":"{date_text}"}}'
            ))

        # Enrich top 20
        for job in jobs[:20]:
            if not job.apply_url or job.apply_url == LIST_URL:
                continue
            detail = await _fetch_detail(client, job.apply_url)
            job.stipend = detail['stipend']
            job.location = detail['location']
            job.description = detail['description'] or None
            job.duration = extract_articleship_duration(detail['description'])
            await asyncio.sleep(1.5)

    return jobs
