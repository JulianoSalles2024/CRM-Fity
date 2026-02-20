

import React, { useState, useMemo } from 'react';
import {
    DndContext,
    DragEndEvent,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCenter,
    DragOverlay,
} from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import Column from './Column';
import Card from './Card';
import PipelineHeader from './PipelineHeader';
import type { ColumnData, Lead, Id, User, CardDisplaySettings, Task, Board } from '@/shared/types';

interface KanbanBoardProps {
    columns: ColumnData[];
    leads: Lead[];
    users: User[];
    tasks: Task[];
    cardDisplaySettings: CardDisplaySettings;
    onUpdateLeadColumn: (leadId: Id, newColumnId: Id) => void;
    onSelectLead: (lead: Lead) => void;
    selectedLeadId: Id | null;
    onAddLead: (columnId: Id) => void;
    onUpdateCardSettings: (newSettings: CardDisplaySettings) => void;
    minimizedLeads: Id[];
    onToggleLeadMinimize: (leadId: Id) => void;
    minimizedColumns: Id[];
    onToggleColumnMinimize: (columnId: Id) => void;
    isPlaybookActionEnabled: boolean;
    onApplyPlaybookClick: () => void;
    boards: Board[];
    activeBoardId: Id;
    onSelectBoard: (boardId: Id) => void;
    onCreateBoardClick: () => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
    columns, 
    leads, 
    users,
    tasks,
    cardDisplaySettings,
    onUpdateLeadColumn, 
    onSelectLead,
    selectedLeadId,
    onAddLead,
    onUpdateCardSettings,
    minimizedLeads,
    onToggleLeadMinimize,
    minimizedColumns,
    onToggleColumnMinimize,
    isPlaybookActionEnabled,
    onApplyPlaybookClick,
    boards,
    activeBoardId,
    onSelectBoard,
    onCreateBoardClick
}) => {
    const [activeLead, setActiveLead] = useState<Lead | null>(null);
    const columnIds = useMemo(() => columns.map(c => c.id), [columns]);

    const sensors = useSensors(useSensor(PointerSensor, {
        activationConstraint: {
            distance: 10, // 10px threshold to start dragging
        },
    }));

    function handleDragStart(event: DragStartEvent) {
        const lead = leads.find(l => l.id === event.active.id);
        if (lead) {
            setActiveLead(lead);
        }
    }

    function handleDragEnd(event: DragEndEvent) {
        setActiveLead(null);
        const { active, over } = event;
        if (!over) return;

        const activeLeadData = leads.find(l => l.id === active.id);
        
        // Find the column ID we're dropping over. It could be the column itself or another card in that column.
        const overId = over.id;
        const overIsColumn = columns.some(c => c.id === overId);
        const overLead = overIsColumn ? null : leads.find(l => l.id === overId);
        const overColumnId = overIsColumn ? overId : overLead?.columnId;


        if (activeLeadData && overColumnId && activeLeadData.columnId !== overColumnId) {
            onUpdateLeadColumn(active.id, overColumnId);
        }
    }
    
    return (
        <div className="flex flex-col h-full">
            <div className="relative z-10">
                <PipelineHeader 
                    cardDisplaySettings={cardDisplaySettings} 
                    onUpdateCardSettings={onUpdateCardSettings}
                    isPlaybookActionEnabled={isPlaybookActionEnabled}
                    onApplyPlaybookClick={onApplyPlaybookClick}
                    boards={boards}
                    activeBoardId={activeBoardId}
                    onSelectBoard={onSelectBoard}
                    onCreateBoardClick={onCreateBoardClick}
                />
            </div>
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
                <DndContext
                    sensors={sensors}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    collisionDetection={closestCenter}
                >
                    <div className="flex gap-4 h-full pb-4">
                        {/* We don't need SortableContext for columns if they are not reorderable */}
                        {columns.map(col => (
                            <Column
                                key={col.id}
                                column={col}
                                leads={leads}
                                users={users}
                                tasks={tasks}
                                cardDisplaySettings={cardDisplaySettings}
                                onSelectLead={onSelectLead}
                                selectedLeadId={selectedLeadId}
                                onAddLead={onAddLead}
                                minimizedLeads={minimizedLeads}
                                onToggleLeadMinimize={onToggleLeadMinimize}
                                minimizedColumns={minimizedColumns}
                                onToggleColumnMinimize={onToggleColumnMinimize}
                            />
                        ))}
                    </div>
                     <DragOverlay>
                        {activeLead ? (
                             <Card 
                                lead={activeLead} 
                                displaySettings={cardDisplaySettings}
                                users={users}
                                tasks={tasks}
                                onSelect={() => {}}
                                isSelected={false}
                                minimizedLeads={minimizedLeads}
                                onToggleLeadMinimize={onToggleLeadMinimize}
                            />
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>
        </div>
    );
};

export default KanbanBoard;