import React from 'react';
import { useAuth } from './AuthContext';
import AuthPage from '@/components/AuthPage';

const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    user, isLoading,
    login, register, signInWithGoogle, forgotPassword,
    authError, successMessage,
    blockedError, clearBlockedError,
  } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (!user) {
    if (blockedError) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-950 px-4">
          <div className="w-full max-w-sm bg-slate-900 border border-red-500/30 rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Acesso bloqueado</h2>
            <p className="text-sm text-slate-400 mb-7">{blockedError}</p>
            <button
              onClick={clearBlockedError}
              className="w-full py-3 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      );
    }

    return (
      <AuthPage
        onLogin={login}
        onRegister={register}
        onSignInWithGoogle={signInWithGoogle}
        onForgotPassword={forgotPassword}
        error={authError}
        successMessage={successMessage}
      />
    );
  }

  return <>{children}</>;
};

export default AuthGate;
