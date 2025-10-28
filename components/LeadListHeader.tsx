
import React, { useState } from 'react';
import { Users, Contact, SlidersHorizontal } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import ListCustomizationPopup from './ListCustomizationPopup';
import type { ListDisplaySettings } from '../types';

interface LeadListHeaderProps {
    viewType: 'Leads' | 'Clientes';
    listDisplaySettings: ListDisplaySettings;
    onUpdateListSettings: (newSettings: ListDisplaySettings) => void;
}

const LeadListHeader: React.FC<LeadListHeaderProps> = ({ viewType, listDisplaySettings, onUpdateListSettings }) => {
    const [isCustomizeOpen, setCustomizeOpen] = useState(false);
    const isClientsView = viewType === 'Clientes';
    const Icon = isClientsView ? Contact : Users;
    const title = isClientsView ? 'Clientes' : 'Leads';
    const description = isClientsView ? 'Gerencie seus clientes e relacionamentos' : 'Gerencie todos os seus leads e clientes';


    return (
        <div className="flex flex-col gap-4">
             <div className="flex items-center gap-4">
                 <Icon className="w-8 h-8 text-violet-500" />
                <div>
                    <h1 className="text-2xl font-bold text-white">{title}</h1>
                    <p className="text-zinc-400">{description}</p>
                </div>
            </div>
             <div className="flex items-center justify-end p-2 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <div className="relative">
                    <button 
                        onClick={() => setCustomizeOpen(prev => !prev)}
                        className="flex items-center gap-2 text-sm text-zinc-300 bg-zinc-700 hover:bg-zinc-600 px-3 py-1.5 rounded-md"
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        <span>Personalizar Colunas</span>
                    </button>
                    <AnimatePresence>
                        {isCustomizeOpen && (
                            <ListCustomizationPopup
                                settings={listDisplaySettings}
                                onUpdate={onUpdateListSettings}
                                onClose={() => setCustomizeOpen(false)}
                            />
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default LeadListHeader;
