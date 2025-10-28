import React, { useState, useMemo } from 'react';
import { Lead, ColumnData, Tag } from '../types';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';

const TagPill: React.FC<{ tag: Tag }> = ({ tag }) => (
    <span 
        className="px-2 py-0.5 text-xs font-medium rounded-full text-white/90"
        style={{ backgroundColor: tag.color }}
    >
        {tag.name}
    </span>
);

type SortableKeys = keyof Lead | 'status';

interface LeadListViewProps {
    leads: Lead[];
    columns: ColumnData[];
    onLeadClick: (lead: Lead) => void;
}

const LeadListView: React.FC<LeadListViewProps> = ({ leads, columns, onLeadClick }) => {
    const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'ascending' | 'descending' } | null>({ key: 'name', direction: 'ascending'});

    const currencyFormatter = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
    
    const columnMap = useMemo(() => {
        return columns.reduce((acc, col) => {
            acc[col.id] = col.title;
            return acc;
        }, {} as Record<string, string>);
    }, [columns]);

    const sortedLeads = useMemo(() => {
        let sortableLeads = [...leads];
        if (sortConfig !== null) {
            sortableLeads.sort((a, b) => {
                let aValue: any;
                let bValue: any;

                if (sortConfig.key === 'status') {
                    aValue = columnMap[a.columnId] || '';
                    bValue = columnMap[b.columnId] || '';
                } else {
                    aValue = a[sortConfig.key as keyof Lead];
                    bValue = b[sortConfig.key as keyof Lead];
                }
                
                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableLeads;
    }, [leads, sortConfig, columnMap]);

    const requestSort = (key: SortableKeys) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: SortableKeys) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <div className="w-4 h-4" />;
        }
        return sortConfig.direction === 'ascending' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
    };
    
    const TableHeader: React.FC<{ sortKey: SortableKeys; label: string; className?: string }> = ({ sortKey, label, className }) => (
        <th className={`px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider ${className}`}>
            <button className="flex items-center gap-1 group" onClick={() => requestSort(sortKey)}>
                {label}
                <span className="opacity-50 group-hover:opacity-100 transition-opacity">
                    {getSortIcon(sortKey)}
                </span>
            </button>
        </th>
    );

    return (
        <div className="bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden">
             <div className="p-4 border-b border-zinc-700">
                <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                     <input 
                        type="text" 
                        placeholder="Buscar leads..."
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-md pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                </div>
            </div>
            {leads.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 border-t border-zinc-700">
                    <h3 className="text-lg font-semibold text-zinc-300">Nenhum lead encontrado</h3>
                    <p className="text-zinc-500 mt-1">Comece adicionando seu primeiro lead!</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-zinc-700">
                        <thead className="bg-zinc-800">
                            <tr>
                                <TableHeader sortKey="name" label="Nome" className="w-2/5" />
                                <TableHeader sortKey="status" label="Status" />
                                <TableHeader sortKey="value" label="Valor" />
                                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Tags</th>
                                <TableHeader sortKey="lastActivity" label="Última Atividade" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-700">
                            {sortedLeads.map(lead => (
                                <tr key={lead.id} onClick={() => onLeadClick(lead)} className="hover:bg-zinc-700/50 cursor-pointer transition-colors duration-150">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 bg-zinc-700 rounded-full flex items-center justify-center font-bold">
                                                {lead.name.charAt(0)}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-white">{lead.name}</div>
                                                <div className="text-sm text-zinc-400">{lead.company}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-zinc-700 text-zinc-300">
                                            {columnMap[lead.columnId] || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">{currencyFormatter.format(lead.value)}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex flex-wrap gap-1">
                                            {lead.tags.map(tag => <TagPill key={tag.id} tag={tag} />)}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-400">{lead.lastActivity}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             )}
        </div>
    );
};

export default LeadListView;