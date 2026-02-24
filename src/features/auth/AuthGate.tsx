import React from 'react';
import { useAuth } from './AuthContext';
import AuthPage from '@/components/AuthPage';

const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading, login, register, signInWithGoogle, forgotPassword, authError, successMessage } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (!user) {
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
