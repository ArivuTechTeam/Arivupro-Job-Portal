"""
Company logo fetcher — Clearbit free tier with Google favicon fallback.
Fetches once per company name; subsequent jobs reuse the cached URL.
No API key required for Clearbit free tier.
"""
import re
import logging
import httpx
from typing import Optional

logger = logging.getLogger(__name__)

# In-memory cache for the current sync run: company_name -> logo_url | None
_cache: dict[str, Optional[str]] = {}

# Well-known company → domain overrides (avoids wrong domain guesses)
_DOMAIN_OVERRIDES: dict[str, str] = {
    'deloitte': 'deloitte.com',
    'pwc': 'pwc.com',
    'kpmg': 'kpmg.com',
    'ey': 'ey.com',
    'ernst & young': 'ey.com',
    'grant thornton': 'grantthornton.com',
    'bdo': 'bdo.com',
    'zoho': 'zoho.com',
    'amazon': 'amazon.com',
    'google': 'google.com',
    'microsoft': 'microsoft.com',
    'infosys': 'infosys.com',
    'wipro': 'wipro.com',
    'tcs': 'tcs.com',
    'tata consultancy': 'tcs.com',
    'accenture': 'accenture.com',
    'cognizant': 'cognizant.com',
    'genpact': 'genpact.com',
    'wns': 'wns.com',
    'icici': 'icicibank.com',
    'hdfc': 'hdfcbank.com',
    'axis bank': 'axisbank.com',
    'kotak': 'kotak.com',
    'bajaj': 'bajajfinserv.in',
    'reliance': 'ril.com',
    'mahindra': 'mahindra.com',
    'aditya birla': 'adityabirla.com',
    'hero': 'heromotocorp.com',
}


def _guess_domain(company: str) -> Optional[str]:
    """Guess company domain from name. Returns None if too uncertain."""
    name = company.lower().strip()

    # Check overrides first
    for key, domain in _DOMAIN_OVERRIDES.items():
        if key in name:
            return domain

    # Strip common suffixes to get root name
    cleaned = re.sub(
        r'\b(pvt\.?|ltd\.?|limited|private|llp|llc|inc\.?|corp\.?|'
        r'chartered accountants?|ca firm|co\.?|and|&|associates?|'
        r'consultants?|services?|solutions?|group|india|industries)\b',
        '', name
    ).strip(' .,&-')

    # Only guess .com for names that look like proper company names (≥4 chars, no spaces)
    words = cleaned.split()
    if not words:
        return None

    root = words[0]
    if len(root) < 3:
        return None

    # For small CA firms with multiple words, skip guessing — Clearbit won't have them
    if len(words) > 2:
        return None

    # Single or double word company — try .com
    domain_root = re.sub(r'[^a-z0-9]', '', root)
    if len(domain_root) < 3:
        return None

    return f"{domain_root}.com"


def _clearbit_url(domain: str) -> str:
    return f"https://logo.clearbit.com/{domain}"


def _favicon_url(domain: str) -> str:
    return f"https://www.google.com/s2/favicons?domain={domain}&sz=64"


async def fetch_logo(company: str, client: httpx.AsyncClient) -> Optional[str]:
    """
    Return a logo URL for the given company name.
    Uses in-memory cache; fetches Clearbit on miss, falls back to Google favicon.
    Returns None if no logo can be found (small CA firms).
    """
    key = company.strip().lower()
    if key in _cache:
        return _cache[key]

    domain = _guess_domain(company)
    if not domain:
        _cache[key] = None
        return None

    # Try Clearbit first
    try:
        resp = await client.head(_clearbit_url(domain), timeout=3.0, follow_redirects=True)
        if resp.status_code == 200:
            url = _clearbit_url(domain)
            _cache[key] = url
            return url
    except Exception:
        pass

    # Fall back to Google favicon (always returns something, even a generic globe)
    # We only use it for well-known companies where we're confident about the domain
    for key_name in _DOMAIN_OVERRIDES:
        if key_name in key:
            url = _favicon_url(domain)
            _cache[key] = url
            return url

    _cache[key] = None
    return None


def prime_cache_from_db(supabase) -> None:
    """
    Load existing company→logo mappings from the DB into the in-memory cache.
    Call once before the sync run so we don't re-fetch logos we already have.
    """
    try:
        result = supabase.table('external_jobs') \
            .select('company, logo_url') \
            .not_.is_('logo_url', 'null') \
            .limit(2000) \
            .execute()
        for row in (result.data or []):
            key = (row.get('company') or '').strip().lower()
            if key and row.get('logo_url'):
                _cache[key] = row['logo_url']
        logger.info(f"[logo] Primed cache with {len(_cache)} companies from DB")
    except Exception as e:
        logger.warning(f"[logo] Could not prime cache from DB: {e}")


def clear_cache() -> None:
    _cache.clear()
