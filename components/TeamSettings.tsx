import React, { useState } from 'react';
import { User, InviteLink, UserRole } from '../types';
import { Users, UserPlus, Copy, Trash2, Clock, Shield, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface TeamSettingsProps {
    users: User[];
    currentUser: User;
    onUpdateUsers: (users: User[]) => void;
}

const TeamSettings: React.FC<TeamSettingsProps> = ({ users, currentUser, onUpdateUsers }) => {
    const [isInviteModalOpen, setInviteModalOpen] = useState(false);
    const [inviteLinks, setInviteLinks] = useState<InviteLink[]>([]);
    
    // Invite Modal State
    const [inviteRole, setInviteRole] = useState<UserRole>('Vendedor');
    const [inviteExpiration, setInviteExpiration] = useState<'7 days' | '30 days' | 'never'>('7 days');

    const handleGenerateInvite = () => {
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        let expiresAt: string | null = null;
        
        if (inviteExpiration === '7 days') {
            const date = new Date();
            date.setDate(date.getDate() + 7);
            expiresAt = date.toISOString();
        } else if (inviteExpiration === '30 days') {
            const date = new Date();
            date.setDate(date.getDate() + 30);
            expiresAt = date.toISOString();
        }

        const newInvite: InviteLink = {
            id: `invite-${Date.now()}`,
            role: inviteRole,
            expiration: inviteExpiration,
            expiresAt,
            token,
            createdAt: new Date().toISOString()
        };

        setInviteLinks(prev => [newInvite, ...prev]);
    };

    const handleDeleteInvite = (id: string) => {
        setInviteLinks(prev => prev.filter(link => link.id !== id));
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Could add a toast here
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(date);
    };

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Sua Equipe</h2>
                    <p className="text-slate-400 mt-1">
                        {users.length} membro{users.length !== 1 && 's'} • {users.filter(u => u.role === 'Admin' || !u.role).length} admin, {users.filter(u => u.role === 'Vendedor').length} vendedores
                    </p>
                </div>
                <button 
                    onClick={() => setInviteModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    <UserPlus className="w-4 h-4" />
                    Convidar
                </button>
            </div>

            {/* Members List */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                <div className="divide-y divide-slate-800">
                    {users.map(user => (
                        <div key={user.id} className="p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    {user.avatarUrl ? (
                                        <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-xl object-cover" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                                            {getInitials(user.name)}
                                        </div>
                                    )}
                                    {(user.role === 'Admin' || !user.role) && (
                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-slate-900 rounded-full flex items-center justify-center">
                                            <Shield className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-white">{user.name}</h3>
                                        {user.id === currentUser.id && (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-blue-400 uppercase tracking-wider">
                                                Você
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                        <span>{user.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                        <span className="flex items-center gap-1 text-yellow-500">
                                            <Shield className="w-3 h-3" />
                                            {user.role || 'Admin'}
                                        </span>
                                        <span>•</span>
                                        <span>Desde {formatDate(user.joinedAt || new Date().toISOString())}</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Actions could go here */}
                        </div>
                    ))}
                </div>
            </div>

            {/* Invite Modal */}
            <AnimatePresence>
                {isInviteModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-800 flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                                    <UserPlus className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Gerar Convite</h3>
                                    <p className="text-sm text-slate-400">Crie links de acesso para sua equipe</p>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Active Links List */}
                                {inviteLinks.length > 0 && (
                                    <div className="space-y-3">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Links Ativos</label>
                                        <div className="space-y-2">
                                            {inviteLinks.map(link => (
                                                <div key={link.id} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 flex items-center justify-between group">
                                                    <div className="overflow-hidden">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 uppercase">
                                                                {link.role}
                                                            </span>
                                                            <span className="text-xs text-slate-500">
                                                                Expira em {link.expiresAt ? new Date(link.expiresAt).toLocaleDateString() : 'Nunca'}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm text-slate-300 font-mono truncate">
                                                            ...{link.token.substring(link.token.length - 8)}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button 
                                                            onClick={() => copyToClipboard(`${window.location.origin}/invite/${link.token}`)}
                                                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                                            title="Copiar Link"
                                                        >
                                                            <Copy className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteInvite(link.id)}
                                                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                            title="Revogar"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Configuration Form */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Cargo</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button 
                                                onClick={() => setInviteRole('Vendedor')}
                                                className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${inviteRole === 'Vendedor' ? 'bg-blue-500/10 border-blue-500 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                                            >
                                                <BriefcaseIcon className="w-4 h-4" />
                                                <span className="font-medium">Vendedor</span>
                                                {inviteRole === 'Vendedor' && <div className="w-2 h-2 rounded-full bg-blue-500 ml-1" />}
                                            </button>
                                            <button 
                                                onClick={() => setInviteRole('Admin')}
                                                className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${inviteRole === 'Admin' ? 'bg-blue-500/10 border-blue-500 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                                            >
                                                <Shield className="w-4 h-4" />
                                                <span className="font-medium">Admin</span>
                                                {inviteRole === 'Admin' && <div className="w-2 h-2 rounded-full bg-blue-500 ml-1" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Expiração</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {(['7 days', '30 days', 'never'] as const).map((opt) => (
                                                <button
                                                    key={opt}
                                                    onClick={() => setInviteExpiration(opt)}
                                                    className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${inviteExpiration === opt ? 'bg-white text-slate-900 border-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                                                >
                                                    {opt === '7 days' ? '7 dias' : opt === '30 days' ? '30 dias' : 'Nunca'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-800 flex justify-between items-center bg-slate-900/50">
                                <button 
                                    onClick={() => setInviteModalOpen(false)}
                                    className="text-slate-400 hover:text-white font-medium transition-colors"
                                >
                                    Fechar
                                </button>
                                <button 
                                    onClick={handleGenerateInvite}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
                                >
                                    <Copy className="w-4 h-4" />
                                    Gerar Link
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Helper icon
const BriefcaseIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
);

export default TeamSettings;
