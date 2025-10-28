import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Calendar, Mail, Phone, CalendarPlus, Flag } from 'lucide-react';
import type { Lead, Tag, User, CardDisplaySettings, ColumnData } from '../types';

interface CardProps {
  lead: Lead;
  column: ColumnData;
  users: User[];
  cardDisplaySettings: CardDisplaySettings;
  isOverlay?: boolean;
  onClick?: () => void;
  isSelected?: boolean;
}

const TagPill: React.FC<{ tag: Tag }> = ({ tag }) => (
  <span 
    className="px-2 py-0.5 text-xs font-medium rounded-full text-white/90"
    style={{ backgroundColor: tag.color }}
  >
    {tag.name}
  </span>
);

const Card: React.FC<CardProps> = ({ lead, column, users, cardDisplaySettings, isOverlay = false, onClick, isSelected = false }) => {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: lead.id,
    data: {
      type: 'Lead',
      lead,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };
  
  const currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }

  const assignedUser = users.find(u => u.id === lead.assignedTo);
  const userInitials = assignedUser?.name.split(' ').map(n => n[0]).join('') || '?';

  const cardContent = (
    <div className="space-y-2">
      <div className="flex justify-between items-start">
        <h4 className="font-semibold text-gray-100 pr-2">{lead.name}</h4>
        {cardDisplaySettings.showValue && (
          <div className="text-sm font-bold text-white flex-shrink-0">
              {currencyFormatter.format(lead.value)}
          </div>
        )}
      </div>
      
      {cardDisplaySettings.showCompany && (
        <p className="text-sm text-zinc-400">{lead.company}</p>
      )}

      {cardDisplaySettings.showTags && lead.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {lead.tags.map(tag => <TagPill key={tag.id} tag={tag} />)}
        </div>
      )}
      
      {(cardDisplaySettings.showEmail || cardDisplaySettings.showPhone || cardDisplaySettings.showCreatedAt || cardDisplaySettings.showStage) && (
        <div className="mt-2 pt-2 border-t border-zinc-700/60 space-y-1.5 text-xs text-zinc-400">
            {cardDisplaySettings.showStage && (
                <div className="flex items-center gap-2">
                    <Flag className="w-3 h-3 text-zinc-500 flex-shrink-0" />
                    <span className="font-medium" style={{color: column.color}}>{column.title}</span>
                </div>
            )}
            {cardDisplaySettings.showEmail && lead.email && (
                 <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3 h-3 text-zinc-500 flex-shrink-0" />
                    <a href={`mailto:${lead.email}`} className="truncate hover:underline" onClick={e => e.stopPropagation()}>{lead.email}</a>
                </div>
            )}
            {cardDisplaySettings.showPhone && lead.phone && (
                 <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3 text-zinc-500 flex-shrink-0" />
                    <span>{lead.phone}</span>
                </div>
            )}
            {cardDisplaySettings.showCreatedAt && lead.createdAt && (
                 <div className="flex items-center gap-2">
                    <CalendarPlus className="w-3 h-3 text-zinc-500 flex-shrink-0" />
                    <span>Capturado em {formatDate(lead.createdAt)}</span>
                </div>
            )}
        </div>
      )}


      {cardDisplaySettings.showProbability && typeof lead.probability === 'number' && (
        <div className="flex items-center gap-3 pt-1">
          <div className="w-full bg-zinc-700/70 rounded-full h-1.5">
            <div className="bg-teal-400 h-1.5 rounded-full" style={{ width: `${lead.probability}%` }}></div>
          </div>
          <span className="text-xs font-medium text-zinc-400">{lead.probability}%</span>
        </div>
      )}

      {(cardDisplaySettings.showDueDate || cardDisplaySettings.showAssignedTo) && (
        <div className="flex justify-between items-center text-xs text-zinc-400 pt-2 border-t border-zinc-700/60">
          <div className="flex items-center gap-2">
            {cardDisplaySettings.showDueDate && lead.dueDate && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#14ff00]" />
                <span>{formatDate(lead.dueDate)}</span>
              </div>
            )}
          </div>
          {cardDisplaySettings.showAssignedTo && assignedUser && (
            <div className="w-6 h-6 rounded-full bg-zinc-700 text-white/80 font-bold flex items-center justify-center text-[10px]" title={assignedUser.name}>
              {userInitials}
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="p-3 rounded-lg bg-zinc-800 border border-zinc-700 opacity-50"
      >
        {cardContent}
      </div>
    );
  }

  const motionProps = isSelected
    ? { layoutId: `lead-card-${lead.id}` }
    : {};

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`p-3 rounded-lg bg-zinc-800 border border-zinc-700 cursor-grab active:cursor-grabbing transition-all ease-out duration-[140ms] ${isOverlay ? 'shadow-2xl scale-105' : 'hover:border-zinc-600 hover:-translate-y-1 hover:shadow-lg'} ${isSelected ? 'border-violet-500 ring-2 ring-violet-500/50' : ''}`}
      {...motionProps}
    >
      {cardContent}
    </motion.div>
  );
};

export default Card;