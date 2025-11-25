

import React, { useState } from 'react';
import { SlidersHorizontal, Columns, BookOpen } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import CardCustomizationPopup from './CardCustomizationPopup';
import type { CardDisplaySettings } from '../types';

interface PipelineHeaderProps {
    cardDisplaySettings: CardDisplaySettings;
    onUpdateCardSettings: (newSettings: CardDisplaySettings) => void;
    isPlaybookActionEnabled: boolean;
    onApplyPlaybookClick: () => void;
}

const PipelineHeader: React.FC<PipelineHeaderProps> = ({ cardDisplaySettings, onUpdateCardSettings, isPlaybookActionEnabled, onApplyPlaybookClick }) => {
    const [isCustomizeOpen, setCustomizeOpen] = useState(false);

    return (
        <div className="flex-shrink-0 flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
                <Columns className="w-8 h-8 text-violet-500" />
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Pipeline de Vendas</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">Arraste e solte os leads entre os estágios</p>
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