import React from 'react';
import { Key, ShieldCheck, Info } from 'lucide-react';
import { useAIProviders } from './useAIProviders';
import { AIProviderCard } from './AIProviderCard';
import { AIProviderId } from './aiProviders.types';

export const AIProvidersPage: React.FC = () => {
  const { credentials, isLoading, updateCredential, saveCredential, testConnection } = useAIProviders();

  const providers: AIProviderId[] = ['openai', 'gemini', 'anthropic'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20">
          <Key className="w-8 h-8 text-sky-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Credenciais de IA</h1>
          <p className="text-slate-400">Gerencie as chaves de API e modelos dos provedores de inteligência artificial</p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-3 items-start">
        <ShieldCheck className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="text-amber-200 font-bold mb-1">Segurança de Dados</p>
          <p className="text-amber-200/70">Suas chaves são criptografadas antes de serem armazenadas e nunca são exibidas em texto puro após o salvamento.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {providers.map(providerId => (
          <AIProviderCard 
            key={providerId}
            credential={credentials[providerId]}
            onUpdate={(updates) => updateCredential(providerId, updates)}
            onSave={() => saveCredential(providerId)}
            onTest={() => testConnection(providerId)}
          />
        ))}
      </div>

      <div className="p-6 rounded-2xl border border-white/10 bg-white/5 flex gap-4 items-start">
        <Info className="w-5 h-5 text-slate-400 flex-shrink-0 mt-1" />
        <div className="text-sm text-slate-400 space-y-2">
          <p>O sistema utilizará o provedor configurado como "Conectado" para alimentar as ferramentas de IA.</p>
          <p>Caso múltiplos provedores estejam conectados, a prioridade segue a ordem: Gemini {'>'} OpenAI {'>'} Anthropic.</p>
        </div>
      </div>
    </div>
  );
};
