import React, { useRef, useEffect, useState, useCallback } from 'react';
import { SendHorizonal, Lock } from 'lucide-react';
import type { ConversationStatus } from '../hooks/useConversations';

const MAX_LENGTH = 4096;

interface MessageComposerProps {
  onSendMessage: (text: string) => Promise<void>;
  conversationId: string;
  conversationStatus: ConversationStatus;
  canSend: boolean; // false se não for o assignee ou não tiver permissão
}

const BLOCKED_STATUSES: ConversationStatus[] = ['resolved', 'blocked'];

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendMessage,
  conversationId,
  conversationStatus,
  canSend,
}) => {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isStatusBlocked = BLOCKED_STATUSES.includes(conversationStatus);
  const isDisabled = isStatusBlocked || !canSend || isSending;

  const blockedReason = !canSend
    ? 'Você não é o responsável por esta conversa'
    : conversationStatus === 'resolved'
    ? 'Esta conversa foi resolvida'
    : conversationStatus === 'blocked'
    ? 'Este contato está bloqueado'
    : null;

  // Reset e auto-focus ao trocar de conversa
  useEffect(() => {
    setText('');
    setIsSending(false);
    if (!isDisabled) {
      // Pequeno delay para garantir que o DOM atualizou
      const t = setTimeout(() => textareaRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-resize sem duplo reflow: usa requestAnimationFrame
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(() => {
      el.style.height = '0px';
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    });
    return () => cancelAnimationFrame(raf);
  }, [text]);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || isDisabled) return;

    setIsSending(true);
    try {
      await onSendMessage(trimmed);
      // Limpa apenas em caso de sucesso
      setText('');
    } finally {
      setIsSending(false);
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }, [text, isDisabled, onSendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Shift+Enter: quebra de linha (comportamento padrão do browser)
  };

  const isEmpty = text.trim().length === 0;
  const charsLeft = MAX_LENGTH - text.length;
  const nearLimit = charsLeft <= 200;

  if (isDisabled && blockedReason) {
    return (
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-3 border-t border-slate-800 bg-[#0B1220]">
        <div className="flex-1 flex items-center gap-2 bg-slate-800/30 border border-slate-700/30 rounded-xl px-4 py-3">
          <Lock className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <span className="text-sm text-slate-500">{blockedReason}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 flex flex-col gap-1 px-4 py-3 border-t border-slate-800 bg-[#0B1220]">
      <div className="flex items-end gap-2">
        {/* Wrapper com focus ring acessível */}
        <div
          className={`flex-1 flex items-end bg-slate-800/60 border rounded-xl px-3 py-2 transition-colors duration-150 ${
            isDisabled
              ? 'border-slate-700/30 opacity-50'
              : 'border-slate-700/50 focus-within:border-blue-500/60 focus-within:ring-1 focus-within:ring-blue-500/20'
          }`}
        >
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              if (e.target.value.length <= MAX_LENGTH) setText(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            disabled={isDisabled}
            maxLength={MAX_LENGTH}
            placeholder="Digite uma mensagem..."
            rows={1}
            aria-label="Campo de mensagem"
            aria-describedby="composer-hint"
            aria-disabled={isDisabled}
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 resize-none focus:outline-none leading-relaxed max-h-[120px] overflow-y-auto disabled:cursor-not-allowed"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={isEmpty || isDisabled}
          aria-label="Enviar mensagem"
          aria-disabled={isEmpty || isDisabled}
          className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150 active:scale-95"
        >
          <SendHorizonal className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Hint acessível + contador de caracteres */}
      <div id="composer-hint" className="flex justify-between px-1">
        <span className="text-[10px] text-slate-600">Enter para enviar · Shift+Enter para nova linha</span>
        {nearLimit && (
          <span className={`text-[10px] ${charsLeft <= 50 ? 'text-red-400' : 'text-yellow-500'}`}>
            {charsLeft} restantes
          </span>
        )}
      </div>
    </div>
  );
};
