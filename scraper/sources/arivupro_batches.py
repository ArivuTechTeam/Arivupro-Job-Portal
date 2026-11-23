"""
Scrape ArivuPro course batch dates from arivupro.com.

Each course page renders batch cards as <div class="ari-ub-card"> with structured
data-* attributes (confirmed 2026-11-22):
  data-start="2027-01-04"          ISO 8601 — parse directly, no guessing
  data-batch="CS Executive | Chennai | 04 Jan 2027 | Mon–Sun 7:30 AM"
  data-level="executive"
  data-city="chennai"
  data-modes="f2f live"

One page may list batches for multiple courses — we scrape all COURSE_PAGES and
deduplicate on (course, city, start_date) before upserting.
"""

import logging
from dataclasses import dataclass
from datetime import date, datetime
from typing import Optional

import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; ArivuPro/1.0; +https://arivupro.com)",
}

# All course pages to scrape — no Mock Test Masters (plain text, no ISO attrs)
COURSE_PAGES: list[dict] = [
    {
        "course": "CA",
        "url": "https://www.arivupro.com/ca-coaching-classes-institute-center-in-india",
    },
    {
        "course": "CMA USA",
        "url": "https://www.arivupro.com/us-cma-course-in-india",
    },
    {
        "course": "ACCA",
        "url": "https://www.arivupro.com/acca-coaching-classes-institute-center-in-bangalore",
    },
    {
        "course": "CS",
        "url": "https://www.arivupro.com/best-cs-coaching-classes-institute-center-in-india",
    },
    {
        "course": "CMA India",
        "url": "https://www.arivupro.com/best-icwa-cma-india-coaching-classes-institute-center-in-india",
    },
    {
        "course": "EA",
        "url": "https://www.arivupro.com/enrolled-agent-course-in-india",
    },
    {
        "course": "CPA US",
        "url": "https://www.arivupro.com/best-cpa-usa-coaching-classes-institute-center-in-india",
    },
    {
        "course": "CIA",
        "url": "https://www.arivupro.com/cia-course-in-india",
    },
    {
        "course": "CFA",
        "url": "https://www.arivupro.com/cfa-course-in-india",
    },
    {
        "course": "FRM",
        "url": "https://www.arivupro.com/frm-coaching-classes-in-india",
    },
    {
        "course": "CFP",
        "url": "https://www.arivupro.com/cfp-course-in-india",
    },
]

# Canonical course page URLs for linking back from promo cards
COURSE_URLS: dict[str, str] = {p["course"]: p["url"] for p in COURSE_PAGES}


@dataclass
class BatchRow:
    course: str
    level: Optional[str]
    city: Optional[str]
    mode: Optional[str]
    start_date: date
    schedule: Optional[str]
    batch_label: Optional[str]
    course_url: str


def _parse_city(raw: str) -> str:
    """Normalise city names to match portal cities."""
    mapping = {
        "bengaluru": "Bengaluru",
        "bangalore": "Bengaluru",
        "koramangala": "Bengaluru",
        "malleshwaram": "Bengaluru",
        "nungambakkam": "Chennai",
        "tambaram": "Chennai",
        "chennai": "Chennai",
        "coimbatore": "Coimbatore",
        "ram nagar": "Coimbatore",
        "online": "Online",
        "live online": "Online",
    }
    lower = raw.strip().lower()
    for key, norm in mapping.items():
        if key in lower:
            return norm
    return raw.strip().title()


def _parse_cards(html: str, course: str, course_url: str) -> list[BatchRow]:
    soup = BeautifulSoup(html, "html.parser")
    rows: list[BatchRow] = []
    seen: set[tuple] = set()

    for card in soup.select(".ari-ub-card"):
        start_raw = card.get("data-start", "").strip()
        if not start_raw:
            continue

        # Validate ISO date — skip cards with bad/missing dates
        try:
            start_date = date.fromisoformat(start_raw)
        except ValueError:
            logger.debug(f"[arivupro_batches] bad data-start={start_raw!r}, skipping")
            continue

        # Skip past batches
        if start_date < date.today():
            continue

        batch_label = card.get("data-batch", "").strip() or None
        level = card.get("data-level", "").strip() or None
        city_raw = card.get("data-city", card.get("data-lcity", "")).strip()
        city = _parse_city(city_raw) if city_raw else None
        mode = card.get("data-modes", "").strip() or None

        # Schedule is the 4th pipe segment of data-batch
        schedule: Optional[str] = None
        if batch_label:
            parts = [p.strip() for p in batch_label.split("|")]
            if len(parts) >= 4:
                schedule = parts[3]
            # city fallback from batch label if data-city missing
            if not city and len(parts) >= 2:
                city = _parse_city(parts[1])

        dedup_key = (course, city or "", start_date)
        if dedup_key in seen:
            continue
        seen.add(dedup_key)

        rows.append(BatchRow(
            course=course,
            level=level,
            city=city,
            mode=mode,
            start_date=start_date,
            schedule=schedule,
            batch_label=batch_label,
            course_url=course_url,
        ))

    return rows


async def fetch_batches() -> list[BatchRow]:
    """Fetch all course pages and return parsed batch rows."""
    all_rows: list[BatchRow] = []

    async with httpx.AsyncClient(headers=HEADERS, follow_redirects=True, timeout=20) as client:
        for page in COURSE_PAGES:
            try:
                resp = await client.get(page["url"])
                resp.raise_for_status()
                rows = _parse_cards(resp.text, page["course"], page["url"])
                logger.info(f"[arivupro_batches] {page['course']}: {len(rows)} upcoming batches")
                all_rows.extend(rows)
            except Exception as e:
                logger.error(f"[arivupro_batches] failed {page['url']}: {e}")

    return all_rows


def upsert_batches(supabase, rows: list[BatchRow]) -> dict:
    """Upsert batch rows into arivupro_batches table. Returns counts."""
    created = updated = skipped = 0
    scraped_at = datetime.utcnow().isoformat()

    for row in rows:
        record = {
            "course": row.course,
            "level": row.level,
            "city": row.city,
            "mode": row.mode,
            "start_date": row.start_date.isoformat(),
            "schedule": row.schedule,
            "batch_label": row.batch_label,
            "course_url": row.course_url,
            "scraped_at": scraped_at,
        }
        try:
            # Try update first (match on unique index: course + city + start_date)
            existing = (
                supabase.table("arivupro_batches")
                .select("id")
                .eq("course", row.course)
                .eq("start_date", row.start_date.isoformat())
                .eq("city", row.city or "")
                .limit(1)
                .execute()
            )
            if existing.data:
                supabase.table("arivupro_batches").update({
                    "level": row.level,
                    "mode": row.mode,
                    "schedule": row.schedule,
                    "batch_label": row.batch_label,
                    "scraped_at": scraped_at,
                }).eq("id", existing.data[0]["id"]).execute()
                updated += 1
            else:
                supabase.table("arivupro_batches").insert(record).execute()
                created += 1
        except Exception as e:
            logger.warning(f"[arivupro_batches] upsert failed {row.course}/{row.city}/{row.start_date}: {e}")
            skipped += 1

    return {"created": created, "updated": updated, "skipped": skipped}
