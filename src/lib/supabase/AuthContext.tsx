import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getCurrentUser, onAuthStateChange, type AppAuthUser, type AuthUser } from './auth';

interface AuthContextValue {
  admin: AuthUser | null;
  user: AppAuthUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ admin: null, user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AuthUser | null>(null);
  const [user, setUser] = useState<AppAuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // Check the existing session on mount, including OAuth callback sessions.
    getCurrentUser().then(currentUser => {
      if (!active) return;
      setUser(currentUser);
      setAdmin(currentUser?.role === 'admin' ? currentUser as AuthUser : null);
      setLoading(false);
    });

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = onAuthStateChange(currentUser => {
      if (!active) return;
      setUser(currentUser);
      setAdmin(currentUser?.role === 'admin' ? currentUser as AuthUser : null);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ admin, user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
