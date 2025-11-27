import React, { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
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
  const [scheduleReactivation, setScheduleReactivation] = useState(false);
  const [reactivationDate, setReactivationDate] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const finalReason = reason === 'Outro' ? customReason : reason;
    if (!finalReason) {
        alert('Por favor, especifique o motivo da perda.');
        return;
    }
    onSubmit(finalReason, scheduleReactivation ? reactivationDate : null);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-zinc-800 rounded-lg shadow-xl w-full max-w-lg border border-zinc-700 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-zinc-700">
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-bold text-white">Processar Lead Perdido: {lead.name}</h2>
            <button onClick={onClose} className="p-1 rounded-full text-zinc-400 hover:bg-zinc-700"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Motivo da Perda <span className="text-red-500">*</span></label>
                    <select value={reason} onChange={e => setReason(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white focus:ring-violet-500">
                        {lossReasons.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    {reason === 'Outro' && (
                        <input
                            type="text"
                            value={customReason}
                            onChange={e => setCustomReason(e.target.value)}
                            placeholder="Especifique o motivo..."
                            className="mt-2 w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white focus:ring-violet-500"
                        />
                    )}
                </div>

                <div>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={scheduleReactivation}
                            onChange={e => setScheduleReactivation(e.target.checked)}
                            className="h-5 w-5 rounded bg-zinc-700 border-zinc-600 text-violet-600 focus:ring-violet-500 focus:ring-offset-zinc-800"
                        />
                        <span className="text-sm font-medium text-zinc-300">Agendar Reativação Futura?</span>
                    </label>
                </div>

                {scheduleReactivation && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                        <label htmlFor="reactivationDate" className="block text-sm font-medium text-zinc-300 mb-2">Data de Reativação</label>
                        <input
                            type="date"
                            id="reactivationDate"
                            value={reactivationDate}
                            onChange={e => setReactivationDate(e.target.value)}
                            required
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white focus:ring-violet-500"
                        />
                    </motion.div>
                )}
            </div>
            <div className="p-4 bg-zinc-800/50 border-t border-zinc-700 flex justify-end gap-3">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-zinc-300 bg-zinc-700 rounded-md hover:bg-zinc-600">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 rounded-md hover:bg-violet-700">Confirmar</button>
            </div>
        </form>
      </motion.div>
    </div>
  );
};

export default LostLeadModal;