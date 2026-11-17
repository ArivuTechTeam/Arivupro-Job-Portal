"""CAClubIndia scraper — scrapes job listing cards from browse.asp."""
import re
import httpx
from bs4 import BeautifulSoup
from datetime import datetime
from scraper.types import NormalizedJob
from scraper.parse_utils import extract_stipend, extract_duration, extract_articleship_duration
from scraper.course_detector import detect_courses

BASE_URL = "https://www.caclubindia.com"
BROWSE_URL = f"{BASE_URL}/jobs/browse.asp"
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; ArivuPro/1.0; +https://arivupro.com)"}

ARTICLESHIP_RE = re.compile(r'article|articleship|article trainee|article assistant|article clerk', re.I)
FINANCE_RE = re.compile(r'article|articleship|audit|tax|account|financ|\bca\b|\bcs\b|\bcma\b|gst|income tax|compliance|secretary|payroll|bookkeep', re.I)


def _parse_date(text: str) -> datetime:
    text = text.strip()
    for fmt in ('%d %B %Y', '%d %b %Y', '%B %d, %Y'):
        try:
            return datetime.strptime(text, fmt)
        except ValueError:
            pass
    return datetime.utcnow()


def _slug_to_id(url: str) -> str:
    m = re.search(r'-(\d+)\.asp', url)
    return f'caclub-{m.group(1)}' if m else f'caclub-{url[-20:]}'


async def fetch() -> list[NormalizedJob]:
    jobs: list[NormalizedJob] = []
    seen_ids: set = set()

    async with httpx.AsyncClient(headers=HEADERS, follow_redirects=True, timeout=15) as client:
        # Fetch up to 3 pages of the browse listing
        for pg in range(1, 4):
            resp = await client.get(BROWSE_URL, params={"pg": pg})
            if resp.status_code != 200:
                break
            soup = BeautifulSoup(resp.text, 'lxml')

            cards = soup.select("div.course-card")
            if not cards:
                break

            for card in cards:
                # Title + link
                a_tag = card.select_one("h5 a, .card-title")
                if not a_tag:
                    continue
                title = a_tag.get_text(strip=True)
                href = a_tag.get("href", "")
                if not href:
                    continue
                link = href if href.startswith("http") else f"{BASE_URL}{href}"
                # Strip UTM params
                link = re.sub(r'\?.*$', '', link)

                external_id = _slug_to_id(link)
                if external_id in seen_ids:
                    continue
                seen_ids.add(external_id)

                if not FINANCE_RE.search(title):
                    continue

                # Company name
                company_tag = card.select_one("p.text-muted")
                company = company_tag.get_text(strip=True).lstrip("").strip() if company_tag else "CA Firm"
                # Clean icon text
                company = re.sub(r'^\s*\S+\s*', '', company).strip() or "CA Firm"

                # Date — look for the small date span
                date_tag = card.select_one("span.text-muted")
                date_text = date_tag.get_text(strip=True) if date_tag else ""

                # Badge for job type
                badge_tag = card.select_one(".badge")
                badge_text = badge_tag.get_text(strip=True) if badge_tag else ""
                job_type = "articleship" if ARTICLESHIP_RE.search(f"{title} {badge_text}") else "job"

                posted_at = _parse_date(date_text) if date_text else datetime.utcnow()

                jobs.append(NormalizedJob(
                    source='caclubindia',
                    external_id=external_id,
                    title=title,
                    company=company,
                    location='India',
                    stipend=0,
                    duration='3 years' if job_type == 'articleship' else '',
                    courses=[],
                    job_type=job_type,
                    apply_url=link,
                    description=f"{badge_text} at {company}".strip(),
                    is_remote=False,
                    posted_at=posted_at,
                    raw_data=f'{{"title":"{title[:60]}","link":"{link[:100]}"}}'
                ))

    for j in jobs:
        j.courses = await detect_courses(j.title, j.description or '')

    return jobs
