"""ICAI Bangalore job portal scraper — 4 job types, paginated."""
import re
import asyncio
import httpx
from bs4 import BeautifulSoup
from datetime import datetime
from scraper.types import NormalizedJob
from scraper.parse_utils import extract_stipend, extract_duration, extract_articleship_duration

BASE = "https://jobportal.bangaloreicai.org"
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; ArivuPro/1.0; +https://arivupro.com)"}
PAGE_LIMIT = 10

JOB_TYPES = [
    {'param': 1, 'title': 'Article Assistant',     'job_type': 'articleship', 'courses': ['CA']},
    {'param': 2, 'title': 'Industrial Trainee',    'job_type': 'articleship', 'courses': ['CMA India']},
    {'param': 3, 'title': 'Paid Assistant',        'job_type': 'job',         'courses': ['CA']},
    {'param': 4, 'title': 'Chartered Accountant',  'job_type': 'job',         'courses': ['CA']},
]


def _parse_date(text: str) -> datetime:
    for fmt in ('%d-%b-%Y', '%Y-%m-%d', '%d/%m/%Y'):
        try:
            return datetime.strptime(text.strip(), fmt)
        except ValueError:
            pass
    return datetime.utcnow()


def _parse_rows(html: str, job_type_param: int, default_title: str, job_type: str, courses: list[str]) -> list[NormalizedJob]:
    soup = BeautifulSoup(html, 'html.parser')
    jobs = []

    for idx, row in enumerate(soup.select('tbody.uv_class_body_bg tr')):
        td = row.find('td')
        if not td:
            continue

        title_el = td.find('a')
        title = title_el.get_text().strip() if title_el else default_title

        anchors = td.find_all('a')
        location = anchors[1].get_text().strip() if len(anchors) > 1 else 'Bangalore'

        full_text = td.get_text(separator=' ')
        m = re.search(r'[Uu]ploaded\s+by\s*:\s*(.+?)(?:Posted|$)', full_text.replace('\n', ' '))
        company = m.group(1).strip() if m else 'CA Firm (Bangalore)'
        company = re.sub(r'\s+', ' ', company)

        pm = re.search(r'Posted\s+Date\s*:\s*([\d\w-]+)', full_text, re.I)
        posted_at = _parse_date(pm.group(1)) if pm else datetime.utcnow()

        dm = re.search(r'Job\s+Description\s*:\s*(.+?)(?:Uploaded|Posted|$)', full_text.replace('\n', ' '), re.I)
        description = re.sub(r'\s+', ' ', dm.group(1)).strip()[:2000] if dm else None

        apply_href = ''
        for a in row.find_all('a', href=True):
            if 'applyNow' in a['href'] or 'jobId' in a['href']:
                apply_href = a['href']
                break
        apply_url = apply_href if apply_href.startswith('http') else (f'{BASE}{apply_href}' if apply_href else f'{BASE}/home/searchJobs?JobType={job_type_param}')

        jm = re.search(r'jobId=(\d+)', apply_href)
        external_id = (
            f'blr-{job_type_param}-{jm.group(1)}' if jm else
            f'blr-{job_type_param}-{idx}-{re.sub(r"\\s", "-", company[:12])}'
        )

        loc_full = f'{location}, Karnataka' if 'bangalore' not in location.lower() and 'bengaluru' not in location.lower() else location

        jobs.append(NormalizedJob(
            source='icai_bangalore',
            external_id=external_id,
            title=title,
            company=company,
            location=loc_full or 'Bangalore',
            stipend=extract_stipend(f'{title} {description or ""}'),
            duration=extract_articleship_duration(f'{title} {description or ""}') if job_type == 'articleship' else extract_duration(f'{title} {description or ""}'),
            courses=courses,
            job_type=job_type,
            apply_url=apply_url,
            description=description,
            is_remote=False,
            posted_at=posted_at,
            raw_data=f'{{"jobTypeParam":{job_type_param},"company":"{company[:60]}"}}'
        ))

    return jobs


def _has_more_pages(html: str) -> bool:
    soup = BeautifulSoup(html, 'html.parser')
    return bool(soup.select('.uv_pagination_outer_wrap li:not(.disabled):not(.active) a'))


async def _fetch_job_type(client: httpx.AsyncClient, param: int, default_title: str, job_type: str, courses: list[str]) -> list[NormalizedJob]:
    jobs = []
    seen: set[str] = set()

    for page in range(PAGE_LIMIT):
        url = f'{BASE}/home/searchJobs?JobType={param}&StartIndex={page * 10}'
        try:
            resp = await client.get(url, timeout=20)
            if not resp.is_success:
                if page == 0:
                    resp.raise_for_status()
                break
            html = resp.text
        except Exception as e:
            if page == 0:
                raise
            break

        rows = _parse_rows(html, param, default_title, job_type, courses)
        if not rows:
            break

        for j in rows:
            if j.external_id in seen:
                continue
            seen.add(j.external_id)
            jobs.append(j)

        if not _has_more_pages(html):
            break
        await asyncio.sleep(1.5)

    return jobs


async def fetch() -> list[NormalizedJob]:
    results: list[NormalizedJob] = []
    async with httpx.AsyncClient(headers=HEADERS, follow_redirects=True) as client:
        for jt in JOB_TYPES:
            try:
                jobs = await _fetch_job_type(client, jt['param'], jt['title'], jt['job_type'], jt['courses'])
                results.extend(jobs)
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f'[icai_bangalore] JobType={jt["param"]} failed: {e}')
            await asyncio.sleep(2)
    return results
