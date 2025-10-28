
import React from 'react';
import { Activity as ActivityIcon, MessageSquare, ArrowRight, ChevronsRight } from 'lucide-react';
import { Activity, Lead } from '../types';

const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return `${diffSeconds}s atrás`;
    const diffMinutes = Math.round(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m atrás`;
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
};

interface RecentActivitiesProps {
    activities: Activity[];
    leads: Lead[];
    onNavigate: (view: string) => void;
}

const RecentActivities: React.FC<RecentActivitiesProps> = ({ activities, leads, onNavigate }) => {

    const sortedActivities = [...activities]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5); // Show latest 5 activities on dashboard

    const getLeadName = (leadId: number | string) => {
        return leads.find(l => l.id === leadId)?.name || 'Lead desconhecido';
    }

    return (
         <div className="bg-zinc-800 p-5 rounded-lg border border-zinc-700 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <ActivityIcon className="w-5 h-5 text-[#14ff00]" />
                    <h2 className="font-semibold text-white">Atividades Recentes</h2>
                </div>
                 <button onClick={() => onNavigate('Atividades')} className="flex items-center gap-1 text-sm text-[#14ff00] hover:text-[#14ff00]/80">
                    <span>Ver tudo</span>
                    <ChevronsRight className="w-4 h-4" />
                </button>
            </div>
            {sortedActivities.length > 0 ? (
                <ul className="space-y-4 flex-1 overflow-y-auto -mr-2 pr-2">
                    {sortedActivities.map(activity => (
                         <li key={activity.id} className="flex gap-3 items-start">
                            <div className="flex-shrink-0 bg-zinc-900/50 h-8 w-8 rounded-full flex items-center justify-center mt-1">
                                {activity.type === 'note' ? <MessageSquare className="w-4 h-4 text-[#14ff00]" /> : <ArrowRight className="w-4 h-4 text-[#14ff00]" />}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-zinc-300 leading-snug">
                                    <span className="font-semibold text-white">{activity.authorName}</span>
                                    {` ${activity.type === 'note' ? 'adicionou uma nota em' : 'atualizou'} `}
                                    <a href="#" className="font-semibold text-white hover:underline">{getLeadName(activity.leadId)}</a>.
                                    <span className="text-xs text-zinc-500 ml-2">{formatTimestamp(activity.timestamp)}</span>
                                </p>
                                {activity.type === 'note' ? (
                                    <p className="text-sm mt-1 text-zinc-400 italic border-l-2 border-zinc-700 pl-2">"{activity.text}"</p>
                                ) : (
                                    <p className="text-sm mt-1 text-zinc-400">{activity.text}</p>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="flex items-center justify-center flex-1 min-h-[150px] border-2 border-dashed border-zinc-700/50 rounded-md">
                    <p className="text-sm text-zinc-500">Nenhuma atividade registrada ainda</p>
                </div>
            )}
        </div>
    );
};

export default RecentActivities;