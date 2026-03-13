import React, { useState, useCallback } from 'react';
import type { OmniConversation, ConversationStatus } from './hooks/useConversations';
import { useConversations } from './hooks/useConversations';
import { ConversationList } from './ConversationList';
import { ConversationPanel } from './ConversationPanel';

export const InboxPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<ConversationStatus | null>(null);
  const [search, setSearch] = useState('');
  const [activeConversation, setActiveConversation] = useState<OmniConversation | null>(null);

  const { conversations, loading } = useConversations(statusFilter, search);

  const handleStatusChange = useCallback((conversationId: string, newStatus: ConversationStatus) => {
    setActiveConversation((prev) =>
      prev?.id === conversationId ? { ...prev, status: newStatus } : prev
    );
  }, []);

  return (
    <div className="flex h-full -mx-6 -mt-6 -mb-6 overflow-hidden rounded-xl border border-slate-800">
      <ConversationList
        conversations={conversations}
        loading={loading}
        activeId={activeConversation?.id ?? null}
        statusFilter={statusFilter}
        search={search}
        onSelectConversation={setActiveConversation}
        onStatusFilterChange={setStatusFilter}
        onSearchChange={setSearch}
      />
      <ConversationPanel
        conversation={activeConversation}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};
