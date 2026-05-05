import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.warn(
    '[Supabase] REACT_APP_SUPABASE_URL or REACT_APP_SUPABASE_ANON_KEY is not set in .env'
  );
}

export const supabase = createClient(
  SUPABASE_URL  || 'https://ryrspalzirnzohvoghog.supabase.co',
  SUPABASE_ANON || '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

// ── Storage helper — upload a file to Supabase Storage ───────────────────────
export async function uploadAnswerScript(file, studentId, paperId) {
  const ext      = file.name.split('.').pop();
  const path     = `${studentId}/${paperId}_${Date.now()}.${ext}`;
  const { data, error } = await supabase.storage
    .from('answer-scripts')
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('answer-scripts')
    .getPublicUrl(data.path);

  return { path: data.path, publicUrl };
}

// ── Storage helper — get public URL for a stored file ────────────────────────
export function getPublicUrl(storagePath) {
  const { data } = supabase.storage
    .from('answer-scripts')
    .getPublicUrl(storagePath);
  return data.publicUrl;
}

export default supabase;
