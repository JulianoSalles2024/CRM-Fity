
import React from 'react';
import Column from './Column';
import type { ColumnData, Lead, Id, User, CardDisplaySettings } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface KanbanBoardProps {
  columns: ColumnData[];
  leadsByColumn: { [key: Id]: Lead[] };
  onCardClick: (lead: Lead) => void;
  selectedLeadId?: Id | null;
  users: User[];
  cardDisplaySettings: CardDisplaySettings;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ columns, leadsByColumn, onCardClick, selectedLeadId, users, cardDisplaySettings }) => {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = React.useState({ thumbWidth: 0, thumbPosition: 0 });
  const [collapsedColumns, setCollapsedColumns] = React.useState<Set<Id>>(new Set());

  const toggleColumnCollapse = (columnId: Id) => {
    setCollapsedColumns(prev => {
        const newSet = new Set(prev);
        if (newSet.has(columnId)) {
            newSet.delete(columnId);
        } else {
            newSet.add(columnId);
        }
        return newSet;
    });
  };

  const updateScrollbar = React.useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollWidth, clientWidth, scrollLeft } = container;
      if (scrollWidth > clientWidth) {
        const thumbWidthPercent = (clientWidth / scrollWidth) * 100;
        const thumbPositionPercent = (scrollLeft / (scrollWidth - clientWidth)) * (100 - thumbWidthPercent);
        setScrollState({ thumbWidth: thumbWidthPercent, thumbPosition: thumbPositionPercent });
      } else {
        setScrollState({ thumbWidth: 100, thumbPosition: 0 });
      }
    }
  }, []);

  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      updateScrollbar();
      container.addEventListener('scroll', updateScrollbar);
      const resizeObserver = new ResizeObserver(updateScrollbar);
      resizeObserver.observe(container);
      
      return () => {
        container.removeEventListener('scroll', updateScrollbar);
        resizeObserver.unobserve(container);
      };
    }
  }, [updateScrollbar, collapsedColumns]);

  const scrollBy = (amount: number) => {
    scrollContainerRef.current?.scrollBy({ left: amount, behavior: 'smooth' });
  };


  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-end items-center mb-4">
        <div className="flex items-center gap-2">
            <button 
              onClick={() => scrollBy(-320)} 
              className="p-1 rounded-full text-zinc-400 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed"
              disabled={scrollState.thumbPosition <= 0}
            >
              <ChevronLeft className="w-5 h-5 text-violet-500/70 hover:text-violet-500" />
            </button>
            <button 
              onClick={() => scrollBy(320)} 
              className="p-1 rounded-full text-zinc-400 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed"
              disabled={scrollState.thumbPosition >= (100 - scrollState.thumbWidth) - 0.1}
              >
              <ChevronRight className="w-5 h-5 text-violet-500/70 hover:text-violet-500" />
            </button>
        </div>
      </div>
      <div ref={scrollContainerRef} className="flex items-start gap-4 flex-1 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style>{`
          .overflow-x-auto::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {columns.map((col) => {
          const leads = leadsByColumn[col.id] || [];
          return (
            <Column
              key={col.id}
              column={col}
              leads={leads}
              onCardClick={onCardClick}
              selectedLeadId={selectedLeadId}
              users={users}
              cardDisplaySettings={cardDisplaySettings}
              isCollapsed={collapsedColumns.has(col.id)}
              onToggleCollapse={() => toggleColumnCollapse(col.id)}
            />
          );
        })}
      </div>
      <div className="flex-shrink-0 pt-2 flex items-center gap-3">
        <button 
          onClick={() => scrollBy(-320)} 
          className="p-1 rounded-full text-zinc-400 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed"
          disabled={scrollState.thumbPosition <= 0}
        >
          <ChevronLeft className="w-5 h-5 text-violet-500/70 hover:text-violet-500" />
        </button>
        <div className="w-full bg-zinc-700/50 rounded-full h-2 relative">
          <div
            className="bg-zinc-500 h-2 rounded-full absolute"
            style={{ width: `${scrollState.thumbWidth}%`, left: `${scrollState.thumbPosition}%` }}
          />
        </div>
        <button 
          onClick={() => scrollBy(320)} 
          className="p-1 rounded-full text-zinc-400 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed"
          disabled={scrollState.thumbPosition >= (100 - scrollState.thumbWidth) - 0.1}
          >
          <ChevronRight className="w-5 h-5 text-violet-500/70 hover:text-violet-500" />
        </button>
      </div>
    </div>
  );
};

export default KanbanBoard;
