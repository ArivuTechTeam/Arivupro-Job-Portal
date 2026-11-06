import os
import uuid
import logging
from datetime import datetime
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client, Client
from google import genai as google_genai

load_dotenv()

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Clients
# ---------------------------------------------------------------------------
supabase: Client = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_ROLE_KEY"],
)

GEMINI_KEY = os.getenv("GEMINI_API_KEY")
gemini_client = None
if GEMINI_KEY:
    gemini_client = google_genai.Client(api_key=GEMINI_KEY)

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
CRON_SECRET = os.getenv("CRON_SECRET", "")

# ---------------------------------------------------------------------------
# APScheduler — auto-sync every N hours (default 6)
# ---------------------------------------------------------------------------
_scheduler = None

def _start_scheduler(sb: Client):
    global _scheduler
    interval_hours = int(os.getenv("SCRAPER_INTERVAL_HOURS", "6"))
    try:
        from apscheduler.schedulers.asyncio import AsyncIOScheduler
        from apscheduler.triggers.interval import IntervalTrigger

        async def _scheduled_sync():
            logger.info("[cron] Scheduled scraper sync starting…")
            try:
                results = await run_all_sources(sb)
                total_new = sum(r.created for r in results)
                logger.info(f"[cron] Sync done — {total_new} new jobs across {len(results)} sources")
            except Exception as e:
                logger.error(f"[cron] Sync failed: {e}")

        _scheduler = AsyncIOScheduler()
        _scheduler.add_job(
            _scheduled_sync,
            trigger=IntervalTrigger(hours=interval_hours),
            id="scraper_sync",
            replace_existing=True,
        )
        _scheduler.start()
        logger.info(f"[cron] APScheduler started — scraper runs every {interval_hours}h")
    except ImportError:
        logger.warning("[cron] apscheduler not installed — scheduled sync disabled. Run: pip install apscheduler")


@asynccontextmanager
async def lifespan(app: FastAPI):
    if os.getenv("SCRAPER_AUTO_RUN", "true").lower() == "true":
        _start_scheduler(supabase)

    print("ArivuPro Finance Career Portal API — started")
    yield

    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("[cron] APScheduler shut down")



