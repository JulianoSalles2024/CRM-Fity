import React from 'react';
import type { ConversationStatus } from './hooks/useConversations';

interface Filter {
  label: string;
  value: ConversationStatus | null;
}

const FILTERS: Filter[] = [
  { label: 'Todos', value: null },
  { label: 'Em espera', value: 'waiting' },
  { label: 'Em atendimento', value: 'in_progress' },
  { label: 'Encerrados', value: 'resolved' },
];

interface InboxFiltersProps {
  active: ConversationStatus | null;
  onChange: (value: ConversationStatus | null) => void;
}

export const InboxFilters: React.FC<InboxFiltersProps> = ({ active, onChange }) => (
  <div className="flex gap-1 px-3 py-2 border-b border-slate-800">
    {FILTERS.map((f) => (
      <button
        key={String(f.value)}
        onClick={() => onChange(f.value)}
        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
          active === f.value
            ? 'bg-blue-600 text-white'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
      >
        {f.label}
      </button>
    ))}
  </div>
);
