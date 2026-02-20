import React from 'react';
import { Settings2, Play, Power } from 'lucide-react';
import { AIToolConfig } from '../types';

interface AIToolCardProps {
  tool: AIToolConfig;
  onToggle: (enabled: boolean) => void;
  onEditPrompt: () => void;
  onTest: () => void;
}

export const AIToolCard: React.FC<AIToolCardProps> = ({ tool, onToggle, onEditPrompt, onTest }) => {
  return (
    <div 
      className="flex items-center justify-between p-4 rounded-xl border border-white/10 transition-all hover:bg-white/5"
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="flex-1">
        <h3 className="text-sm font-bold text-white mb-1">{tool.name}</h3>
        <p className="text-xs text-slate-400">{tool.description}</p>
      </div>
      
      <div className="flex items-center gap-3 ml-4">
        <button
          onClick={onEditPrompt}
          className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          title="Editar Prompt"
        >
          <Settings2 className="w-4 h-4" />
        </button>
        
        <button
          onClick={onTest}
          className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          title="Testar Ferramenta"
        >
          <Play className="w-4 h-4" />
        </button>

        <button
          onClick={() => onToggle(!tool.enabled)}
          className={`p-2 rounded-lg transition-all flex items-center gap-2 ${
            tool.enabled 
              ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' 
              : 'bg-white/5 text-slate-500 border border-white/5'
          }`}
        >
          <Power className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-wider">
            {tool.enabled ? 'ON' : 'OFF'}
          </span>
        </button>
      </div>
    </div>
  );
};
