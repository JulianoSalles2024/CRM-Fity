
import React, { useState, FormEvent, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Archive, RefreshCw, Calendar } from 'lucide-react';
import type { Lead } from '../types';

interface LostLeadModalProps {
  lead: Lead;
  onClose: () => void;
  onSubmit: (reason: string, reactivationDate: string | null) => void;
}

const lossReasons = ['Preço', 'Timing', 'Concorrência', 'Sem Resposta', 'Outro'];

const LostLeadModal: React.FC<LostLeadModalProps> = ({ lead, onClose, onSubmit }) => {
  const [reason, setReason] = useState(lossReasons[0]);
  const [customReason, setCustomReason] = useState('');
  const [actionType, setActionType] = useState<'archive' | 'recovery'>('archive');
  const [reactivationDate, setReactivationDate] = useState('');

  // Set default reactivation date to 30 days from now
  useEffect(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    setReactivationDate(date.toISOString().split('T')[0]);
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const finalReason = reason === 'Outro' ? customReason : reason;
    if (!finalReason) {
        alert('Por favor, especifique o motivo da perda.');
        return;
    }
    
    // If recovery is selected, pass the date. If archive, pass null.
    onSubmit(finalReason, actionType === 'recovery' ? reactivationDate : null);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 rounded-lg shadow-xl w-full max-w-lg border border-slate-800 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-800">
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-bold text-white">Processar Lead Perdido</h2>
            <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-800"><X className="w-5 h-5" /></button>
          </div>
          <p className="text-sm text-slate-400 mt-1">{lead.name} - {lead.company}</p>
        </div>
        <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Motivo da Perda <span className="text-red-500">*</span></label>
                    <select value={reason} onChange={e => setReason(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-white focus:ring-violet-500">
                        {lossReasons.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    {reason === 'Outro' && (
                        <input
                            type="text"
                            value={customReason}
                            onChange={e => setCustomReason(e.target.value)}
                            placeholder="Especifique o motivo..."
                            className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-white focus:ring-violet-500"
                        />
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">Próximo Passo</label>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => setActionType('archive')}
                            className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${actionType === 'archive' ? 'border-slate-500 bg-slate-700/50 text-white' : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-700/30'}`}
                        >
                            <Archive className="w-6 h-6 mb-2" />
                            <span className="text-sm font-semibold">Encerrar</span>
                            <span className="text-xs opacity-70 mt-1">Sem contato futuro</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActionType('recovery')}
                            className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${actionType === 'recovery' ? 'border-violet-500 bg-violet-500/10 text-violet-100' : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-700/30'}`}
                        >
                            <RefreshCw className="w-6 h-6 mb-2" />
                            <span className="text-sm font-semibold">Recuperação</span>
                            <span className="text-xs opacity-70 mt-1">Tentar novamente</span>
                        </button>
                    </div>
                </div>

                {actionType === 'recovery' && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-violet-900/20 border border-violet-500/30 rounded-md p-4"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-violet-400" />
                            <label htmlFor="reactivationDate" className="block text-sm font-medium text-violet-200">Data de Reativação</label>
                        </div>
                        <input
                            type="date"
                            id="reactivationDate"
                            value={reactivationDate}
                            onChange={e => setReactivationDate(e.target.value)}
                            required
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full bg-slate-950 border border-slate-600 rounded-md px-3 py-2 text-sm text-white focus:ring-violet-500 focus:border-violet-500"
                        />
                        <p className="text-xs text-violet-300/70 mt-2">
                            O lead aparecerá na aba "Recuperação" nesta data.
                        </p>
                    </motion.div>
                )}
            </div>
            <div className="p-4 bg-slate-800/50 border-t border-slate-800 flex justify-end gap-3">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-300 bg-slate-800 rounded-md hover:bg-slate-700">Cancelar</button>
                <button 
                    type="submit" 
                    className={`px-4 py-2 text-sm font-semibold text-white rounded-md transition-colors ${actionType === 'recovery' ? 'bg-violet-600 hover:bg-violet-700' : 'bg-slate-600 hover:bg-slate-500'}`}
                >
                    {actionType === 'recovery' ? 'Salvar na Recuperação' : 'Confirmar Encerramento'}
                </button>
            </div>
        </form>
      </motion.div>
    </div>
  );
};

export default LostLeadModal;
