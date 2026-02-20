import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Bot, User, Loader2 } from 'lucide-react';
import { aiConfig, aiGenerator } from '../services/ai';
import type { Lead, Task, ColumnData, Activity } from '../types';

interface SdrAssistantChatProps {
    onClose: () => void;
    leads: Lead[];
    tasks: Task[];
    columns: ColumnData[];
    activities: Activity[];
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    text: string;
}

const SdrAssistantChat: React.FC<SdrAssistantChatProps> = ({ onClose, leads, tasks, columns, activities }) => {
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'assistant', text: 'Olá! Sou seu assistente de vendas SDR. Como posso ajudar com seus leads hoje?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const getSystemContext = () => {
        // Create a summary context of the CRM data
        const leadsSummary = leads.slice(0, 50).map(l => ({
            name: l.name,
            company: l.company,
            value: l.value,
            status: columns.find(c => c.id === l.columnId)?.title || 'Desconhecido',
            lastActivity: l.lastActivity
        }));

        const tasksPending = tasks.filter(t => t.status === 'pending').length;
        const totalValue = leads.reduce((acc, curr) => acc + curr.value, 0);

        return `Você é um Assistente SDR (Sales Development Representative) inteligente integrado a um CRM.
        
        CONTEXTO ATUAL DO CRM:
        - Total de Leads: ${leads.length}
        - Valor Total em Pipeline: R$ ${totalValue.toFixed(2)}
        - Tarefas Pendentes: ${tasksPending}
        - Estágios do Pipeline: ${columns.map(c => c.title).join(', ')}
        
        AMOSTRA DE LEADS (Use isso para responder perguntas específicas):
        ${JSON.stringify(leadsSummary)}

        INSTRUÇÕES:
        1. Responda perguntas sobre os leads, valores e status.
        2. Seja conciso, profissional e prestativo.
        3. Se não souber algo que não está nos dados, diga que não tem essa informação.
        4. Sempre responda em Português do Brasil.
        `;
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { id: Date.now().toString(), role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const config = aiConfig.load();

            if (!config.apiKey) {
                setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', text: 'Erro: Chave de API não encontrada. Por favor, reconfigure a IA nas configurações.' }]);
                return;
            }

            // Prepare history for prompt (simplified)
            const prompt = `${getSystemContext()}\n\nHistórico da conversa:\n${messages.map(m => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.text}`).join('\n')}\nUsuário: ${userMessage.text}\nAssistente:`;

            const responseText = await aiGenerator.generate(prompt, config);
            
            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', text: responseText }]);

        } catch (error: any) {
            console.error(error);
            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', text: `Desculpe, tive um problema ao processar sua solicitação. Erro: ${error.message || 'Desconhecido'}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-slate-950 w-full max-w-lg rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[600px] max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/20 animate-pulse">
                            <Bot className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white leading-tight">SDR Assistant</h3>
                            <p className="text-xs text-green-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Online
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 p-4 overflow-y-auto bg-slate-950 space-y-4">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex items-start gap-2 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${msg.role === 'user' ? 'bg-slate-700' : 'bg-violet-900/30 border border-violet-700/50'}`}>
                                    {msg.role === 'user' ? <User className="w-4 h-4 text-slate-300" /> : <Bot className="w-4 h-4 text-violet-400" />}
                                </div>
                                <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                                    msg.role === 'user' 
                                        ? 'bg-slate-800 text-white rounded-tr-none' 
                                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="flex items-center gap-2 max-w-[80%]">
                                <div className="w-8 h-8 rounded-full bg-violet-900/30 border border-violet-700/50 flex items-center justify-center flex-shrink-0 mt-1">
                                    <Bot className="w-4 h-4 text-violet-400" />
                                </div>
                                <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none">
                                    <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-slate-900/50 border-t border-slate-800">
                    <form onSubmit={handleSend} className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Pergunte sobre seus leads ou tarefas..."
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-600/50 focus:border-violet-600/50 transition-all"
                            disabled={isLoading}
                        />
                        <button 
                            type="submit" 
                            disabled={!input.trim() || isLoading}
                            className="bg-violet-600 hover:bg-violet-500 text-white p-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-violet-900/20"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default SdrAssistantChat;