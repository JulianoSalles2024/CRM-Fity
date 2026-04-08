import React, { useState } from 'react';
import { ChevronRight, Clock, Trash2 } from 'lucide-react';
import type { SupportTicket, TicketStatus, TicketPriority } from './support.types';

const statusColors: Record<TicketStatus, string> = {
  open: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  in_progress: 'text-sky-400 bg-blue-400/10 border-blue-400/20',
  resolved: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  reopened: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
};
const statusLabels: Record<TicketStatus, string> = {
  open: 'Aberto', in_progress: 'Em Atendimento', resolved: 'Resolvido', reopened: 'Reaberto',
};
const priorityColors: Record<TicketPriority, string> = {
  low: 'text-slate-400', medium: 'text-sky-400', high: 'text-orange-400', urgent: 'text-red-400',
};
const priorityLabels: Record<TicketPriority, string> = {
  low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente',
};

interface TicketListProps {
  tickets: SupportTicket[];
  onSelect: (ticket: SupportTicket) => void;
  onDelete: (id: string) => Promise<void>;
  onBulkDelete: (ids: string[]) => Promise<void>;
}

const TicketList: React.FC<TicketListProps> = ({ tickets, onSelect, onDelete, onBulkDelete }) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmingBulk, setConfirmingBulk] = useState(false);

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(prev => prev.size === tickets.length ? new Set() : new Set(tickets.map(t => t.id)));
  };

  const handleDelete = async (id: string) => {
    await onDelete(id);
    setConfirmId(null);
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const handleBulkDelete = async () => {
    await onBulkDelete(Array.from(selected));
    setSelected(new Set());
    setConfirmingBulk(false);
  };

  if (tickets.length === 0) {
    return <div className="text-center py-12 text-slate-500 text-sm">Nenhum chamado encontrado.</div>;
  }

  const allSelected = selected.size === tickets.length;

  return (
    <div className="flex flex-col gap-3">
      {/* Bulk action bar */}
      <div className="flex items-center justify-between min-h-[36px]">
        <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-500 hover:text-slate-300 transition-colors">
          <input
            type="checkbox"
            checked={allSelected && tickets.length > 0}
            onChange={toggleAll}
            className="w-4 h-4 rounded border-slate-700 bg-slate-800 accent-blue-500 cursor-pointer"
          />
          {selected.size > 0 ? `${selected.size} selecionado${selected.size > 1 ? 's' : ''}` : 'Selecionar todos'}
        </label>

        {selected.size > 0 && (
          confirmingBulk ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Excluir {selected.size} chamado{selected.size > 1 ? 's' : ''}?</span>
              <button onClick={handleBulkDelete} className="text-xs px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors">Confirmar</button>
              <button onClick={() => setConfirmingBulk(false)} className="text-xs px-2 py-1 text-slate-400 hover:text-white transition-colors">Cancelar</button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingBulk(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Excluir selecionados
            </button>
          )
        )}
      </div>

      {/* Ticket rows */}
      {tickets.map(ticket => (
        <div
          key={ticket.id}
          className={`flex items-center gap-3 px-4 py-3.5 bg-[#0B1220] border rounded-xl transition-all group ${
            selected.has(ticket.id) ? 'border-blue-500/40 bg-blue-950/10' : 'border-slate-800 hover:border-sky-500/30 hover:bg-blue-950/10'
          }`}
        >
          <input
            type="checkbox"
            checked={selected.has(ticket.id)}
            onChange={() => toggleOne(ticket.id)}
            onClick={e => e.stopPropagation()}
            className="w-4 h-4 rounded border-slate-700 bg-slate-800 accent-blue-500 cursor-pointer flex-shrink-0"
          />

          <button
            onClick={() => onSelect(ticket)}
            className="flex items-center justify-between flex-1 text-left min-w-0"
          >
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <span className="text-sm text-white font-medium truncate">{ticket.subject}</span>
              <div className="flex items-center gap-3 text-xs">
                {ticket.category && <span className="text-slate-500">{ticket.category.name}</span>}
                <span className={`font-medium ${priorityColors[ticket.priority]}`}>{priorityLabels[ticket.priority]}</span>
                <span className="flex items-center gap-1 text-slate-600">
                  <Clock className="w-3 h-3" />
                  {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 ml-3">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusColors[ticket.status]}`}>
                {statusLabels[ticket.status]}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-sky-400" />
            </div>
          </button>

          {/* Individual delete */}
          <div className="flex-shrink-0 w-16 flex justify-end">
            {confirmId === ticket.id ? (
              <div className="flex items-center gap-1">
                <button onClick={() => handleDelete(ticket.id)} className="text-xs px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded hover:bg-red-500/30 transition-colors">Sim</button>
                <button onClick={() => setConfirmId(null)} className="text-xs px-1 py-1 text-slate-500 hover:text-white transition-colors">Não</button>
              </div>
            ) : (
              <button
                onClick={e => { e.stopPropagation(); setConfirmId(ticket.id); }}
                className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                title="Excluir chamado"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TicketList;
