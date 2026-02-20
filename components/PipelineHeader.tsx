

import React, { useState } from 'react';
import { SlidersHorizontal, Columns, BookOpen, ChevronDown, Plus, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import CardCustomizationPopup from './CardCustomizationPopup';
import type { CardDisplaySettings, Board, Id } from '../types';

interface PipelineHeaderProps {
    cardDisplaySettings: CardDisplaySettings;
    onUpdateCardSettings: (newSettings: CardDisplaySettings) => void;
    isPlaybookActionEnabled: boolean;
    onApplyPlaybookClick: () => void;
    boards: Board[];
    activeBoardId: Id;
    onSelectBoard: (boardId: Id) => void;
    onCreateBoardClick: () => void;
}

const PipelineHeader: React.FC<PipelineHeaderProps> = ({ 
    cardDisplaySettings, 
    onUpdateCardSettings, 
    isPlaybookActionEnabled, 
    onApplyPlaybookClick,
    boards,
    activeBoardId,
    onSelectBoard,
    onCreateBoardClick
}) => {
    const [isCustomizeOpen, setCustomizeOpen] = useState(false);
    const [isBoardMenuOpen, setBoardMenuOpen] = useState(false);

    const activeBoard = boards.find(b => b.id === activeBoardId) || boards[0];

    return (
        <div className="flex-shrink-0 flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
                <div className="relative">
                    <button 
                        onClick={() => setBoardMenuOpen(!isBoardMenuOpen)}
                        className="flex items-center gap-2 text-2xl font-bold text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                        {activeBoard?.name}
                        <ChevronDown className={`w-5 h-5 text-zinc-500 transition-transform ${isBoardMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {isBoardMenuOpen && (
                            <>
                                <div 
                                    className="fixed inset-0 z-40" 
                                    onClick={() => setBoardMenuOpen(false)}
                                ></div>
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-full left-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden"
                                >
                                    <div className="p-2 space-y-1">
                                        {boards.map(board => (
                                            <button
                                                key={board.id}
                                                onClick={() => {
                                                    onSelectBoard(board.id);
                                                    setBoardMenuOpen(false);
                                                }}
                                                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-2 h-2 rounded-full ${board.id === activeBoardId ? 'bg-blue-500' : 'bg-slate-600 group-hover:bg-slate-500'}`}></span>
                                                    <div className="text-left">
                                                        <span className={`block text-sm font-medium ${board.id === activeBoardId ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                                            {board.name}
                                                        </span>
                                                        <span className="block text-xs text-slate-500">Parte da jornada: Sim</span>
                                                    </div>
                                                </div>
                                                {board.id === activeBoardId && <Check className="w-4 h-4 text-blue-500" />}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="p-2 border-t border-slate-800">
                                        <button
                                            onClick={() => {
                                                onCreateBoardClick();
                                                setBoardMenuOpen(false);
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-blue-400 hover:bg-slate-800 hover:text-blue-300 transition-colors text-sm font-medium"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Criar novo board
                                        </button>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="flex items-center gap-2">
                 <button
                    onClick={onApplyPlaybookClick}
                    disabled={!isPlaybookActionEnabled}
                    className="flex items-center gap-2 text-sm text-white bg-violet-600 px-3 py-1.5 rounded-md font-semibold transition-colors hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <BookOpen className="w-4 h-4" />
                    <span>Aplicar Playbook</span>
                </button>
                 <div className="relative">
                    <button
                        onClick={() => setCustomizeOpen(prev => !prev)}
                        className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-700 px-3 py-1.5 rounded-md"
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        <span>Personalizar Cards</span>
                    </button>
                    <AnimatePresence>
                        {isCustomizeOpen && (
                            <CardCustomizationPopup
                                settings={cardDisplaySettings}
                                onUpdate={onUpdateCardSettings}
                                onClose={() => setCustomizeOpen(false)}
                            />
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default PipelineHeader;