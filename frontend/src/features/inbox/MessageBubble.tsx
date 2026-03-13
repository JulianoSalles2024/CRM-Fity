import React from 'react';
import { Bot } from 'lucide-react';
import type { OmniMessage } from './hooks/useMessages';

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

interface MessageBubbleProps {
  message: OmniMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const { sender_type, content, sent_at, content_type } = message;

  // System event — centered
  if (sender_type === 'system') {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-slate-500 bg-slate-800/60 px-3 py-1 rounded-full">
          {content ?? 'Evento do sistema'}
        </span>
      </div>
    );
  }

  const isOutbound = sender_type === 'agent' || sender_type === 'bot';

  return (
    <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`max-w-[70%] flex flex-col gap-1 ${isOutbound ? 'items-end' : 'items-start'}`}>
        {sender_type === 'bot' && (
          <span className="flex items-center gap-1 text-[10px] text-purple-400 font-medium">
            <Bot className="w-3 h-3" /> IA
          </span>
        )}
        <div
          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
            isOutbound
              ? 'bg-blue-600 text-white rounded-br-sm'
              : 'bg-slate-700 text-slate-100 rounded-bl-sm'
          }`}
        >
          {content_type === 'text' || content_type === 'unknown' ? (
            <span>{content ?? ''}</span>
          ) : (
            <span className="italic text-slate-300 text-xs">
              [{content_type === 'image' ? 'Imagem' :
                content_type === 'audio' ? 'Áudio' :
                content_type === 'video' ? 'Vídeo' :
                content_type === 'document' ? 'Documento' : content_type}]
            </span>
          )}
        </div>
        <span className="text-[10px] text-slate-500">{formatTime(sent_at)}</span>
      </div>
    </div>
  );
};
