"""Run once to create Supabase Storage buckets needed by the portal."""
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])

for bucket_id in ["resumes", "job-logos", "job-docs"]:
    try:
        supabase.storage.create_bucket(bucket_id, options={"public": True})
        print(f"✅ Created bucket: {bucket_id}")
    except Exception as e:
        msg = str(e)
        if "already exists" in msg.lower() or "duplicate" in msg.lower() or "409" in msg:
            print(f"ℹ️  Bucket already exists: {bucket_id}")
        else:
            print(f"❌ Failed to create {bucket_id}: {e}")
