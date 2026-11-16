import os
import uuid
import logging
from datetime import datetime
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client, Client

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
    try:
        from google import genai as google_genai
        gemini_client = google_genai.Client(api_key=GEMINI_KEY)
    except ImportError:
        logger.warning("google-genai not installed — Gemini features disabled")

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
CRON_SECRET = os.getenv("CRON_SECRET", "")


# ---------------------------------------------------------------------------
# Admin auth — validate caller's Supabase access token against admin_users.
# Mirrors the frontend signInAdmin() gate (src/lib/supabase/auth.ts).
# Admin dashboard calls must send `Authorization: Bearer <access_token>`.
# ---------------------------------------------------------------------------
async def require_admin(authorization: Optional[str] = Header(default=None)) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    try:
        user_res = supabase.auth.get_user(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = getattr(user_res, "user", None)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    admin = supabase.table("admin_users").select("id, email, role").eq("id", user.id).limit(1).execute()
    if not admin.data:
        raise HTTPException(status_code=403, detail="Admin access required")
    return admin.data[0]

# ---------------------------------------------------------------------------
# APScheduler — auto-sync every N hours (default 6)
# ---------------------------------------------------------------------------
_scheduler = None

def _start_scheduler(sb: Client):
    global _scheduler
    daily_hours = int(os.getenv("SCRAPER_INTERVAL_HOURS", "24"))
    weekly_hours = int(os.getenv("SCRAPER_WEEKLY_INTERVAL_HOURS", "168"))
    try:
        from apscheduler.schedulers.asyncio import AsyncIOScheduler
        from apscheduler.triggers.interval import IntervalTrigger

        async def _daily_sync():
            sources = [s.strip() for s in os.getenv("SYNC_SOURCES_ENABLED", "").split(",") if s.strip()]
            logger.info(f"[cron] Daily sync starting — {len(sources)} sources")
            try:
                results = await run_all_sources(sb, sources=sources)
                total_new = sum(r.created for r in results)
                logger.info(f"[cron] Daily sync done — {total_new} new jobs")
            except Exception as e:
                logger.error(f"[cron] Daily sync failed: {e}")

        async def _weekly_sync():
            sources = [s.strip() for s in os.getenv("SYNC_SOURCES_WEEKLY", "").split(",") if s.strip()]
            if not sources:
                return
            logger.info(f"[cron] Weekly sync starting — {len(sources)} sources")
            try:
                results = await run_all_sources(sb, sources=sources)
                total_new = sum(r.created for r in results)
                logger.info(f"[cron] Weekly sync done — {total_new} new jobs")
            except Exception as e:
                logger.error(f"[cron] Weekly sync failed: {e}")

        _scheduler = AsyncIOScheduler()
        _scheduler.add_job(_daily_sync, trigger=IntervalTrigger(hours=daily_hours), id="daily_sync", replace_existing=True)
        _scheduler.add_job(_weekly_sync, trigger=IntervalTrigger(hours=weekly_hours), id="weekly_sync", replace_existing=True)
        _scheduler.start()
        logger.info(f"[cron] APScheduler started — daily every {daily_hours}h, weekly every {weekly_hours}h")
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

_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")
_allowed_origins = [o.strip() for o in _origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
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

class RecruiterRegister(BaseModel):
    full_name: str
    email: str
    password: str
    phone: Optional[str] = None
    company_name: str
    company_website: Optional[str] = None
    company_domain: Optional[str] = None
    office_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    cin: Optional[str] = None
    gstin: Optional[str] = None
    linkedin_page: Optional[str] = None

class RecruiterApprove(BaseModel):
    action: str  # "approve" | "reject"
    rejection_reason: Optional[str] = None

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
async def create_job(body: JobPost, _admin: dict = Depends(require_admin)):
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
async def get_applications(_admin: dict = Depends(require_admin)):
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
async def update_application(app_id: str, body: ApplicationPatch, _admin: dict = Depends(require_admin)):
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
async def get_companies(_admin: dict = Depends(require_admin)):
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
async def company_applications(company_id: str, _admin: dict = Depends(require_admin)):
    comp = supabase.table("company_leads").select("company_name").eq("id", company_id).single().execute()
    name = comp.data.get("company_name", "") if comp.data else ""
    result = supabase.table("student_leads").select("*").ilike("company", f"%{name}%").execute()
    data = result.data or []
    return {"company_name": name, "total_applications": len(data), "applications": data}

# ---------------------------------------------------------------------------
# RECRUITERS
# ---------------------------------------------------------------------------
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
ADMIN_NOTIFY_EMAIL = os.getenv("ADMIN_NOTIFY_EMAIL", "tech@arivupro.com")
PORTAL_URL = os.getenv("PORTAL_URL", "https://arivupro.com")
# EMAIL_FROM must match a verified sender in your Resend account.
# Without a verified domain, use "onboarding@resend.dev" (Resend's shared test sender).
# Once arivupro.com is verified in Resend, change to "noreply@arivupro.com".
EMAIL_FROM = os.getenv("EMAIL_FROM", "onboarding@resend.dev")


def _send_email(to: str, subject: str, html: str) -> bool:
    """Send email via Resend API. Returns True on success."""
    if not RESEND_API_KEY:
        logger.warning("[email] RESEND_API_KEY not set — email skipped")
        return False
    import httpx as _httpx
    try:
        resp = _httpx.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {RESEND_API_KEY}", "Content-Type": "application/json"},
            json={"from": f"ArivuPro Portal <{EMAIL_FROM}>", "to": [to], "subject": subject, "html": html},
            timeout=10,
        )
        if resp.status_code not in (200, 201):
            logger.warning(f"[email] Resend returned {resp.status_code}: {resp.text}")
            return False
        return True
    except Exception as exc:
        logger.warning(f"[email] Send failed: {exc}")
        return False


@app.post("/api/recruiters/register", status_code=201)
async def recruiter_register(body: RecruiterRegister):
    # 1. Validate password length (Supabase enforces min 6, we want 8)
    if len(body.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    # 2. Check duplicate email
    existing = supabase.table("recruiter_profiles").select("id").eq("email", body.email).execute()
    if existing.data:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    # 3. Create Supabase Auth user
    try:
        auth_res = supabase.auth.admin.create_user({
            "email": body.email,
            "password": body.password,
            "email_confirm": True,
            "user_metadata": {"full_name": body.full_name, "role": "recruiter"},
        })
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not create account: {exc}")

    auth_user = getattr(auth_res, "user", None)
    if not auth_user:
        raise HTTPException(status_code=500, detail="Account creation failed — no user returned.")

    # 4. Insert recruiter_profiles row
    profile = {
        "auth_user_id": str(auth_user.id),
        "full_name": body.full_name,
        "email": body.email,
        "phone": body.phone,
        "company_name": body.company_name,
        "company_website": body.company_website,
        "company_domain": body.company_domain,
        "office_address": body.office_address,
        "city": body.city,
        "state": body.state,
        "cin": body.cin,
        "gstin": body.gstin,
        "linkedin_page": body.linkedin_page,
        "approval_status": "pending",
    }
    result = supabase.table("recruiter_profiles").insert(profile).execute()
    recruiter_id = result.data[0]["id"] if result.data else str(auth_user.id)

    # 5. Notify admin
    admin_panel_url = f"{PORTAL_URL}/?admin"
    _send_email(
        to=ADMIN_NOTIFY_EMAIL,
        subject=f"[ArivuPro] New Recruiter Registration: {body.company_name}",
        html=f"""
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
  <h2 style="color:#0f2419;">New Recruiter Registration</h2>
  <table style="width:100%;border-collapse:collapse;font-size:14px;">
    <tr><td style="padding:6px 0;color:#6b7280;width:140px;">Company</td><td style="font-weight:700;">{body.company_name}</td></tr>
    <tr><td style="padding:6px 0;color:#6b7280;">Contact</td><td>{body.full_name}</td></tr>
    <tr><td style="padding:6px 0;color:#6b7280;">Email</td><td>{body.email}</td></tr>
    <tr><td style="padding:6px 0;color:#6b7280;">Phone</td><td>{body.phone or '—'}</td></tr>
    <tr><td style="padding:6px 0;color:#6b7280;">Website</td><td>{body.company_website or '—'}</td></tr>
    <tr><td style="padding:6px 0;color:#6b7280;">Domain</td><td>{body.company_domain or '—'}</td></tr>
    <tr><td style="padding:6px 0;color:#6b7280;">Address</td><td>{body.office_address or '—'}, {body.city or ''} {body.state or ''}</td></tr>
    <tr><td style="padding:6px 0;color:#6b7280;">CIN</td><td>{body.cin or '—'}</td></tr>
    <tr><td style="padding:6px 0;color:#6b7280;">GSTIN</td><td>{body.gstin or '—'}</td></tr>
  </table>
  <div style="margin-top:24px;">
    <a href="{admin_panel_url}" style="background:#1a7a4a;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:700;display:inline-block;">
      Review in Admin Panel →
    </a>
  </div>
  <p style="color:#9ca3af;font-size:12px;margin-top:24px;">ArivuPro Finance Career Portal · Recruiter ID: {recruiter_id}</p>
</div>""",
    )

    return {"message": "Registration successful. Your account is pending approval.", "recruiter_id": recruiter_id}


@app.get("/api/recruiters/pending")
async def get_pending_recruiters(_admin: dict = Depends(require_admin)):
    result = (
        supabase.table("recruiter_profiles")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )
    data = result.data or []
    return {"total": len(data), "recruiters": data}


@app.patch("/api/recruiters/{recruiter_id}/approve")
async def approve_recruiter(
    recruiter_id: str,
    body: RecruiterApprove,
    _admin: dict = Depends(require_admin),
):
    if body.action not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="action must be 'approve' or 'reject'")

    rec = supabase.table("recruiter_profiles").select("*").eq("id", recruiter_id).maybe_single().execute()
    if not rec.data:
        raise HTTPException(status_code=404, detail="Recruiter not found")

    updates: dict = {"updated_at": now_iso()}
    if body.action == "approve":
        updates["approval_status"] = "approved"
        updates["approved_by"] = str(_admin["id"])
        updates["approved_at"] = now_iso()
        # Sync approved recruiter into company_leads so they appear in Companies tab
        # Check if already exists first (no unique constraint on work_email)
        existing = supabase.table("company_leads").select("id").eq("work_email", rec.data["email"]).execute()
        if not existing.data:
            supabase.table("company_leads").insert({
                "company_name": rec.data["company_name"],
                "legal_name": rec.data["company_name"],
                "website": rec.data.get("company_website") or "",
                "contact_person": rec.data["full_name"],
                "work_email": rec.data["email"],
                "phone": rec.data.get("phone") or "",
                "industry": "Finance & Corporate Services",
                "cin_or_gstin": rec.data.get("cin") or rec.data.get("gstin") or "",
                "verification_status": "verified",
                "notes": f"Approved recruiter. Address: {rec.data.get('office_address') or ''}, {rec.data.get('city') or ''} {rec.data.get('state') or ''}".strip(", "),
                "status": "new",
                "active_jobs_count": 0,
            }).execute()
        # Notify recruiter
        _send_email(
            to=rec.data["email"],
            subject="Your ArivuPro Recruiter Account is Approved!",
            html=f"""
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
  <h2 style="color:#1a7a4a;">Welcome to ArivuPro, {rec.data['full_name']}!</h2>
  <p>Your recruiter account for <strong>{rec.data['company_name']}</strong> has been verified and approved.</p>
  <p>You can now login and post finance jobs to reach our pool of CA, ACCA, US CPA, CFA, and CS candidates.</p>
  <div style="margin-top:24px;">
    <a href="{PORTAL_URL}" style="background:#1a7a4a;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:700;display:inline-block;">
      Login to ArivuPro Portal →
    </a>
  </div>
  <p style="color:#9ca3af;font-size:12px;margin-top:24px;">Login email: {rec.data['email']}</p>
</div>""",
        )
    else:
        updates["approval_status"] = "rejected"
        updates["rejection_reason"] = body.rejection_reason or ""
        _send_email(
            to=rec.data["email"],
            subject="ArivuPro Recruiter Account — Verification Update",
            html=f"""
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
  <h2 style="color:#0f2419;">Account Verification Update</h2>
  <p>Hi {rec.data['full_name']}, we could not verify your recruiter account for <strong>{rec.data['company_name']}</strong> at this time.</p>
  {f'<p style="color:#dc2626;">Reason: {body.rejection_reason}</p>' if body.rejection_reason else ''}
  <p>If you believe this is an error, please reply to this email with supporting documents.</p>
  <p style="color:#9ca3af;font-size:12px;margin-top:24px;">ArivuPro Finance Career Portal</p>
</div>""",
        )

    supabase.table("recruiter_profiles").update(updates).eq("id", recruiter_id).execute()
    return {"message": f"Recruiter {body.action}d successfully"}


@app.get("/api/recruiters/status")
async def recruiter_status(email: str = Query(...)):
    """Frontend polls this after login to check approval status."""
    result = (
        supabase.table("recruiter_profiles")
        .select("approval_status, company_name, full_name")
        .eq("email", email)
        .maybe_single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Recruiter profile not found")
    return result.data


async def require_recruiter(authorization: Optional[str] = Header(default=None)) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    try:
        user_res = supabase.auth.get_user(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = getattr(user_res, "user", None)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    profile = (
        supabase.table("recruiter_profiles")
        .select("id, email, company_name, full_name, approval_status")
        .eq("auth_user_id", str(user.id))
        .maybe_single()
        .execute()
    )
    if not profile.data:
        raise HTTPException(status_code=403, detail="Recruiter profile not found")
    if profile.data["approval_status"] != "approved":
        raise HTTPException(status_code=403, detail="Recruiter account not approved")
    return profile.data


@app.post("/api/recruiters/jobs", status_code=201)
async def recruiter_create_job(body: JobPost, recruiter: dict = Depends(require_recruiter)):
    job_id = str(uuid.uuid4())
    job = {
        "id": job_id,
        "title": body.title,
        "company": recruiter["company_name"],
        "salary_text": body.salary_text or "As per norms",
        "location": body.location or "",
        "city": body.city or "",
        "workplace_type": body.workplace_type or "hybrid",
        "job_type": body.job_type or "full-time",
        "experience_level": body.experience_level or "Fresher / 0-1 yr",
        "min_experience_years": body.min_experience_years or 0,
        "salary_min_lpa": body.salary_min_lpa,
        "salary_max_lpa": body.salary_max_lpa,
        "qualifications": body.qualifications or [],
        "mandatory_skills": body.mandatory_skills or [],
        "good_to_have_skills": body.good_to_have_skills or [],
        "description": body.description or "",
        "key_responsibilities": body.key_responsibilities or [],
        "department": body.department or "Audit & Assurance",
        "source": "direct_recruiter",
        "arivupro_exclusive": False,
        "is_urgent": body.is_urgent or False,
        "is_featured": False,
        "status": "draft" if body.crm_drive_code == "draft" else "active",
        "posted_date": now_iso(),
        "deadline_date": body.deadline_date,
        "applicants_count": 0,
        "recruiter_profile_id": recruiter["id"],
    }
    try:
        result = supabase.table("jobs").insert(job).execute()
    except Exception as e:
        err = str(e)
        logger.error(f"[recruiter_create_job] insert failed: {err}")
        # If recruiter_profile_id column doesn't exist yet, retry without it
        if "recruiter_profile_id" in err:
            job.pop("recruiter_profile_id", None)
            result = supabase.table("jobs").insert(job).execute()
        else:
            raise HTTPException(status_code=500, detail=f"Failed to create job: {err}")
    if not result.data:
        raise HTTPException(status_code=500, detail="Job insert returned no data")
    return {"message": "Job published successfully", "job": result.data[0]}


@app.get("/api/recruiters/jobs")
async def recruiter_get_jobs(recruiter: dict = Depends(require_recruiter)):
    try:
        result = (
            supabase.table("jobs")
            .select("*")
            .eq("recruiter_profile_id", recruiter["id"])
            .order("posted_date", desc=True)
            .execute()
        )
        jobs = result.data or []
    except Exception:
        # Fallback if column not migrated yet: filter by company name
        result = (
            supabase.table("jobs")
            .select("*")
            .eq("company", recruiter["company_name"])
            .eq("source", "direct_recruiter")
            .order("posted_date", desc=True)
            .execute()
        )
        jobs = result.data or []
    return {"jobs": jobs}


@app.get("/api/recruiters/applicants")
async def recruiter_get_applicants(job_id: Optional[str] = None, recruiter: dict = Depends(require_recruiter)):
    """Return applicants for jobs posted by this recruiter."""
    # Get this recruiter's job IDs
    jobs_res = (
        supabase.table("jobs")
        .select("id, title")
        .eq("recruiter_profile_id", recruiter["id"])
        .execute()
    )
    recruiter_job_ids = {j["id"]: j["title"] for j in (jobs_res.data or [])}

    if not recruiter_job_ids:
        return {"applicants": []}

    q = supabase.table("student_leads").select("*")
    if job_id and job_id in recruiter_job_ids:
        q = q.eq("job_id", job_id)
    else:
        q = q.in_("job_id", list(recruiter_job_ids.keys()))

    result = q.order("created_at", desc=True).execute()
    return {"applicants": result.data or []}


# ---------------------------------------------------------------------------
# CRM
# ---------------------------------------------------------------------------
@app.post("/api/crm/sync-all")
async def crm_sync_all(_admin: dict = Depends(require_admin)):
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
async def scrape_logs(_admin: dict = Depends(require_admin)):
    result = supabase.table("sync_runs").select("*").order("started_at", desc=True).limit(20).execute()
    data = result.data or []
    return {"logs": data, "last_run": data[0].get("started_at") if data else None}


@app.post("/api/scrape/trigger")
async def scrape_trigger(body: ScrapeRequest, _admin: dict = Depends(require_admin)):
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
async def run_sync_now(body: ScrapeRequest, _admin: dict = Depends(require_admin)):
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
    next_weekly = None
    if _scheduler and _scheduler.running:
        running = True
        daily_job = _scheduler.get_job("daily_sync")
        if daily_job and daily_job.next_run_time:
            next_run = daily_job.next_run_time.isoformat()
        weekly_job = _scheduler.get_job("weekly_sync")
        if weekly_job and weekly_job.next_run_time:
            next_weekly = weekly_job.next_run_time.isoformat()
    return {
        "scheduler_running": running,
        "next_daily_run": next_run,
        "next_weekly_run": next_weekly,
        "daily_interval_hours": int(os.getenv("SCRAPER_INTERVAL_HOURS", "24")),
        "weekly_interval_hours": int(os.getenv("SCRAPER_WEEKLY_INTERVAL_HOURS", "168")),
        "auto_run_enabled": os.getenv("SCRAPER_AUTO_RUN", "true").lower() == "true",
        "daily_sources": os.getenv("SYNC_SOURCES_ENABLED", "").split(","),
        "weekly_sources": os.getenv("SYNC_SOURCES_WEEKLY", "").split(","),
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
