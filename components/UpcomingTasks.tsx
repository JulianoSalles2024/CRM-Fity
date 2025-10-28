import React from 'react';
import { Task, Lead } from '../types';
import { CheckCircle2, ChevronsRight, Calendar } from 'lucide-react';

interface UpcomingTasksProps {
    tasks: Task[];
    leads: Lead[];
}

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Hoje';
    }
    if (date.toDateString() === tomorrow.toDateString()) {
        return 'Amanhã';
    }
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
};

const UpcomingTasks: React.FC<UpcomingTasksProps> = ({ tasks, leads }) => {
    const leadsMap = new Map(leads.map(lead => [lead.id, lead.name]));
    const upcomingTasks = tasks
        .filter(task => task.status === 'pending')
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 4);

    return (
        <div className="bg-zinc-800 p-5 rounded-lg border border-zinc-700 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                 <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-violet-400" />
                    <h2 className="font-semibold text-white">Próximas Tarefas</h2>
                </div>
                <a href="#" className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300">
                    <span>Ver todas</span>
                    <ChevronsRight className="w-4 h-4" />
                </a>
            </div>
            {upcomingTasks.length > 0 ? (
                <div className="flex-1 space-y-3">
                    {upcomingTasks.map(task => (
                        <div key={task.id} className="p-3 bg-zinc-900/50 rounded-md flex justify-between items-center">
                            <div>
                                <p className="font-medium text-white">{task.title}</p>
                                <p className="text-xs text-zinc-400">Para: {leadsMap.get(task.leadId) || 'Lead desconhecido'}</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-semibold px-2 py-1 rounded-md bg-zinc-700 text-zinc-300">
                                <Calendar className="w-3 h-3"/>
                                <span>{formatDate(task.dueDate)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                 <div className="flex items-center justify-center flex-1 min-h-[150px] border-2 border-dashed border-zinc-700/50 rounded-md">
                    <p className="text-sm text-zinc-500">Nenhuma tarefa pendente</p>
                </div>
            )}
        </div>
    );
};

export default UpcomingTasks;