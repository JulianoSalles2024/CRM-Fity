import React, { useState } from 'react';
import { Key, Eye, EyeOff, Check } from 'lucide-react';

interface SecurityFormProps {
  onSave: (data: any) => void;
  onCancel: () => void;
}

export const SecurityForm: React.FC<SecurityFormProps> = ({ onSave, onCancel }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    new: '',
    confirm: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(passwords);
  };

  return (
    <div className="bg-[#0f1116] border border-slate-800 rounded-2xl p-8 shadow-xl">
      <div className="flex items-start gap-4 mb-8">
        <div className="p-2 rounded-lg bg-slate-800/50">
          <Key className="w-5 h-5 text-slate-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Segurança</h3>
          <p className="text-sm text-slate-400">Gerencie sua senha de acesso.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Nova Senha</label>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"}
              placeholder="Mínimo 6 caracteres"
              value={passwords.new}
              onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
              className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Confirmar Nova Senha</label>
          <input 
            type={showPassword ? "text" : "password"}
            placeholder="Digite novamente"
            value={passwords.confirm}
            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
            className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
          />
        </div>

        <div className="flex items-center justify-center gap-4 pt-4">
          <button 
            type="button"
            onClick={onCancel}
            className="px-8 py-3 text-slate-300 hover:text-white font-medium transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            className="flex-1 max-w-[300px] flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 text-white font-bold py-3 rounded-xl shadow-lg shadow-sky-500/20 transition-all active:scale-[0.98]"
          >
            <Check className="w-5 h-5" />
            Salvar Senha
          </button>
        </div>
      </form>
    </div>
  );
};
