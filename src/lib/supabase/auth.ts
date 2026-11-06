import { supabase } from './client';

export interface AuthUser {
  id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'counselor';
  name: string;
}

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

  return { user: adminData as AuthUser, error: null };
}

export async function signOut() {
  await supabase.auth.signOut();
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
