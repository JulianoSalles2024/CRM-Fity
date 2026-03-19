import React from 'react';
import { Bot } from 'lucide-react';
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
  waiting:     { label: 'Em espera',      dot: 'bg-yellow-400', pill: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  in_progress: { label: 'Em atendimento', dot: 'bg-blue-400',   pill: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  resolved:    { label: 'Encerrado',      dot: 'bg-emerald-400', pill: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  blocked:     { label: 'Bloqueado',      dot: 'bg-red-400',    pill: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

const AVATAR_GRADIENTS = [
  'from-blue-500 to-cyan-400',
  'from-violet-500 to-purple-400',
  'from-emerald-500 to-teal-400',
  'from-orange-500 to-amber-400',
  'from-rose-500 to-pink-400',
  'from-indigo-500 to-blue-400',
  'from-teal-500 to-emerald-400',
  'from-fuchsia-500 to-violet-400',
];

function getAvatarGradient(name: string): string {
  const code = (name.charCodeAt(0) || 0) + (name.charCodeAt(1) || 0);
  return AVATAR_GRADIENTS[code % AVATAR_GRADIENTS.length];
}

interface ConversationItemProps {
  conversation: OmniConversation;
  isActive: boolean;
  onClick: () => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({ conversation, isActive, onClick }) => {
  const displayName = conversation.contact_name || conversation.contact_identifier;
  const status = STATUS_CONFIG[conversation.status] ?? STATUS_CONFIG.waiting;
  const gradient = getAvatarGradient(displayName);
  const isAiEscalated = conversation.status === 'in_progress' && conversation.ai_agent_id != null;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-all duration-150 border-b border-slate-800/50 border-l-2 ${
        isAiEscalated
          ? 'bg-amber-950/20 border-l-amber-500 animate-pulse-subtle'
          : isActive
          ? 'bg-blue-950/30 border-l-blue-500'
          : 'hover:bg-slate-800/40 border-l-transparent'
      }`}
    >
      {/* Avatar com gradiente */}
      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 text-white font-bold text-sm shadow-lg`}>
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

        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          {isAiEscalated ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold border bg-amber-500/15 text-amber-400 border-amber-500/30">
              <Bot className="w-2.5 h-2.5" />
              IA escalou → você
            </span>
          ) : (
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${status.pill}`}>
              <span className={`w-1 h-1 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          )}
          <span className="text-[10px] text-slate-600">· WhatsApp</span>
        </div>
      </div>
    </button>
  );
};
