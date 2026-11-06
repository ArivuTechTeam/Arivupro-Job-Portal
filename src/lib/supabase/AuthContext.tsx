import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getCurrentAdmin, onAuthStateChange, type AuthUser } from './auth';

interface AuthContextValue {
  admin: AuthUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ admin: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check session on mount
    getCurrentAdmin().then(user => {
      setAdmin(user);
      setLoading(false);
    });

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = onAuthStateChange(user => {
      setAdmin(user);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ admin, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
