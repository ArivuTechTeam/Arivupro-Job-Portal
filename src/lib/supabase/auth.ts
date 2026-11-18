import { supabase } from './client';

export interface AuthUser {
  id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'counselor';
  name: string;
}

const ADMIN_TOKEN_KEY = 'ap_admin_token';

export async function signInAdmin(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { user: null, error: error.message };
  if (!data.user) return { user: null, error: 'Login failed' };

  // Fetch admin profile
  const { data: adminData, error: adminError } = await supabase
    .from('admin_users')
    .select('id, email, name, role')
    .eq('id', data.user.id)
    .single();

  if (adminError || !adminData) {
    await supabase.auth.signOut();
    return { user: null, error: 'You do not have admin access.' };
  }

  // Persist token in localStorage so it survives page reloads
  if (data.session?.access_token) {
    localStorage.setItem(ADMIN_TOKEN_KEY, data.session.access_token);
  }

  return { user: adminData as AuthUser, error: null };
}

export async function signOut() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  await supabase.auth.signOut();
}

/** fetch() wrapper that attaches the admin's Supabase access token. Use for admin-only API calls. */
export async function adminFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  // Fall back to localStorage token (survives page reloads)
  const token = session?.access_token || localStorage.getItem(ADMIN_TOKEN_KEY);
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getCurrentAdmin(): Promise<AuthUser | null> {
  const session = await getSession();
  if (!session) return null;

  const { data } = await supabase
    .from('admin_users')
    .select('id, email, name, role')
    .eq('id', session.user.id)
    .single();

  return data as AuthUser | null;
}

export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (!session) {
      callback(null);
      return;
    }
    const admin = await getCurrentAdmin();
    callback(admin);
  });
}
