"""BuddingCA WordPress REST API scraper — free source."""
import re
import httpx
from bs4 import BeautifulSoup
from datetime import datetime
from scraper.types import NormalizedJob
from scraper.parse_utils import extract_stipend, extract_duration, extract_articleship_duration
from scraper.course_detector import detect_courses

WP_API = "https://buddingca.com/wp-json/wp/v2/posts"
FALLBACK_URL = "https://buddingca.com/category/articleship/"
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; ArivuPro/1.0; +https://arivupro.com)"}


def _strip_html(html: str) -> str:
    text = re.sub(r'<[^>]+>', ' ', html)
    for entity, char in [('&amp;', '&'), ('&lt;', '<'), ('&gt;', '>'), ('&quot;', '"'), ('&#39;', "'"), ('&nbsp;', ' ')]:
        text = text.replace(entity, char)
    return re.sub(r'\s+', ' ', text).strip()


def _extract_company(title: str, content: str) -> str:
    m = re.search(r'(?:M/s\.?\s+|firm[:\s]+)([A-Z][^<\n,.(]{4,50})', content, re.I)
    if m:
        return m.group(1).strip()
    m2 = re.search(r'at\s+([A-Za-z][^,.(]{4,50})', title, re.I)
    if m2:
        return m2.group(1).strip()
    return 'CA Firm'


def _extract_location(content: str) -> str:
    m = re.search(r'(?:location|city|place)[:\s]+([A-Za-z][^<\n,.(]{2,40})', content, re.I)
    return m.group(1).strip() if m else 'India'


async def _fetch_via_wp_api() -> list[NormalizedJob]:
    params = {
        'per_page': '50',
        'orderby': 'date',
        'order': 'desc',
        'search': 'articleship',
        '_fields': 'id,date,link,title,excerpt,content,slug',
    }
    async with httpx.AsyncClient(headers=HEADERS, timeout=20) as client:
        resp = await client.get(WP_API, params=params)
        resp.raise_for_status()
        posts = resp.json()

    jobs: list[NormalizedJob] = []
    for post in posts:
        title = _strip_html(post['title']['rendered'])
        content_text = _strip_html(post['content']['rendered'])
        excerpt_text = _strip_html(post['excerpt']['rendered'])
        full_text = f'{title} {content_text}'

        courses = await detect_courses(title, content_text[:500])
        job_type = 'articleship' if re.search(r'article|articleship', full_text, re.I) else 'job'

        jobs.append(NormalizedJob(
            source='buddingca',
            external_id=f'buddingca-{post["id"]}',
            title=title,
            company=_extract_company(title, content_text),
            location=_extract_location(content_text),
            stipend=extract_stipend(full_text),
            duration=extract_articleship_duration(full_text) if job_type == 'articleship' else extract_duration(full_text),
            courses=courses,
            job_type=job_type,
            apply_url=post['link'],
            description=(excerpt_text or content_text)[:2000],
            is_remote=bool(re.search(r'remote|work from home|wfh', full_text, re.I)),
            posted_at=datetime.fromisoformat(post['date'].replace('Z', '+00:00')).replace(tzinfo=None),
            raw_data=f'{{"id":{post["id"]},"slug":"{post["slug"][:60]}"}}'
        ))

    return jobs


async def _fetch_via_html_fallback() -> list[NormalizedJob]:
    async with httpx.AsyncClient(headers=HEADERS, timeout=20) as client:
        resp = await client.get(FALLBACK_URL)
        resp.raise_for_status()

    soup = BeautifulSoup(resp.text, 'html.parser')
    jobs: list[NormalizedJob] = []

    for idx, el in enumerate(soup.select('article, .post, .entry')):
        title_el = el.select_one('h2 a, h1 a, .entry-title a')
        if not title_el:
            continue
        title = title_el.get_text().strip()
        link = title_el.get('href', '')
        excerpt = (el.select_one('.entry-content, .entry-summary, p') or el).get_text().strip()
        date_el = el.select_one('time, .entry-date, .post-date')
        date_str = date_el.get('datetime', '') if date_el else ''

        full = f'{title} {excerpt}'
        is_art = bool(re.search(r'article|articleship', full, re.I))

        try:
            posted_at = datetime.fromisoformat(date_str.replace('Z', '+00:00')).replace(tzinfo=None) if date_str else datetime.utcnow()
        except Exception:
            posted_at = datetime.utcnow()

        jobs.append(NormalizedJob(
            source='buddingca',
            external_id=f'buddingca-html-{idx}-{link.rstrip("/").split("/")[-1] if link else idx}',
            title=title,
            company=_extract_company(title, excerpt),
            location=_extract_location(excerpt),
            stipend=extract_stipend(full),
            duration=extract_articleship_duration(full) if is_art else extract_duration(full),
            courses=['CA'],
            job_type='articleship' if is_art else 'job',
            apply_url=link,
            description=excerpt[:2000],
            is_remote=bool(re.search(r'remote|wfh', full, re.I)),
            posted_at=posted_at,
            raw_data=f'{{"link":"{link[:100]}"}}'
        ))

    for j in jobs:
        j.courses = await detect_courses(j.title, j.description or '')

    return jobs


async def fetch() -> list[NormalizedJob]:
    try:
        return await _fetch_via_wp_api()
    except Exception:
        return await _fetch_via_html_fallback()
