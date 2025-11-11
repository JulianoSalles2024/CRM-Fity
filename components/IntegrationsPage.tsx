import React, { useState } from 'react';
import { 
    ToyBrick, KeyRound, Webhook as WebhookIcon, FileCode, Server, Copy, BookOpen, Settings, Eye, EyeOff, RefreshCw, 
    Lock, ShieldCheck, Gauge, GitBranch, Download, AlertTriangle, ChevronRight, Check, List, FileJson2, Database, BarChartHorizontal
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import ConfirmDeleteModal from './ConfirmDeleteModal';

// --- Reusable Components ---

const CodeBlock: React.FC<{ code: string; language?: string; onCopy: () => void }> = ({ code, language = 'bash', onCopy }) => (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg relative group my-4">
        <pre className="p-4 overflow-x-auto text-sm scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
            <code className={`language-${language} text-violet-300`}>
                {code.trim()}
            </code>
        </pre>
        <button 
            onClick={onCopy}
            className="absolute top-2 right-2 p-2 bg-zinc-700/50 text-zinc-400 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-zinc-700 hover:text-white"
            aria-label="Copiar código"
        >
            <Copy className="w-4 h-4" />
        </button>
    </div>
);

const InfoCard: React.FC<{ icon: React.ElementType, title: string, description: string }> = ({ icon: Icon, title, description }) => (
    <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700 flex items-start gap-4 h-full">
        <div className="bg-zinc-800 p-2 rounded-md">
            <Icon className="w-5 h-5 text-violet-400 mt-0.5 flex-shrink-0" />
        </div>
        <div>
            <h3 className="font-semibold text-white">{title}</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
        </div>
    </div>
);

const Section: React.FC<{ icon: React.ElementType, title: string, children: React.ReactNode, actions?: React.ReactNode }> = ({ icon: Icon, title, children, actions }) => (
    <div className="bg-zinc-800/50 rounded-lg border border-zinc-700">
        <div className="p-5 border-b border-zinc-700 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-violet-400" />
                <h2 className="text-lg font-semibold text-white">{title}</h2>
            </div>
            {actions}
        </div>
        <div className="p-5">
            {children}
        </div>
    </div>
);

const SubTabs: React.FC<{ tabs: string[], activeTab: string, onTabClick: (tab: string) => void }> = ({ tabs, activeTab, onTabClick }) => (
    <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-1 flex items-center gap-1 self-start">
        {tabs.map(tab => (
            <button
                key={tab}
                onClick={() => onTabClick(tab)}
                className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 ${activeTab === tab ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:bg-zinc-700/50 hover:text-white'}`}
            >
                {tab}
            </button>
        ))}
    </div>
);

// --- API Keys Tab ---

const ApiKeysTab: React.FC<{ showNotification: (msg: string, type: 'success' | 'error') => void }> = ({ showNotification }) => {
    const [apiKey, setApiKey] = useState('sk_live_1a2b3c4d5e6f7g8h9i0j');
    const [isKeyVisible, setIsKeyVisible] = useState(false);
    const [showRegenConfirm, setShowRegenConfirm] = useState(false);
    
    const handleCopy = (text: string, subject: string) => {
        navigator.clipboard.writeText(text);
        showNotification(`${subject} copiado!`, 'success');
    };
    
    const handleRegenerateKey = () => {
        const newKey = `sk_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
        setApiKey(newKey);
        setShowRegenConfirm(false);
        showNotification('Nova Chave de API gerada com sucesso!', 'success');
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InfoCard icon={Lock} title="Bearer Authentication" description="Formato padrão da indústria para autenticação segura e stateless." />
                <InfoCard icon={ShieldCheck} title="SHA-256 Hash" description="Armazenamento seguro no banco de dados para proteger suas chaves." />
                <InfoCard icon={Gauge} title="Rate Limiting" description="100 requisições/minuto para garantir a estabilidade da plataforma." />
            </div>
            <div className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-300">
                <strong className="text-white">Autenticação Bearer:</strong> Use suas chaves no formato <code className="bg-zinc-900 px-1 py-0.5 rounded-md text-violet-300">Authorization: Bearer sk_live_...</code>
            </div>
             <div className="p-3 bg-yellow-900/30 border border-yellow-700/50 rounded-lg text-sm text-yellow-300 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                    <strong className="text-yellow-200">Migrando de X-API-Key?</strong> O header <code className="bg-yellow-900/50 px-1 py-0.5 rounded-md">X-API-KEY</code> foi descontinuado. Use apenas <code className="bg-yellow-900/50 px-1 py-0.5 rounded-md">Authorization: Bearer</code> em todas as suas integrações.
                </div>
            </div>
            <Section icon={KeyRound} title="Gerenciar API Keys" actions={
                <button className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-violet-700 transition-colors">
                    + Nova Chave
                </button>
            }>
                <div className="text-center py-10">
                    <KeyRound className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                    <h3 className="font-semibold text-white">Nenhuma API Key gerada ainda</h3>
                    <p className="text-sm text-zinc-500 mt-1">Crie sua primeira chave para começar a integrar.</p>
                </div>
            </Section>
             <Section icon={BookOpen} title="Como Usar">
                <h4 className="font-semibold text-white">Exemplo com cURL:</h4>
                <CodeBlock code={`curl -X GET "https://.../api-v1/leads" \\\n  -H "Authorization: Bearer SUA_CHAVE"`} onCopy={() => handleCopy("curl...", "Código cURL")} />

                <h4 className="font-semibold text-white mt-4">Exemplo com JavaScript/Node.js:</h4>
                <CodeBlock language="javascript" code={`fetch('https://.../api-v1/leads', {\n  headers: {\n    'Authorization': 'Bearer SUA_CHAVE'\n  }\n})`} onCopy={() => handleCopy("fetch...", "Código JavaScript")} />
                
                <h4 className="font-semibold text-white mt-4">Exemplo com Python:</h4>
                <CodeBlock language="python" code={`import requests\n\nresponse = requests.get(\n    'https://.../api-v1/leads',\n    headers={'Authorization': 'Bearer SUA_CHAVE'}\n)`} onCopy={() => handleCopy("requests...", "Código Python")} />
            </Section>
            
            <AnimatePresence>
                {showRegenConfirm && (
                    <ConfirmDeleteModal
                        onClose={() => setShowRegenConfirm(false)} onConfirm={handleRegenerateKey}
                        title="Regerar Chave de API?" message="A chave atual será invalidada. Atualize suas integrações com a nova chave."
                        confirmText="Sim, Regerar" confirmVariant="danger"
                    />
                )}
            </AnimatePresence>
        </div>
    );
};


// --- Webhooks Tab ---

const WebhooksTab: React.FC<{ showNotification: (msg: string, type: 'success' | 'error') => void }> = ({ showNotification }) => {
    const [activeSubTab, setActiveSubTab] = useState('Entrada');
    const webhookUrl = 'https://lxcjwmvclbfqizwtxpxy.supabase.co/functions/v1/webhook-receiver';

    const handleCopy = (text: string, subject: string) => {
        navigator.clipboard.writeText(text);
        showNotification(`${subject} copiada!`, 'success');
    };

    const curlExample = `curl -X POST https://.../v1/webhook-receiver \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer sk_live_SUA_CHAVE" \\
  -d '{
    "event": "lead.created",
    "data": {
      "title": "Novo lead",
      "value": 5000,
      "stage": 1
    }
  }'`;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InfoCard icon={GitBranch} title="Bidirecional" description="Receba e envie dados automaticamente para manter seus sistemas sincronizados." />
                <InfoCard icon={Lock} title="Bearer Auth" description="Entrada usa Bearer e HMAC na saída para garantir a segurança e autenticidade dos dados." />
                <InfoCard icon={List} title="8 Eventos" description="Notificações para lead.*, contact.*, activity.* para cobrir todo o ciclo de vida do cliente." />
            </div>
             <div className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-300">
                <strong className="text-white">Autenticação Bearer:</strong> Webhooks de entrada usam <code className="bg-zinc-900 px-1 py-0.5 rounded-md text-violet-300">Authorization: Bearer sk_live_...</code>
            </div>
            
            <SubTabs tabs={['Entrada', 'Saída', 'Documentação']} activeTab={activeSubTab} onTabClick={setActiveSubTab} />

            {activeSubTab === 'Entrada' && (
                <Section icon={ChevronRight} title="Webhook Receiver (Entrada)">
                    <p className="text-zinc-400 text-sm mb-6">Receba dados de sistemas externos via HTTP POST.</p>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">URL do Webhook</label>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-300 font-mono truncate">{webhookUrl}</div>
                                <button onClick={() => handleCopy(webhookUrl, 'URL')} className="p-2.5 bg-zinc-700 text-white rounded-md hover:bg-zinc-600"><Copy className="w-4 h-4" /></button>
                            </div>
                            <p className="text-xs text-zinc-500 mt-2">Use esta URL para enviar dados. Inclua sua API Key no header Authorization.</p>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-zinc-300 mb-2">Eventos Suportados:</h4>
                            <ul className="list-disc list-inside text-sm text-zinc-400 space-y-1">
                                <li><code className="text-violet-300">lead.created</code> - Criar novo lead</li>
                                <li><code className="text-violet-300">contact.created</code> - Criar novo cliente</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-zinc-300 mb-2 mt-4">Exemplo de uso:</h4>
                            <CodeBlock code={curlExample} onCopy={() => handleCopy(curlExample, "Exemplo cURL")} />
                        </div>
                    </div>
                </Section>
            )}
             {activeSubTab !== 'Entrada' && <div className="text-center py-10 text-zinc-500">Em breve...</div>}
        </div>
    );
};


// --- API REST Tab ---

const ApiRestTab: React.FC<{}> = () => {
    const [activeSubTab, setActiveSubTab] = useState('Visão Geral');

    const endpointsData = {
        Leads: { count: 7, endpoints: [{m:'GET',p:'/leads'}, {m:'GET',p:'/leads/{id}'}, {m:'POST',p:'/leads'}, {m:'PUT',p:'/leads/{id}'}, {m:'PATCH',p:'/leads/{id}/stage'}, {m:'PATCH',p:'/leads/{id}/convert'}, {m:'DELETE',p:'/leads/{id}'}] },
        Contacts: { count: 5, endpoints: [{m:'GET',p:'/contacts'}, {m:'GET',p:'/contacts/{id}'}, {m:'POST',p:'/contacts'}, {m:'PUT',p:'/contacts/{id}'}, {m:'DELETE',p:'/contacts/{id}'}] },
        Activities: { count: 6, endpoints: [{m:'GET',p:'/activities'}, {m:'GET',p:'/activities/{id}'}, {m:'POST',p:'/activities'}, {m:'PUT',p:'/activities/{id}'}, {m:'PATCH',p:'/activities/{id}/complete'}, {m:'DELETE',p:'/activities/{id}'}] },
        Pipeline: { count: 5, endpoints: [{m:'GET',p:'/pipeline/stages'}, {m:'POST',p:'/pipeline/stages'}, {m:'PUT',p:'/pipeline/stages/{id}'}, {m:'DELETE',p:'/pipeline/stages/{id}'}, {m:'PUT',p:'/pipeline/stages/reorder'}] },
        Metrics: { count: 1, endpoints: [{m:'GET',p:'/metrics/dashboard'}] },
    };
    
    const getMethodClass = (method: string) => ({
        'GET': 'text-blue-400', 'POST': 'text-violet-400', 'PUT': 'text-orange-400', 
        'PATCH': 'text-yellow-400', 'DELETE': 'text-red-400'
    }[method] || 'text-zinc-400');

    return (
        <div className="space-y-6">
            <Section icon={FileCode} title="API REST v1" actions={
                <button className="flex items-center gap-2 bg-zinc-700 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-zinc-600 transition-colors">
                    <Download className="w-4 h-4" /> Download Spec
                </button>
            }>
                <div className="space-y-4">
                    <p className="text-zinc-300">API RESTful completa para integração com seu CRM. Autenticação via JWT ou API Key com rate limiting inteligente.</p>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InfoCard icon={List} title="26 Endpoints" description="CRUD completo para todos os recursos." />
                        <InfoCard icon={Gauge} title="Rate Limiting" description="JWT: 300/min • API Key: 100/min" />
                        <InfoCard icon={WebhookIcon} title="8 Webhooks" description="Notificações em tempo real." />
                    </div>
                     <div className="p-3 bg-yellow-900/30 border border-yellow-700/50 rounded-lg text-sm text-yellow-300 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <strong className="text-yellow-200">Sobre Validação OpenAPI 3.1:</strong> Esta especificação segue OpenAPI 3.1.0. O Swagger Editor 3.x pode mostrar erros estruturais falsos. Para validação completa, use: Swagger Editor 5.x+, Redocly CLI, Stoplight Studio, ou Postman v10+.
                        </div>
                    </div>
                </div>
            </Section>

            <SubTabs tabs={['Visão Geral', 'Autenticação', 'Endpoints', 'Exemplos']} activeTab={activeSubTab} onTabClick={setActiveSubTab} />

            {activeSubTab === 'Visão Geral' && (
                <div className="space-y-6">
                    <Section icon={ChevronRight} title="Quick Start">
                        <div className="prose prose-sm prose-invert text-zinc-300 max-w-none">
                            <h4>1. Base URL</h4>
                            <p>https://lxcjwmvclbfqizwtxpxy.supabase.co/functions/v1/api-v1</p>
                            <h4>2. Obtenha sua API Key</h4>
                            <p>Vá para a aba Integrações e gere uma nova API Key. Ela será usada para autenticar suas requisições.</p>
                            <h4>3. Faça sua primeira requisição</h4>
                            <p>curl -X GET "https://.../leads?page=1&limit=20" \ <br/> -H "Authorization: Bearer YOUR_API_KEY"</p>
                            <h4>4. Resposta esperada</h4>
                            <CodeBlock language="json" code={`{\n  "data": [\n    {\n      "id": "uid",\n      "title": "lead Empresa X",\n      "value": 15000,\n      "stage": "uid",\n      "status": "active"\n    }\n  ],\n  "pagination": {\n    "page": 1,\n    "limit": 20,\n    "total": 150,\n    "totalPages": 8\n  }\n}`} onCopy={() => {}}/>
                        </div>
                    </Section>
                </div>
            )}
            {activeSubTab === 'Autenticação' && (
                <div className="space-y-6">
                    <Section icon={Lock} title="Métodos de Autenticação">
                         <div className="p-3 bg-zinc-900/50 rounded-md border border-zinc-700 text-white font-medium">Recomendado: Bearer Token (JWT ou API Key)</div>
                         <div className="p-3 mt-2 bg-zinc-900/50 rounded-md border border-zinc-700 text-zinc-400">Query Parameter (não recomendado)</div>
                    </Section>
                    <Section icon={Gauge} title="Rate Limiting Headers">
                        <p className="text-zinc-400 text-sm mb-4">Todas as respostas incluem headers informativos sobre o rate limiting:</p>
                        <div className="font-mono text-sm text-zinc-300 space-y-2">
                            <div className="flex justify-between"><span>X-RateLimit-Limit</span><span className="text-zinc-500">Limite total de requisições</span></div>
                            <div className="flex justify-between"><span>X-RateLimit-Remaining</span><span className="text-zinc-500">Requisições restantes</span></div>
                            <div className="flex justify-between"><span>X-RateLimit-Reset</span><span className="text-zinc-500">Timestamp do reset</span></div>
                        </div>
                    </Section>
                </div>
            )}
             {activeSubTab === 'Endpoints' && (
                 <div className="space-y-6">
                    {Object.entries(endpointsData).map(([resource, data]) => (
                        <Section key={resource} icon={ChevronRight} title={resource} actions={<span className="text-xs font-semibold bg-zinc-700 text-zinc-300 px-2 py-1 rounded-md">{data.count} endpoints</span>}>
                            <div className="space-y-2">
                                {data.endpoints.map(ep => (
                                    <div key={ep.p} className="flex items-center gap-4 p-2 bg-zinc-900/50 rounded-md">
                                        <span className={`w-16 text-center font-bold text-sm ${getMethodClass(ep.m)}`}>{ep.m}</span>
                                        <span className="font-mono text-zinc-300 flex-1">{ep.p}</span>
                                    </div>
                                ))}
                            </div>
                        </Section>
                    ))}
                 </div>
             )}
             {activeSubTab === 'Exemplos' && <div className="text-center py-10 text-zinc-500">Em breve...</div>}
        </div>
    );
};


// --- Main Component ---

interface IntegrationsPageProps {
    showNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

const IntegrationsPage: React.FC<IntegrationsPageProps> = ({ showNotification }) => {
    const [activeTab, setActiveTab] = useState('API Keys');

    const mainTabs = [
        { name: 'API Keys', icon: KeyRound },
        { name: 'Webhooks', icon: WebhookIcon },
        { name: 'API REST', icon: FileCode },
        { name: 'MCP Server', icon: Server },
    ];

    return (
        <div className="flex flex-col gap-6 h-full">
            <div className="flex items-center gap-4">
                <ToyBrick className="w-8 h-8 text-violet-500" />
                <div>
                    <h1 className="text-2xl font-bold text-white">Integrações</h1>
                    <p className="text-zinc-400">Conecte seu CRM com outras ferramentas e APIs.</p>
                </div>
            </div>

            <div>
                <div className="border-b border-zinc-700">
                    <nav className="flex -mb-px space-x-6" aria-label="Tabs">
                        {mainTabs.map(tab => (
                            <button
                                key={tab.name}
                                onClick={() => setActiveTab(tab.name)}
                                className={`whitespace-nowrap flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.name ? 'border-violet-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.name}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 -mr-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
                 {activeTab === 'API Keys' && <ApiKeysTab showNotification={showNotification} />}
                 {activeTab === 'Webhooks' && <WebhooksTab showNotification={showNotification} />}
                 {activeTab === 'API REST' && <ApiRestTab />}
                 {activeTab === 'MCP Server' && <div className="text-center py-20 text-zinc-500">MCP Server - Em breve...</div>}
            </div>
        </div>
    );
};

export default IntegrationsPage;
