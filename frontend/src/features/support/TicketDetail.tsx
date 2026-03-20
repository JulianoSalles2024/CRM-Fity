import React, { useState } from 'react';
import { ArrowLeft, Send, Lock } from 'lucide-react';
import { useTicketMessages } from './hooks/useTicketMessages';
import type { SupportTicket, TicketStatus } from './support.types';

const statusLabels: Record<TicketStatus, string> = {
  open: 'Aberto', in_progress: 'Em Atendimento', resolved: 'Resolvido', reopened: 'Reaberto',
};
const statusColors: Record<TicketStatus, string> = {
  open: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  in_progress: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  resolved: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  reopened: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
};

interface TicketDetailProps {
  ticket: SupportTicket;
  isAdmin: boolean;
  currentUserId: string;
  onBack: () => void;
  onStatusChange: (ticketId: string, status: TicketStatus) => Promise<void>;
}

const TicketDetail: React.FC<TicketDetailProps> = ({ ticket, isAdmin, currentUserId, onBack, onStatusChange }) => {
  const { messages, loading, sendMessage } = useTicketMessages(ticket.id, isAdmin);
  const [reply, setReply] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!reply.trim()) return;
    setSending(true);
    await sendMessage(reply.trim(), isInternal);
    setReply('');
    setSending(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        {isAdmin && (
          <select
            value={ticket.status}
            onChange={e => onStatusChange(ticket.id, e.target.value as TicketStatus)}
            className="bg-slate-800 border border-white/10 rounded-lg px-2 py-1 text-white text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
          >
            {(Object.keys(statusLabels) as TicketStatus[]).map(s => (
              <option key={s} value={s}>{statusLabels[s]}</option>
            ))}
          </select>
        )}
      </div>

      <div className="bg-[#0B1220] border border-slate-800 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h2 className="text-white font-semibold text-base">{ticket.subject}</h2>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${statusColors[ticket.status]}`}>
            {statusLabels[ticket.status]}
          </span>
        </div>
        {ticket.category && (
          <span className="text-xs text-slate-500">{ticket.category.name}</span>
        )}
      </div>

      <div className="flex flex-col gap-3 min-h-[200px]">
        {loading ? (
          <div className="text-slate-500 text-sm">Carregando mensagens...</div>
        ) : messages.length === 0 ? (
          <div className="text-slate-500 text-sm text-center py-8">
            Nenhuma mensagem ainda. Escreva abaixo para iniciar o atendimento.
          </div>
        ) : messages.map(msg => {
          const isMine = msg.author_id === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm ${
                msg.is_internal
                  ? 'bg-amber-950/40 border border-amber-500/20 text-amber-200'
                  : isMine
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-200'
              }`}>
                {msg.is_internal && (
                  <div className="flex items-center gap-1 text-xs text-amber-400 mb-1">
                    <Lock className="w-3 h-3" /> Nota interna
                  </div>
                )}
                <p>{msg.content}</p>
                <span className="text-xs opacity-50 mt-1 block">
                  {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 border-t border-slate-800 pt-3">
        {isAdmin && (
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={isInternal}
              onChange={e => setIsInternal(e.target.checked)}
              className="rounded border-slate-600"
            />
            Nota interna (invisível para o usuário)
          </label>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={reply}
            onChange={e => setReply(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Escrever resposta..."
            className="flex-1 bg-[#0B1220] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none placeholder:text-slate-500"
          />
          <button
            onClick={handleSend}
            disabled={sending || !reply.trim()}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;
