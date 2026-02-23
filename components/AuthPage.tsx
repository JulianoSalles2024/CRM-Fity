import React, { useState, FormEvent } from 'react';
import { Loader2 } from 'lucide-react';

type AuthMode = 'login' | 'register' | 'forgotPassword';

interface AuthPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (name: string, email: string, password: string) => Promise<void>;
  onSignInWithGoogle: () => Promise<void>;
  onForgotPassword: (email: string) => Promise<void>;
  error: string | null;
  successMessage?: string | null;
}

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.519-3.317-11.28-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.022,35.021,44,30.021,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
  </svg>
);

const AuthPage: React.FC<AuthPageProps> = ({
  onLogin,
  onRegister,
  onSignInWithGoogle,
  onForgotPassword,
  error,
  successMessage,
}) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  React.useEffect(() => {
    setInternalError(error);
  }, [error]);

  React.useEffect(() => {
    if (successMessage) {
      setMode('login');
    }
  }, [successMessage]);

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    setInternalError(null);
    setInfoMessage(null);
    if (newMode === 'register') {
      setName('');
      setPassword('');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setInternalError(null);
    if (mode === 'login') {
      await onLogin(email, password);
    } else {
      await onRegister(name, email, password);
    }
    setIsSubmitting(false);
  };

  const handleGoogleLogin = async () => {
    setIsGoogleSubmitting(true);
    setInternalError(null);
    await onSignInWithGoogle();
    setIsGoogleSubmitting(false);
  };

  const handleForgotPasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setInternalError(null);
    setInfoMessage(null);
    try {
      await onForgotPassword(email);
    } finally {
      setInfoMessage('Se uma conta com este e-mail existir, um link de redefinição foi enviado.');
      setMode('login');
      setIsSubmitting(false);
    }
  };

  // Shared input classes
  const inputClass =
    'w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200';

  // Shared primary button classes
  const primaryBtnClass =
    'w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200';

  if (mode === 'forgotPassword') {
    return (
      <PageWrapper>
        <CardHeader
          title="Redefinir senha"
          subtitle="Digite seu e-mail para receber o link de redefinição."
        />
        <form onSubmit={handleForgotPasswordSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="fp-email" className="block text-sm font-medium text-slate-300 mb-1.5">
              E-mail
            </label>
            <input
              id="fp-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className={inputClass}
            />
          </div>
          {internalError && <ErrorMessage message={internalError} />}
          <button type="submit" disabled={isSubmitting} className={primaryBtnClass}>
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isSubmitting ? 'Enviando...' : 'Enviar link'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          <button
            type="button"
            onClick={() => handleModeChange('login')}
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            Voltar para o login
          </button>
        </p>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <CardHeader
        title={mode === 'login' ? 'Bem-vindo de volta' : 'Criar conta'}
        subtitle={
          mode === 'login'
            ? 'Entre na sua conta para continuar'
            : 'Cadastre-se para acessar o CRM'
        }
      />

      {successMessage && mode === 'login' && (
        <div className="mb-4 rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-400">
          {successMessage}
        </div>
      )}
      {infoMessage && mode === 'login' && (
        <div className="mb-4 rounded-xl bg-blue-500/10 border border-blue-500/20 px-4 py-3 text-sm text-blue-400">
          {infoMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {mode === 'register' && (
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1.5">
              Nome
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Seu nome"
              className={inputClass}
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className={inputClass}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-slate-300">
              Senha
            </label>
            {mode === 'login' && (
              <button
                type="button"
                onClick={() => handleModeChange('forgotPassword')}
                className="text-xs text-slate-400 hover:text-blue-400 transition-colors"
              >
                Esqueci minha senha
              </button>
            )}
          </div>
          <input
            id="password"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            className={inputClass}
          />
        </div>

        {internalError && <ErrorMessage message={internalError} />}

        <button type="submit" disabled={isSubmitting || isGoogleSubmitting} className={primaryBtnClass}>
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isSubmitting ? 'Processando...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-600/60" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-slate-800 px-3 text-slate-500 uppercase tracking-wide">ou</span>
        </div>
      </div>

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isSubmitting || isGoogleSubmitting}
        className="w-full flex justify-center items-center gap-3 py-3 px-4 rounded-xl border border-slate-600 bg-slate-700/40 text-sm font-medium text-slate-200 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        aria-label="Continuar com Google"
      >
        {isGoogleSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon />}
        {isGoogleSubmitting ? 'Redirecionando...' : 'Continuar com Google'}
      </button>

      {/* Mode toggle */}
      <p className="mt-6 text-center text-sm text-slate-400">
        {mode === 'login' ? (
          <>
            Não tem conta?{' '}
            <button
              type="button"
              onClick={() => handleModeChange('register')}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Criar conta
            </button>
          </>
        ) : (
          <>
            Já tem conta?{' '}
            <button
              type="button"
              onClick={() => handleModeChange('login')}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Entrar
            </button>
          </>
        )}
      </p>
    </PageWrapper>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-[#0f1c3a] to-slate-950 px-4 py-12">
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <span className="text-white text-sm font-bold">C</span>
        </div>
        <span className="text-xl font-bold text-white tracking-tight">CRM</span>
      </div>

      {/* Card */}
      <div className="bg-slate-800 rounded-2xl shadow-2xl shadow-black/40 border border-slate-700/50 px-8 py-10">
        {children}
      </div>

      <p className="mt-6 text-center text-xs text-slate-600">
        &copy; {new Date().getFullYear()} CRM. Todos os direitos reservados.
      </p>
    </div>
  </div>
);

const CardHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className="mb-8">
    <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
    <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
  </div>
);

const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400" role="alert">
    {message}
  </div>
);

export default AuthPage;
