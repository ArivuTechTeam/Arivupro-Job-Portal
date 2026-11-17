"""ICAI SIRC (Southern Region) articleship vacancy scraper.
Vacancies are posted as PDF links on ca_jobvaccancy.php.
Firm name and date are encoded in the PDF filename.
"""
import re
import httpx
from bs4 import BeautifulSoup
from datetime import datetime
from scraper.types import NormalizedJob

BASE = "https://sirc-icai.org"
LIST_URL = f"{BASE}/ca_jobvaccancy.php"
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; ArivuPro/1.0; +https://arivupro.com)"}

SOUTH_CITIES = [
    "Chennai", "Bangalore", "Bengaluru", "Hyderabad", "Coimbatore",
    "Kochi", "Thiruvananthapuram", "Madurai", "Visakhapatnam", "Vijayawada",
    "Mysore", "Mangalore", "Salem", "Trichy",
]


def _extract_city(text: str) -> str:
    for city in SOUTH_CITIES:
        if re.search(city, text, re.I):
            return city
    return 'South India'


def _parse_filename(href: str) -> tuple[str, datetime]:
    """Extract firm name and date from SIRC PDF filename.
    Old pattern: /vacancy/2026/FIRM NAME_YYMMDDHHMMSS.pdf
    New pattern: /ca-jobs/2026/FIRM NAME.pdf  or  FIRM NAME (N)_YYMMDDHHMMSS.pdf
    """
    # Try to get year from path segment
    year_match = re.search(r'/(20\d{2})/', href)
    path_year = int(year_match.group(1)) if year_match else datetime.utcnow().year

    fname = href.split('/')[-1]
    base = re.sub(r'\.pdf$', '', fname, flags=re.I)
    # Try to split timestamp suffix _YYMMDDHHMMSS
    parts = base.rsplit('_', 1)
    firm = parts[0].strip()
    # Clean serial numbers like (2), (3)
    firm = re.sub(r'\s*\(\d+\)\s*$', '', firm).strip()

    posted_at = datetime(path_year, 1, 1)
    if len(parts) == 2:
        ts = parts[1]
        try:
            year = 2000 + int(ts[0:2])
            month = int(ts[2:4])
            day = int(ts[4:6])
            if 1 <= month <= 12 and 1 <= day <= 31:
                posted_at = datetime(year, month, day)
        except Exception:
            pass

    return firm, posted_at


async def fetch() -> list[NormalizedJob]:
    async with httpx.AsyncClient(headers=HEADERS, timeout=20, follow_redirects=True) as client:
        resp = await client.get(LIST_URL)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, 'html.parser')

        jobs: list[NormalizedJob] = []
        seen: set = set()

        # All PDF vacancy links — SIRC uses path /ca-jobs/YEAR/ or /vacancy/YEAR/
        for a in soup.find_all('a', href=True):
            href = a['href']
            if not href.endswith('.pdf'):
                continue
            # Only job/vacancy PDFs, not manuals
            if not any(k in href for k in ['ca-jobs/', 'vacancy/', 'ca_jobs/', 'vaccancy/']):
                continue
            pdf_url = href if href.startswith('http') else f"{BASE}/{href.lstrip('/')}"
            if pdf_url in seen:
                continue
            seen.add(pdf_url)

            firm, posted_at = _parse_filename(href)
            if not firm:
                continue

            # Try to get location from surrounding row text
            row_text = ''
            parent = a.find_parent('tr') or a.find_parent('li') or a.find_parent('div')
            if parent:
                row_text = parent.get_text(separator=' ', strip=True)

            location = _extract_city(row_text) if row_text else 'South India'
            external_id = f"sirc-{re.sub(r'[^a-z0-9]', '-', firm.lower()[:30])}-{posted_at.strftime('%Y%m%d')}"

            jobs.append(NormalizedJob(
                source='icai_sirc',
                external_id=external_id,
                title='Article Assistant',
                company=firm,
                location=location,
                stipend=0,
                duration='3 years',
                courses=['CA'],
                job_type='articleship',
                apply_url=pdf_url,
                description=f'Articleship vacancy at {firm}. Download PDF for details.',
                is_remote=False,
                posted_at=posted_at,
                raw_data=f'{{"firm":"{firm[:60]}","pdf":"{pdf_url[-80:]}"}}'
            ))

    return jobs
