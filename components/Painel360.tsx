
import React, { useState } from 'react';
import { Search, User, Trophy, FileText, Plus, ArrowRight, ShieldCheck, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { User as UserType, Id } from '../types';

interface Painel360Props {
    users: UserType[];
    onSelectSeller: (seller: UserType) => void;
}

const Painel360: React.FC<Painel360Props> = ({ users, onSelectSeller }) => {
    const [activeTab, setActiveTab] = useState<'Vendedores' | 'Score' | 'Normativas'>('Vendedores');
    const [searchQuery, setSearchQuery] = useState('');

    const sellers = users.filter(u => u.role === 'Vendedor' || u.role === 'Admin');

    const filteredSellers = sellers.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Painel 360</h2>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-800">
                {(['Vendedores', 'Score', 'Normativas'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 text-sm font-medium transition-all relative ${
                            activeTab === tab 
                                ? 'text-blue-400' 
                                : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        {tab}
                        {activeTab === tab && (
                            <motion.div 
                                layoutId="activeTab360" 
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" 
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto">
                <AnimatePresence mode="wait">
                    {activeTab === 'Vendedores' && (
                        <motion.div
                            key="vendedores"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            <div className="relative max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Buscar vendedor..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredSellers.map((seller) => (
                                    <button
                                        key={seller.id}
                                        onClick={() => onSelectSeller(seller)}
                                        className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-blue-500/50 hover:bg-slate-900 transition-all group text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold border border-slate-700">
                                                {seller.avatarUrl ? (
                                                    <img src={seller.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                                ) : (
                                                    seller.name.substring(0, 2).toUpperCase()
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                                                    {seller.name}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`w-2 h-2 rounded-full ${seller.role === 'Admin' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                                                        Ativo
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-blue-400 transition-all" />
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'Score' && (
                        <motion.div
                            key="score"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-white">Ranking de Performance</h3>
                                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5">
                                    <Search className="w-4 h-4 text-slate-500" />
                                    <span className="text-xs text-slate-400">Filtro por período</span>
                                </div>
                            </div>

                            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                                    <Trophy className="w-8 h-8" />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold">Ranking em breve</h4>
                                    <p className="text-slate-500 text-sm max-w-xs mx-auto mt-2">
                                        Aqui você poderá visualizar o ranking de performance dos vendedores em tempo real.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'Normativas' && (
                        <motion.div
                            key="normativas"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-white">Normativas Bancárias</h3>
                                <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all">
                                    <Plus className="w-4 h-4" /> Cadastrar Banco
                                </button>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-950 border-b border-slate-800">
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Banco</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo de Operação</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        <tr className="hover:bg-slate-800/30 transition-colors">
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic text-sm">
                                                Nenhum banco cadastrado ainda.
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Painel360;
