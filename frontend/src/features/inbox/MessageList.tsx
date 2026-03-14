import React, { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import type { OmniMessage } from './hooks/useMessages';

interface MessageListProps {
  messages: OmniMessage[];
  loading: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, loading }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1">
        <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center flex-1 text-slate-500 text-sm">
        Nenhuma mensagem
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
};
