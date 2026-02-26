import React, { useMemo } from 'react';
import { AICredential, AIProviderId } from './aiProviders.types';
import { MODELS_REGISTRY } from './models.registry';
import { CheckCircle2, XCircle, AlertCircle, Loader2, Save, Zap, Unplug } from 'lucide-react';

interface AIProviderCardProps {
  credential: AICredential;
  onUpdate: (updates: Partial<AICredential>) => void;
  onSave: () => Promise<void>;
  onTest: () => Promise<any>;
  onDisconnect: () => Promise<void>;
}

export const AIProviderCard: React.FC<AIProviderCardProps> = ({
  credential,
  onUpdate,
  onSave,
  onTest,
  onDisconnect,
}) => {
  const providerModels = useMemo(() => 
    MODELS_REGISTRY.filter(m => m.provider === credential.provider),
    [credential.provider]
  );

  const selectedModel = useMemo(() => 
    MODELS_REGISTRY.find(m => m.id === credential.model),
    [credential.model]
  );

  const statusConfig = {
    connected: { color: 'text-emerald-500', icon: CheckCircle2, label: 'Conectado' },
    invalid: { color: 'text-red-500', icon: XCircle, label: 'Inválido' },
    not_configured: { color: 'text-slate-500', icon: AlertCircle, label: 'Não configurado' },
    testing: { color: 'text-sky-500', icon: Loader2, label: 'Testando...' },
  };

  const config = statusConfig[credential.status];
  const StatusIcon = config.icon;

  const providerNames = {
    openai: 'OpenAI',
    gemini: 'Google Gemini',
    anthropic: 'Anthropic'
  };

  return (
    <div 
      className="p-6 rounded-2xl border border-white/10 transition-all"
      style={{
        background: 'rgba(255, 255, 255, 0.04)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/5">
            <Zap className={`w-5 h-5 ${credential.status === 'connected' ? 'text-sky-500' : 'text-slate-400'}`} />
          </div>
          <h3 className="text-lg font-bold text-white">{providerNames[credential.provider]}</h3>
        </div>
        <div className={`flex items-center gap-2 text-sm font-medium ${config.color}`}>
          <StatusIcon className={`w-4 h-4 ${credential.status === 'testing' ? 'animate-spin' : ''}`} />
          {config.label}
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Modelo</label>
            <select 
              value={credential.model}
              onChange={(e) => onUpdate({ model: e.target.value })}
              className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all appearance-none"
            >
              {providerModels.map(model => (
                <option key={model.id} value={model.id} className="bg-slate-900">
                  {model.name} {model.recommended ? ' (Recomendado)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Preço (Input / Output)</label>
            <div className="w-full bg-black/10 border border-white/5 rounded-xl px-4 py-3 text-slate-400 text-sm">
              ${selectedModel?.inputPrice.toFixed(2)} / ${selectedModel?.outputPrice.toFixed(2)} <span className="text-[10px] ml-1">(por 1M tokens)</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">API Key</label>
          <input 
            type="password"
            value={credential.apiKey}
            onChange={(e) => onUpdate({ apiKey: e.target.value })}
            placeholder={`Insira sua chave ${providerNames[credential.provider]}...`}
            className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onTest}
            disabled={credential.status === 'testing' || !credential.apiKey}
            className="flex-1 bg-white/5 hover:bg-white/10 text-white px-4 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
          >
            Testar Conexão
          </button>
          {credential.status === 'connected' && (
            <button
              onClick={onDisconnect}
              className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 px-4 py-3 rounded-xl text-sm font-semibold transition-all border border-red-500/20"
            >
              <Unplug className="w-4 h-4" />
              Desconectar
            </button>
          )}
          <button
            onClick={onSave}
            disabled={credential.status === 'testing'}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};
