import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import Card from './Card';
import type { ColumnData, Lead, Id, User, CardDisplaySettings } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ColumnProps {
  column: ColumnData;
  leads: Lead[];
  onCardClick: (lead: Lead) => void;
  selectedLeadId?: Id | null;
  users: User[];
  cardDisplaySettings: CardDisplaySettings;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const Column: React.FC<ColumnProps> = ({ column, leads, onCardClick, selectedLeadId, users, cardDisplaySettings, isCollapsed, onToggleCollapse }) => {
  const { setNodeRef } = useDroppable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  });

  const leadsIds = React.useMemo(() => leads.map((l) => l.id), [leads]);

  if (isCollapsed) {
    return (
      <div
        ref={setNodeRef}
        className="w-14 flex-shrink-0 bg-zinc-800 rounded-lg p-2 border-l-[3px] flex flex-col items-center cursor-pointer transition-all duration-300"
        style={{ borderColor: column.color, maxHeight: 'calc(100vh - 12rem)' }}
        onClick={onToggleCollapse}
      >
        <div className="flex flex-col items-center gap-4 h-full">
          <button onClick={(e) => { e.stopPropagation(); onToggleCollapse(); }} className="p-1 rounded-full hover:bg-zinc-700/50">
            <ChevronRight className="w-5 h-5 text-zinc-400" />
          </button>
          <div className="flex-1 flex items-center">
            <h3 className="[writing-mode:vertical-rl] rotate-180 font-semibold text-gray-200 text-sm whitespace-nowrap">{column.title}</h3>
          </div>
          <span className="text-sm font-medium text-gray-400 bg-zinc-900/50 rounded-full px-2 py-0.5 text-xs">{leads.length}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-72 md:w-80 flex-shrink-0 flex flex-col transition-all duration-300"
    >
      <div 
        ref={setNodeRef}
        className={`flex flex-col bg-zinc-800 rounded-lg p-3 border-l-[3px]`}
        style={{ borderColor: column.color, maxHeight: 'calc(100vh - 12rem)' }} // This caps the column height
      >
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: column.color }}></div>
              <h3 className="font-semibold text-gray-200 text-sm">{column.title}</h3>
              <span className="text-sm font-medium text-gray-400 bg-zinc-900/50 rounded-full px-2 py-0.5 text-xs">{leads.length}</span>
          </div>
          <button onClick={onToggleCollapse} className="p-1 rounded-full hover:bg-zinc-700/50">
            <ChevronLeft className="w-5 h-5 text-zinc-400" />
          </button>
        </div>
        <div className="overflow-y-auto pr-1 -mr-1 space-y-3 pb-2">
          <SortableContext items={leadsIds} strategy={verticalListSortingStrategy}>
            {leads.length > 0 ? leads.map((lead) => (
              <Card
                key={lead.id}
                lead={lead}
                column={column}
                onClick={() => onCardClick(lead)}
                isSelected={selectedLeadId === lead.id}
                users={users}
                cardDisplaySettings={cardDisplaySettings}
              />
            )) : (
              <div className="flex items-center justify-center min-h-[120px] bg-transparent border-2 border-dashed border-zinc-700/80 rounded-lg">
                  <p className="text-sm text-zinc-500">Nenhum lead</p>
              </div>
            )}
          </SortableContext>
        </div>
      </div>
    </div>
  );
};

export default Column;