import React from 'react';

const InvitePage: React.FC<{ token: string }> = ({ token }) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-[#0f1c3a] to-slate-950 px-4">
      <div className="w-full max-w-md bg-slate-800/50 backdrop-blur-md border border-white/[0.06] rounded-2xl shadow-xl shadow-black/30 px-8 py-10 text-center">

        <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/20 flex items-center justify-center mx-auto mb-6">
          <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Convite recebido</h1>
        <p className="text-slate-400 text-sm mb-8">
          Você foi convidado para acessar o CRM. Crie sua conta para continuar.
        </p>

        <div className="bg-slate-900/60 border border-white/[0.06] rounded-xl px-4 py-3 mb-8 text-left">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Token do convite</p>
          <p className="text-sm font-mono text-slate-300 break-all">{token}</p>
        </div>

        <a
          href="/"
          className="block w-full py-3 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
        >
          Criar conta
        </a>

        <p className="mt-4 text-xs text-slate-600">
          Já tem uma conta?{' '}
          <a href="/" className="text-blue-400 hover:text-blue-300 transition-colors">
            Entrar
          </a>
        </p>
      </div>
    </div>
  );
};

export const InvalidTokenPage: React.FC = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-[#0f1c3a] to-slate-950 px-4">
      <div className="w-full max-w-md bg-slate-800/50 backdrop-blur-md border border-white/[0.06] rounded-2xl shadow-xl shadow-black/30 px-8 py-10 text-center">

        <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
          <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Token inválido</h1>
        <p className="text-slate-400 text-sm mb-8">
          Este link de convite é inválido ou expirou. Solicite um novo convite.
        </p>

        <a
          href="/"
          className="block w-full py-3 rounded-xl text-sm font-semibold border border-slate-600 text-slate-300 hover:bg-slate-700/50 transition-all"
        >
          Voltar ao início
        </a>
      </div>
    </div>
  );
};

export default InvitePage;
