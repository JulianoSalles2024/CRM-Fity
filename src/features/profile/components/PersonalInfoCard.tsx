import React from 'react';
import { Pencil, Mail, Phone, Calendar } from 'lucide-react';

interface PersonalInfoCardProps {
  user: {
    name: string;
    nickname: string;
    fullName: string;
    role: string;
    email: string;
    phone: string;
    memberSince: string;
    avatarUrl: string;
  };
  onEdit: () => void;
}

export const PersonalInfoCard: React.FC<PersonalInfoCardProps> = ({ user, onEdit }) => {
  return (
    <div className="bg-[#0f1116] border border-slate-800 rounded-2xl p-8 shadow-xl">
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-6">
          <div className="relative">
            <img 
              src={user.avatarUrl} 
              alt={user.nickname} 
              className="w-24 h-24 rounded-2xl object-cover border-2 border-slate-800"
            />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-white">{user.nickname}</h2>
            </div>
            <p className="text-slate-400 mb-3">{user.fullName}</p>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 text-amber-500 text-xs font-bold uppercase tracking-wider border border-amber-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              {user.role}
            </span>
          </div>
        </div>
        <button 
          onClick={onEdit}
          className="flex items-center gap-2 text-sky-500 hover:text-sky-400 font-medium transition-colors"
        >
          <Pencil className="w-4 h-4" />
          Editar
        </button>
      </div>

      <div className="space-y-4 pt-6 border-t border-slate-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-slate-300">
            <Mail className="w-4 h-4 text-slate-500" />
            <span>{user.email}</span>
          </div>
          <button className="text-sky-500 hover:text-sky-400 text-sm font-medium">
            Alterar
          </button>
        </div>
        
        <div className="flex items-center gap-3 text-slate-300">
          <Phone className="w-4 h-4 text-slate-500" />
          <span>{user.phone}</span>
        </div>

        <div className="flex items-center gap-3 text-slate-500 text-sm">
          <Calendar className="w-4 h-4" />
          <span>Membro desde {user.memberSince}</span>
        </div>
      </div>
    </div>
  );
};
