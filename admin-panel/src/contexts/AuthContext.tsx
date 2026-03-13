import React, { createContext, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession, signIn, signOut } from 'next-auth/react';

interface User {
  id: string;
  email: string;
  name: string; // Cambiado de 'nombre' a 'name'
  role: string; // Cambiado de 'rol' a 'role'
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const loading = status === 'loading';
  const user = session?.user as User | null;
  const isAuthenticated = !!session;

  useEffect(() => {
    // Si la sesión ha terminado de cargar y no hay usuario,
    // y no estamos en una página pública, redirigir a login.
    if (!loading && !isAuthenticated && !['/login', '/register'].includes(router.pathname)) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  const login = async (email: string, password: string) => {
    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      throw new Error(result.error);
    }

    if (result?.ok) {
      router.push('/dashboard');
    }
  };

  const loginWithGoogle = async () => {
    // NextAuth se encarga de todo el flujo de redirección
    await signIn('google', { callbackUrl: '/dashboard' });
  };

  const logout = async () => {
    // NextAuth limpia la sesión y redirige
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};
