import React, { useState } from 'react';
import { Phone, Shield, Check, Save, User, AtSign, Calendar, Lock } from 'lucide-react';
import { ProfileAvatar } from './components/ProfileAvatar';

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
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

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
    setIsEditing(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCancel = () => {
    setEditData(user);
    setPreviewUrl(user.avatarUrl);
    setIsEditing(false);
  };

  const inputClass = `w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all duration-200 ${
    isEditing
      ? 'bg-white/[0.04] border border-white/[0.08] focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/40'
      : 'bg-transparent border border-transparent cursor-default'
  }`;

  return (
    <div className="max-w-3xl mx-auto py-10 px-6 space-y-6">

      {/* ── Card 1: User Info ──────────────────────────────── */}
      <div className="relative bg-slate-800/40 backdrop-blur-md border border-white/[0.06] rounded-2xl shadow-xl shadow-black/30 overflow-hidden">
        {/* top gradient highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Card header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-5">
            <div className={!isEditing ? 'pointer-events-none' : ''}>
              <ProfileAvatar
                avatarUrl={previewUrl}
                onImageChange={handleImageChange}
                onRemove={handleRemoveAvatar}
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white leading-tight">
                {editData.nickname || `${editData.firstName} ${editData.lastName}`}
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">
                {editData.firstName} {editData.lastName}
              </p>
              <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                {editData.role}
              </span>
            </div>
          </div>

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:border-slate-500 transition-all"
            >
              Editar
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg transition-all active:scale-[0.97] ${
                  saved
                    ? 'bg-emerald-500 shadow-emerald-500/20 text-white'
                    : 'bg-sky-600 hover:bg-sky-500 shadow-sky-500/20 text-white'
                }`}
              >
                {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saved ? 'Salvo!' : 'Salvar'}
              </button>
            </div>
          )}
        </div>

        {/* Form fields */}
        <div className="px-8 py-7 space-y-5">

          {/* Nome + Sobrenome */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 mt-1 rounded-lg bg-slate-700/50 flex items-center justify-center">
              <User className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Nome</label>
                <input
                  type="text"
                  value={editData.firstName}
                  onChange={e => setEditData({ ...editData, firstName: e.target.value })}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Sobrenome</label>
                <input
                  type="text"
                  value={editData.lastName}
                  onChange={e => setEditData({ ...editData, lastName: e.target.value })}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-white/[0.04]" />

          {/* Apelido */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 mt-1 rounded-lg bg-slate-700/50 flex items-center justify-center">
              <AtSign className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Apelido</label>
              <input
                type="text"
                value={editData.nickname}
                onChange={e => setEditData({ ...editData, nickname: e.target.value })}
                disabled={!isEditing}
                className={inputClass}
              />
            </div>
          </div>

          <div className="border-t border-white/[0.04]" />

          {/* Telefone */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 mt-1 rounded-lg bg-slate-700/50 flex items-center justify-center">
              <Phone className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Telefone</label>
              <input
                type="text"
                value={editData.phone}
                onChange={e => setEditData({ ...editData, phone: e.target.value })}
                disabled={!isEditing}
                className={inputClass}
              />
            </div>
          </div>

        </div>

      </div>

      {/* ── Card 2: Security ──────────────────────────────── */}
      <div className="relative bg-slate-800/40 backdrop-blur-md border border-white/[0.06] rounded-2xl shadow-xl shadow-black/30 overflow-hidden">
        {/* top gradient highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Card header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-slate-700/50 flex items-center justify-center">
              <Shield className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Segurança</h3>
              <p className="text-xs text-slate-500 mt-0.5">Gerencie sua senha de acesso.</p>
            </div>
          </div>
          <button
            onClick={() => setShowPasswordForm(v => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              showPasswordForm
                ? 'bg-slate-700/60 border-slate-500 text-white'
                : 'border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:border-slate-500'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            Alterar Senha
          </button>
        </div>

        {/* Expandable password form */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
          showPasswordForm ? 'max-h-80' : 'max-h-0'
        }`}>
          <div className={`px-8 pb-8 pt-6 border-t border-white/[0.06] space-y-4 transition-all duration-300 ease-in-out ${
            showPasswordForm ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
          }`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="new-password" className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Nova Senha
                </label>
                <input
                  id="new-password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="confirm-password" className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Confirmar Nova Senha
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  placeholder="Digite novamente"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowPasswordForm(false)}
                className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => setShowPasswordForm(false)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/20 transition-all active:scale-[0.97]"
              >
                <Lock className="w-3.5 h-3.5" />
                Salvar Senha
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
