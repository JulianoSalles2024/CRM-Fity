import React from 'react';
import { MessageCircle } from 'lucide-react';
import type { OmniConversation } from './hooks/useConversations';

function formatTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffH = Math.floor((now.getTime() - d.getTime()) / 3600000);
  if (diffH < 24) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

const STATUS_CONFIG = {
  waiting:     { label: 'Em espera',      color: 'bg-yellow-500' },
  in_progress: { label: 'Em atendimento', color: 'bg-blue-500' },
  resolved:    { label: 'Encerrado',      color: 'bg-green-500' },
  blocked:     { label: 'Bloqueado',      color: 'bg-red-500' },
};

interface ConversationItemProps {
  conversation: OmniConversation;
  isActive: boolean;
  onClick: () => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({ conversation, isActive, onClick }) => {
  const displayName = conversation.contact_name || conversation.contact_identifier;
  const status = STATUS_CONFIG[conversation.status] ?? STATUS_CONFIG.waiting;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-slate-800/60 transition-colors border-b border-slate-800/50 ${
        isActive ? 'bg-slate-800/80 border-l-2 border-l-blue-500' : ''
      }`}
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 text-white font-semibold text-sm">
        {displayName.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-white truncate">{displayName}</span>
          <span className="text-xs text-slate-500 flex-shrink-0">{formatTime(conversation.last_message_at)}</span>
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-xs text-slate-400 truncate">
            {conversation.last_message_preview ?? 'Sem mensagens'}
          </p>
          {conversation.unread_count > 0 && (
            <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
              {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 mt-1">
          <span className={`w-1.5 h-1.5 rounded-full ${status.color}`} />
          <span className="text-[10px] text-slate-500">{status.label}</span>
          <span className="text-[10px] text-slate-600">· WhatsApp</span>
        </div>
      </div>
    </button>
  );
};
