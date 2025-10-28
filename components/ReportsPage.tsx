import React, { useMemo } from 'react';
import { Lead, ColumnData, Task } from '../types';
import { BarChart, ChevronDown, RefreshCw, Download, Users, Goal, DollarSign, CheckCircle, Eye, Target } from 'lucide-react';

interface ReportsPageProps {
    leads: Lead[];
    columns: ColumnData[];
    tasks: Task[];
}

interface ReportKpiCardProps {
    title: string;
    value: string;
    icon: React.ElementType;
    color: string;
}

const ReportKpiCard: React.FC<ReportKpiCardProps> = ({ title, value, icon: Icon, color }) => (
    <div className="bg-zinc-800 p-5 rounded-lg border border-zinc-700 flex justify-between items-center transition-all duration-200 ease-in-out hover:bg-zinc-700/50 hover:-translate-y-1 hover:shadow-lg">
        <div>
            <p className="text-sm text-zinc-400">{title}</p>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
            <Icon className="w-6 h-6" style={{ color }} />
        </div>
    </div>
);


const ReportsPage: React.FC<ReportsPageProps> = ({ leads, columns, tasks }) => {
    
    const currencyFormatter = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });

    const reportData = useMemo(() => {
        const totalLeads = leads.length;
        const closedWonColumnId = columns[columns.length - 1]?.id; // Assume last column is 'won'
        const wonLeadsCount = leads.filter(l => l.columnId === closedWonColumnId).length;
        const conversionRate = totalLeads > 0 ? ((wonLeadsCount / totalLeads) * 100).toFixed(1) : '0.0';

        const totalValue = leads.reduce((sum, lead) => sum + lead.value, 0);
        const averageValue = totalLeads > 0 ? totalValue / totalLeads : 0;

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const activityCompletionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : '0.0';
        
        const funnelData = columns.map(col => {
            const leadsInCol = leads.filter(l => l.columnId === col.id);
            return {
                ...col,
                count: leadsInCol.length,
            };
        });

        const topLeads = [...leads]
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
            
        return {
            totalLeads,
            conversionRate,
            averageValue,
            activityCompletionRate,
            funnelData,
            topLeads,
        };
    }, [leads, columns, tasks]);

     const columnMap = useMemo(() => {
        return columns.reduce((acc, col) => {
            acc[col.id] = {title: col.title, color: col.color};
            return acc;
        }, {} as Record<string, {title: string, color: string}>);
    }, [columns]);

    return (
        <div className="flex flex-col gap-6">
             <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <BarChart className="w-8 h-8 text-[#14ff00]" />
                    <div>
                        <h1 className="text-2xl font-bold text-white">Relatórios</h1>
                        <p className="text-zinc-400">Análise detalhada de desempenho e métricas</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 text-sm text-zinc-300 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 px-3 py-1.5 rounded-md">
                        <span>Último Mês</span>
                        <ChevronDown className="w-4 h-4 text-zinc-500" />
                    </button>
                    <button className="p-2 text-zinc-300 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 rounded-md">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                     <button className="p-2 text-zinc-300 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 rounded-md">
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <ReportKpiCard title="Total de Leads" value={reportData.totalLeads.toString()} icon={Users} color="#8b5cf6" />
                <ReportKpiCard title="Taxa de Conversão" value={`${reportData.conversionRate}%`} icon={Target} color="#ec4899" />
                <ReportKpiCard title="Valor Médio" value={currencyFormatter.format(reportData.averageValue)} icon={DollarSign} color="#3b82f6" />
                <ReportKpiCard title="Conclusão de Atividades" value={`${reportData.activityCompletionRate}%`} icon={CheckCircle} color="#10b981" />
            </div>
            
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-zinc-800 p-5 rounded-lg border border-zinc-700">
                    <h3 className="font-semibold text-white mb-4">Funil de Conversão</h3>
                    <div className="space-y-3">
                        {reportData.funnelData.map(stage => (
                            <div key={stage.id} className="flex items-center gap-3">
                                <p className="text-sm text-zinc-400 w-28 truncate">{stage.title}</p>
                                <div className="flex-1 bg-zinc-700 rounded-full h-4">
                                    <div 
                                        className="h-4 rounded-full text-white text-xs flex items-center pl-2"
                                        style={{ 
                                            width: `${reportData.totalLeads > 0 ? (stage.count / reportData.totalLeads) * 100 : 0}%`,
                                            backgroundColor: stage.color,
                                            minWidth: '20px'
                                        }}
                                    >{stage.count}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-zinc-800 p-5 rounded-lg border border-zinc-700">
                    <h3 className="font-semibold text-white mb-4">Evolução Temporal</h3>
                     <div className="h-48 flex items-end justify-center text-zinc-500 text-sm">
                        {/* Placeholder for chart */}
                        <p>Gráfico de Linhas</p>
                    </div>
                </div>
                 <div className="bg-zinc-800 p-5 rounded-lg border border-zinc-700">
                    <h3 className="font-semibold text-white mb-4">Distribuição de Atividades</h3>
                     <div className="h-48 flex items-center justify-center text-zinc-500 text-sm">
                        <p>Gráfico de Rosca</p>
                    </div>
                </div>
                 <div className="bg-zinc-800 p-5 rounded-lg border border-zinc-700">
                    <h3 className="font-semibold text-white mb-4">Origem dos Leads</h3>
                     <div className="h-48 flex items-center justify-center text-zinc-500 text-sm">
                        <p>Gráfico de Rosca</p>
                    </div>
                </div>
            </div>

            {/* Top Leads Table */}
            <div className="bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden">
                <h3 className="font-semibold text-white p-5">Top 10 Leads por Valor</h3>
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-zinc-700">
                        <thead className="bg-zinc-900/50">
                            <tr>
                                <th className="px-5 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Lead</th>
                                <th className="px-5 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Valor</th>
                                <th className="px-5 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Estágio</th>
                                <th className="px-5 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Probabilidade</th>
                                <th className="px-5 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Fechamento Esperado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-700">
                            {reportData.topLeads.map(lead => (
                                <tr key={lead.id} className="hover:bg-zinc-700/50 transition-colors">
                                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-white">{lead.name}</td>
                                    <td className="px-5 py-4 whitespace-nowrap text-sm text-zinc-300">{currencyFormatter.format(lead.value)}</td>
                                    <td className="px-5 py-4 whitespace-nowrap text-sm">
                                        {columnMap[lead.columnId] ? 
                                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full" style={{ color: columnMap[lead.columnId].color, backgroundColor: `${columnMap[lead.columnId].color}20`}}>
                                                {columnMap[lead.columnId].title}
                                            </span>
                                            : '-'
                                        }
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap text-sm text-zinc-300">
                                        <div className="flex items-center gap-2">
                                            <div className="w-20 bg-zinc-700 rounded-full h-1.5">
                                                <div className="h-1.5 rounded-full" style={{ width: `${lead.probability || 0}%`, backgroundColor: '#8b5cf6' }}></div>
                                            </div>
                                            <span>{lead.probability || 0}%</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap text-sm text-zinc-400">{lead.dueDate ? new Date(lead.dueDate).toLocaleDateString('pt-BR') : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </div>
        </div>
    );
};

export default ReportsPage;
