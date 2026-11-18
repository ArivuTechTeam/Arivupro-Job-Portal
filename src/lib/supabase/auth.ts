import type { Session } from '@supabase/supabase-js';
import { supabase } from './client';

export interface AuthUser {
  id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'counselor';
  name: string;
}

export interface AppAuthUser {
  id: string;
  email: string;
  role: 'student' | 'recruiter' | 'admin';
  name: string;
  course?: string;
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

/** Start the browser OAuth flow. Supabase redirects back to the current SPA origin. */
export async function signInWithGoogle(): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + window.location.pathname,
    },
  });

  return { error: error?.message ?? null };
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
    .maybeSingle();

  return data as AuthUser | null;
}

/** Resolve the Supabase session into the app's UI identity. */
export async function getCurrentUser(session?: Session | null): Promise<AppAuthUser | null> {
  const currentSession = session ?? await getSession();
  const user = currentSession?.user;
  if (!user) return null;

  const { data: adminData } = await supabase
    .from('admin_users')
    .select('id, email, name, role')
    .eq('id', user.id)
    .maybeSingle();

  const adminRecord = adminData as Pick<AuthUser, 'id' | 'email' | 'name'> | null;
  if (adminRecord) {
    return {
      id: adminRecord.id,
      email: adminRecord.email,
      name: adminRecord.name,
      role: 'admin',
    };
  }

  const metadata = user.user_metadata ?? {};
  // This role is only used for client-side routing. Privileged API access is
  // still checked server-side against the authenticated user's profile.
  const role = metadata.role === 'recruiter' ? 'recruiter' : 'student';
  return {
    id: user.id,
    email: user.email ?? '',
    name: metadata.name ?? metadata.full_name ?? user.email ?? 'ArivuPro user',
    role,
    course: metadata.course,
  };
}

export function onAuthStateChange(callback: (user: AppAuthUser | null) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    // Do not await Supabase queries inside the auth callback; Auth can hold an
    // internal lock while dispatching this event.
    window.setTimeout(() => {
      void getCurrentUser(session).then(callback);
    }, 0);
  });
}
