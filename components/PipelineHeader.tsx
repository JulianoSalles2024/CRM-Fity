
import React, { useState } from 'react';
import { Columns, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import CardCustomizationPopup from './CardCustomizationPopup';
import type { CardDisplaySettings } from '../types';

interface PipelineHeaderProps {
    cardDisplaySettings: CardDisplaySettings;
    onUpdateCardSettings: (newSettings: CardDisplaySettings) => void;
}

const PipelineHeader: React.FC<PipelineHeaderProps> = ({ cardDisplaySettings, onUpdateCardSettings }) => {
    const [isCustomizeOpen, setCustomizeOpen] = useState(false);

    return (
        <div className="flex flex-col gap-4 mb-6">
             <div className="flex items-center gap-4">
                 <Columns className="w-8 h-8 text-violet-500" />
                <div>
                    <h1 className="text-2xl font-bold text-white">Pipeline</h1>
                    <p className="text-zinc-400">Gerencie seus leads através do funil de vendas</p>
                </div>
            </div>
            <div className="flex items-center justify-between p-2 bg-zinc-800/50 rounded-lg border border-zinc-700">
                {/* Left side - Placeholder for "Stacked by" */}
                <div className="flex items-center gap-2">
                     <button className="flex items-center gap-2 text-sm text-zinc-300 bg-zinc-700 hover:bg-zinc-600 px-3 py-1.5 rounded-md">
                        <Columns className="w-4 h-4" />
                        <span>Stacked by Estágio do Pipeline</span>
                        <ChevronDown className="w-4 h-4 text-zinc-500" />
                    </button>
                </div>
                {/* Right side - Customize Button */}
                <div className="relative">
                    <button 
                        onClick={() => setCustomizeOpen(prev => !prev)}
                        className="flex items-center gap-2 text-sm text-zinc-300 bg-zinc-700 hover:bg-zinc-600 px-3 py-1.5 rounded-md"
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        <span>Customize cards</span>
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
