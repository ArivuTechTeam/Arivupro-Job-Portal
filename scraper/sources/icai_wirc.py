"""ICAI WIRC (Western Region) — GraphQL API."""
import httpx
from datetime import datetime
from scraper.types import NormalizedJob
from scraper.parse_utils import extract_stipend, extract_articleship_duration

GRAPHQL_URL = "https://admin.wirc-icai.org/graphql"
HEADERS = {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (compatible; ArivuPro/1.0; +https://arivupro.com)",
}

QUERY = """
{
  getAllArticlesPlacementFront {
    _id name position area address contactNo email info date createdAt isActive
    articlesVacancyCategory { name }
    city { name }
    state { name }
  }
}
"""


def _build_location(p: dict) -> str:
    city = (p.get('city') or {}).get('name')
    state = (p.get('state') or {}).get('name')
    parts = [x for x in [city, state] if x]
    return ', '.join(parts) if parts else p.get('area') or 'West India'


def _parse_date(p: dict) -> datetime:
    raw = p.get('date') or p.get('createdAt')
    if not raw:
        return datetime.utcnow()
    try:
        return datetime.fromisoformat(raw.replace('Z', '+00:00')).replace(tzinfo=None)
    except Exception:
        return datetime.utcnow()


async def fetch() -> list[NormalizedJob]:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(GRAPHQL_URL, headers=HEADERS, json={'query': QUERY})
        resp.raise_for_status()

    data = resp.json()
    placements = data.get('data', {}).get('getAllArticlesPlacementFront') or []
    jobs: list[NormalizedJob] = []

    for p in placements:
        if not p.get('_id') or p.get('isActive') is False:
            continue
        company = (p.get('name') or '').strip() or 'CA Firm (WIRC)'
        title = (p.get('position') or '').strip() or 'Article Assistant'
        parts = [
            p.get('info'),
            p.get('address'),
            f'Contact: {p["contactNo"]}' if p.get('contactNo') else None,
            f'Email: {p["email"]}' if p.get('email') else None,
        ]
        description = ' | '.join(x for x in parts if x)[:2000] or None

        jobs.append(NormalizedJob(
            source='icai_wirc',
            external_id=f'wirc-{p["_id"]}',
            title=title,
            company=company,
            location=_build_location(p),
            stipend=extract_stipend(description or ''),
            duration=extract_articleship_duration(description or ''),
            courses=['CA'],
            job_type='articleship',
            apply_url='https://wirc-icai.org/article-vacancy',
            description=description,
            is_remote=False,
            posted_at=_parse_date(p),
            raw_data=f'{{"id":"{p["_id"]}","city":"{(p.get("city") or {}).get("name","")}"}}'
        ))

    return jobs
