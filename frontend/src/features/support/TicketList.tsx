import React from 'react';
import { ChevronRight, Clock } from 'lucide-react';
import type { SupportTicket, TicketStatus, TicketPriority } from './support.types';

const statusColors: Record<TicketStatus, string> = {
  open: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  in_progress: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  resolved: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  reopened: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
};
const statusLabels: Record<TicketStatus, string> = {
  open: 'Aberto', in_progress: 'Em Atendimento', resolved: 'Resolvido', reopened: 'Reaberto',
};
const priorityColors: Record<TicketPriority, string> = {
  low: 'text-slate-400', medium: 'text-blue-400', high: 'text-orange-400', urgent: 'text-red-400',
};
const priorityLabels: Record<TicketPriority, string> = {
  low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente',
};

interface TicketListProps {
  tickets: SupportTicket[];
  onSelect: (ticket: SupportTicket) => void;
}

const TicketList: React.FC<TicketListProps> = ({ tickets, onSelect }) => {
  if (tickets.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 text-sm">
        Nenhum chamado encontrado.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {tickets.map(ticket => (
        <button
          key={ticket.id}
          onClick={() => onSelect(ticket)}
          className="flex items-center justify-between px-4 py-3.5 bg-[#0B1220] border border-slate-800 rounded-xl text-left hover:border-blue-500/30 hover:bg-blue-950/10 transition-all group"
        >
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <span className="text-sm text-white font-medium truncate">{ticket.subject}</span>
            <div className="flex items-center gap-3 text-xs">
              {ticket.category && <span className="text-slate-500">{ticket.category.name}</span>}
              <span className={`font-medium ${priorityColors[ticket.priority]}`}>
                {priorityLabels[ticket.priority]}
              </span>
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
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400" />
          </div>
        </button>
      ))}
    </div>
  );
};

export default TicketList;