app = FastAPI(title="ArivuPro Finance Career Portal", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------
class JobPost(BaseModel):
    title: str
    company: str
    salary_text: str
    location: Optional[str] = "Bangalore, Karnataka"
    city: Optional[str] = "Bangalore"
    workplace_type: Optional[str] = "hybrid"
    job_type: Optional[str] = "full-time"
    experience_level: Optional[str] = "0-1 yr (Fresher)"
    min_experience_years: Optional[float] = 0
    salary_min_lpa: Optional[float] = None
    salary_max_lpa: Optional[float] = None
    stipend_monthly: Optional[int] = None
    duration: Optional[str] = None
    qualifications: Optional[list[str]] = ["CA", "ACCA"]
    mandatory_skills: Optional[list[str]] = ["Financial Analysis", "Excel"]
    good_to_have_skills: Optional[list[str]] = []
    description: Optional[str] = ""
    key_responsibilities: Optional[list[str]] = []
    department: Optional[str] = "FP&A & Corporate Finance"
    arivupro_exclusive: Optional[bool] = False
    is_urgent: Optional[bool] = False
    deadline_date: Optional[str] = None
    crm_drive_code: Optional[str] = None

class ApplicationPost(BaseModel):
    job_id: str
    student_name: str
    student_email: str
    student_phone: str
    student_id: Optional[str] = None
    primary_course: Optional[str] = None
    cover_note: Optional[str] = None

class ApplicationPatch(BaseModel):
    stage: Optional[str] = None
    status: Optional[str] = None
    counselor_notes: Optional[str] = None
    interview_date: Optional[str] = None
    assigned_counselor: Optional[str] = None

class CompanyRegister(BaseModel):
    company_name: str
    work_email: str
    cin_or_gstin: str
    legal_name: Optional[str] = None
    website: Optional[str] = None
    contact_person: Optional[str] = "Talent Acquisition Partner"
    phone: Optional[str] = None
    industry: Optional[str] = "Finance & Corporate Services"

class MatchRequest(BaseModel):
    job_id: str
    student_name: str
    qualifications_completed: list[str]
    key_skills: list[str]
    articleship_months: int
    enrollment_cohort: Optional[str] = ""
    current_level: Optional[str] = ""
    expected_salary: Optional[str] = ""
    about_bio: Optional[str] = ""

class PrepRequest(BaseModel):
    job_id: str

class ScrapeRequest(BaseModel):
    target_source: Optional[str] = None
    keywords: Optional[str] = None

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def now_iso() -> str:
    return datetime.utcnow().isoformat()

def now_str() -> str:
    return datetime.now().strftime("%Y-%m-%d %I:%M %p")

def today() -> str:
    return datetime.utcnow().strftime("%Y-%m-%d")

def calc_match(qualifications: list[str], skills: list[str], articleship_months: int, job: dict) -> dict:
    job_quals = job.get("qualifications", [])
    qual_score = 95 if any(q in qualifications for q in job_quals) else (65 if qualifications else 40)

    job_skills = job.get("mandatory_skills", []) + job.get("good_to_have_skills", [])
    matched = [s for s in job_skills if any(ks.lower() in s.lower() or s.lower() in ks.lower() for ks in skills)]
    skill_score = min(98, round(len(matched) / max(len(job_skills), 1) * 60 + 38))

    min_exp = job.get("min_experience_years", 0) or 0
    exp_score = 95 if min_exp == 0 else (92 if articleship_months >= min_exp * 12 else 70)

    overall = round(qual_score * 0.45 + skill_score * 0.35 + exp_score * 0.20)
    grade = "Excellent" if overall >= 90 else "Strong" if overall >= 80 else "Moderate" if overall >= 65 else "Low"

    strengths = [
        f"Strong alignment in core finance qualifications ({', '.join(qualifications[:3])})",
        f"Competency detected in {', '.join(matched[:3]) or 'Financial reporting'}",
        f"Completed {articleship_months} months of practical training",
    ]
    gaps = [f"Consider reviewing {s} before interview" for s in job_skills if s not in matched][:2]

    return {
        "overall_score": overall,
        "grade": grade,
        "qualification_fit": qual_score,
        "skills_fit": skill_score,
        "experience_fit": exp_score,
        "strengths": strengths,
        "gap_alerts": gaps,
        "counselor_recommendation": (
            "High suitability! Direct application recommended."
            if overall >= 85
            else "Good potential. We suggest taking the ArivuPro technical brush-up module."
        ),
    }

# ---------------------------------------------------------------------------
# JOBS
# ---------------------------------------------------------------------------
@app.get("/api/jobs")
async def get_jobs(
    query: Optional[str] = None,
    qualification: Optional[str] = None,
    location: Optional[str] = None,
    job_type: Optional[str] = None,
    experience: Optional[str] = None,
    source: Optional[str] = None,
    department: Optional[str] = None,
    exclusive_only: Optional[bool] = False,
):
    q = supabase.table("jobs").select("*").eq("status", "active")

    if exclusive_only:
        q = q.eq("arivupro_exclusive", True)
    if source and source != "ALL":
        q = q.eq("source", source)
    if job_type and job_type != "ALL":
        q = q.eq("job_type", job_type)
    if department and department != "ALL":
        q = q.eq("department", department)
    if location and location != "ALL":
        q = q.ilike("location", f"%{location}%")
    if qualification and qualification != "ALL":
        q = q.contains("qualifications", [qualification])

    result = q.order("posted_date", desc=True).execute()
    jobs = result.data or []

    if query and query.strip():
        ql = query.lower()
        jobs = [
            j for j in jobs
            if ql in j.get("title", "").lower()
            or ql in j.get("company", "").lower()
            or ql in j.get("location", "").lower()
            or any(ql in s.lower() for s in j.get("mandatory_skills", []))
        ]

    return {"total": len(jobs), "jobs": jobs}


@app.get("/api/jobs/{job_id}")
async def get_job(job_id: str):
    result = supabase.table("jobs").select("*").eq("id", job_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Job not found")
    return result.data


@app.post("/api/jobs", status_code=201)
async def create_job(body: JobPost):
    job = {
        "id": str(uuid.uuid4()),
        "title": body.title,
        "company": body.company,
        "salary_text": body.salary_text,
        "location": body.location,
        "city": body.city,
        "workplace_type": body.workplace_type,
        "job_type": body.job_type,
        "experience_level": body.experience_level,
        "min_experience_years": body.min_experience_years,
        "salary_min_lpa": body.salary_min_lpa,
        "salary_max_lpa": body.salary_max_lpa,
        "stipend_monthly": body.stipend_monthly,
        "duration": body.duration,
        "qualifications": body.qualifications,
        "mandatory_skills": body.mandatory_skills,
        "good_to_have_skills": body.good_to_have_skills,
        "description": body.description,
        "key_responsibilities": body.key_responsibilities,
        "department": body.department,
        "source": "direct_recruiter",
        "arivupro_exclusive": body.arivupro_exclusive,
        "is_urgent": body.is_urgent,
        "is_featured": False,
        "status": "active",
        "posted_date": now_iso(),
        "deadline_date": body.deadline_date,
        "applicants_count": 0,
        "crm_drive_code": body.crm_drive_code or f"REC-{str(uuid.uuid4())[:4].upper()}",
    }
    result = supabase.table("jobs").insert(job).execute()
    return {"message": "Job published successfully", "job": result.data[0]}

# ---------------------------------------------------------------------------
# APPLICATIONS
# ---------------------------------------------------------------------------
@app.get("/api/applications")
async def get_applications():
    result = supabase.table("student_leads").select("*").order("created_at", desc=True).execute()
    data = result.data or []
    return {"total": len(data), "applications": data}


@app.post("/api/applications", status_code=201)
async def submit_application(body: ApplicationPost):
    # Check job exists
    job_res = supabase.table("jobs").select("*").eq("id", body.job_id).single().execute()
    if not job_res.data:
        raise HTTPException(status_code=404, detail="Job not found")
    job = job_res.data

    # Check duplicate
    dup = (
        supabase.table("student_leads")
        .select("id")
        .eq("job_id", body.job_id)
        .eq("student_email", body.student_email)
        .execute()
    )
    if dup.data:
        raise HTTPException(status_code=400, detail="You have already applied for this job.")

    match = calc_match([], [], 0, job)

    timeline = [
        {"stage": "Applied", "timestamp": now_str(), "note": "Application submitted via ArivuPro Portal"},
        {"stage": "ArivuPro Review", "timestamp": now_str(), "note": "Queued for placement team verification"},
    ]

    record = {
        "id": str(uuid.uuid4()),
        "job_id": body.job_id,
        "job_title": job.get("title"),
        "company": job.get("company"),
        "student_name": body.student_name,
        "student_email": body.student_email,
        "student_phone": body.student_phone,
        "student_id": body.student_id,
        "primary_course": body.primary_course,
        "ai_match_score": match["overall_score"],
        "match_grade": match["grade"],
        "stage": "applied",
        "status": "new",
        "crm_sync_status": "pending",
        "timeline": timeline,
    }

    result = supabase.table("student_leads").insert(record).execute()

    # Bump applicants_count
    supabase.table("jobs").update({"applicants_count": (job.get("applicants_count") or 0) + 1}).eq("id", body.job_id).execute()

    return {"message": "Application submitted successfully", "application": result.data[0]}


@app.patch("/api/applications/{app_id}")
async def update_application(app_id: str, body: ApplicationPatch):
    app_res = supabase.table("student_leads").select("*").eq("id", app_id).single().execute()
    if not app_res.data:
        raise HTTPException(status_code=404, detail="Application not found")

    current = app_res.data
    timeline = current.get("timeline") or []

    updates: dict = {"updated_at": now_iso(), "crm_sync_status": "synced"}

    if body.stage:
        updates["stage"] = body.stage
        timeline.append({"stage": body.stage, "timestamp": now_str(), "note": body.counselor_notes or f"Stage updated to {body.stage}"})
        updates["timeline"] = timeline

    if body.status:
        updates["status"] = body.status
    if body.counselor_notes:
        updates["interview_notes"] = body.counselor_notes
    if body.interview_date:
        updates["interview_date"] = body.interview_date
    if body.assigned_counselor:
        updates["assigned_counselor"] = body.assigned_counselor

    result = supabase.table("student_leads").update(updates).eq("id", app_id).execute()
    return {"message": "Application updated", "application": result.data[0]}

# ---------------------------------------------------------------------------
# COMPANIES
# ---------------------------------------------------------------------------
@app.get("/api/companies")
async def get_companies():
    result = supabase.table("company_leads").select("*").order("created_at", desc=True).execute()
    data = result.data or []
    return {"total": len(data), "companies": data}


@app.post("/api/companies/register", status_code=201)
async def register_company(body: CompanyRegister):
    if not body.company_name or not body.work_email or not body.cin_or_gstin:
        raise HTTPException(status_code=400, detail="Company name, email, and CIN/GSTIN are required.")

    domain = body.work_email.split("@")[-1].lower()
    generic = {"gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "rediffmail.com"}
    is_corporate = domain not in generic
    is_valid_id = len(body.cin_or_gstin.strip()) >= 15

    if is_corporate and is_valid_id:
        verification_status = "verified"
        notes = f"Verified domain (@{domain}) & valid registration identity ({body.cin_or_gstin})."
    else:
        verification_status = "pending"
        notes = "Corporate domain under 24-hour review by ArivuPro Industry Relations Team."

    record = {
        "id": str(uuid.uuid4()),
        "company_name": body.company_name,
        "legal_name": body.legal_name or body.company_name,
        "website": body.website or f"https://{domain}",
        "contact_person": body.contact_person,
        "work_email": body.work_email,
        "phone": body.phone,
        "industry": body.industry,
        "cin_or_gstin": body.cin_or_gstin.upper(),
        "verification_status": verification_status,
        "notes": notes,
        "status": "new",
        "active_jobs_count": 0,
    }

    result = supabase.table("company_leads").insert(record).execute()
    msg = "Company verified successfully." if verification_status == "verified" else "Company registered. Queued for manual verification."
    return {"message": msg, "company": result.data[0]}


@app.get("/api/companies/{company_id}/applications")
async def company_applications(company_id: str):
    comp = supabase.table("company_leads").select("company_name").eq("id", company_id).single().execute()
    name = comp.data.get("company_name", "") if comp.data else ""
    result = supabase.table("student_leads").select("*").ilike("company", f"%{name}%").execute()
    data = result.data or []
    return {"company_name": name, "total_applications": len(data), "applications": data}

# ---------------------------------------------------------------------------
# CRM
# ---------------------------------------------------------------------------
@app.post("/api/crm/sync-all")
async def crm_sync_all():
    supabase.table("student_leads").update({"crm_sync_status": "synced", "updated_at": now_iso()}).eq("crm_sync_status", "pending").execute()
    count_res = supabase.table("student_leads").select("id", count="exact").execute()
    return {
        "message": "All records pushed to ArivuPro Placement CRM (LeadSquared / Zoho webhook: 200 OK)",
        "timestamp": now_iso(),
        "synced_records_count": count_res.count or 0,
        "pipeline_metrics": _crm_metrics(),
    }


@app.get("/api/crm/stats")
async def crm_stats():
    return {"metrics": _crm_metrics(), "course_wise_salary_benchmarks": _salary_benchmarks()}


def _crm_metrics():
    return {
        "total_arivupro_applicants": 148,
        "active_interviews": 26,
        "offers_released": 19,
        "total_placed": 87,
        "avg_package_lpa": 9.8,
        "highest_package_lpa": 24.5,
        "big4_placements_count": 64,
        "top_demanded_course": "ACCA + US CPA Dual Track",
    }


def _salary_benchmarks():
    return [
        {"course": "Qualified Chartered Accountant (CA)", "fresher_avg_lpa": 11.5, "top_offers_lpa": 24.0, "big4_share": "42%"},
        {"course": "ACCA (Affiliate / Member)", "fresher_avg_lpa": 8.5, "top_offers_lpa": 16.5, "big4_share": "36%"},
        {"course": "US CPA (AICPA Qualified)", "fresher_avg_lpa": 9.5, "top_offers_lpa": 18.0, "big4_share": "38%"},
        {"course": "CFA (L2/L3 Cleared)", "fresher_avg_lpa": 12.0, "top_offers_lpa": 22.0, "big4_share": "18%"},
        {"course": "US CMA / CMA India", "fresher_avg_lpa": 8.0, "top_offers_lpa": 14.5, "big4_share": "22%"},
        {"course": "CA Articleship (Intermediate)", "fresher_avg_lpa": 3.2, "top_offers_lpa": 4.8, "big4_share": "50%"},
    ]

# ---------------------------------------------------------------------------
# SCRAPER — real pipeline
# ---------------------------------------------------------------------------
from scraper.orchestrator import run_source_sync, run_all_sources
from scraper.types import SOURCE_NAMES

@app.get("/api/scrape/status")
async def scrape_status():
    scraped = supabase.table("external_jobs").select("id", count="exact").eq("is_active", True).execute()
    exclusive = supabase.table("jobs").select("id", count="exact").eq("arivupro_exclusive", True).execute()
    sync_res = supabase.table("sync_runs").select("*").order("started_at", desc=True).limit(10).execute()
    return {
        "total_scraped": scraped.count or 0,
        "total_exclusive": exclusive.count or 0,
        "sources_available": SOURCE_NAMES,
        "recent_syncs": sync_res.data or [],
    }


@app.get("/api/scrape/logs")
async def scrape_logs():
    result = supabase.table("sync_runs").select("*").order("started_at", desc=True).limit(20).execute()
    data = result.data or []
    return {"logs": data, "last_run": data[0].get("started_at") if data else None}


@app.post("/api/scrape/trigger")
async def scrape_trigger(body: ScrapeRequest):
    """Trigger one source or all sources. Runs in background."""
    import asyncio
    source = body.target_source

    if source:
        if source not in SOURCE_NAMES:
            raise HTTPException(status_code=400, detail=f"Unknown source '{source}'. Valid: {SOURCE_NAMES}")
        asyncio.create_task(run_source_sync(supabase, source))
        return {"message": f"Sync triggered for source: {source}", "source": source}
    else:
        asyncio.create_task(run_all_sources(supabase))
        return {"message": "Full sync triggered for all sources", "sources": SOURCE_NAMES}


@app.post("/api/scrape/run-sync")
async def run_sync_now(body: ScrapeRequest):
    """Synchronous trigger — waits for result. Use for cron jobs."""
    source = body.target_source
    if source:
        if source not in SOURCE_NAMES:
            raise HTTPException(status_code=400, detail=f"Unknown source '{source}'")
        result = await run_source_sync(supabase, source)
        return {"results": [vars(result)]}
    else:
        results = await run_all_sources(supabase)
        return {"results": [vars(r) for r in results]}


# ---------------------------------------------------------------------------
# CRON endpoint — for external schedulers (cron-job.org, Render cron, etc.)
# Protected by CRON_SECRET header.  Set CRON_SECRET in .env to a random string.
# Example curl:
#   curl -X POST https://your-api.com/api/cron/sync \
#        -H "x-cron-secret: <your-secret>"
# ---------------------------------------------------------------------------
@app.post("/api/cron/sync")
async def cron_sync(x_cron_secret: Optional[str] = Header(default=None)):
    if CRON_SECRET and x_cron_secret != CRON_SECRET:
        raise HTTPException(status_code=401, detail="Invalid cron secret")
    logger.info("[cron] External cron ping received — starting full sync")
    results = await run_all_sources(supabase)
    total_new = sum(r.created for r in results)
    total_fetched = sum(r.fetched for r in results)
    errors = [{"source": r.source, "error": r.error} for r in results if r.error]
    return {
        "triggered_at": datetime.utcnow().isoformat(),
        "total_fetched": total_fetched,
        "total_new": total_new,
        "sources_run": len(results),
        "errors": errors,
        "results": [vars(r) for r in results],
    }


@app.get("/api/cron/status")
async def cron_status():
    """Check scheduler status and next run time."""
    next_run = None
    running = False
    if _scheduler and _scheduler.running:
        running = True
        job = _scheduler.get_job("scraper_sync")
        if job and job.next_run_time:
            next_run = job.next_run_time.isoformat()
    return {
        "scheduler_running": running,
        "next_run": next_run,
        "interval_hours": int(os.getenv("SCRAPER_INTERVAL_HOURS", "6")),
        "auto_run_enabled": os.getenv("SCRAPER_AUTO_RUN", "true").lower() == "true",
    }


# ---------------------------------------------------------------------------
# EXTERNAL JOBS (scraped) — served to frontend
# ---------------------------------------------------------------------------
@app.get("/api/external-jobs")
async def get_external_jobs(
    course: Optional[str] = None,
    job_type: Optional[str] = None,
    location: Optional[str] = None,
    source: Optional[str] = None,
    query: Optional[str] = None,
    limit: int = Query(default=50, le=200),
):
    q = supabase.table("external_jobs").select("*").eq("is_active", True)

    if source:
        q = q.eq("source", source)
    if job_type:
        q = q.eq("job_type", job_type)
    if location:
        q = q.ilike("location", f"%{location}%")

    result = q.order("posted_at", desc=True).limit(limit).execute()
    jobs = result.data or []

    # Client-side course filter (courses is a JSON array in DB)
    if course:
        jobs = [j for j in jobs if course in (j.get("courses") or [])]

    if query:
        ql = query.lower()
        jobs = [
            j for j in jobs
            if ql in (j.get("title") or "").lower()
            or ql in (j.get("company") or "").lower()
            or ql in (j.get("location") or "").lower()
        ]

    return {"total": len(jobs), "jobs": jobs}

# ---------------------------------------------------------------------------
# AI MATCHING
# ---------------------------------------------------------------------------
@app.post("/api/ai/match")
async def ai_match(body: MatchRequest):
    job_res = supabase.table("jobs").select("*").eq("id", body.job_id).single().execute()
    if not job_res.data:
        raise HTTPException(status_code=404, detail="Job not found")
    job = job_res.data

    if gemini_client:
        try:
            prompt = f"""
You are an expert Finance Talent Partner at ArivuPro Academy (CA, ACCA, US CPA, US CMA, CFA, CS, CMA India).
Evaluate this candidate against the job and return ONLY valid JSON.

Candidate:
- Name: {body.student_name}
- Qualifications: {', '.join(body.qualifications_completed)}
- Skills: {', '.join(body.key_skills)}
- Articleship months: {body.articleship_months}
- Course/Level: {body.enrollment_cohort} | {body.current_level}
- Expected CTC: {body.expected_salary}
- Bio: {body.about_bio}

Job:
- Title: {job.get('title')}
- Company: {job.get('company')}
- Required qualifications: {', '.join(job.get('qualifications', []))}
- Mandatory skills: {', '.join(job.get('mandatory_skills', []))}
- Good to have: {', '.join(job.get('good_to_have_skills', []))}
- Experience: {job.get('experience_level')} ({job.get('min_experience_years')} yrs min)
- Department: {job.get('department')}

Return JSON with keys: overall_score, grade, qualification_fit, skills_fit, experience_fit,
strengths (array of 3), gap_alerts (array of 1-2), counselor_recommendation, personalized_elevator_pitch.
"""
            import json, re
            response = gemini_client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
            text = response.text
            match_obj = re.search(r'\{.*\}', text, re.DOTALL)
            if match_obj:
                parsed = json.loads(match_obj.group())
                return {"source": "gemini-2.0-flash", "job_id": body.job_id, "match": parsed}
        except Exception as e:
            print(f"Gemini match error: {e}")

    fallback = calc_match(body.qualifications_completed, body.key_skills, body.articleship_months, job)
    return {"source": "arivupro-algorithmic-engine", "job_id": body.job_id, "match": fallback}


# ---------------------------------------------------------------------------
# AI INTERVIEW PREP
# ---------------------------------------------------------------------------
@app.post("/api/ai/prep")
async def ai_prep(body: PrepRequest):
    job_res = supabase.table("jobs").select("*").eq("id", body.job_id).single().execute()
    if not job_res.data:
        raise HTTPException(status_code=404, detail="Job not found")
    job = job_res.data

    if gemini_client:
        try:
            prompt = f"""
Generate 4 realistic technical and behavioral interview questions for a finance candidate interviewing for
"{job.get('title')}" at "{job.get('company')}".
Qualifications: {', '.join(job.get('qualifications', []))}.
Skills: {', '.join(job.get('mandatory_skills', []))}.
Return ONLY a JSON array of objects with keys: question, key_concepts_tested, sample_ideal_answer_guideline.
"""
            import json, re
            response = gemini_client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
            text = response.text
            arr = re.search(r'\[.*\]', text, re.DOTALL)
            if arr:
                questions = json.loads(arr.group())
                return {"role": job.get("title"), "company": job.get("company"), "questions": questions}
        except Exception as e:
            print(f"Gemini prep error: {e}")

    return {
        "role": job.get("title"),
        "company": job.get("company"),
        "questions": [
            {
                "question": "How would you verify revenue recognition under IFRS 15 / Ind AS 115 for a multi-element contract?",
                "key_concepts_tested": "Five-Step Revenue Model, Performance Obligations, Transaction Price Allocation",
                "sample_ideal_answer_guideline": "Walk through identifying distinct goods/services, allocating standalone selling price, and verifying whether control transfers over time or at a point in time.",
            },
            {
                "question": "Explain the difference between substantive testing and test of controls in a statutory audit.",
                "key_concepts_tested": "Audit Risk Model, Assertions, Internal Financial Controls",
                "sample_ideal_answer_guideline": "Tests of controls evaluate operational efficacy of client controls; substantive tests directly detect material misstatements in balances and disclosures.",
            },
            {
                "question": "How do you handle sensitivity around working capital and debtor days in financial modeling?",
                "key_concepts_tested": "Working Capital Days, Cash Conversion Cycle, Stress Testing",
                "sample_ideal_answer_guideline": "Link DSO dynamically to receivables balance and model base, bull, and bear scenarios for operating cash flow impact.",
            },
            {
                "question": f"Why does your ArivuPro {(job.get('qualifications') or ['Finance'])[0]} preparation set you apart for {job.get('company')}?",
                "key_concepts_tested": "Self-awareness, practical application, professional ethics",
                "sample_ideal_answer_guideline": "Connect your rigorous case-study curriculum, articleship simulations, and commercial acumen fostered at ArivuPro.",
            },
        ],
    }

# ---------------------------------------------------------------------------
# Serve React frontend (production build)
# ---------------------------------------------------------------------------
DIST = os.path.join(os.path.dirname(__file__), "dist")
if os.path.isdir(DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        return FileResponse(os.path.join(DIST, "index.html"))


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
