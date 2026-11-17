"""ICAI NIRC (Northern Region) articleship vacancy scraper.
NOTE: As of Nov 2026, nirc.icai.org/placement/articleship-vacancies returns 404.
      NIRC appears to have removed their online vacancy board.
      This scraper returns empty until a working URL is found.
"""
from scraper.types import NormalizedJob


async def fetch() -> list[NormalizedJob]:
    return []
