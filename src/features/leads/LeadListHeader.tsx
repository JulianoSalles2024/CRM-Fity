import React, { useState, useRef, useEffect } from 'react';
import { Users, Contact, SlidersHorizontal, Tag, X, Download, Plus, TrendingUp, User as UserIcon, ClipboardList } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import ListCustomizationPopup from '@/shared/components/ListCustomizationPopup';
import TagFilterPopup from '@/shared/components/TagFilterPopup';
import type { ListDisplaySettings, Tag as TagType } from '@/shared/types';

interface LeadListHeaderProps {
    viewType: 'Leads' | 'Clientes';
    listDisplaySettings: ListDisplaySettings;
    onUpdateListSettings: (newSettings: ListDisplaySettings) => void;
    allTags: TagType[];
    selectedTags: TagType[];
    onSelectedTagsChange: React.Dispatch<React.SetStateAction<TagType[]>>;
    statusFilter: 'all' | 'Ativo' | 'Inativo';
    onStatusFilterChange: (status: 'all' | 'Ativo' | 'Inativo') => void;
    onExportCSV: () => void;
    onExportPDF: () => void;
    onOpenCreateLeadModal: () => void;
    onOpenCreateTaskModal: () => void;
}

const LeadListHeader: React.FC<LeadListHeaderProps> = ({ 
    viewType, 
    listDisplaySettings, 
    onUpdateListSettings,
    allTags,
    selectedTags,
    onSelectedTagsChange,
    statusFilter,
    onStatusFilterChange,
    onExportCSV,
    onExportPDF,
    onOpenCreateLeadModal,
    onOpenCreateTaskModal,
}) => {
    const [isCustomizeOpen, setCustomizeOpen] = useState(false);
    const [isTagFilterOpen, setTagFilterOpen] = useState(false);
    const [isCreateMenuOpen, setCreateMenuOpen] = useState(false);
    
    const createMenuRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (createMenuRef.current && !createMenuRef.current.contains(event.target as Node)) {
                setCreateMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isClientsView = viewType === 'Clientes';
    const Icon = isClientsView ? Contact : Users;
    const title = isClientsView ? 'Clientes' : 'Leads';
    const description = isClientsView ? 'Gerencie seus clientes e relacionamentos' : 'Gerencie todos os seus leads e clientes';

    const handleTagToggle = (tagToToggle: TagType) => {
        onSelectedTagsChange(prev => {
            if (prev.find(t => t.id === tagToToggle.id)) {
                return prev.filter(t => t.id !== tagToToggle.id);
            } else {
                return [...prev, tagToToggle];
            }
        });
    };

    const handleClearTags = () => {
        onSelectedTagsChange([]);
    };

    const createMenuItems = [
        { label: 'Novo Lead', icon: TrendingUp, action: onOpenCreateLeadModal },
        { label: 'Novo Cliente', icon: UserIcon, action: onOpenCreateLeadModal },
        { label: 'Nova Atividade', icon: ClipboardList, action: onOpenCreateTaskModal },
    ];

    return (
        <div className="flex flex-col gap-4">
             <div className="flex items-center gap-4">
                 <Icon className="w-8 h-8 text-violet-500" />
                <div>
                    <h1 className="text-2xl font-bold text-white">{title}</h1>
                    <p className="text-zinc-400">{description}</p>
                </div>
            </div>
             <div className="flex items-center gap-4 p-2 bg-zinc-800/50 rounded-lg border border-zinc-700 min-h-[52px]">
                {/* Status Filter */}
                <div className="flex items-center p-1 bg-zinc-700 rounded-md">
                    <button
                        onClick={() => onStatusFilterChange('all')}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${statusFilter === 'all' ? 'bg-zinc-600 text-white shadow' : 'text-zinc-300 hover:bg-zinc-600/50'}`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => onStatusFilterChange('Ativo')}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${statusFilter === 'Ativo' ? 'bg-zinc-600 text-white shadow' : 'text-zinc-300 hover:bg-zinc-600/50'}`}
                    >
                        Ativos
                    </button>
                    <button
                        onClick={() => onStatusFilterChange('Inativo')}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${statusFilter === 'Inativo' ? 'bg-zinc-600 text-white shadow' : 'text-zinc-300 hover:bg-zinc-600/50'}`}
                    >
                        Inativos
                    </button>
                </div>

                <div className="w-px h-6 bg-zinc-700"></div>

                {/* Selected Tags */}
                <div className="flex-1 flex items-center gap-2 flex-wrap">
                    {selectedTags.length > 0 ? (
                        <>
                            {selectedTags.map(tag => (
                                <span key={tag.id} className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full text-white/90" style={{ backgroundColor: tag.color }}>
                                    {tag.name}
                                    <button type="button" onClick={() => handleTagToggle(tag)} className="text-white/70 hover:text-white">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                            <button onClick={handleClearTags} className="text-xs text-violet-400 hover:text-violet-300 ml-2">Limpar filtros</button>
                        </>
                    ) : (
                        <span className="text-sm text-zinc-500">Nenhum filtro de tag aplicado</span>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                     <div className="relative z-50" ref={createMenuRef}>
                        <button
                            onClick={() => setCreateMenuOpen(prev => !prev)}
                            className="flex items-center gap-2 bg-violet-600 text-white px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-violet-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Criar</span>
                        </button>
                        <AnimatePresence>
                            {isCreateMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute top-full right-0 mt-2 w-56 bg-zinc-800 rounded-lg border border-zinc-700 shadow-lg z-20 py-1"
                                >
                                    {createMenuItems.map(item => (
                                        <button
                                            key={item.label}
                                            onClick={() => { item.action(); setCreateMenuOpen(false); }}
                                            className="w-full flex items-center justify-between px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-700/50"
                                        >
                                            <div className="flex items-center gap-2">
                                                <item.icon className="w-4 h-4 text-zinc-400" />
                                                <span>{item.label}</span>
                                            </div>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                     <div className="relative z-40">
                        <button 
                            onClick={() => setTagFilterOpen(p => !p)}
                            className="flex items-center gap-2 text-sm text-zinc-300 bg-zinc-700 hover:bg-zinc-600 px-3 py-1.5 rounded-md"
                        >
                            <Tag className="w-4 h-4" />
                            <span>Filtrar Tags</span>
                            {selectedTags.length > 0 && (
                                <span className="bg-violet-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{selectedTags.length}</span>
                            )}
                        </button>
                        <AnimatePresence>
                            {isTagFilterOpen && (
                                <TagFilterPopup
                                    allTags={allTags}
                                    selectedTags={selectedTags}
                                    onTagToggle={handleTagToggle}
                                    onClose={() => setTagFilterOpen(false)}
                                    onClear={handleClearTags}
                                />
                            )}
                        </AnimatePresence>
                    </div>
                    <div className="relative z-30">
                        <button 
                            onClick={() => setCustomizeOpen(prev => !prev)}
                            className="flex items-center gap-2 text-sm text-zinc-300 bg-zinc-700 hover:bg-zinc-600 px-3 py-1.5 rounded-md"
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            <span>Personalizar Colunas</span>
                        </button>
                        <AnimatePresence>
                            {isCustomizeOpen && (
                                <ListCustomizationPopup
                                    settings={listDisplaySettings}
                                    onUpdate={onUpdateListSettings}
                                    onClose={() => setCustomizeOpen(false)}
                                />
                            )}
                        </AnimatePresence>
                    </div>
                     <button 
                        onClick={onExportCSV}
                        className="flex items-center gap-2 text-sm text-zinc-300 bg-zinc-700 hover:bg-zinc-600 px-3 py-1.5 rounded-md"
                    >
                        <Download className="w-4 h-4" />
                        <span>Exportar CSV</span>
                    </button>
                    <button 
                        onClick={onExportPDF}
                        className="flex items-center gap-2 text-sm text-zinc-300 bg-zinc-700 hover:bg-zinc-600 px-3 py-1.5 rounded-md"
                    >
                        <Download className="w-4 h-4" />
                        <span>Exportar PDF</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LeadListHeader;