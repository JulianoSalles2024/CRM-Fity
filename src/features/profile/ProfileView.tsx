import React, { useState } from 'react';
import { Save, Phone, Shield, Check } from 'lucide-react';
import { ProfileAvatar } from './components/ProfileAvatar';
import { GlassCard } from '@/src/shared/components/GlassCard';
import { GlassSection } from '@/src/shared/components/GlassSection';

export const ProfileView: React.FC = () => {
  // Initial state from localStorage or defaults
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('crm-profile-user');
    return saved ? JSON.parse(saved) : {
      firstName: 'Juliano',
      lastName: 'Salles',
      nickname: 'Juka',
      role: 'Admin',
      phone: '+5551993351127',
      avatarUrl: 'https://i.pravatar.cc/150?u=juka'
    };
  });

  const [editData, setEditData] = useState(user);
  const [previewUrl, setPreviewUrl] = useState(user.avatarUrl);
  const [saved, setSaved] = useState(false);

  const handleImageChange = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPreviewUrl(base64);
      setEditData(prev => ({ ...prev, avatarUrl: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    const defaultUrl = 'https://i.pravatar.cc/150?u=juka';
    setPreviewUrl(defaultUrl);
    setEditData(prev => ({ ...prev, avatarUrl: defaultUrl }));
  };

  const handleSave = () => {
    setUser(editData);
    localStorage.setItem('crm-profile-user', JSON.stringify(editData));
    window.dispatchEvent(new CustomEvent('profile-updated', { detail: editData }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCancel = () => {
    setEditData(user);
    setPreviewUrl(user.avatarUrl);
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <header className="mb-12">
        <h1 className="text-4xl font-bold text-white mb-2">Meu Perfil</h1>
        <p className="text-slate-400">Gerencie suas informações pessoais e segurança.</p>
      </header>

      <div className="space-y-8">
        {/* Main Card with Glassmorphism */}
        <GlassCard className="p-8 shadow-[0_8px_32px_rgba(0,149,255,0.1)]">
          <div className="flex items-center gap-6 mb-10">
            <ProfileAvatar
              avatarUrl={previewUrl}
              onImageChange={handleImageChange}
              onRemove={handleRemoveAvatar}
            />
            <div>
              <h2 className="text-2xl font-bold text-white">{editData.nickname}</h2>
              <p className="text-slate-400">{editData.firstName} {editData.lastName}</p>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 text-amber-500 text-xs font-bold uppercase tracking-wider border border-amber-500/20 mt-3">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                {editData.role}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Nome</label>
              <input 
                type="text"
                value={editData.firstName}
                onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Sobrenome</label>
              <input 
                type="text"
                value={editData.lastName}
                onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <label className="text-sm font-medium text-slate-400">Apelido (como gostaria de ser chamado)</label>
            <input 
              type="text"
              value={editData.nickname}
              onChange={(e) => setEditData({ ...editData, nickname: e.target.value })}
              className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
            />
          </div>

          <div className="space-y-2 mb-10">
            <label className="text-sm font-medium text-slate-400">Telefone</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text"
                value={editData.phone}
                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                className="w-full bg-black/20 border border-white/5 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-center gap-6">
            <button 
              onClick={handleCancel}
              className="px-8 py-3 text-slate-400 hover:text-white font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className={`flex-1 max-w-[300px] flex items-center justify-center gap-2 font-bold py-3 rounded-xl shadow-lg transition-all active:scale-[0.98] ${
                saved
                  ? 'bg-emerald-500 shadow-emerald-500/20 text-white'
                  : 'bg-sky-500 hover:bg-sky-400 shadow-sky-500/20 text-white'
              }`}
            >
              {saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
              {saved ? 'Salvo!' : 'Salvar'}
            </button>
          </div>
        </GlassCard>

        {/* Security Section (Styled like the screenshot) */}
        <GlassCard className="p-8 shadow-[0_8px_32px_rgba(0,149,255,0.05)]">
          <div className="flex items-start gap-4 mb-8">
            <div className="p-2 rounded-lg bg-white/5">
              <Shield className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Segurança</h3>
              <p className="text-sm text-slate-400">Gerencie sua senha de acesso.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Nova Senha</label>
              <input 
                type="password"
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Confirmar Nova Senha</label>
              <input 
                type="password"
                placeholder="Digite novamente"
                className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
              />
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
