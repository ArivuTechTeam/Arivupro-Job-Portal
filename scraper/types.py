from dataclasses import dataclass, field
from datetime import datetime
from typing import Literal, Optional

JobType = Literal["articleship", "internship", "trainee", "job"]
ExperienceLevel = Literal["fresher", "0-1 year", "1-3 years", "3+ years"]

SOURCE_NAMES = [
    "caclubindia",
    "icai_eirc",
    "icai_kochi",
    "icai_sirc",
    "icai_wirc",
    "icai_pune",
    "icai_bangalore",
    "icai_nirc",
    "icmai",
    "buddingca",
    "jsearch",
    "jobspy",              # LinkedIn, Indeed, Glassdoor, Naukri via python-jobspy
    "apify_multi_board",   # Naukri + Google Jobs + LinkedIn + Indeed in one run
    "apify_google_jobs",   # Google for Jobs — company career pages via Google crawl
    "apify_career_sites",  # Big 4 + banks direct ATS (Workday/Greenhouse/Lever)
    "greenhouse",          # Greenhouse public API — Big 4, banks, GCCs (free)
    "lever",               # Lever public API — fintech, startups, consulting (free)
]

@dataclass
class NormalizedJob:
    source: str
    external_id: str
    title: str
    company: str
    location: str
    stipend: int
    duration: str
    courses: list[str]
    job_type: JobType
    apply_url: str
    description: Optional[str]
    is_remote: bool
    posted_at: datetime
    experience_level: Optional[ExperienceLevel] = None
    raw_data: Optional[str] = None

@dataclass
class SyncResult:
    source: str
    fetched: int = 0
    created: int = 0
    updated: int = 0
    duplicates: int = 0
    skipped: int = 0
    duration_ms: int = 0
    error: Optional[str] = None
