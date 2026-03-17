import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import Card from './Card';
import type { ColumnData, Lead, User, CardDisplaySettings, Id, Task, Board } from '@/types';
import { PlusCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import FlatCard from '@/components/ui/FlatCard';

interface ColumnProps {
    column: ColumnData;
    leads: Lead[];
    users: User[];
    tasks: Task[];
    cardDisplaySettings: CardDisplaySettings;
    onSelectLead: (lead: Lead) => void;
    selectedLeadId: Id | null;
    onAddLead: (columnId: Id) => void;
    minimizedLeads: Id[];
    onToggleLeadMinimize: (leadId: Id) => void;
    minimizedColumns: Id[];
    onToggleColumnMinimize: (columnId: Id) => void;
    boards?: Board[];
    onMoveToBoardClick?: (lead: Lead) => void;
}

const contentVariants = {
    hidden: { opacity: 0, transition: { duration: 0.2 } },
    visible: { opacity: 1, transition: { duration: 0.2, delay: 0.1 } },
};

const Column: React.FC<ColumnProps> = ({ column, leads, users, tasks, cardDisplaySettings, onSelectLead, selectedLeadId, onAddLead, minimizedLeads, onToggleLeadMinimize, minimizedColumns, onToggleColumnMinimize, boards, onMoveToBoardClick }) => {
    const { setNodeRef, isOver } = useDroppable({ id: column.id, data: { type: 'Column', column } });
    
    const leadsInColumn = leads.filter(lead => lead.columnId === column.id && !lead.reactivationDate);
    const leadIds = React.useMemo(() => leadsInColumn.map(l => l.id), [leadsInColumn]);

    const totalValue = leadsInColumn.reduce((sum, lead) => sum + lead.value, 0);
    const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
    
    const isMinimized = minimizedColumns.includes(column.id);

    return (
        <motion.div
            ref={setNodeRef}
            layout
            animate={{ width: isMinimized ? 72 : 320 }}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
            className="flex-shrink-0 h-full"
        >
            <FlatCard className={`flex flex-col h-full p-0 transition-all duration-200 ${isOver ? 'bg-blue-500/5 ring-2 ring-inset ring-blue-500/20' : ''}`}>
                <AnimatePresence initial={false}>
                    {isMinimized ? (
                        <motion.div
                            key="minimized"
                            variants={contentVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            className="flex flex-col items-center justify-between h-full p-2 overflow-hidden border-t-[3px]"
                            style={{ borderTopColor: column.color }}
                        >
                            <button onClick={() => onToggleColumnMinimize(column.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition-colors" title="Expandir coluna">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                            <div className="flex-1 flex flex-col items-center justify-center gap-4 py-4 cursor-default">
                                <h2 className="font-bold text-white text-sm [writing-mode:vertical-rl] transform-gpu rotate-180 whitespace-nowrap">
                                    {column.title}
                                </h2>
                                <div className="text-center">
                                    <p className="font-bold text-sm tabular-nums" style={{ color: column.color }}>{leadsInColumn.length}</p>
                                    <p className="text-[10px] text-slate-600">leads</p>
                                </div>
                            </div>
                            <button onClick={() => onAddLead(column.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition-colors" title="Adicionar lead">
                                <PlusCircle className="w-4 h-4" />
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="expanded"
                            variants={contentVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            className="flex flex-col max-h-full"
                        >
                            {/* Expanded Column Header */}
                            <div className="px-4 pt-3 pb-3 flex justify-between items-center flex-shrink-0 border-t-[3px] border-b border-b-white/5" style={{ borderTopColor: column.color }}>
                                <div>
                                    <h2 className="font-bold text-white text-sm tracking-wide">{column.title}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-semibold text-slate-400 tabular-nums"
                                            style={{ color: column.color }}>
                                            {leadsInColumn.length}
                                        </span>
                                        <span className="text-xs text-slate-600">leads</span>
                                        <span className="text-xs text-slate-600">·</span>
                                        <span className="text-xs text-slate-500 tabular-nums">{currencyFormatter.format(totalValue)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-0.5">
                                    <button onClick={() => onAddLead(column.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition-colors" title="Adicionar lead a este estágio">
                                        <PlusCircle className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => onToggleColumnMinimize(column.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition-colors" title="Minimizar coluna">
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            
                            {/* Expanded Column Body */}
                            <div className="p-2 flex-1 overflow-y-auto">
                                <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
                                    <div className="space-y-2">
                                        {leadsInColumn.map(lead => (
                                            <Card
                                                key={lead.id}
                                                lead={lead}
                                                columnType={column.type}
                                                displaySettings={cardDisplaySettings}
                                                users={users}
                                                tasks={tasks}
                                                onSelect={() => onSelectLead(lead)}
                                                isSelected={selectedLeadId === lead.id}
                                                minimizedLeads={minimizedLeads}
                                                onToggleLeadMinimize={onToggleLeadMinimize}
                                                boards={boards}
                                                onMoveToBoardClick={onMoveToBoardClick}
                                            />
                                        ))}
                                        {leadsInColumn.length === 0 && (
                                            <div className="flex flex-col items-center justify-center py-10 gap-2 rounded-xl border border-dashed border-white/8">
                                                <PlusCircle className="w-5 h-5 text-slate-700" />
                                                <span className="text-xs text-slate-700">Solte leads aqui</span>
                                            </div>
                                        )}
                                    </div>
                                </SortableContext>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </FlatCard>
        </motion.div>
    );
};

export default Column;