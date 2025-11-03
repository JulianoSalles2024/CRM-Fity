

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Bot, Send, User, Building, DollarSign, Sparkles, FileText, Loader2, MessageSquare, Inbox, FileClock, CheckCircle2, XCircle, MessageCircle as OpenIcon, ChevronDown } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { AnimatePresence, motion } from 'framer-motion';
import { Lead, ChatConversation, ChatMessage, User as UserType, Id, ChatConversationStatus } from '../types';

interface ChatViewProps {
    conversations: ChatConversation[];
    messages: ChatMessage[];
    leads: Lead[];
    currentUser: UserType;
    onSendMessage: (conversationId: Id, text: string) => void;
    onUpdateConversationStatus: (conversationId: Id, status: ChatConversationStatus) => void;
}

const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return `agora`;
    const diffMinutes = Math.round(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m`;
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h`;
    
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
};

const statusConfig: Record<ChatConversationStatus, { label: string; icon: React.ElementType; color: string; bgColor: string; }> = {
    open: { label: 'Em Aberto', icon: OpenIcon, color: 'text-blue-400', bgColor: 'bg-blue-900/50' },
    waiting: { label: 'Aguardando', icon: FileClock, color: 'text-yellow-400', bgColor: 'bg-yellow-900/50' },
    not_started: { label: 'Não Iniciada', icon: Inbox, color: 'text-zinc-400', bgColor: 'bg-zinc-700/50' },
    automation: { label: 'Automação', icon: Bot, color: 'text-purple-400', bgColor: 'bg-purple-900/50' },
    finished: { label: 'Finalizada', icon: CheckCircle2, color: 'text-green-400', bgColor: 'bg-green-900/50' },
    failed: { label: 'Falha', icon: XCircle, color: 'text-red-400', bgColor: 'bg-red-900/50' },
};


