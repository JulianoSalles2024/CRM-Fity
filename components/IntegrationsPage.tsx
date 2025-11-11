import React, { useState } from 'react';
import { ToyBrick, Copy, Inbox, BookOpen, Settings, Eye, EyeOff, RefreshCw } from 'lucide-react';
import WebhookDocumentation from './WebhookDocumentation';

interface IntegrationsPageProps {
    showNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

const IntegrationsPage: React.FC<IntegrationsPageProps> = ({ showNotification }) => {
    const [activeTab, setActiveTab] = useState('Configuração');
    const webhookUrl = 'https://api.crmfity.ai/webhooks/SUA_CHAVE_UNICA';
    const [apiKey, setApiKey] = useState('crm_sk_1a2b3c4d5e6f7g8h9i0j');
    const [isKeyVisible, setIsKeyVisible] = useState(false);
    const [showRegenConfirm, setShowRegenConfirm] = useState(false);

    const handleCopy = (text: string, subject: string) => {
        navigator.clipboard.writeText(text);
        showNotification(`${subject} copiada!`, 'success');
    };

    const handleRegenerateKey = () => {
        // In a real app, this would be an API call.
        const newKey = `crm_sk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
        setApiKey(newKey);
        setShowRegenConfirm(false);
        showNotification('Nova Chave de API gerada com sucesso!', 'success');
    };

    return (
        <>
            <div className="flex flex-col gap-6 h-full">
                <div className="flex items-center gap-4">
                    <ToyBrick className="w-8 h-8 text-violet-500" />
                    <div>
                        <h1 className="text-2xl font-bold text-white">Webhooks & Integrações</h1>
                        <p className="text-zinc-400">Automatize a entrada de leads conectando com suas ferramentas favoritas.</p>
                    </div>
                </div>

                <div>
                    <div className="border-b border-zinc-700">
                        <nav className="flex -mb-px space-x-6" aria-label="Tabs">
                            {['Configuração', 'Documentação'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`whitespace-nowrap flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-violet-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    {tab === 'Configuração' ? <Settings className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                                    {tab}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {activeTab === 'Configuração' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
                        {/* Left Column: Setup */}
                        <div className="bg-zinc-800/50 p-6 rounded-lg border border-zinc-700 flex flex-col gap-6">
                            <div>
                                <h2 className="text-lg font-semibold text-white">Endpoint de Entrada</h2>
                                <p className="text-sm text-zinc-400 mt-2">
                                    Use esta URL e Chave de API para enviar dados de outras plataformas e criar leads automaticamente no CRM.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">Sua URL de Webhook</label>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-300 font-mono truncate">
                                            {webhookUrl}
                                        </div>
                                        <button 
                                            onClick={() => handleCopy(webhookUrl, 'URL do Webhook')}
                                            className="flex items-center gap-2 bg-zinc-700 text-white px-3 py-2 rounded-md text-sm font-semibold hover:bg-zinc-600 transition-colors"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">Chave de API (Secret)</label>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 relative bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-300 font-mono">
                                            <input 
                                                type={isKeyVisible ? 'text' : 'password'} 
                                                value={apiKey} 
                                                readOnly 
                                                className="bg-transparent w-full focus:outline-none"
                                            />
                                        </div>
                                        <button onClick={() => setIsKeyVisible(!isKeyVisible)} className="p-2.5 bg-zinc-700 text-white rounded-md hover:bg-zinc-600">
                                            {isKeyVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                        <button onClick={() => handleCopy(apiKey, 'Chave de API')} className="p-2.5 bg-zinc-700 text-white rounded-md hover:bg-zinc-600">
                                            <Copy className="w-4 h-4" />
                                        </button>
                                         <button onClick={() => setShowRegenConfirm(true)} className="p-2.5 bg-zinc-700 text-white rounded-md hover:bg-zinc-600">
                                            <RefreshCw className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-2">Esta chave é secreta. Use-a no cabeçalho `x-api-key` de suas requisições.</p>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Received Events */}
                        <div className="bg-zinc-800/50 rounded-lg border border-zinc-700 flex flex-col">
                            <div className="p-6 border-b border-zinc-700">
                                <h2 className="text-lg font-semibold text-white">Eventos Recebidos</h2>
                                <p className="text-sm text-zinc-400 mt-1">Aqui você verá os últimos eventos para fins de teste e depuração.</p>
                            </div>
                            <div className="flex-1 p-6 flex items-center justify-center">
                                <div className="text-center">
                                    <Inbox className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                                    <h3 className="font-semibold text-white">Aguardando eventos...</h3>
                                    <p className="text-sm text-zinc-500 mt-1">Envie um evento de teste para esta URL para vê-lo aqui.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <WebhookDocumentation />
                )}
            </div>

            <ConfirmDeleteModal
                onClose={() => setShowRegenConfirm(false)}
                onConfirm={handleRegenerateKey}
                title="Regerar Chave de API?"
                message="Gerar uma nova chave invalidará a atual. Você precisará atualizar suas integrações existentes com a nova chave. Deseja continuar?"
                confirmText="Sim, Regerar"
                confirmVariant="danger"
                isOpen={showRegenConfirm}
            />
        </>
    );
};

// Sub-componente para o modal de confirmação, adaptado para ser controlado por prop
const ConfirmDeleteModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  confirmVariant?: 'primary' | 'danger';
}> = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirmar', confirmVariant = 'danger' }) => {
  if (!isOpen) return null;

  const confirmButtonClasses = {
    primary: 'bg-violet-600 hover:bg-violet-700',
    danger: 'bg-red-600 hover:bg-red-700',
  };
  
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-zinc-800 rounded-lg shadow-xl w-full max-w-md border border-zinc-700 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
          <div className="text-sm text-zinc-300">{message}</div>
        </div>
        <div className="p-4 bg-zinc-900/30 border-t border-zinc-700 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-zinc-300 bg-zinc-700 rounded-md hover:bg-zinc-600 transition-colors">Cancelar</button>
          <button type="button" onClick={onConfirm} className={`px-4 py-2 text-sm font-semibold text-white rounded-md transition-colors ${confirmButtonClasses[confirmVariant]}`}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};


export default IntegrationsPage;