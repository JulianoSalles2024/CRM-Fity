
import React, { useMemo } from 'react';
import { Lead, User, ColumnData } from '../types';
import { Trophy, Users } from 'lucide-react';

interface TopSellersProps {
    leads: Lead[];
    users: User[];
    columns: ColumnData[];
}

const TopSellers: React.FC<TopSellersProps> = ({ leads, users, columns }) => {
    const currencyFormatter = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0,
    });

    const topSellers = useMemo(() => {
        const wonColumnIds = columns.filter(c => c.type === 'won').map(c => c.id);
        
        // Group won leads by assigned user
        const salesByUser: Record<string, { totalValue: number; count: number }> = {};
        
        leads.forEach(lead => {
            if (lead.assignedTo && wonColumnIds.includes(lead.columnId)) {
                if (!salesByUser[lead.assignedTo]) {
                    salesByUser[lead.assignedTo] = { totalValue: 0, count: 0 };
                }
                salesByUser[lead.assignedTo].totalValue += Number(lead.value || 0);
                salesByUser[lead.assignedTo].count += 1;
            }
        });

        // Map to user objects and sort
        return Object.entries(salesByUser)
            .map(([userId, stats]) => {
                const user = users.find(u => u.id === userId);
                return {
                    id: userId,
                    name: user?.name || 'Vendedor Desconhecido',
                    avatarUrl: user?.avatarUrl,
                    ...stats
                };
            })
            .sort((a, b) => b.totalValue - a.totalValue)
            .slice(0, 3);
    }, [leads, users, columns]);

    return (
        <div className="bg-[rgba(10,16,28,0.72)] backdrop-blur-[14px] p-6 rounded-xl border border-white/5 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <h2 className="font-bold text-white text-lg">Top Vendedores</h2>
                </div>
            </div>
            
            <div className="flex-1 space-y-4">
                {topSellers.length > 0 ? (
                    topSellers.map((seller, index) => (
                        <div key={seller.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-950/50 border border-slate-800/50 hover:border-slate-700 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <img 
                                        src={seller.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.name)}&background=random`} 
                                        alt={seller.name}
                                        className="w-10 h-10 rounded-full border-2 border-slate-800"
                                    />
                                    <div className={`absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg
                                        ${index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-amber-700' : 'bg-slate-700'}`}>
                                        {index + 1}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">{seller.name}</p>
                                    <p className="text-xs text-slate-500">{seller.count} deals fechados</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-emerald-400">{currencyFormatter.format(seller.totalValue)}</p>
                                <div className="w-24 bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                                    <div 
                                        className="h-full bg-emerald-500 rounded-full" 
                                        style={{ width: `${Math.min((seller.totalValue / (topSellers[0]?.totalValue || 1)) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-full py-10 text-slate-500">
                        <Users className="w-12 h-12 mb-3 opacity-20" />
                        <p className="text-sm">Nenhum deal fechado no período.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TopSellers;
