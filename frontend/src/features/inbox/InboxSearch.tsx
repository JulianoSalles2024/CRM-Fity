import React from 'react';
import { Search } from 'lucide-react';

interface InboxSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export const InboxSearch: React.FC<InboxSearchProps> = ({ value, onChange }) => (
  <div className="relative px-3 py-2 border-b border-slate-800">
    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
    <input
      type="text"
      placeholder="Buscar por nome ou telefone..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
    />
  </div>
);
