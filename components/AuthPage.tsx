import React, { useState, FormEvent } from 'react';
import { Loader2, Zap } from 'lucide-react';

type AuthMode = 'login' | 'register';

interface AuthPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (name: string, email: string, password: string) => Promise<void>;
  onSignInWithGoogle: () => Promise<void>;
  error: string | null;
  successMessage?: string | null;
}

// SVG for Google icon
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.519-3.317-11.28-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.022,35.021,44,30.021,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
  </svg>
);

const AuthPage: React.FC<AuthPageProps> = ({ onLogin, onRegister, onSignInWithGoogle, error, successMessage }) => {
  const [mode, setMode] = useState<AuthMode>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  React.useEffect(() => {
    setInternalError(error);
  }, [error]);

  React.useEffect(() => {
    if (successMessage) {
        setMode('login');
    }
  }, [successMessage]);

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
    // A página será redirecionada pelo Supabase, então não precisamos resetar o estado de loading no sucesso.
    // Em caso de falha, o erro será capturado no App.tsx. Resetamos aqui por segurança.
    setIsGoogleSubmitting(false);
  };

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    setInternalError(null);
    // Don't clear fields when switching from register error to login
    if (newMode === 'register') {
      setName('');
      setEmail('');
      setPassword('');
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-zinc-900">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-12 bg-zinc-900 border-r border-zinc-800">
        <div className="max-w-md w-full">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-violet-500" />
            <span className="text-2xl font-bold text-white">CRM Fity AI</span>
          </div>
          <h1 className="mt-8 text-4xl font-bold tracking-tight text-white">
            Gerencie seus leads com <br />
            <span className="text-violet-400">velocidade</span> e <span className="text-violet-400">simplicidade</span>
          </h1>
          <p className="mt-4 text-lg text-zinc-400">
            CRM moderno e minimalista para empreendedores que valorizam produtividade e experiência de uso premium.
          </p>
        </div>
      </div>

      {/* Right Panel (Form) */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-12 bg-[#1f1f23]">
        <div className="w-full max-w-sm">
            
            {/* Logo for mobile */}
            <div className="flex lg:hidden items-center gap-3 mb-8">
                <Zap className="w-8 h-8 text-violet-500" />
                <span className="text-2xl font-bold text-white">CRM Fity AI</span>
            </div>

          {/* Tabs */}
          <div className="p-1 bg-zinc-800 rounded-lg flex items-center gap-1 mb-8 border border-zinc-700">
            <button
              onClick={() => handleModeChange('login')}
              className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors ${mode === 'login' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              Entrar
            </button>
            <button
              onClick={() => handleModeChange('register')}
              className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors ${mode === 'register' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              Cadastrar
            </button>
          </div>

          {/* Form Title */}
          <h2 className="text-2xl font-bold text-white">
            {mode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}
          </h2>
          <p className="text-zinc-400 mt-2 mb-6">
            {mode === 'login' ? 'Entre com sua conta para continuar' : 'Preencha os dados abaixo para começar'}
          </p>
          
          {successMessage && mode === 'login' && <p className="mb-4 text-sm text-center text-green-400 bg-green-900/30 p-2 rounded-md">{successMessage}</p>}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-2">
                  Nome
                </label>
                <input id="name" name="name" type="text" required value={name} onChange={e => setName(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">
                Email
              </label>
              <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label htmlFor="password"className="block text-sm font-medium text-zinc-300 mb-2">
                Senha
              </label>
              <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {internalError && (
              <div>
                <p className="text-sm text-red-400">{internalError}</p>
                {mode === 'register' && internalError.includes("email já está em uso") && (
                  <p className="mt-1 text-sm text-zinc-400">
                    Já tem uma conta?{' '}
                    <button
                      type="button"
                      onClick={() => handleModeChange('login')}
                      className="font-semibold text-violet-400 hover:text-violet-300 underline focus:outline-none"
                    >
                      Faça o login aqui.
                    </button>
                  </p>
                )}
              </div>
            )}

            <div>
              <button type="submit" disabled={isSubmitting || isGoogleSubmitting}
                className="mt-2 w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmitting ? 'Processando...' : (mode === 'login' ? 'Entrar' : 'Cadastrar')}
              </button>
            </div>
          </form>

          {mode === 'login' && (
              <div className="mt-4 text-center">
                <a href="#" className="text-sm text-zinc-400 hover:text-violet-400 transition-colors">Esqueci minha senha</a>
              </div>
          )}

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-[#1f1f23] px-2 text-zinc-500">OU</span>
            </div>
          </div>
          
          {/* Google Login */}
          <div>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isSubmitting || isGoogleSubmitting}
              className="w-full flex justify-center items-center gap-3 py-2.5 px-4 border border-zinc-700 rounded-md shadow-sm text-sm font-medium text-white bg-zinc-800 hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-violet-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGoogleSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon />}
              {isGoogleSubmitting ? 'Redirecionando...' : 'Continuar com Google'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AuthPage;