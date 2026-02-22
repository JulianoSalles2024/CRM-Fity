import React from 'react';
import { ArrowLeft, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import type { User } from '../../types';

function PlaceholderSection({ title }: { key?: React.Key; title: string }) {
    return (
        <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">{title}</h3>
            <div className="bg-slate-900/50 border border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-center gap-2">
                <Clock className="w-5 h-5 text-slate-600" />
                <span className="text-sm text-slate-500">Em breve</span>
            </div>
        </div>
    );
}

interface Perfil360PageProps {
    seller: User | null;
    sellerId: string;
    onBack: () => void;
}

const SECTIONS: Array<{ id: string; title: string }> = [
    { id: 'header-estrategico', title: 'Header Estratégico' },
    { id: 'kpis-periodo', title: 'KPIs do Período' },
    { id: 'evolucao-vendas', title: 'Evolução de Vendas' },
    { id: 'breakdown-banco', title: 'Breakdown por Banco' },
    { id: 'breakdown-tipo', title: 'Breakdown por Tipo de Operação' },
    { id: 'lista-operacoes', title: 'Lista de Operações' },
];

const Perfil360Page: React.FC<Perfil360PageProps> = ({ seller, sellerId, onBack }) => {
    if (!seller) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-slate-400 font-medium text-lg">Vendedor não encontrado</p>
                <p className="text-slate-500 text-sm mt-1 mb-6">
                    O ID <code className="bg-slate-800 px-1.5 py-0.5 rounded text-xs">{sellerId}</code> não corresponde a nenhum vendedor.
                </p>
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para Vendedores
                </button>
            </div>
        );
    }

    const isActive = seller.isActive !== false;
    const initials = seller.name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
        >
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-sm border border-slate-700 overflow-hidden flex-shrink-0">
                        {seller.avatarUrl ? (
                            <img src={seller.avatarUrl} alt={seller.name} className="w-full h-full object-cover" />
                        ) : (
                            initials
                        )}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">
                            Perfil 360 – {seller.name}
                        </h2>
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
                    </div>
                </div>
            </div>

            {/* Placeholder Sections */}
            <div className="space-y-6">
                {SECTIONS.map((section) => (
                    <PlaceholderSection key={section.id} title={section.title} />
                ))}
            </div>
        </motion.div>
    );
};

export default Perfil360Page;
