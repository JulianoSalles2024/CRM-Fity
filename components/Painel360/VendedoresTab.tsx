import React, { useState, useMemo } from 'react';
import { Search, ArrowRight, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import type { User } from '../../types';

interface VendedoresTabProps {
    users: User[];
    onSelectSeller: (seller: User) => void;
}

function BadgeStatus({ isActive }: { isActive: boolean }) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-slate-700/50 text-slate-400 border border-slate-700'
            }`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-slate-500'}`} />
            {isActive ? 'Ativo' : 'Inativo'}
        </span>
    );
}

const VendedoresTab: React.FC<VendedoresTabProps> = ({ users, onSelectSeller }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const sellers = useMemo(() => {
        const list = users.filter(u => u.role === 'Vendedor' || u.role === 'Admin');

        const filtered = list.filter(s =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        // Sort: active first (isActive !== false), then alphabetically within each group
        return [...filtered].sort((a, b) => {
            const aActive = a.isActive !== false;
            const bActive = b.isActive !== false;
            if (aActive && !bActive) return -1;
            if (!aActive && bActive) return 1;
            return a.name.localeCompare(b.name, 'pt-BR');
        });
    }, [users, searchQuery]);

    return (
        <div className="space-y-5">
            <div>
                <h3 className="text-lg font-bold text-white">Vendedores</h3>
                <p className="text-sm text-slate-400 mt-0.5">
                    Selecione um vendedor para ver o Perfil 360º
                </p>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                    type="text"
                    placeholder="Buscar vendedor por nome…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                />
            </div>

            {/* List */}
            {sellers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Users className="w-12 h-12 text-slate-700 mb-3" />
                    <p className="text-slate-400 font-medium">Nenhum vendedor encontrado</p>
                    {searchQuery && (
                        <p className="text-slate-500 text-sm mt-1">
                            Tente buscar com outro nome.
                        </p>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sellers.map((seller) => {
                        const isActive = seller.isActive !== false;
                        const initials = seller.name
                            .split(' ')
                            .map(n => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase();

                        return (
                            <motion.button
                                key={seller.id}
                                layout
                                onClick={() => onSelectSeller(seller)}
                                className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-blue-500/50 hover:bg-slate-900 transition-all group text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-sm border border-slate-700 overflow-hidden flex-shrink-0">
                                        {seller.avatarUrl ? (
                                            <img
                                                src={seller.avatarUrl}
                                                alt={seller.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            initials
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                                            {seller.name}
                                        </h4>
                                        <div className="mt-1">
                                            <BadgeStatus isActive={isActive} />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500 group-hover:text-blue-400 transition-colors hidden sm:inline">
                                        Ver Perfil 360
                                    </span>
                                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-all group-hover:translate-x-0.5" />
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default VendedoresTab;
