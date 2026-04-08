import React, { useState } from 'react';
import { X, Ticket } from 'lucide-react';
import type { TicketPriority, SupportCategory } from './support.types';

interface NewTicketModalProps {
  categories: SupportCategory[];
  onSubmit: (subject: string, categoryId: string | null, priority: TicketPriority) => Promise<void>;
  onClose: () => void;
}

const priorityLabels: Record<TicketPriority, string> = {
  low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente',
};

const NewTicketModal: React.FC<NewTicketModalProps> = ({ categories, onSubmit, onClose }) => {
  const [subject, setSubject] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;
    setLoading(true);
    await onSubmit(subject.trim(), categoryId, priority);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0B1220] border border-slate-800 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-sky-400" />
            <h2 className="text-white font-semibold">Abrir Chamado</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="text-sm text-slate-400 block mb-1.5">Assunto *</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Descreva brevemente o problema..."
              className="w-full bg-[#0B1220] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none placeholder:text-slate-500"
              required
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 block mb-1.5">Categoria</label>
            <select
              value={categoryId ?? ''}
              onChange={e => setCategoryId(e.target.value || null)}
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              <option value="">Selecionar categoria...</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-slate-400 block mb-1.5">Prioridade</label>
            <div className="flex gap-2">
              {(Object.keys(priorityLabels) as TicketPriority[]).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    priority === p
                      ? 'bg-sky-500/5 border-sky-500/30 text-sky-400'
                      : 'border-slate-700 text-slate-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {priorityLabels[p]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-slate-700 text-slate-400 text-sm hover:text-white hover:bg-white/5 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !subject.trim()}
              className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Abrir Chamado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewTicketModal;
