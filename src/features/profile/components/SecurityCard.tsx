import React from 'react';
import { Key } from 'lucide-react';

interface SecurityCardProps {
  onEdit: () => void;
}

export const SecurityCard: React.FC<SecurityCardProps> = ({ onEdit }) => {
  return (
    <div className="bg-[#0f1116] border border-slate-800 rounded-2xl p-8 shadow-xl">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-slate-800/50">
            <Key className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Segurança</h3>
            <p className="text-sm text-slate-400">Gerencie sua senha de acesso.</p>
          </div>
        </div>
        <button 
          onClick={onEdit}
          className="text-sky-500 hover:text-sky-400 font-medium transition-colors"
        >
          Alterar Senha
        </button>
      </div>

      <p className="text-sm text-slate-500 leading-relaxed">
        Sua senha está configurada. Clique em "Alterar Senha" para modificá-la.
      </p>
    </div>
  );
};
