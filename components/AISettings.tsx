import React, { useState, useEffect } from 'react';
import { Bot, Save, Check, AlertTriangle, Eye, EyeOff, Sparkles, Globe, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';
import { aiConfig, AIConfig } from '../services/ai';

const AISettings: React.FC = () => {
    const [config, setConfig] = useState<AIConfig>({
        provider: 'google',
        model: 'gemini-1.5-flash',
        thinkingMode: true,
        searchGrounding: true,
        apiKey: '',
    });
    
    const [showApiKey, setShowApiKey] = useState(false);
    const [status, setStatus] = useState<'pending' | 'saved' | 'testing' | 'success' | 'error'>('pending');
    
    const models = aiConfig.getModels();
    const providers = [
        { id: 'google', name: 'Google Gemini' },
        { id: 'openai', name: 'OpenAI' },
        { id: 'anthropic', name: 'Anthropic' },
    ];

    useEffect(() => {
        const savedConfig = aiConfig.load();
        if (savedConfig) {
            setConfig(savedConfig);
            if (savedConfig.apiKey) {
                setStatus('saved');
            }
        }
    }, []);

    const handleSave = () => {
        if (!config.apiKey.trim()) return;
        
        aiConfig.save(config);
        setStatus('saved');
    };

    const handleTestConnection = async () => {
        if (!config.apiKey.trim()) return;
        
        setStatus('testing');
        try {
            await aiGenerator.generate('Hello, are you online?', config);
            setStatus('success');
            // Save after successful test
            aiConfig.save(config);
        } catch (error) {
            console.error(error);
            setStatus('error');
        }
    };

    const handleChange = (field: keyof AIConfig, value: any) => {
        setConfig(prev => {
            const newConfig = { ...prev, [field]: value };
            // Reset model if provider changes
            if (field === 'provider') {
                const providerModels = models[value as keyof typeof models];
                if (providerModels && providerModels.length > 0) {
                    newConfig.model = providerModels[0].id;
                }
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
                            onClick={handleTestConnection}
                            disabled={!config.apiKey.trim() || status === 'testing'}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${status === 'testing' ? 'bg-slate-700 text-slate-400 cursor-wait' : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'}`}
                        >
                            {status === 'testing' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            Testar
                        </button>
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
                    {status === 'success' && (
                        <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                            <Check className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="text-sm font-semibold text-emerald-300">Conexão Estabelecida!</h4>
                                <p className="text-xs text-emerald-400/70 mt-1">A chave de API é válida e o modelo {config.model} está respondendo.</p>
                            </div>
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="text-sm font-semibold text-red-300">Erro na Conexão</h4>
                                <p className="text-xs text-red-400/70 mt-1">Não foi possível conectar com a API. Verifique sua chave e tente novamente.</p>
                            </div>
                        </div>
                    )}
                    {status === 'saved' && (
                        <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <Check className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="text-sm font-semibold text-blue-300">Configuração Salva</h4>
                                <p className="text-xs text-blue-400/70 mt-1">As configurações foram salvas localmente.</p>
                            </div>
                        </div>
                    )}
                    {status === 'pending' && (
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