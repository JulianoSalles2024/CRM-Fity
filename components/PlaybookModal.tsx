import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, BookOpen, FileText } from 'lucide-react';
import { Lead, Playbook, Id } from '../types';

interface PlaybookModalProps {
    lead: Lead;
    playbooks: Playbook[];
    onClose: () => void;
    onApply: (playbookId: Id) => void;
}

const PlaybookModal: React.FC<PlaybookModalProps> = ({ lead, playbooks, onClose, onApply }) => {
    const applicablePlaybooks = useMemo(() => {
        return playbooks.filter(p => p.stages.includes(lead.columnId));
    }, [playbooks, lead.columnId]);

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-zinc-800 rounded-lg shadow-xl w-full max-w-lg border border-zinc-700 flex flex-col max-h-[70vh]"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b border-zinc-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold text-white">Aplicar Playbook</h2>
                            <p className="text-sm text-zinc-400 mt-1">Selecione uma cadência para <span className="font-semibold text-white">{lead.name}</span>.</p>
                        </div>
                        <button onClick={onClose} className="p-1 rounded-full text-zinc-400 hover:bg-zinc-700"><X className="w-5 h-5" /></button>
                    </div>
                </div>
                <div className="p-6 flex-1 overflow-y-auto space-y-3">
                    {applicablePlaybooks.length > 0 ? (
                        applicablePlaybooks.map(playbook => (
                            <div key={playbook.id} className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-4 flex justify-between items-center gap-4">
                                <div>
                                    <h3 className="font-semibold text-white">{playbook.name}</h3>
                                    <p className="text-xs text-zinc-400 mt-1">{playbook.steps.length} etapas</p>
                                </div>
                                <button
                                    onClick={() => onApply(playbook.id)}
                                    className="px-3 py-1.5 text-sm font-semibold text-white bg-violet-600 rounded-md hover:bg-violet-700 transition-colors"
                                >
                                    Aplicar
                                </button>
                            </div>
                        ))
                    ) : (
                         <div className="text-center py-10 border-2 border-dashed border-zinc-800 rounded-lg">
                            <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                            <h3 className="font-semibold text-white">Nenhum Playbook Aplicável</h3>
                            <p className="text-sm text-zinc-500 mt-1">Não há playbooks configurados para o estágio atual deste lead.</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default PlaybookModal;
