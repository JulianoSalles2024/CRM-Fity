import React, { useState, useMemo } from 'react';
import { Lead, Id } from '../types';
import { ArchiveRestore, RefreshCw, User, Calendar, MessageCircle, Download } from 'lucide-react';

interface RecoveryViewProps {
    leads: Lead[];
    onReactivateLead: (leadId: Id) => void;
    onExportPDF: (leads: Lead[]) => void;
}

const RecoveryView: React.FC<RecoveryViewProps> = ({ leads, onReactivateLead, onExportPDF }) => {
    const [dateFilter, setDateFilter] = useState({
        start: '',
        end: ''
    });

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setDateFilter(prev => ({ ...prev, [name]: value }));
    };

    const filteredLeads = useMemo(() => {
        if (!dateFilter.start && !dateFilter.end) {
            return leads;
        }
        return leads.filter(lead => {
            if (!lead.reactivationDate) return false;
            const reactivationDate = new Date(lead.reactivationDate);
            const startDate = dateFilter.start ? new Date(dateFilter.start) : null;
            const endDate = dateFilter.end ? new Date(dateFilter.end) : null;
            
            if (startDate && reactivationDate < startDate) return false;
            if (endDate) {
                // Include the whole day
                const endOfDay = new Date(endDate);
                endOfDay.setHours(23, 59, 59, 999);
                if (reactivationDate > endOfDay) return false;
            }
            return true;
        });
    }, [leads, dateFilter]);
    
    const sortedLeads = [...filteredLeads].sort((a, b) => 
        new Date(a.reactivationDate || 0).getTime() - new Date(b.reactivationDate || 0).getTime()
    );

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' });
    };

    const handleExportCSV = () => {
        const headers = ['Nome', 'Empresa', 'Motivo da Perda', 'Data de Reativação'];
        const rows = sortedLeads.map(lead => [
            `"${lead.name.replace(/"/g, '""')}"`,
            `"${lead.company.replace(/"/g, '""')}"`,
            `"${(lead.lostReason || '').replace(/"/g, '""')}"`,
            formatDate(lead.reactivationDate)
        ].join(','));
        const csvString = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `recuperacao_leads_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                 <div className="flex items-center gap-4">
                    <ArchiveRestore className="w-8 h-8 text-violet-500" />
                    <div>
                        <h1 className="text-2xl font-bold text-white">Recuperação de Leads</h1>
                        <p className="text-zinc-400">Leads perdidos com agendamento para reativação.</p>
                    </div>
                </div>
                 <div className="flex items-center gap-2 self-start md:self-center">
                    <div className="flex items-center gap-2">
                        <input type="date" name="start" value={dateFilter.start} onChange={handleDateChange} className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-white focus:ring-violet-500 h-[36px]" />
                        <span className="text-zinc-500">-</span>
                        <input type="date" name="end" value={dateFilter.end} onChange={handleDateChange} className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-white focus:ring-violet-500 h-[36px]" />
                    </div>
                    <button onClick={handleExportCSV} className="flex items-center gap-2 text-sm text-zinc-300 bg-zinc-700 hover:bg-zinc-600 px-3 py-1.5 rounded-md h-[36px]">
                        <Download className="w-4 h-4" /><span>CSV</span>
                    </button>
                    <button onClick={() => onExportPDF(sortedLeads)} className="flex items-center gap-2 text-sm text-zinc-300 bg-zinc-700 hover:bg-zinc-600 px-3 py-1.5 rounded-md h-[36px]">
                        <Download className="w-4 h-4" /><span>PDF</span>
                    </button>
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
                        <p className="text-sm text-zinc-500 mt-1">Nenhum lead perdido foi agendado para reativação neste período.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecoveryView;