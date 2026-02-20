import React, { useState } from 'react';
import { Save, Phone } from 'lucide-react';

interface PersonalInfoFormProps {
  initialData: {
    firstName: string;
    lastName: string;
    nickname: string;
    phone: string;
    avatarUrl: string;
    role: string;
  };
  onSave: (data: any) => void;
  onCancel: () => void;
}

export const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({ initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState(initialData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="bg-[#0f1116] border border-slate-800 rounded-2xl p-8 shadow-xl">
      <div className="flex items-center gap-6 mb-8">
        <img 
          src={formData.avatarUrl} 
          alt={formData.nickname} 
          className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-800"
        />
        <div>
          <h2 className="text-xl font-bold text-white">{formData.nickname}</h2>
          <p className="text-slate-400">{formData.firstName} {formData.lastName}</p>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-wider border border-amber-500/20 mt-2">
            {formData.role}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Nome</label>
            <input 
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Sobrenome</label>
            <input 
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Apelido (como gostaria de ser chamado)</label>
          <input 
            type="text"
            value={formData.nickname}
            onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
            className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Telefone</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
            />
          </div>
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
            <Save className="w-5 h-5" />
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
};
