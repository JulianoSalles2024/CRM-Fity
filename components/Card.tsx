import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
// FIX: Added Variants to the import to fix typing issue with cardContentVariants.
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { DollarSign, Tag, Clock, Building, TrendingUp, Calendar, Mail, Phone, ChevronDown, ChevronUp, MessageCircle, BookOpen, Briefcase, ShieldCheck, ShieldX } from 'lucide-react';
import type { Lead, CardDisplaySettings, User as UserType, Id } from '../types';

interface CardProps {
    lead: Lead;
    displaySettings: CardDisplaySettings;
    users: UserType[];
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

const Card: React.FC<CardProps> = ({ lead, displaySettings, users, onSelect, isSelected, minimizedLeads, onToggleLeadMinimize }) => {
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
    
    // FIX: Added Variants type to ensure correct type inference for framer-motion properties like 'ease'.
    const cardContentVariants: Variants = {
        hidden: { opacity: 0, height: 0 },
        visible: { opacity: 1, height: 'auto', transition: { duration: 0.2, ease: "easeInOut" } },
    };

    const handleWhatsAppClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!lead.phone) return;

        // Sanitize phone number: remove non-numeric characters
        let sanitizedPhone = lead.phone.replace(/\D/g, '').slice(0, 11);

        // Add country code for Brazil (55) if not present.
        if (sanitizedPhone.length >= 10 && !sanitizedPhone.startsWith('55')) {
            sanitizedPhone = '55' + sanitizedPhone;
        }
        
        const url = `https://wa.me/${sanitizedPhone}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const qualificationIcon = lead.qualificationStatus === 'qualified' 
// FIX: The `title` prop is not recognized on Lucide icons. Wrapped the icon in a `span` with a `title` attribute to provide a tooltip and resolve the type error.
        ? <span title="Qualificado"><ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0" /></span> 
        : lead.qualificationStatus === 'disqualified' 
// FIX: The `title` prop is not recognized on Lucide icons. Wrapped the icon in a `span` with a `title` attribute to provide a tooltip and resolve the type error.
        ? <span title="Não Qualificado"><ShieldX className="w-4 h-4 text-zinc-500 flex-shrink-0" /></span> 
        : null;

    return (
        <motion.div
            layout // Animate layout changes (e.g., height)
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onSelect}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`bg-white dark:bg-zinc-900 rounded-lg border shadow-sm cursor-grab active:cursor-grabbing hover:bg-gray-50 dark:hover:bg-zinc-800/50 hover:shadow-lg hover:shadow-violet-500/10 dark:hover:shadow-violet-500/20 transition-all duration-150 touch-none ${isMinimized ? 'p-3' : 'p-4'} ${isSelected ? 'border-violet-500 ring-2 ring-violet-500/50' : 'border-zinc-200 dark:border-zinc-800 hover:border-violet-500'}`}
        >
            <div className="flex justify-between items-center gap-2">
                 <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {qualificationIcon}
                    <h3 className="font-bold text-zinc-900 dark:text-white text-md leading-tight truncate">{lead.name}</h3>
                    {isMinimized && lead.activePlaybook && (
                        <div title={lead.activePlaybook.playbookName} className="flex-shrink-0">
                            <BookOpen className="w-4 h-4 text-violet-500" />
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                    {isHovered && !isMinimized && lead.phone && (
                        <button
                            onClick={handleWhatsAppClick}
                            className="p-1 rounded-full text-zinc-500 dark:text-zinc-400 hover:bg-green-500/10 dark:hover:bg-green-500/20 hover:text-green-500 dark:hover:text-green-400 transition-colors"
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
                            className="p-1 rounded-full text-zinc-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"
                            title={isMinimized ? "Expandir card" : "Minimizar card"}
                        >
                            {isMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        </button>
                    )}
                    {displaySettings.showAssignedTo && assignedUser && (
                        <div title={assignedUser.name} className="w-7 h-7 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center font-bold text-xs text-zinc-600 dark:text-white ring-1 ring-white dark:ring-zinc-900">
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
                            {lead.activePlaybook && (
                                <div className="flex items-center gap-2 text-xs font-semibold text-violet-400 bg-violet-900/40 px-2 py-1 rounded-md">
                                    <BookOpen className="w-3.5 h-3.5" />
                                    <span className="truncate">{lead.activePlaybook.playbookName}</span>
                                </div>
                            )}

                            {displaySettings.showCompany && <p className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-2"><Building className="w-3.5 h-3.5 flex-shrink-0" /> {lead.company}</p>}
                            
                            {displaySettings.showSegment && lead.segment && (
                               <p className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                                   <Briefcase className="w-3.5 h-3.5 flex-shrink-0" /> {lead.segment}
                               </p>
                           )}

                            {displaySettings.showValue && (
                                <p className="text-sm font-semibold text-teal-700 dark:text-teal-400 flex items-center gap-2">
                                    <DollarSign className="w-3.5 h-3.5 flex-shrink-0" />
                                    {currencyFormatter.format(lead.value)}
                                </p>
                            )}
                            
                            {displaySettings.showEmail && <p className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-2 truncate"><Mail className="w-3.5 h-3.5 flex-shrink-0" /> {lead.email || 'N/A'}</p>}
                            {displaySettings.showPhone && <p className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-2"><Phone className="w-3.5 h-3.5 flex-shrink-0" /> {lead.phone || 'N/A'}</p>}

                            {displaySettings.showTags && lead.tags.length > 0 && (
                                 <div className="flex flex-wrap gap-1.5 items-center">
                                    <Tag className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
                                    {lead.tags.map(tag => <TagPill key={tag.id} tag={tag} />)}
                                </div>
                            )}
                            
                            {typeof lead.probability === 'number' && (
                                 <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                                    <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span>Probabilidade: {lead.probability}%</span>
                                </div>
                            )}

                            <div className="border-t border-zinc-200/80 dark:border-zinc-700/50 pt-2 text-xs text-zinc-400 dark:text-zinc-500 space-y-1.5">
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
        </motion.div>
    );
};

export default Card;