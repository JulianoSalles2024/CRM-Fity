import React, { useMemo } from 'react';
import { Task, Lead, Id } from '../types';
import TaskItem from './TaskItem';

interface ActivitiesViewProps {
    tasks: Task[];
    leads: Lead[];
    onEditTask: (task: Task) => void;
    onDeleteTask: (taskId: Id) => void;
    onUpdateTaskStatus: (taskId: Id, status: 'pending' | 'completed') => void;
}

const ActivitiesView: React.FC<ActivitiesViewProps> = ({ tasks, leads, onEditTask, onDeleteTask, onUpdateTaskStatus }) => {
    const leadsMap = useMemo(() => new Map(leads.map(lead => [lead.id, lead.name])), [leads]);

    const pendingTasks = tasks.filter(task => task.status === 'pending');
    const completedTasks = tasks.filter(task => task.status === 'completed');

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-lg font-semibold text-white mb-4">Pendentes</h2>
                <div className="space-y-3">
                    {pendingTasks.length > 0 ? (
                        pendingTasks.map(task => (
                            <TaskItem 
                                key={task.id} 
                                task={task} 
                                leadName={leadsMap.get(task.leadId) || 'Lead não encontrado'} 
                                onEditTask={onEditTask} 
                                onDeleteTask={onDeleteTask} 
                                onUpdateTaskStatus={onUpdateTaskStatus} 
                            />
                        ))
                    ) : (
                        <p className="text-zinc-500 text-sm">Nenhuma tarefa pendente. Hora de relaxar!</p>
                    )}
                </div>
            </div>
             <div>
                <h2 className="text-lg font-semibold text-white mb-4">Concluídas</h2>
                 <div className="space-y-3">
                    {completedTasks.length > 0 ? (
                        completedTasks.map(task => (
                            <TaskItem 
                                key={task.id} 
                                task={task} 
                                leadName={leadsMap.get(task.leadId) || 'Lead não encontrado'} 
                                onEditTask={onEditTask} 
                                onDeleteTask={onDeleteTask} 
                                onUpdateTaskStatus={onUpdateTaskStatus} 
                            />
                        ))
                    ) : (
                        <p className="text-zinc-500 text-sm">Nenhuma tarefa foi concluída ainda.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActivitiesView;