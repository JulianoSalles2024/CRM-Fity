
import React, { useMemo } from 'react';
import { Lead, ColumnData, Activity, Task } from '../types';
import { Users, Goal, DollarSign, TrendingUp, LayoutDashboard } from 'lucide-react';
import KpiCard from './KpiCard';
import PipelineOverview from './PipelineOverview';
import RecentActivities from './RecentActivities';

interface DashboardProps {
    leads: Lead[];
    columns: ColumnData[];
    activities: Activity[];
    tasks: Task[];
    onNavigate: (view: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ leads, columns, activities, tasks, onNavigate }) => {
    
    const currencyFormatter = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });

    const kpiData = useMemo(() => {
        const totalLeads = leads.length;
        const wonLeads = leads.filter(l => l.columnId === 'won').length;
        const activeLeads = leads.filter(l => l.columnId !== 'won' && l.columnId !== 'lost');
        const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(0) : 0;
        const pipelineValue = activeLeads.reduce((sum, lead) => sum + lead.value, 0);
        
        return {
            totalLeads: totalLeads,
            conversionRate,
            pipelineValue,
            monthlyGoal: 0, // Placeholder
        };
    }, [leads]);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <LayoutDashboard className="w-8 h-8 text-violet-500" />
                <div>
                    <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                    <p className="text-zinc-400">Visão geral das suas métricas e atividades</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard 
                    title="Total de Leads" 
                    value={kpiData.totalLeads.toString()} 
                    icon={Users}
                    iconColor="text-violet-500"
                />
                <KpiCard 
                    title="Taxa de Conversão" 
                    value={`${kpiData.conversionRate}%`} 
                    icon={Goal}
                    iconColor="text-violet-500"
                />
                <KpiCard 
                    title="Valor no Pipeline" 
                    value={currencyFormatter.format(kpiData.pipelineValue)} 
                    icon={DollarSign}
                    iconColor="text-violet-500"
                />
                 <KpiCard 
                    title="Meta Mensal" 
                    value={`${kpiData.monthlyGoal}%`} 
                    icon={TrendingUp}
                    iconColor="text-violet-500"
                />
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PipelineOverview columns={columns} leads={leads} onNavigate={onNavigate} />
                <RecentActivities activities={activities} leads={leads} onNavigate={onNavigate} />
            </div>
        </div>
    );
};

export default Dashboard;
