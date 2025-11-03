import React, { useMemo } from 'react';
import { ColumnData, Lead } from '../types';
import { ChevronsRight } from 'lucide-react';

interface PipelineOverviewProps {
    columns: ColumnData[];
    leads: Lead[];
    onNavigate: (view: string) => void;
}

const PipelineOverview: React.FC<PipelineOverviewProps> = ({ columns, leads, onNavigate }) => {
    
    const currencyFormatter = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });

    const overviewData = useMemo(() => {
        return columns.map(column => {
            const leadsInColumn = leads.filter(lead => lead.columnId === column.id);
            const value = leadsInColumn.reduce((sum, lead) => sum + lead.value, 0);
            return {
                ...column,
                leadCount: leadsInColumn.length,
                value: value
            };
        });
    }, [columns, leads]);

    return (
        <div className="bg-zinc-800 p-5 rounded-lg border border-zinc-700 h-full flex flex-col transition-all duration-200 ease-in-out hover:bg-zinc-700/50 hover:-translate-y-1 hover:shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-white">Visão Geral do Pipeline</h2>
                <button onClick={() => onNavigate('Pipeline')} className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300">
                    <span>Ver tudo</span>
                    <ChevronsRight className="w-4 h-4" />
                </button>
            </div>
            <div className="flex-1 space-y-2">
                {overviewData.map(stage => (
                    <div key={stage.id} className="p-3 bg-zinc-900/50 rounded-md flex justify-between items-center transition-colors hover:bg-zinc-700/50">
                        <div>
                            <p className="font-medium text-white">{stage.title}</p>
                            <p className="text-xs text-zinc-400">{stage.leadCount} leads</p>
                        </div>
                        <p className="font-semibold text-green-400">{currencyFormatter.format(stage.value)}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PipelineOverview;