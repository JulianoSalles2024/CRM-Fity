import React, { useState } from 'react';
import { Trophy, FileText, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { User } from '../../types';
import VendedoresTab from './VendedoresTab';

type Tab = 'Vendedores' | 'Score' | 'Normativas';

interface Painel360LayoutProps {
    users: User[];
    onSelectSeller: (seller: User) => void;
    initialTab?: Tab;
}

function PlaceholderTab({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-slate-900/50 border border-dashed border-slate-700 rounded-2xl p-16 flex flex-col items-center justify-center text-center gap-4"
        >
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                <Icon className="w-8 h-8" />
            </div>
            <div>
                <h4 className="text-white font-bold text-lg">{title}</h4>
                <p className="text-slate-500 text-sm max-w-xs mx-auto mt-2">{description}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 text-slate-400 rounded-full text-xs font-medium border border-slate-700">
                <Clock className="w-3 h-3" />
                Em breve
            </span>
        </motion.div>
    );
}

const TABS: Tab[] = ['Vendedores', 'Score', 'Normativas'];

const Painel360Layout: React.FC<Painel360LayoutProps> = ({
    users,
    onSelectSeller,
    initialTab = 'Vendedores',
}) => {
    const [activeTab, setActiveTab] = useState<Tab>(initialTab);

    return (
        <div className="flex flex-col h-full space-y-6">
            {/* Page title */}
            <div>
                <h2 className="text-2xl font-bold text-white">Painel 360</h2>
                <p className="text-slate-400 text-sm mt-0.5">Visão completa da equipe de vendas</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-800 gap-1">
                {TABS.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-3 text-sm font-medium transition-all relative ${
                            activeTab === tab
                                ? 'text-blue-400'
                                : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        {tab}
                        {activeTab === tab && (
                            <motion.div
                                layoutId="activeTab360"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-auto">
                <AnimatePresence mode="wait">
                    {activeTab === 'Vendedores' && (
                        <motion.div
                            key="vendedores"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <VendedoresTab users={users} onSelectSeller={onSelectSeller} />
                        </motion.div>
                    )}

                    {activeTab === 'Score' && (
                        <motion.div key="score" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <PlaceholderTab
                                icon={Trophy}
                                title="Score em breve"
                                description="Aqui você verá o ranking de performance dos vendedores em tempo real."
                            />
                        </motion.div>
                    )}

                    {activeTab === 'Normativas' && (
                        <motion.div key="normativas" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <PlaceholderTab
                                icon={FileText}
                                title="Normativas em breve"
                                description="Gerencie e consulte as normativas bancárias aplicadas à equipe de vendas."
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Painel360Layout;
