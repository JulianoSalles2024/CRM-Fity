
import React, { useState, FormEvent, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { ColumnData, Id } from '@/shared/types';

interface CreateStageModalProps {
  onClose: () => void;
  onSubmit: (data: { id?: Id, title: string, color: string, type: ColumnData['type'] }) => void;
  stageToEdit?: ColumnData | null;
}

const typeOptions: { value: ColumnData['type']; label: string }[] = [
    { value: 'open', label: 'Abertura' },
    { value: 'follow-up', label: 'Follow-up' },
    { value: 'scheduling', label: 'Agendamento' },
    { value: 'won', label: 'Ganho' },
    { value: 'lost', label: 'Perda' },
];

const CreateStageModal: React.FC<CreateStageModalProps> = ({ onClose, onSubmit, stageToEdit }) => {
    const [title, setTitle] = useState('');
    const [color, setColor] = useState('#3b82f6');
    const [type, setType] = useState<ColumnData['type']>('open');
    const isEditMode = !!stageToEdit;

    useEffect(() => {
        if (stageToEdit) {
            setTitle(stageToEdit.title);
            setColor(stageToEdit.color);
            setType(stageToEdit.type || 'open');
        }
    }, [stageToEdit]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            alert('Por favor, insira um nome para o estágio.');
            return;
        }
        onSubmit({ id: stageToEdit?.id, title, color, type });
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-slate-900 rounded-lg shadow-xl w-full max-w-md border border-slate-800 flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b border-slate-800">
                    <div className="flex items-start justify-between">
                        <h2 className="text-xl font-bold text-white">{isEditMode ? 'Editar Estágio' : 'Criar Novo Estágio'}</h2>
                        <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-5">
                        <div>
                            <label htmlFor="stage-name" className="block text-sm font-medium text-slate-300 mb-2">
                                Nome do Estágio
                            </label>
                            <input
                                type="text"
                                id="stage-name"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Ex: Qualificação"
                                required
                                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="stage-color" className="block text-sm font-medium text-slate-300 mb-2">
                                Cor
                            </label>
                            <div className="flex items-center gap-3">
                                <div className="relative w-10 h-10">
                                    <input
                                        type="color"
                                        id="stage-color"
                                        value={color}
                                        onChange={(e) => setColor(e.target.value)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div
                                        className="w-full h-full rounded-md border border-slate-600"
                                        style={{ backgroundColor: color }}
                                        aria-hidden="true"
                                    ></div>
                                </div>
                                <input
                                    type="text"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                                />
                            </div>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-slate-300 mb-2">
                                Tipo de Estágio
                            </label>
                             <div className="flex gap-1 rounded-md bg-slate-950 p-1 border border-slate-800 flex-wrap">
                                {typeOptions.map(option => (
                                    <button
                                        type="button"
                                        key={option.value}
                                        onClick={() => setType(option.value)}
                                        className={`flex-1 min-w-[80px] py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-colors ${type === option.value ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-700/50'}`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-800/50 border-t border-slate-800 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-300 bg-slate-800 rounded-md hover:bg-slate-700 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 rounded-md hover:bg-violet-700 transition-colors">
                            {isEditMode ? 'Salvar Alterações' : 'Criar Estágio'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default CreateStageModal;
