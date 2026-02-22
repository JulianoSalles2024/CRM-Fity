
import React, { useMemo, useState } from 'react';
import { Task, Notification, Lead, Id } from '../types';
import { 
    CheckCircle2, 
    Bell, 
    Clock, 
    Calendar, 
    ArrowRight, 
    UserPlus, 
    AlertCircle, 
    List, 
    ScanLine, 
    Circle, 
    Play, 
    Check, 
    ChevronDown, 
    ChevronLeft, 
    ChevronRight,
    LayoutGrid,
    Target,
    Zap,
    AlertTriangle,
    TrendingUp,
    UserMinus,
    ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InboxViewProps {
    tasks: Task[];
    notifications: Notification[];
    leads: Lead[];
    onNavigate: (view: string, itemId?: Id) => void;
    onMarkNotificationRead: (id: Id) => void;
    onOpenLead?: (lead: Lead) => void;
    mode?: 'standard' | 'analysis';
}

const InboxView: React.FC<InboxViewProps> = ({ tasks, notifications, leads, onNavigate, onMarkNotificationRead, onOpenLead, mode = 'standard' }) => {
    const [viewMode, setViewMode] = useState<'overview' | 'list' | 'focus'>('overview');

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

    const churnRiskLeads = useMemo(() => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return leads.filter(l => {
            const lastDate = l.lastActivityTimestamp ? new Date(l.lastActivityTimestamp) : new Date(l.createdAt || Date.now());
            return l.status === 'Ativo' && lastDate < thirtyDaysAgo;
        }).slice(0, 2);
    }, [leads]);

    const upsellOpportunities = useMemo(() => {
        // Mock logic for upsell: leads in 'closed' column or with high value
        return leads.filter(l => l.value > 10000 && l.columnId === 'closed').slice(0, 1);
    }, [leads]);

    const stats = [
        { label: 'ATRASADOS', value: overdueTasks.length, subtext: overdueTasks.length === 0 ? 'Tudo em dia' : `${overdueTasks.length} pendentes`, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
        { label: 'HOJE', value: todayTasks.length, subtext: todayTasks.length === 0 ? 'Sem tarefas para hoje' : `${todayTasks.length} tarefas`, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
        { label: 'SUGESTÕES CRÍTICAS', value: 0, subtext: 'Sem urgências', color: 'text-slate-500', bgColor: 'bg-slate-800/50' },
        { label: 'PENDÊNCIAS', value: 3, subtext: '1 próximos', color: 'text-slate-200', bgColor: 'bg-slate-800/50' },
    ];

    return (
        <div className="flex flex-col gap-8 h-full max-w-7xl mx-auto w-full p-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-white tracking-tight">Inbox</h1>
                    <p className="text-slate-400 mt-1 text-lg">Sua mesa de trabalho.</p>
                    <button className="mt-4 flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-lg text-sm border border-slate-700/50 transition-colors">
                        <Zap className="w-4 h-4" />
                        Seed Inbox
                    </button>
                </div>

                <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 shadow-xl">
                    <button 
                        onClick={() => setViewMode('overview')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'overview' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        Visão Geral
                    </button>
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        <List className="w-4 h-4" />
                        Lista
                    </button>
                    <button 
                        onClick={() => setViewMode('focus')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'focus' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Target className="w-4 h-4" />
                        Foco
                    </button>
                </div>
            </div>

            {/* Visão Geral Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white">Visão Geral</h2>
                        <p className="text-slate-500 text-sm">Diagnóstico rápido do dia (sem virar outra lista de atividades).</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white transition-colors text-sm font-medium border border-slate-800 rounded-lg">
                            Ver lista <ArrowRight className="w-4 h-4" />
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-sky-500/20">
                            <Circle className="w-4 h-4 fill-white" />
                            Começar foco
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, i) => (
                        <div key={i} className={`p-6 rounded-2xl border border-slate-800/50 ${stat.bgColor} backdrop-blur-sm flex flex-col justify-between h-32`}>
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-bold text-slate-500 tracking-widest">{stat.label}</span>
                                <span className={`text-3xl font-bold ${stat.color}`}>{stat.value}</span>
                            </div>
                            <span className="text-sm text-slate-400">{stat.subtext}</span>
                        </div>
                    ))}
                </div>

                {/* Lists Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Risco Section */}
                    <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-6 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                                <h3 className="font-bold text-white">Risco (resgate e deals parados)</h3>
                            </div>
                            <button className="text-sky-400 hover:text-sky-300 text-sm font-medium">Ver tudo</button>
                        </div>
                        <div className="space-y-4">
                            {churnRiskLeads.map(lead => (
                                <div key={lead.id} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-red-500/10 rounded-lg">
                                            <UserMinus className="w-5 h-5 text-red-400" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">Risco de Churn</p>
                                            <p className="text-xs text-slate-500">{lead.name} não interage há 40 dias</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-xs font-bold transition-colors">
                                            Aplicar
                                        </button>
                                        <button 
                                            onClick={() => onOpenLead?.(lead)}
                                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors"
                                        >
                                            Abrir
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Oportunidades Section */}
                    <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-6 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-emerald-500" />
                                <h3 className="font-bold text-white">Oportunidades (upsell)</h3>
                            </div>
                            <button className="text-sky-400 hover:text-sky-300 text-sm font-medium">Ver tudo</button>
                        </div>
                        <div className="space-y-4">
                            {upsellOpportunities.map(lead => (
                                <div key={lead.id} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                                            <TrendingUp className="w-5 h-5 text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">Oportunidade de Upsell</p>
                                            <p className="text-xs text-slate-500">Sem empresa fechou há 40 dias • R$ 12.000</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-xs font-bold transition-colors">
                                            Aplicar
                                        </button>
                                        <button 
                                            onClick={() => onOpenLead?.(lead)}
                                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors"
                                        >
                                            Abrir
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InboxView;

