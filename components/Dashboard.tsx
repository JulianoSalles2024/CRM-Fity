import React, { useMemo } from 'react';
import { Lead, ColumnData, Activity, Task } from '../types';
import { Users, Goal, TrendingUp, LayoutDashboard, XCircle } from 'lucide-react';
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

    const kpiData = useMemo(() => {
        const wonColumnId = 'closed';
        const lostColumnId = 'lost';

        const totalDeals = leads.length;
        const totalWon = leads.filter(l => l.columnId === wonColumnId).length;
        const totalLost = leads.filter(l => l.columnId === lostColumnId).length;
        const totalOpen = leads.filter(l => l.columnId !== wonColumnId && l.columnId !== lostColumnId).length;
        
        return {
            totalDeals,
            totalWon,
            totalLost,
            totalOpen,
        };
    }, [leads]);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <LayoutDashboard className="w-8 h-8 text-violet-500" />
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Dashboard</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">Visão geral das suas métricas e atividades</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard 
                    title="Total de Negócios" 
                    value={kpiData.totalDeals.toString()} 
                    icon={Users}
                    iconColor="text-violet-500"
                />
                <KpiCard 
                    title="Total Ganhos" 
                    value={kpiData.totalWon.toString()} 
                    icon={Goal}
                    iconColor="text-violet-500"
                />
                <KpiCard 
                    title="Total Perdidos" 
                    value={kpiData.totalLost.toString()} 
                    icon={XCircle}
                    iconColor="text-violet-500"
                />
                 <KpiCard 
                    title="Total em Aberto" 
                    value={kpiData.totalOpen.toString()} 
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