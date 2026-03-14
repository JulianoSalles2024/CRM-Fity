import React, { useState } from 'react';
import { MessageCircle, Phone, UserCheck, CheckCircle, Loader2, AlertCircle, X, RefreshCw, RefreshCcw } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/features/auth/AuthContext';
import { useAppContext } from '@/src/app/AppContext';
import type { OmniConversation, ConversationStatus } from './hooks/useConversations';
import { MessageList } from './MessageList';
import { MessageComposer } from './components/MessageComposer';
import { useSendMessage } from './hooks/useSendMessage';
import { useMessages } from './hooks/useMessages';

const STATUS_LABEL: Record<string, string> = {
  waiting:     'Em espera',
  in_progress: 'Em atendimento',
  resolved:    'Resolvido',
  blocked:     'Bloqueado',
};

const STATUS_COLOR: Record<string, string> = {
  waiting:     'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  in_progress: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  resolved:    'text-green-400 bg-green-500/10 border-green-500/20',
  blocked:     'text-red-400 bg-red-500/10 border-red-500/20',
};

interface ConversationPanelProps {
  conversation: OmniConversation | null;
  onStatusChange: (conversationId: string, newStatus: ConversationStatus) => void;
}

export const ConversationPanel: React.FC<ConversationPanelProps> = ({ conversation, onStatusChange }) => {
  const { user, companyId, currentUserRole } = useAuth();
  const { localUser } = useAppContext();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isReopening, setIsReopening] = useState(false);
  const [reopenError, setReopenError] = useState<string | null>(null);
  const { sendMessage, isSending, sendError, clearError } = useSendMessage();
  const { messages, loading: messagesLoading, addOptimisticMessage } = useMessages(conversation?.id ?? null);

  const reopenConversation = async () => {
    if (!conversation || !companyId || !user) return;
    setIsReopening(true);
    setReopenError(null);
    const { error } = await supabase
      .from('conversations')
      .update({ status: 'in_progress', assignee_id: user.id })
      .eq('id', conversation.id)
      .eq('company_id', companyId);
    if (error) setReopenError('Não foi possível reabrir a conversa. Tente novamente.');
    setIsReopening(false);
  };

  const canUpdate =
    currentUserRole === 'admin' ||
    conversation?.assignee_id === user?.id;

  const updateStatus = async (newStatus: ConversationStatus) => {
    if (!conversation || !companyId || !canUpdate) return;
    setIsUpdating(true);

    const { error } = await supabase
      .from('conversations')
      .update({ status: newStatus })
      .eq('id', conversation.id)
      .eq('company_id', companyId);

    if (!error) {
      const userName = localUser?.name ?? user?.email ?? 'Usuário';
      const previousStatus = conversation.status;
      const content =
        newStatus === 'in_progress' && previousStatus === 'resolved'
          ? `${userName} reabriu a conversa`
          : newStatus === 'in_progress'
          ? `${userName} assumiu o atendimento`
          : 'Conversa marcada como resolvida';

      await supabase.from('messages').insert({
        company_id: companyId,
        conversation_id: conversation.id,
        direction: null,
        sender_type: 'system',
        content,
        content_type: 'text',
      });

      onStatusChange(conversation.id, newStatus);
    }

    setIsUpdating(false);
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-600 bg-[#080E1A]">
        <MessageCircle className="w-12 h-12" />
        <p className="text-sm">Selecione uma conversa</p>
      </div>
    );
  }

  const displayName = conversation.contact_name || conversation.contact_identifier;
  const statusLabel = STATUS_LABEL[conversation.status] ?? conversation.status;
  const statusColor = STATUS_COLOR[conversation.status] ?? STATUS_COLOR.open;

  return (
    <div className="flex-1 flex flex-col bg-[#080E1A] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#0B1220] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{displayName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Phone className="w-3 h-3 text-slate-500" />
              <span className="text-xs text-slate-400">{conversation.contact_identifier}</span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400">WhatsApp</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusColor}`}>
            {statusLabel}
          </span>

          {canUpdate && conversation.status === 'waiting' && (
            <button
              onClick={() => updateStatus('in_progress')}
              disabled={isUpdating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
            >
              {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
              Assumir atendimento
            </button>
          )}

          {canUpdate && conversation.status === 'in_progress' && (
            <button
              onClick={() => updateStatus('resolved')}
              disabled={isUpdating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
            >
              {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
              Resolver
            </button>
          )}

          {canUpdate && conversation.status === 'resolved' && (
            <button
              onClick={() => updateStatus('in_progress')}
              disabled={isUpdating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-orange-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
            >
              {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Retornar Agente
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <MessageList messages={messages} loading={messagesLoading} />

      {/* Reabrir conversa — aparece apenas quando resolved */}
      {conversation.status === 'resolved' && (
        <div className="flex-shrink-0 flex flex-col items-center gap-2 px-4 py-3 border-t border-slate-800 bg-[#0B1220]">
          {reopenError && (
            <div className="w-full flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="flex-1 text-xs text-red-300">{reopenError}</span>
              <button onClick={() => setReopenError(null)} aria-label="Fechar erro" className="text-red-400 hover:text-red-300">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <button
            onClick={reopenConversation}
            disabled={isReopening}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-500/50 text-blue-400 hover:bg-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {isReopening
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <RefreshCcw className="w-4 h-4" />}
            Reabrir conversa
          </button>
        </div>
      )}

      {/* Banner de erro de envio */}
      {sendError && (
        <div className="flex-shrink-0 flex items-center gap-2 mx-4 mb-1 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="flex-1 text-xs text-red-300">{sendError}</span>
          <button onClick={clearError} aria-label="Fechar erro" className="text-red-400 hover:text-red-300">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <MessageComposer
        conversationId={conversation.id}
        conversationStatus={conversation.status}
        canSend={canUpdate && conversation.status === 'in_progress' && !isSending}
        onSendMessage={(text) => {
          addOptimisticMessage(text);
          sendMessage(conversation.id, text, conversation.contact_identifier);
        }}
      />
    </div>
  );
};
