# Supabase Setup — ArivuPro ExamApp

**Project ID:** `ryrspalzirnzohvoghog`  
**Project URL:** `https://ryrspalzirnzohvoghog.supabase.co`

---

## Step 1 — Get your Database Password

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/ryrspalzirnzohvoghog)
2. Click **Settings** → **Database**
3. Copy the **Database password**

---

## Step 2 — Update `backend/.env`

Replace `YOUR_SUPABASE_DB_PASSWORD` with the password you copied:

```env
DB_PASSWORD=YOUR_SUPABASE_DB_PASSWORD
```

---

## Step 3 — Get your Service Role Key (for storage/admin)

1. Go to **Settings** → **API**
2. Copy the **service_role** key (keep this secret — never expose in frontend)
3. Add it to `backend/.env`:

```env
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key...
```

---

## Step 4 — Create Storage Bucket (for answer scripts)

1. Go to **Storage** in the Supabase Dashboard
2. Click **New bucket** → Name: `answer-scripts`
3. Set access to **Private** (admin controls access via service role key)

---

## Step 5 — Run Django Migrations

```bash
cd backend
python manage.py migrate
python manage.py createsuperuser
```

---

## Step 6 — Test the Connection

```bash
cd backend
python manage.py dbshell
# Should connect to Supabase PostgreSQL
```

---

## Connection Details Summary

| Setting | Value |
|---------|-------|
| Host (pooler) | `aws-0-ap-south-1.pooler.supabase.com` |
| Host (direct) | `db.ryrspalzirnzohvoghog.supabase.co` |
| Port | `5432` |
| Database | `postgres` |
| User | `postgres.ryrspalzirnzohvoghog` |
| SSL | Required |

---

## Frontend Usage

The Supabase JS client is at `frontend/src/lib/supabase.js`.

```js
import { supabase, uploadAnswerScript } from '../lib/supabase';

// Upload an answer script file
const { publicUrl } = await uploadAnswerScript(file, studentId, paperId);
```
