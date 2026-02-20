
import React, { useMemo, useState } from 'react';
import { Task, Notification, Lead, Id } from '@/shared/types';
import { CheckCircle2, Bell, Clock, Calendar, ArrowRight, UserPlus, AlertCircle, List, ScanLine, Circle, Play, Check, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InboxViewProps {
    tasks: Task[];
    notifications: Notification[];
    leads: Lead[];
    onNavigate: (view: string, itemId?: Id) => void;
    onMarkNotificationRead: (id: Id) => void;
    mode?: 'standard' | 'analysis';
}

const InboxView: React.FC<InboxViewProps> = ({ tasks, notifications, leads, onNavigate, onMarkNotificationRead, mode = 'standard' }) => {
    
    // --- Standard Inbox Logic ---
    const today = new Date();
    today.setHours(0,0,0,0);

    const { todayTasks, overdueTasks } = useMemo(() => {
        const pending = tasks.filter(t => t.status === 'pending');
        const overdue: Task[] = [];
        const todayList: Task[] = [];

        pending.forEach(task => {
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0,0,0,0);
            
            if (dueDate < today) {
                overdue.push(task);
            } else if (dueDate.getTime() === today.getTime()) {
                todayList.push(task);
            }
        });

        return { todayTasks: todayList, overdueTasks: overdue };
    }, [tasks]);

    const unreadNotifications = notifications.filter(n => !n.isRead);
    const recentLeads = useMemo(() => leads.slice(0, 5), [leads]);

    const handleNotificationClick = (notification: Notification) => {
        onMarkNotificationRead(notification.id);
        if (notification.link) {
            // Logic to handle navigation could go here
        }
    };

    // --- Analysis Mode Logic ---
    const [viewMode, setViewMode] = useState<'list' | 'focus'>('focus');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    // Mock logic for "Churn Risk" items: Leads active but haven't been updated in 30 days
    const analysisItems = useMemo(() => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Filter: Active status AND (lastActivity > 30 days ago OR created > 30 days ago if no activity)
        // For demonstration purposes, if list is empty, we might include some defaults or show empty state.
        const riskyLeads = leads.filter(l => {
            const lastDate = l.lastActivityTimestamp ? new Date(l.lastActivityTimestamp) : new Date(l.createdAt || Date.now());
            return l.status === 'Ativo' && lastDate < thirtyDaysAgo;
        });
        
        // If empty for demo, let's just take the first 3 leads to show the UI
        return riskyLeads.length > 0 ? riskyLeads : leads.slice(0, 3);
    }, [leads]);

    const currentItem = analysisItems[currentIndex];

    const handleNext = () => {
        if (currentIndex < analysisItems.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setIsFinished(true);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    // --- Render: Analysis Mode ---
    if (mode === 'analysis') {
        return (
            <div className="flex flex-col gap-6 h-full max-w-5xl mx-auto w-full relative">
                
                {/* Header - Hidden in Focus Mode for cleaner look, but Toggle remains */}
                <div className={`flex items-center justify-between ${viewMode === 'focus' && !isFinished ? 'absolute top-0 right-0 z-10 w-full pointer-events-none' : ''}`}>
                    {viewMode === 'list' || isFinished ? (
                        <div>
                            <h1 className="text-3xl font-bold text-white">Inbox</h1>
                            <p className="text-slate-400 mt-1">Sua mesa de trabalho.</p>
                        </div>
                    ) : (
                        <div /> /* Spacer */
                    )}
                    
                    {!isFinished && (
                        <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1 pointer-events-auto shadow-lg">
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                            >
                                <List className="w-4 h-4" />
                                Lista
                            </button>
                            <button 
                                onClick={() => setViewMode('focus')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'focus' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                            >
                                <ScanLine className="w-4 h-4" />
                                Foco
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex-1 flex flex-col items-center justify-center">
                    {isFinished || analysisItems.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center"
                        >
                            <div className="relative inline-block">
                                <motion.div 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', delay: 0.2 }}
                                    className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/20"
                                >
                                    <Check className="w-12 h-12 text-white" strokeWidth={3} />
                                </motion.div>
                                <div className="absolute -top-2 -right-4 text-3xl">🎉</div>
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-2">Inbox Zero!</h3>
                            <p className="text-slate-400 text-lg">Você zerou tudo. Aproveite o momento ou planeje o futuro.</p>
                        </motion.div>
                    ) : viewMode === 'focus' && currentItem ? (
                        <div className="w-full max-w-2xl flex flex-col items-center justify-center min-h-[60vh]">
                            {/* Icon */}
                            <motion.div 
                                initial={{ y: -20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="mb-8 p-4 bg-slate-900/30 rounded-2xl border border-slate-800/50 backdrop-blur-sm shadow-xl"
                            >
                                <CheckCircle2 className="w-6 h-6 text-slate-400" />
                            </motion.div>

                            {/* Title */}
                            <motion.h2 
                                key={`title-${currentItem.id}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-3xl font-bold text-white mb-6 text-center tracking-tight"
                            >
                                Análise de Carteira: Risco de Churn
                            </motion.h2>

                            {/* Description */}
                            <motion.div 
                                key={`desc-${currentItem.id}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-slate-400 text-center text-lg mb-16 max-w-xl leading-relaxed"
                            >
                                "O cliente <span className="text-slate-200 font-medium">{currentItem.name}</span> (Empresa: {currentItem.company}) não compra há mais de 30 dias."
                            </motion.div>

                            {/* Buttons */}
                            <div className="flex items-center justify-center gap-6 mb-16">
                                <button onClick={handleNext} className="flex items-center gap-2 px-6 py-3.5 text-slate-300 hover:text-white rounded-xl font-medium transition-all bg-slate-950 border border-slate-800 hover:border-slate-700 group">
                                    <Clock className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" /> Adiar
                                </button>
                                
                                <button onClick={handleNext} className="flex items-center gap-2 px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold transition-all shadow-[0_0_30px_-10px_rgba(16,185,129,0.5)] hover:shadow-[0_0_40px_-5px_rgba(16,185,129,0.6)] transform hover:-translate-y-1 hover:scale-105">
                                    <Check className="w-6 h-6" /> Feito
                                </button>
                                
                                <button onClick={handleNext} className="flex items-center gap-2 px-6 py-3.5 text-slate-300 hover:text-white rounded-xl font-medium transition-all bg-slate-950 border border-slate-800 hover:border-slate-700 group">
                                    Pular <Play className="w-4 h-4 ml-1 text-slate-500 group-hover:text-white transition-colors" />
                                </button>
                            </div>

                            {/* Navigation / Pagination */}
                            <div className="flex flex-col items-center gap-3">
                                <div className="flex items-center gap-6 text-slate-600">
                                    <button onClick={handlePrev} disabled={currentIndex === 0} className="hover:text-slate-400 disabled:opacity-20 transition-colors p-2">
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    
                                    {/* Progress Bar / Indicator */}
                                    <div className="h-1.5 w-16 bg-slate-800 rounded-full overflow-hidden">
                                         <motion.div 
                                            className="h-full bg-blue-500" 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${((currentIndex + 1) / analysisItems.length) * 100}%` }}
                                         />
                                    </div>

                                    <button onClick={handleNext} className="hover:text-slate-400 transition-colors p-2">
                                        <ChevronRight className="w-6 h-6" />
                                    </button>
                                </div>
                                <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">{currentIndex + 1} de {analysisItems.length} pendências</span>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full max-w-3xl space-y-3">
                            <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-slate-500 uppercase tracking-wider">
                                <ChevronDown className="w-4 h-4" /> Tarefas Hoje <span className="bg-slate-800 text-slate-300 px-1.5 rounded-full text-xs ml-1">{analysisItems.length}</span>
                            </div>
                            {analysisItems.map(lead => (
                                <motion.div 
                                    key={lead.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center gap-4 hover:border-slate-700 transition-colors group cursor-pointer"
                                >
                                    <div className="w-6 h-6 rounded-full border-2 border-slate-600 group-hover:border-slate-500 flex-shrink-0" />
                                    <div className="flex-1">
                                        <h3 className="text-white font-medium">Análise de Carteira: Risco de Churn</h3>
                                        <p className="text-sm text-slate-400 truncate">O cliente {lead.name} (Empresa: {lead.company}) não...</p>
                                    </div>
                                    <div className="text-xs text-slate-500 font-mono">
                                        Hoje
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- Render: Standard Inbox ---
    return (
        <div className="flex flex-col gap-6 h-full">
            <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-violet-600/20 rounded-xl">
                    <div className="text-violet-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg>
                    </div>
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Inbox</h1>
                    <p className="text-slate-400">Resumo do que precisa da sua atenção hoje.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-hidden">
                {/* Left Column: Tasks */}
                <div className="flex flex-col gap-6 overflow-hidden">
                    {/* Overdue Tasks Alert */}
                    {overdueTasks.length > 0 && (
                        <div className="bg-red-900/20 border border-red-900/50 rounded-lg p-4 flex flex-col gap-3">
                            <div className="flex items-center gap-2 text-red-400 font-semibold">
                                <AlertCircle className="w-5 h-5" />
                                <h3>{overdueTasks.length} Tarefa{overdueTasks.length > 1 ? 's' : ''} Atrasada{overdueTasks.length > 1 ? 's' : ''}</h3>
                            </div>
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                {overdueTasks.map(task => (
                                    <div key={task.id} className="bg-slate-900/50 p-3 rounded border border-red-900/30 flex justify-between items-center group">
                                        <div>
                                            <p className="text-sm text-slate-200">{task.title}</p>
                                            <p className="text-xs text-red-400/70">{new Date(task.dueDate).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                        <button onClick={() => onNavigate('Tarefas')} className="text-xs bg-red-900/40 hover:bg-red-900/60 text-red-200 px-2 py-1 rounded transition-colors">
                                            Ver
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Today's Tasks */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl flex-1 flex flex-col overflow-hidden">
                        <div className="p-5 border-b border-slate-800 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                <h3 className="font-bold text-white">Tarefas de Hoje</h3>
                            </div>
                            <span className="bg-slate-800 text-slate-400 text-xs px-2 py-1 rounded-full">{todayTasks.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {todayTasks.length > 0 ? todayTasks.map(task => (
                                <motion.div 
                                    key={task.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg hover:border-violet-500/50 transition-colors group cursor-pointer"
                                    onClick={() => onNavigate('Tarefas')}
                                >
                                    <div className="flex justify-between items-start">
                                        <p className="font-medium text-slate-200 group-hover:text-white transition-colors">{task.title}</p>
                                        <div className="bg-slate-800 p-1.5 rounded text-slate-500 group-hover:text-violet-400 transition-colors">
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                    {task.description && <p className="text-sm text-slate-500 mt-1 line-clamp-1">{task.description}</p>}
                                    <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>Até {new Date(task.dueDate).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                </motion.div>
                            )) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                    <Calendar className="w-12 h-12 mb-3 opacity-20" />
                                    <p>Nenhuma tarefa agendada para hoje.</p>
                                    <button onClick={() => onNavigate('Tarefas')} className="mt-2 text-sm text-violet-400 hover:text-violet-300">Ver todas as tarefas</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Notifications & Recent Leads */}
                <div className="flex flex-col gap-6 overflow-hidden">
                    {/* Unread Notifications */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl flex-1 flex flex-col overflow-hidden min-h-[300px]">
                        <div className="p-5 border-b border-slate-800 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Bell className="w-5 h-5 text-amber-500" />
                                <h3 className="font-bold text-white">Notificações</h3>
                            </div>
                            {unreadNotifications.length > 0 && <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-1 rounded-full">{unreadNotifications.length} novas</span>}
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {unreadNotifications.length > 0 ? (
                                <div className="divide-y divide-slate-800">
                                    {unreadNotifications.map(notif => (
                                        <div 
                                            key={notif.id} 
                                            onClick={() => handleNotificationClick(notif)}
                                            className="p-4 hover:bg-slate-800/50 transition-colors cursor-pointer flex gap-3"
                                        >
                                            <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm text-slate-200">{notif.text}</p>
                                                <p className="text-xs text-slate-500 mt-1">{new Date(notif.createdAt).toLocaleString('pt-BR')}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8">
                                    <p>Você está em dia com as notificações.</p>
                                </div>
                            )}
                        </div>
                        {unreadNotifications.length > 0 && (
                            <div className="p-3 border-t border-slate-800 text-center">
                                <button onClick={() => onNavigate('Notificações')} className="text-xs font-medium text-slate-400 hover:text-white transition-colors">
                                    Ver todas as notificações
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Quick Stats / Recent Leads */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <UserPlus className="w-5 h-5 text-blue-500" />
                            <h3 className="font-bold text-white">Leads Recentes</h3>
                        </div>
                        <div className="space-y-3">
                            {recentLeads.map(lead => (
                                <div key={lead.id} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                                            {lead.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-slate-200">{lead.name}</p>
                                            <p className="text-xs text-slate-500">{lead.company}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-500">
                                        {new Date(lead.createdAt || '').toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => onNavigate('Pipeline')} className="w-full mt-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors">
                            Ir para Pipeline
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InboxView;