const ChatView: React.FC<ChatViewProps> = ({ conversations, messages, leads, currentUser, onSendMessage, onUpdateConversationStatus }) => {
    const [activeConversationId, setActiveConversationId] = useState<Id | null>(conversations[0]?.id || null);
    const [newMessage, setNewMessage] = useState('');
    const [isLoadingAi, setIsLoadingAi] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState('');
    const [activeStatusFilter, setActiveStatusFilter] = useState<ChatConversationStatus | 'all'>('all');
    const [isStatusMenuOpen, setStatusMenuOpen] = useState(false);
    
    const statusMenuRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
                setStatusMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const leadsMap = useMemo(() => new Map(leads.map(lead => [lead.id, lead])), [leads]);

    const activeConversation = useMemo(() => 
        conversations.find(c => c.id === activeConversationId), 
        [conversations, activeConversationId]
    );

    const activeLead = useMemo(() => 
        activeConversation ? leadsMap.get(activeConversation.leadId) : null,
        [activeConversation, leadsMap]
    );
    
    const statusFilters: {
        id: ChatConversationStatus;
        label: string;
        icon: React.ElementType;
    }[] = Object.entries(statusConfig).map(([id, {label, icon}]) => ({ id: id as ChatConversationStatus, label, icon }));


    const statusCounts = useMemo(() => {
        const counts: Record<ChatConversationStatus | 'all', number> = {
            all: conversations.length,
            open: 0,
            waiting: 0,
            not_started: 0,
            automation: 0,
            finished: 0,
            failed: 0,
        };
        conversations.forEach(conv => {
            counts[conv.status]++;
        });
        return counts;
    }, [conversations]);

    const filteredConversations = useMemo(() => {
        if (activeStatusFilter === 'all') return conversations;
        return conversations.filter(c => c.status === activeStatusFilter);
    }, [conversations, activeStatusFilter]);

    const messagesForActiveConversation = useMemo(() => 
        messages
            .filter(m => m.conversationId === activeConversationId)
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
        [messages, activeConversationId]
    );

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messagesForActiveConversation]);
    
     useEffect(() => {
        setAiSuggestion('');
    }, [activeConversationId]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() && activeConversationId) {
            onSendMessage(activeConversationId, newMessage);
            setNewMessage('');
        }
    };
    
    const generateAiPrompt = (task: 'reply' | 'summary') => {
        if (!activeLead || messagesForActiveConversation.length === 0) return '';
        
        const conversationHistory = messagesForActiveConversation.map(msg => {
            const senderName = msg.senderId === currentUser.id ? 'Eu (Vendedor)' : activeLead.name;
            return `${senderName}: ${msg.text}`;
        }).join('\n');

        if (task === 'reply') {
            return `Contexto do Lead:\nNome: ${activeLead.name}\nEmpresa: ${activeLead.company}\nDescrição: ${activeLead.description}\n\nHistórico da Conversa:\n${conversationHistory}\n\nTarefa: Com base no histórico e no contexto do lead, sugira a próxima resposta ideal para o vendedor (Eu) continuar a conversa de forma eficaz. A resposta deve ser profissional e direcionada para avançar no processo de venda.`;
        } else { // summary
             return `Histórico da Conversa:\n${conversationHistory}\n\nTarefa: Resuma os pontos-chave desta conversa em 3 a 5 tópicos (bullet points).`;
        }
    };

    const handleAiAction = async (task: 'reply' | 'summary') => {
        const prompt = generateAiPrompt(task);
        if (!prompt) {
            alert("Não há mensagens suficientes para usar a IA.");
            return;
        }
        
        setIsLoadingAi(true);
        setAiSuggestion('');

        try {
            if (!process.env.API_KEY) throw new Error("API Key for Gemini is not configured.");
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });
            setAiSuggestion(response.text);
        } catch(e) {
            console.error(e);
            setAiSuggestion("Ocorreu um erro ao contatar a IA. Verifique sua chave de API.");
        } finally {
            setIsLoadingAi(false);
        }
    }
    
    const StatusIcon = ({ status }: { status: ChatConversationStatus }) => {
        const config = statusConfig[status] || statusConfig.open;
        const Icon = config.icon;
        return <Icon className={`w-4 h-4 flex-shrink-0 ${config.color}`} title={config.label} />;
    };

    return (
        <div className="flex h-full bg-zinc-900 -m-6 border border-zinc-800 rounded-lg">
            {/* Conversations List */}
            <div className="w-1/4 border-r border-zinc-800 flex flex-col">
                <div className="p-4 border-b border-zinc-800">
                    <h2 className="text-lg font-bold text-white">Conversas</h2>
                </div>
                <div className="p-2 border-b border-zinc-800">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 -mb-2 no-scrollbar" style={{ scrollbarWidth: 'none' }}>
                        <button
                            onClick={() => setActiveStatusFilter('all')}
                            className={`flex-shrink-0 px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-2 ${activeStatusFilter === 'all' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:bg-zinc-700/50'}`}
                        >
                            Todas <span className="text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded-full text-xs">{statusCounts.all}</span>
                        </button>
                        {statusFilters.map(filter => (
                            <button
                                key={filter.id}
                                onClick={() => setActiveStatusFilter(filter.id)}
                                className={`flex-shrink-0 px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-2 ${activeStatusFilter === filter.id ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:bg-zinc-700/50'}`}
                            >
                                <filter.icon className="w-3.5 h-3.5" />
                                {filter.label} <span className="text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded-full text-xs">{statusCounts[filter.id]}</span>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {filteredConversations.map(conv => {
                        const lead = leadsMap.get(conv.leadId);
                        if (!lead) return null;
                        const isActive = conv.id === activeConversationId;
                        return (
                            <button key={conv.id} onClick={() => setActiveConversationId(conv.id)} className={`w-full text-left p-4 flex gap-3 transition-colors border-l-4 ${isActive ? 'bg-violet-900 border-violet-700' : 'border-transparent hover:bg-zinc-800/50'}`}>
                                <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center font-bold text-sm text-white flex-shrink-0">
                                    {lead.name.charAt(0)}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <StatusIcon status={conv.status} />
                                            <p className="font-semibold text-white truncate">{lead.name}</p>
                                        </div>
                                        <p className="text-xs text-zinc-500 flex-shrink-0">{formatTimestamp(conv.lastMessageTimestamp)}</p>
                                    </div>
                                    <p className="text-sm text-zinc-400 truncate">{conv.lastMessage}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Chat Panel */}
            <div className="flex-1 flex flex-col">
                {!activeConversation || !activeLead ? (
                    <div className="flex-1 flex items-center justify-center text-center">
                        <div>
                            <MessageSquare className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-white">Selecione uma conversa</h3>
                            <p className="text-zinc-500">Escolha uma conversa da lista para ver as mensagens.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="p-4 border-b border-zinc-800 flex items-center justify-between gap-3">
                             <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center font-bold text-sm text-white flex-shrink-0">
                                    {activeLead.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">{activeLead.name}</h3>
                                    <p className="text-xs text-green-400">Online</p>
                                </div>
                            </div>
                            <div className="relative" ref={statusMenuRef}>
                                <button
                                    onClick={() => setStatusMenuOpen(p => !p)}
                                    className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${statusConfig[activeConversation.status].bgColor} ${statusConfig[activeConversation.status].color} hover:opacity-90`}
                                >
                                    <StatusIcon status={activeConversation.status}/>
                                    <span>{statusConfig[activeConversation.status].label}</span>
                                    <ChevronDown className="w-4 h-4 opacity-70" />
                                </button>
                                <AnimatePresence>
                                    {isStatusMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute top-full right-0 mt-2 w-48 bg-zinc-800 rounded-lg border border-zinc-700 shadow-lg z-20 py-1"
                                        >
                                            {statusFilters.map(({ id, label, icon: Icon }) => (
                                                <button
                                                    key={id}
                                                    onClick={() => {
                                                        onUpdateConversationStatus(activeConversation.id, id);
                                                        setStatusMenuOpen(false);
                                                    }}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-700/50"
                                                >
                                                    <Icon className={`w-4 h-4 ${statusConfig[id].color}`} />
                                                    <span>{label}</span>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messagesForActiveConversation.map(msg => (
                                <div key={msg.id} className={`flex items-end gap-2 ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-md p-3 rounded-2xl ${msg.senderId === currentUser.id ? 'bg-violet-600 text-white rounded-br-none' : 'bg-zinc-700 text-zinc-200 rounded-bl-none'}`}>
                                        <p className="text-sm">{msg.text}</p>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="p-4 border-t border-zinc-800">
                            <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Digite sua mensagem..."
                                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                                />
                                <button type="submit" className="w-10 h-10 bg-violet-600 rounded-lg flex items-center justify-center text-white hover:bg-violet-700 transition-colors disabled:opacity-50" disabled={!newMessage.trim()}>
                                    <Send className="w-5 h-5" />
                                </button>
                            </form>
                        </div>
                    </>
                )}
            </div>

            {/* AI Assistant Panel */}
            <div className="w-1/4 border-l border-zinc-800 flex flex-col">
                <div className="p-4 border-b border-zinc-800">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Bot className="w-5 h-5 text-violet-400" />
                        Assistente de IA
                    </h2>
                </div>
                 <div className="p-4 space-y-4 border-b border-zinc-800">
                    <h3 className="font-semibold text-zinc-300">Contexto do Lead</h3>
                    {activeLead ? (
                         <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-2"><User className="w-4 h-4 text-zinc-500"/> <span className="text-white">{activeLead.name}</span></div>
                            <div className="flex items-center gap-2"><Building className="w-4 h-4 text-zinc-500"/> <span className="text-zinc-400">{activeLead.company}</span></div>
                            <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-zinc-500"/> <span className="text-green-400 font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(activeLead.value)}</span></div>
                        </div>
                    ) : (
                        <p className="text-sm text-zinc-500">Nenhum lead selecionado.</p>
                    )}
                </div>
                <div className="p-4 space-y-3">
                    <h3 className="font-semibold text-zinc-300">Ações da IA</h3>
                    <button onClick={() => handleAiAction('reply')} disabled={isLoadingAi || !activeLead} className="w-full flex items-center gap-2 text-sm bg-zinc-700 hover:bg-zinc-600 text-white font-semibold px-3 py-2 rounded-md transition-colors disabled:opacity-50">
                        <Sparkles className="w-4 h-4" /> <span>Gerar Resposta</span>
                    </button>
                    <button onClick={() => handleAiAction('summary')} disabled={isLoadingAi || !activeLead} className="w-full flex items-center gap-2 text-sm bg-zinc-700 hover:bg-zinc-600 text-white font-semibold px-3 py-2 rounded-md transition-colors disabled:opacity-50">
                        <FileText className="w-4 h-4" /> <span>Resumir Conversa</span>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    {isLoadingAi && (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
                        </div>
                    )}
                    {aiSuggestion && !isLoadingAi && (
                        <div className="text-sm text-zinc-300 bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50 whitespace-pre-wrap">
                            {aiSuggestion}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatView;