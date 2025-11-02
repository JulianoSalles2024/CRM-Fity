import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Lead, ColumnData, Tag, ListDisplaySettings } from '../types';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import LeadListHeader from './LeadListHeader';

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
    viewType: 'Leads' | 'Clientes';
    listDisplaySettings: ListDisplaySettings;
    onUpdateListSettings: (newSettings: ListDisplaySettings) => void;
    allTags: Tag[];
    selectedTags: Tag[];
    onSelectedTagsChange: React.Dispatch<React.SetStateAction<Tag[]>>;
    statusFilter: 'all' | 'Ativo' | 'Inativo';
    onStatusFilterChange: (status: 'all' | 'Ativo' | 'Inativo') => void;
}

const LeadListView: React.FC<LeadListViewProps> = ({ 
    leads, 
    columns, 
    onLeadClick, 
    viewType, 
    listDisplaySettings, 
    onUpdateListSettings,
    allTags,
    selectedTags,
    onSelectedTagsChange,
    statusFilter,
    onStatusFilterChange
}) => {
    const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'ascending' | 'descending' } | null>({ key: 'name', direction: 'ascending'});

    const currencyFormatter = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
    
    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
    }

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
                
                if (aValue == null) return 1;
                if (bValue == null) return -1;
                
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

    // --- VIRTUALIZATION LOGIC ---
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [virtualRange, setVirtualRange] = useState({ start: 0, end: 30 });
    const ROW_HEIGHT = 73; // Estimated height of a single row in pixels. Adjust if row styling changes.
    const OVERSCAN = 5;    // Number of items to render above and below the viewport for smoother scrolling.

    const onScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, clientHeight } = event.currentTarget;
        const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
        const endIndex = Math.min(
            sortedLeads.length - 1,
            Math.ceil((scrollTop + clientHeight) / ROW_HEIGHT) + OVERSCAN
        );

        if (startIndex !== virtualRange.start || endIndex !== virtualRange.end) {
            setVirtualRange({ start: startIndex, end: endIndex });
        }
    }, [sortedLeads.length, virtualRange.start, virtualRange.end]);

    const virtualLeads = useMemo(() => {
        return sortedLeads.slice(virtualRange.start, virtualRange.end + 1);
    }, [sortedLeads, virtualRange.start, virtualRange.end]);

    const topPaddingHeight = virtualRange.start * ROW_HEIGHT;
    const bottomPaddingHeight = Math.max(0, (sortedLeads.length - (virtualRange.end + 1)) * ROW_HEIGHT);

    const numberOfColumns = useMemo(() => {
        return 1 + Object.values(listDisplaySettings).filter(Boolean).length;
    }, [listDisplaySettings]);
    // --- END VIRTUALIZATION LOGIC ---
    
    const TableHeader: React.FC<{ sortKey: SortableKeys; label: string; className?: string }> = ({ sortKey, label, className }) => {
        const isActive = sortConfig?.key === sortKey;
        const isAscending = isActive && sortConfig?.direction === 'ascending';

        return (
            <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${className} ${isActive ? 'text-white' : 'text-zinc-400'}`}>
                <button className="flex items-center gap-1 group" onClick={() => requestSort(sortKey)}>
                    {label}
                    <span className={isActive ? 'opacity-100' : 'opacity-50 group-hover:opacity-100 transition-opacity'}>
                        {isActive 
                            ? (isAscending ? <ChevronUp className="w-4 h-4 text-violet-400" /> : <ChevronDown className="w-4 h-4 text-violet-400" />)
                            : <ChevronsUpDown className="w-4 h-4" />
                        }
                    </span>
                </button>
            </th>
        );
    };

    return (
        <div className="flex flex-col gap-4 h-full">
            <LeadListHeader 
                viewType={viewType}
                listDisplaySettings={listDisplaySettings}
                onUpdateListSettings={onUpdateListSettings}
                allTags={allTags}
                selectedTags={selectedTags}
                onSelectedTagsChange={onSelectedTagsChange}
                statusFilter={statusFilter}
                onStatusFilterChange={onStatusFilterChange}
            />
            <div className="bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden flex-1 flex flex-col">
                {sortedLeads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <h3 className="text-lg font-semibold text-zinc-300">Nenhum {viewType === 'Clientes' ? 'cliente' : 'lead'} encontrado</h3>
                        <p className="text-zinc-500 mt-1">Tente ajustar seus filtros ou adicione um novo lead!</p>
                    </div>
                ) : (
                    <div ref={scrollContainerRef} onScroll={onScroll} className="overflow-auto h-full">
                        <table className="min-w-full divide-y divide-zinc-700" style={{ borderSpacing: 0 }}>
                            <thead className="bg-zinc-900/50 sticky top-0 z-10">
                                <tr>
                                    <TableHeader sortKey="name" label="Nome" />
                                    {listDisplaySettings.showStatus && <TableHeader sortKey="status" label="Status" />}
                                    {listDisplaySettings.showValue && <TableHeader sortKey="value" label="Valor" />}
                                    {listDisplaySettings.showEmail && <TableHeader sortKey="email" label="Email" />}
                                    {listDisplaySettings.showPhone && <TableHeader sortKey="phone" label="Telefone" />}
                                    {listDisplaySettings.showTags && <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Tags</th>}
                                    {listDisplaySettings.showCreatedAt && <TableHeader sortKey="createdAt" label="Criação" />}
                                    {listDisplaySettings.showLastActivity && <TableHeader sortKey="lastActivity" label="Última Atividade" />}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-700 relative">
                                {topPaddingHeight > 0 && (
                                    <tr style={{ height: topPaddingHeight }}>
                                        <td colSpan={numberOfColumns} />
                                    </tr>
                                )}
                                {virtualLeads.map(lead => (
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
                                        {listDisplaySettings.showStatus && (
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-zinc-700 text-zinc-300">
                                                    {columnMap[lead.columnId] || 'N/A'}
                                                </span>
                                            </td>
                                        )}
                                        {listDisplaySettings.showValue && (
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">{currencyFormatter.format(lead.value)}</td>
                                        )}
                                        {listDisplaySettings.showEmail && (
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-400 truncate max-w-xs">{lead.email || '—'}</td>
                                        )}
                                        {listDisplaySettings.showPhone && (
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-400">{lead.phone || '—'}</td>
                                        )}
                                        {listDisplaySettings.showTags && (
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex flex-wrap gap-1">
                                                    {lead.tags.map(tag => <TagPill key={tag.id} tag={tag} />)}
                                                </div>
                                            </td>
                                        )}
                                        {listDisplaySettings.showCreatedAt && (
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-400">{formatDate(lead.createdAt)}</td>
                                        )}
                                        {listDisplaySettings.showLastActivity && (
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-400">{lead.lastActivity}</td>
                                        )}
                                    </tr>
                                ))}
                                {bottomPaddingHeight > 0 && (
                                    <tr style={{ height: bottomPaddingHeight }}>
                                        <td colSpan={numberOfColumns} />
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                 )}
            </div>
        </div>
    );
};

export default LeadListView;