
import React, { useMemo, useEffect } from 'react';
import { Lead, ColumnData, Activity, Task } from '@/shared/types';
import { Users, Target, TrendingUp, DollarSign, ChevronDown, UserCheck, AlertTriangle, Wallet } from 'lucide-react';
import KpiCard from './KpiCard';
import PipelineOverview from './PipelineOverview';
import RecentActivities from './RecentActivities';

interface DashboardProps {
    leads: Lead[];
    columns: ColumnData[];
    activities: Activity[];
    tasks: Task[];
    onNavigate: (view: string) => void;
    onAnalyzePortfolio?: () => void;
    showNotification: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
    onExportReport?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ leads, columns, activities, tasks, onNavigate, onAnalyzePortfolio, showNotification, onExportReport }) => {

    const kpiData = useMemo(() => {
        const wonColumnIds = columns.filter(c => c.type === 'won').map(c => c.id);
        const lostColumnIds = columns.filter(c => c.type === 'lost').map(c => c.id);

        const totalDeals = leads.length;
        const totalWon = leads.filter(l => wonColumnIds.includes(l.columnId)).length;
        // const totalLost = leads.filter(l => lostColumnIds.includes(l.columnId)).length;
        const activeLeads = leads.filter(l => !wonColumnIds.includes(l.columnId) && !lostColumnIds.includes(l.columnId));
        
        const totalValue = activeLeads.reduce((sum, lead) => sum + Number(lead.value || 0), 0);
        const wonValue = leads.filter(l => wonColumnIds.includes(l.columnId)).reduce((sum, lead) => sum + Number(lead.value || 0), 0);
        
        const conversionRate = totalDeals > 0 ? ((totalWon / totalDeals) * 100).toFixed(1) : '0.0';

        // Fake trend data for demo visuals matching the image
        return {
            pipelineValue: totalValue,
            activeCount: activeLeads.length,
            conversionRate,
            revenue: wonValue,
        };
    }, [leads, columns]);

    const walletHealth = useMemo(() => {
        const activeCount = leads.filter(l => l.status === 'Ativo').length;
        const inactiveCount = leads.filter(l => l.status === 'Inativo').length;
        const churnCount = leads.filter(l => l.groupInfo?.churned).length; // Approximate churn logic
        const total = activeCount + inactiveCount + churnCount || 1;
        
        const activePct = Math.round((activeCount / total) * 100);
        const inactivePct = Math.round((inactiveCount / total) * 100);
        const churnPct = Math.round((churnCount / total) * 100);

        // Simple LTV calculation (Average value of won deals)
        const wonLeads = leads.filter(l => columns.find(c => c.id === l.columnId)?.type === 'won');
        const ltv = wonLeads.length > 0 
            ? wonLeads.reduce((acc, curr) => acc + Number(curr.value || 0), 0) / wonLeads.length 
            : 0;

        return {
            activeCount, inactiveCount, churnCount,
            activePct, inactivePct, churnPct,
            ltv
        };
    }, [leads, columns]);

    const currencyFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }); 

    // Risk Detection Logic
    useEffect(() => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Filter: Active status AND (lastActivity > 30 days ago OR created > 30 days ago if no activity)
        const riskLeads = leads.filter(l => {
            const lastDate = l.lastActivityTimestamp ? new Date(l.lastActivityTimestamp) : new Date(l.createdAt || Date.now());
            return l.status === 'Ativo' && lastDate < thirtyDaysAgo;
        });

        if (riskLeads.length > 0) {
            showNotification(`${riskLeads.length} alertas de risco gerados na lista de atividades!`, 'warning');
        } else {
            showNotification('Nenhum novo risco detectado. Carteira saudável!', 'success');
        }
    }, [leads, showNotification]);

    return (
        <div className="flex flex-col gap-8 pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Visão Geral</h1>
                    <p className="text-slate-400 mt-1">O pulso do seu negócio em tempo real.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 bg-slate-900 text-slate-300 px-4 py-2 rounded-lg border border-slate-800 hover:bg-slate-800 hover:text-white transition-colors text-sm font-medium">
                        Este Mês <ChevronDown className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={onAnalyzePortfolio}
                        className="bg-slate-900 text-slate-300 px-4 py-2 rounded-lg border border-slate-800 hover:bg-slate-800 hover:text-white transition-colors text-sm font-medium"
                    >
                        Análise de Carteira
                    </button>
                    <button 
                        onClick={onExportReport}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors text-sm font-medium shadow-lg shadow-blue-900/20 border border-blue-500/50"
                    >
                        Baixar Relatório
                    </button>
                </div>
            </div>

            {/* Main KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard 
                    title="Pipeline Total" 
                    value={currencyFormatter.format(kpiData.pipelineValue)} 
                    icon={DollarSign}
                    iconColor="text-blue-500"
                    trend={12.5}
                    onClick={() => onNavigate('Pipeline')}
                />
                <KpiCard 
                    title="Negócios Ativos" 
                    value={kpiData.activeCount.toString()} 
                    icon={Users}
                    iconColor="text-purple-500"
                    trend={5.2}
                    onClick={() => onNavigate('Pipeline')}
                />
                <KpiCard 
                    title="Conversão" 
                    value={`${kpiData.conversionRate}%`} 
                    icon={Target}
                    iconColor="text-emerald-500"
                    trend={2.1}
                    onClick={() => onNavigate('Pipeline')}
                />
                 <KpiCard 
                    title="Receita (Ganha)" 
                    value={currencyFormatter.format(kpiData.revenue)} 
                    icon={TrendingUp}
                    iconColor="text-orange-500"
                    trend={18}
                    onClick={() => onNavigate('Pipeline')}
                />
            </div>

            {/* Wallet Health Section */}
            <div>
                <div className="flex items-center gap-2 mb-4 pl-1">
                    <UserCheck className="w-5 h-5 text-blue-400" />
                    <h2 className="text-xl font-bold text-white">Saúde da Carteira</h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Distribution Card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-center h-full">
                        <div className="mb-4">
                            <p className="text-sm font-medium text-slate-400 mb-2">Distribuição da Carteira</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-white">{walletHealth.activePct}%</span>
                                <span className="text-emerald-500 text-sm font-bold uppercase">Ativos</span>
                            </div>
                        </div>
                        
                        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex mb-5">
                            <div className="h-full bg-emerald-500" style={{ width: `${walletHealth.activePct}%` }}></div>
                            <div className="h-full bg-amber-500" style={{ width: `${walletHealth.inactivePct}%` }}></div>
                            <div className="h-full bg-red-500" style={{ width: `${walletHealth.churnPct}%` }}></div>
                        </div>
                        
                        <div className="flex justify-between text-xs font-medium text-slate-400">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div> 
                                <span>Ativos ({walletHealth.activeCount})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-amber-500"></div> 
                                <span>Inativos ({walletHealth.inactiveCount})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div> 
                                <span>Churn ({walletHealth.churnCount})</span>
                            </div>
                        </div>
                    </div>

                    {/* Churn Risk Card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-center h-full relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-sm font-medium text-slate-400 mb-2">Risco de Churn</p>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-3xl font-bold text-white">0 Clientes</span>
                                <span className="text-red-400 text-[10px] font-bold uppercase bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded tracking-wide">Alertas</span>
                            </div>
                            <p className="text-xs text-slate-500 mb-5 leading-relaxed">Clientes ativos sem compra há {'>'} 30 dias.</p>
                            <button 
                                onClick={onAnalyzePortfolio}
                                className="text-sm text-blue-400 font-medium hover:text-blue-300 self-start transition-colors flex items-center gap-1"
                            >
                                Rodar verificação agora
                            </button>
                        </div>
                        <AlertTriangle className="absolute right-4 top-4 w-12 h-12 text-slate-800/50" />
                    </div>

                    {/* LTV Card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-center h-full relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-sm font-medium text-slate-400 mb-2">LTV Médio</p>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-3xl font-bold text-white">{currencyFormatter.format(walletHealth.ltv / 1000)}k</span>
                                <span className="text-emerald-400 text-[10px] font-bold uppercase bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded tracking-wide">Médio</span>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">Valor médio vitalício por cliente ativo.</p>
                        </div>
                        <Wallet className="absolute right-4 top-4 w-12 h-12 text-slate-800/50" />
                    </div>
                </div>
            </div>

            {/* Bottom Section: Funnel & Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <PipelineOverview columns={columns} leads={leads} onNavigate={onNavigate} />
                </div>
                <div className="lg:col-span-2">
                    <RecentActivities activities={activities} leads={leads} onNavigate={onNavigate} />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
