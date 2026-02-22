
import React, { useState, useEffect } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Board, Id } from '../types';

interface EditBoardModalProps {
    board: Board;
    boards: Board[];
    onClose: () => void;
    onSave: (boardId: Id, updates: Partial<Board>) => void;
    onSwitchBoard: (boardId: Id) => void;
}

const EditBoardModal: React.FC<EditBoardModalProps> = ({ board, boards, onClose, onSave, onSwitchBoard }) => {
    const [name, setName] = useState(board.name);
    const [slug, setSlug] = useState(board.slug || '');
    const [description, setDescription] = useState(board.description || '');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setName(board.name);
        setSlug(board.slug || '');
        setDescription(board.description || '');
    }, [board]);

    const handleSave = () => {
        onSave(board.id, { name, slug, description });
        onClose();
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(slug);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">Configurações do Board</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Editando board</label>
                        <select 
                            value={board.id}
                            onChange={(e) => onSwitchBoard(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        >
                            {boards.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500 mt-2">Dica: troque aqui para editar outro board sem fechar este modal.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Nome do Board *</label>
                        <input 
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Chave (slug) — para integrações</label>
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                            <button 
                                onClick={copyToClipboard}
                                className="p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                            >
                                {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Dica: é mais fácil usar isso no n8n/Make do que um UUID.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Descrição</label>
                        <textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                        />
                    </div>
                </div>

                <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-900/50">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-slate-400 hover:text-white font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSave}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors shadow-lg shadow-blue-900/20"
                    >
                        Salvar Alterações
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default EditBoardModal;
