import React, { useState, useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { DollarSign, Tag, Clock, Building, TrendingUp, Calendar, Mail, Phone, ChevronDown, ChevronUp, MessageCircle, BookOpen, Briefcase, ShieldCheck, ShieldX, AlertCircle } from 'lucide-react';
import type { Lead, CardDisplaySettings, User as UserType, Id, Task } from '../types';
import { GlassCard } from '@/src/shared/components/GlassCard';

interface CardProps {
    lead: Lead;
    displaySettings: CardDisplaySettings;
    users: UserType[];
    tasks: Task[];
    onSelect: () => void;
    isSelected: boolean;
    minimizedLeads: Id[];
    onToggleLeadMinimize: (leadId: Id) => void;
}

const TagPill: React.FC<{ tag: { name: string, color: string } }> = ({ tag }) => (
    <span
        className="px-2 py-0.5 text-xs font-medium rounded-full text-white/90"
        style={{ backgroundColor: tag.color }}
    >
        {tag.name}
    </span>
);

const Card: React.FC<CardProps> = ({ lead, displaySettings, users, tasks, onSelect, isSelected, minimizedLeads, onToggleLeadMinimize }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: lead.id, data: { type: 'Lead', lead } });
    
    const [isHovered, setIsHovered] = useState(false);
    const isMinimized = minimizedLeads.includes(lead.id);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };
    
    const assignedUser = users.find(u => u.id === lead.assignedTo);
    const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
    const formatDate = (dateString?: string) => dateString ? new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) : 'N/A';
    
    const overdueTasksCount = useMemo(() => {
        if (!tasks) return 0;
        const now = new Date();
        return tasks.filter(t => 
            t.leadId === lead.id && 
            t.status === 'pending' && 
            new Date(t.dueDate).getTime() < now.getTime()
        ).length;
    }, [tasks, lead.id]);

    const cardContentVariants: Variants = {
        hidden: { opacity: 0, height: 0 },
        visible: { opacity: 1, height: 'auto', transition: { duration: 0.2, ease: "easeInOut" } },
    };

    const handleWhatsAppClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!lead.phone) return;

        let sanitizedPhone = lead.phone.replace(/\D/g, '').slice(0, 11);

        if (sanitizedPhone.length >= 10 && !sanitizedPhone.startsWith('55')) {
            sanitizedPhone = '55' + sanitizedPhone;
        }
        
        const url = `https://wa.me/${sanitizedPhone}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const qualificationIcon = lead.qualificationStatus === 'qualified' 
        ? <span title="Qualificado"><ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0" /></span> 
        : lead.qualificationStatus === 'disqualified' 
        ? <span title="Não Qualificado"><ShieldX className="w-4 h-4 text-slate-500 flex-shrink-0" /></span> 
        : null;

    return (
        <motion.div
            layout
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onSelect}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="touch-none"
        >
            <GlassCard
                className={`cursor-grab active:cursor-grabbing hover:shadow-lg hover:shadow-violet-500/10 dark:hover:shadow-violet-500/20 transition-all duration-150 ${isMinimized ? 'p-3' : 'p-4'} ${isSelected ? 'border-violet-500 ring-2 ring-violet-500/50' : 'border-white/10 hover:border-violet-500'}`}
            >
                <div className="flex justify-between items-center gap-2">
                     <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        {qualificationIcon}
                        <h3 className="font-bold text-slate-900 dark:text-white text-md leading-tight truncate">{lead.name}</h3>
                        {isMinimized && lead.activePlaybook && (
                            <div title={lead.activePlaybook.playbookName} className="flex-shrink-0">
                                <BookOpen className="w-4 h-4 text-violet-500" />
                            </div>
                        )}
                        {isMinimized && overdueTasksCount > 0 && (
                            <div title={`${overdueTasksCount} tarefa(s) atrasada(s)`} className="flex-shrink-0">
                                <AlertCircle className="w-4 h-4 text-red-500" />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                        {isHovered && !isMinimized && lead.phone && (
                            <button
                                onClick={handleWhatsAppClick}
                                className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-green-500/10 dark:hover:bg-green-500/20 hover:text-green-500 dark:hover:text-green-400 transition-colors"
                                title="Abrir conversa no WhatsApp"
                            >
                                <MessageCircle className="w-4 h-4" />
                            </button>
                        )}
                        {(isHovered || isMinimized) && (
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleLeadMinimize(lead.id);
                                }}
                                className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                                title={isMinimized ? "Expandir card" : "Minimizar card"}
                            >
                                {isMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                            </button>
                        )}
                        {displaySettings.showAssignedTo && assignedUser && (
                            <div title={assignedUser.name} className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-white ring-1 ring-white dark:ring-slate-900">
                                 {assignedUser.name.split(' ').map(n => n[0]).join('')}
                            </div>
                        )}
                    </div>
                </div>
                
                <AnimatePresence initial={false}>
                    {!isMinimized && (
                        <motion.div
                            key="content"
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            variants={cardContentVariants}
                            className="overflow-hidden"
                        >
                            <div className="pt-3 space-y-3">
                                <div className="flex flex-wrap gap-2">
                                    {lead.activePlaybook && (
                                        <div className="flex items-center gap-2 text-xs font-semibold text-violet-400 bg-violet-900/40 px-2 py-1 rounded-md">
                                            <BookOpen className="w-3.5 h-3.5" />
                                            <span className="truncate max-w-[150px]">{lead.activePlaybook.playbookName}</span>
                                        </div>
                                    )}
                                    {overdueTasksCount > 0 && (
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-red-400 bg-red-900/40 px-2 py-1 rounded-md" title={`${overdueTasksCount} tarefas atrasadas`}>
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            <span>{overdueTasksCount} Atraso{overdueTasksCount > 1 ? 's' : ''}</span>
                                        </div>
                                    )}
                                </div>

                                {displaySettings.showCompany && <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2"><Building className="w-3.5 h-3.5 flex-shrink-0" /> {lead.company}</p>}
                                
                                {displaySettings.showSegment && lead.segment && (
                                   <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                       <Briefcase className="w-3.5 h-3.5 flex-shrink-0" /> {lead.segment}
                                   </p>
                               )}

                                {displaySettings.showValue && (
                                    <p className="text-sm font-semibold text-teal-700 dark:text-teal-400 flex items-center gap-2">
                                        <DollarSign className="w-3.5 h-3.5 flex-shrink-0" />
                                        {currencyFormatter.format(lead.value)}
                                    </p>
                                )}
                                
                                {displaySettings.showEmail && <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2 truncate"><Mail className="w-3.5 h-3.5 flex-shrink-0" /> {lead.email || 'N/A'}</p>}
                                {displaySettings.showPhone && <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2"><Phone className="w-3.5 h-3.5 flex-shrink-0" /> {lead.phone || 'N/A'}</p>}

                                {displaySettings.showTags && lead.tags.length > 0 && (
                                     <div className="flex flex-wrap gap-1.5 items-center">
                                        <Tag className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                                        {lead.tags.map(tag => <TagPill key={tag.id} tag={tag} />)}
                                    </div>
                                )}
                                
                                {typeof lead.probability === 'number' && (
                                     <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                        <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span>Probabilidade: {lead.probability}%</span>
                                    </div>
                                )}

                                <div className="border-t border-white/10 pt-2 text-xs text-slate-400 dark:text-slate-500 space-y-1.5">
                                    {displaySettings.showDueDate && lead.dueDate && (
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3 h-3 flex-shrink-0" />
                                            <span>Vencimento: {formatDate(lead.dueDate)}</span>
                                        </div>
                                    )}
                                     {displaySettings.showCreatedAt && lead.createdAt && (
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-3 h-3 flex-shrink-0" />
                                            <span>Capturado em: {formatDate(lead.createdAt)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </GlassCard>
        </motion.div>
    );
};

export default Card;