import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { ListDisplaySettings } from '../types';

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void }> = ({ checked, onChange }) => (
    <button onClick={() => onChange(!checked)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-violet-600' : 'bg-zinc-600'}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}/>
    </button>
);

interface ListCustomizationPopupProps {
    settings: ListDisplaySettings;
    onUpdate: (newSettings: ListDisplaySettings) => void;
    onClose: () => void;
}

const ListCustomizationPopup: React.FC<ListCustomizationPopupProps> = ({ settings, onUpdate, onClose }) => {
    const popupRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    const handleToggle = (key: keyof ListDisplaySettings) => {
        onUpdate({ ...settings, [key]: !settings[key] });
    };

    const settingOptions: { key: keyof ListDisplaySettings; label: string }[] = [
        { key: 'showStatus', label: 'Mostrar Status' },
        { key: 'showValue', label: 'Mostrar Valor' },
        { key: 'showTags', label: 'Mostrar Tags' },
        { key: 'showLastActivity', label: 'Mostrar Última Atividade' },
        { key: 'showEmail', label: 'Mostrar E-mail' },
        { key: 'showPhone', label: 'Mostrar Telefone' },
        { key: 'showCreatedAt', label: 'Mostrar Data de Criação' },
    ];

    return (
        <motion.div
            ref={popupRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-72 bg-zinc-800 rounded-lg border border-zinc-700 shadow-lg z-20"
        >
            <div className="p-4 border-b border-zinc-700">
                <h3 className="font-semibold text-white">Personalizar Colunas</h3>
                <p className="text-sm text-zinc-400">Escolha quais colunas exibir.</p>
            </div>
            <div className="p-2 max-h-96 overflow-y-auto">
                {settingOptions.map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between p-2 rounded-md hover:bg-zinc-700/50">
                        <label className="text-sm font-medium text-white">{label}</label>
                        <ToggleSwitch checked={settings[key]} onChange={() => handleToggle(key)} />
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

export default ListCustomizationPopup;
