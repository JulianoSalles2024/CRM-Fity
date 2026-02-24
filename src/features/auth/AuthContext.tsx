import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/src/lib/supabase';
import { type AppRole, type Permissions, PERMISSIONS } from '@/src/lib/permissions';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isRoleReady: boolean;
  currentUserRole: AppRole;
  currentPermissions: Permissions;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  authError: string | null;
  successMessage: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<AppRole>('seller');
  const [isRoleReady, setIsRoleReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch role from profiles whenever user changes
  useEffect(() => {
    setIsRoleReady(false);
    if (!user) {
      setCurrentUserRole('seller');
      setIsRoleReady(true);
      return;
    }
    supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        console.log('[AuthContext] user.id:', user.id);
        console.log('[AuthContext] email:', user.email);
        console.log('[AuthContext] role from DB:', data?.role ?? null, '| error:', error?.message ?? null);
        const role = (data?.role as AppRole) ?? 'seller';
        console.log('[AuthContext] currentUserRole final:', role);
        setCurrentUserRole(role);
        setIsRoleReady(true);
      });
  }, [user]);

  const login = async (email: string, password: string) => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
  };

  const register = async (name: string, email: string, password: string) => {
    setAuthError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) {
      setAuthError(error.message);
    } else {
      setSuccessMessage('Conta criada! Verifique seu e-mail para confirmar o cadastro.');
    }
  };

  const signInWithGoogle = async () => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) setAuthError(error.message);
  };

  const forgotPassword = async (email: string) => {
    setAuthError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setAuthError(error.message);
    } else {
      setSuccessMessage('E-mail de recuperação enviado. Verifique sua caixa de entrada.');
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const currentPermissions = PERMISSIONS[currentUserRole];

  return (
    <AuthContext.Provider value={{
      user, session, isLoading, isRoleReady,
      currentUserRole, currentPermissions,
      login, register, signInWithGoogle, forgotPassword, logout,
      authError, successMessage,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
