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
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-lg border border-zinc-200 dark:border-zinc-800 h-full flex flex-col transition-all duration-200 ease-in-out hover:bg-gray-50 dark:hover:bg-zinc-800/50 hover:-translate-y-1 hover:shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-zinc-900 dark:text-white">Visão Geral do Pipeline</h2>
                <button onClick={() => onNavigate('Pipeline')} className="flex items-center gap-1 text-sm text-violet-500 dark:text-violet-400 hover:text-violet-600 dark:hover:text-violet-300">
                    <span>Ver tudo</span>
                    <ChevronsRight className="w-4 h-4" />
                </button>
            </div>
            <div className="flex-1 space-y-2">
                {overviewData.map(stage => (
                    <div key={stage.id} className="p-3 bg-gray-100 dark:bg-zinc-800 rounded-md flex justify-between items-center transition-colors hover:bg-gray-200 dark:hover:bg-zinc-700">
                        <div>
                            <p className="font-medium text-zinc-900 dark:text-white">{stage.title}</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">{stage.leadCount} leads</p>
                        </div>
                        <p className="font-semibold text-teal-700 dark:text-teal-400">{currencyFormatter.format(stage.value)}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PipelineOverview;