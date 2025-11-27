import React from 'react';
import { Lead, Id } from '../types';
import { ArchiveRestore, RefreshCw, User, Calendar, MessageCircle } from 'lucide-react';

interface RecoveryViewProps {
    leads: Lead[];
    onReactivateLead: (leadId: Id) => void;
}

const RecoveryView: React.FC<RecoveryViewProps> = ({ leads, onReactivateLead }) => {
    
    const sortedLeads = [...leads].sort((a, b) => 
        new Date(a.reactivationDate || 0).getTime() - new Date(b.reactivationDate || 0).getTime()
    );

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' });
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <ArchiveRestore className="w-8 h-8 text-violet-500" />
                <div>
                    <h1 className="text-2xl font-bold text-white">Recuperação de Leads</h1>
                    <p className="text-zinc-400">Leads perdidos com agendamento para reativação.</p>
                </div>
            </div>

            <div className="bg-zinc-900 rounded-lg border border-zinc-800">
                {sortedLeads.length > 0 ? (
                    <ul className="divide-y divide-zinc-800">
                        {sortedLeads.map(lead => (
                            <li key={lead.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-zinc-800/50">
                                <div className="flex-1">
                                    <p className="font-semibold text-white">{lead.name}</p>
                                    <p className="text-sm text-zinc-400">{lead.company}</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-zinc-400">
                                    <div className="flex items-center gap-2" title="Motivo da Perda">
                                        <MessageCircle className="w-4 h-4 text-zinc-500" />
                                        <span>{lead.lostReason}</span>
                                    </div>
                                    <div className="flex items-center gap-2" title="Data para Reativar">
                                        <Calendar className="w-4 h-4 text-zinc-500" />
                                        <span>{formatDate(lead.reactivationDate)}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onReactivateLead(lead.id)}
                                    className="flex items-center gap-2 bg-violet-600 text-white px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-violet-700 transition-colors self-start sm:self-center"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    <span>Reativar</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-16">
                        <User className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                        <h3 className="font-semibold text-white">Nenhum lead para reativar</h3>
                        <p className="text-sm text-zinc-500 mt-1">Nenhum lead perdido foi agendado para reativação ainda.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecoveryView;