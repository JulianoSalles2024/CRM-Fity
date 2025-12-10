
import React, { useMemo } from 'react';
import { Task, Notification, Lead, Id } from '../types';
import { CheckCircle2, Bell, Clock, Calendar, ArrowRight, UserPlus, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface InboxViewProps {
    tasks: Task[];
    notifications: Notification[];
    leads: Lead[];
    onNavigate: (view: string, itemId?: Id) => void;
    onMarkNotificationRead: (id: Id) => void;
}

const InboxView: React.FC<InboxViewProps> = ({ tasks, notifications, leads, onNavigate, onMarkNotificationRead }) => {
    
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
            // Logic to handle navigation would go here in a real routing setup
            // For now we just mark read
        }
    };

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
