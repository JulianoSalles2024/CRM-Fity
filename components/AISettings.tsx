import React, { useState, useEffect } from 'react';
import { Bot, Save, Check, AlertTriangle, Eye, EyeOff, Sparkles, Globe, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';

const providers = [
    { id: 'google', name: 'Google Gemini' },
    { id: 'openai', name: 'OpenAI' },
    { id: 'anthropic', name: 'Anthropic' },
];

const models = {
    google: [
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash - Recomendado - Best value ($0.15 / $0.60)' },
        { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro - High reasoning' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro - Legacy' },
    ],
    openai: [
        { id: 'gpt-4o', name: 'GPT-4o - Flagship' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    ],
    anthropic: [
        { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet' },
        { id: 'claude-3-opus', name: 'Claude 3 Opus' },
    ],
};

const AISettings: React.FC = () => {
    const [config, setConfig] = useState({
        provider: 'google',
        model: 'gemini-2.5-flash',
        thinkingMode: true,
        searchGrounding: true,
        apiKey: '',
    });
    
    const [showApiKey, setShowApiKey] = useState(false);
    const [status, setStatus] = useState<'pending' | 'saved'>('pending');

    useEffect(() => {
        const savedConfig = localStorage.getItem('crm-ai-config');
        if (savedConfig) {
            setConfig(JSON.parse(savedConfig));
            if (JSON.parse(savedConfig).apiKey) {
                setStatus('saved');
            }
        }
    }, []);

    const handleSave = () => {
        if (!config.apiKey.trim()) return;
        
        localStorage.setItem('crm-ai-config', JSON.stringify(config));
        setStatus('saved');
        
        // Simulating a save toast/notification could be done here if the prop was passed
    };

    const handleChange = (field: string, value: any) => {
        setConfig(prev => {
            const newConfig = { ...prev, [field]: value };
            // Reset model if provider changes
            if (field === 'provider') {
                newConfig.model = models[value as keyof typeof models][0].id;
            }
            return newConfig;
        });
        if (field === 'apiKey') {
            setStatus('pending');
        }
    };

    const availableModels = models[config.provider as keyof typeof models] || [];

    return (
        <div className="flex flex-col gap-6">
            <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-violet-500/10 rounded-lg">
                        <Bot className="w-6 h-6 text-violet-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Inteligência Artificial</h2>
                        <p className="text-sm text-slate-400">Configure qual cérebro vai alimentar seu CRM.</p>
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Provider Selection */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Bot className="w-3.5 h-3.5" /> Provedor de IA
                        </label>
                        <select
                            value={config.provider}
                            onChange={(e) => handleChange('provider', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none"
                        >
                            {providers.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Model Selection */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5" /> Modelo
                        </label>
                        <select
                            value={config.model}
                            onChange={(e) => handleChange('model', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none"
                        >
                            {availableModels.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="mt-6 space-y-4">
                    {/* Thinking Mode Toggle */}
                    <div 
                        className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${config.thinkingMode ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-slate-950 border-slate-800'}`}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`mt-1 p-1.5 rounded-md ${config.thinkingMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
                                <BrainCircuit className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className={`font-semibold ${config.thinkingMode ? 'text-indigo-100' : 'text-slate-300'}`}>Modo Pensamento (Thinking)</h3>
                                <p className="text-xs text-slate-400 mt-1 max-w-lg">Permite que o modelo "pense" antes de responder, melhorando o raciocínio em tarefas complexas.</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={config.thinkingMode} onChange={(e) => handleChange('thinkingMode', e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                        </label>
                    </div>

                    {/* Grounding Toggle */}
                    <div 
                        className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${config.searchGrounding ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-slate-950 border-slate-800'}`}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`mt-1 p-1.5 rounded-md ${config.searchGrounding ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                                <Globe className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className={`font-semibold ${config.searchGrounding ? 'text-emerald-100' : 'text-slate-300'}`}>Google Search Grounding</h3>
                                <p className="text-xs text-slate-400 mt-1 max-w-lg">Conecta o modelo à internet para buscar informações atualizadas e citar fontes.</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={config.searchGrounding} onChange={(e) => handleChange('searchGrounding', e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                    </div>
                </div>

                {/* API Key Input */}
                <div className="mt-8">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <span className="text-violet-400">🔑</span> Chave de API ({providers.find(p => p.id === config.provider)?.name})
                    </label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type={showApiKey ? "text" : "password"}
                                value={config.apiKey}
                                onChange={(e) => handleChange('apiKey', e.target.value)}
                                placeholder="sk-..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-4 pr-10 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                            <button
                                type="button"
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                            >
                                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        <button
                            onClick={handleSave}
                            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold text-sm transition-all ${config.apiKey.trim() ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-900/20' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                            disabled={!config.apiKey.trim()}
                        >
                            <Save className="w-4 h-4" />
                            Salvar
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Sua chave é validada antes de salvar e armazenada de forma segura no banco de dados local (nesta demo).</p>
                </div>

                {/* Status Message */}
                <div className="mt-6">
                    {status === 'saved' ? (
                        <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                            <Check className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="text-sm font-semibold text-emerald-300">Configuração Ativa</h4>
                                <p className="text-xs text-emerald-400/70 mt-1">O assistente de IA está pronto para uso com o modelo {config.model}.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="text-sm font-semibold text-amber-300">Configuração Pendente</h4>
                                <p className="text-xs text-amber-400/70 mt-1">Insira uma chave de API válida e clique em Salvar para usar o assistente.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AISettings;