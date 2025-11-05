

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Lead, ColumnData, Task, Activity } from '../types';
import { BarChart, ChevronDown, RefreshCw, Download, Users, Target, DollarSign, CheckCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';


interface ReportsPageProps {
    leads: Lead[];
    columns: ColumnData[];
    tasks: Task[];
    activities: Activity[];
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


const ReportsPage: React.FC<ReportsPageProps> = ({ leads, columns, tasks, activities }) => {
    const [timeRange, setTimeRange] = useState<'all' | '7d' | '30d' | 'this_month'>('30d');
    const [isFilterMenuOpen, setFilterMenuOpen] = useState(false);
    const filterMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
                setFilterMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const timeRangeOptions: { key: typeof timeRange, label: string }[] = [
        { key: 'all', label: 'Todo o período' },
        { key: '7d', label: 'Últimos 7 dias' },
        { key: '30d', label: 'Últimos 30 dias' },
        { key: 'this_month', label: 'Este mês' },
    ];
    
    const currencyFormatter = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });

    const { filteredLeads, filteredTasks } = useMemo(() => {
        if (timeRange === 'all') {
            return { filteredLeads: leads, filteredTasks: tasks };
        }

        const now = new Date();
        let startDate = new Date();

        switch (timeRange) {
            case '7d':
                startDate.setDate(now.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(now.getDate() - 30);
                break;
            case 'this_month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
        }
        
        startDate.setHours(0, 0, 0, 0);

        const newFilteredLeads = leads.filter(l => l.createdAt && new Date(l.createdAt) >= startDate);
        const newFilteredTasks = tasks.filter(t => new Date(t.dueDate) >= startDate);

        return { filteredLeads: newFilteredLeads, filteredTasks: newFilteredTasks };
    }, [leads, tasks, timeRange]);


    const reportData = useMemo(() => {
        const closedWonColumnId = columns.find(c => c.title.toLowerCase() === 'fechamento')?.id;
        const totalLeads = filteredLeads.length;
        const wonLeadsCount = filteredLeads.filter(l => l.columnId === closedWonColumnId).length;
        const conversionRate = totalLeads > 0 ? ((wonLeadsCount / totalLeads) * 100).toFixed(1) : '0.0';

        const totalValue = filteredLeads.reduce((sum, lead) => sum + lead.value, 0);
        const averageValue = totalLeads > 0 ? totalValue / totalLeads : 0;

        const totalTasks = filteredTasks.length;
        const completedTasks = filteredTasks.filter(t => t.status === 'completed').length;
        const activityCompletionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : '0.0';
        
        const funnelData = columns.map(col => {
            const leadsInCol = filteredLeads.filter(l => l.columnId === col.id);
            return {
                ...col,
                count: leadsInCol.length,
            };
        });

        const topLeads = [...filteredLeads]
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
    }, [filteredLeads, filteredTasks, columns]);

    const timeSeriesData = useMemo(() => {
        const now = new Date();
        now.setHours(23, 59, 59, 999);
        const buckets: { label: string; startDate: Date; endDate: Date; revenue: number; newLeads: number; churn: number }[] = [];
    
        // 1. Setup Time Buckets
        if (timeRange === '7d') {
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(now.getDate() - i);
                buckets.push({
                    label: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                    startDate: new Date(new Date(date).setHours(0, 0, 0, 0)),
                    endDate: new Date(new Date(date).setHours(23, 59, 59, 999)),
                    revenue: 0, newLeads: 0, churn: 0
                });
            }
        } else if (timeRange === '30d') {
            const thirtyDaysAgo = new Date(now);
            thirtyDaysAgo.setDate(now.getDate() - 29);
            thirtyDaysAgo.setHours(0, 0, 0, 0);
            let currentDay = new Date(thirtyDaysAgo);
            while (currentDay <= now) {
                const weekStart = new Date(currentDay);
                let weekEnd = new Date(currentDay);
                weekEnd.setDate(weekEnd.getDate() + 6);
                if (weekEnd > now) {
                    weekEnd = new Date(now);
                }
                
                buckets.push({
                    label: `${weekStart.toLocaleDateString('pt-BR', {day: '2-digit'})}/${weekStart.toLocaleDateString('pt-BR', {month: '2-digit'})}`,
                    startDate: new Date(new Date(weekStart).setHours(0, 0, 0, 0)),
                    endDate: new Date(new Date(weekEnd).setHours(23, 59, 59, 999)),
                    revenue: 0, newLeads: 0, churn: 0,
                });
                
                currentDay.setDate(currentDay.getDate() + 7);
            }
        } else if (timeRange === 'this_month') {
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            let currentDay = new Date(firstDay);
            while(currentDay <= lastDay) {
                const weekStart = new Date(currentDay);
                let weekEnd = new Date(currentDay);
                weekEnd.setDate(weekEnd.getDate() + 6);
                if(weekEnd > lastDay) weekEnd = new Date(lastDay);
    
                buckets.push({
                    label: `${weekStart.toLocaleDateString('pt-BR', {day: '2-digit'})}-${weekEnd.toLocaleDateString('pt-BR', {day: '2-digit'})}`,
                    startDate: new Date(new Date(weekStart).setHours(0, 0, 0, 0)),
                    endDate: new Date(new Date(weekEnd).setHours(23, 59, 59, 999)),
                    revenue: 0, newLeads: 0, churn: 0,
                });
                currentDay.setDate(currentDay.getDate() + 7);
            }
        } else if (timeRange === 'all') { // Last 6 months
            for (let i = 5; i >= 0; i--) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                buckets.push({
                    label: date.toLocaleDateString('pt-BR', { month: 'short' }),
                    startDate: date,
                    endDate: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999),
                    revenue: 0, newLeads: 0, churn: 0
                });
            }
        }
    
        // 2. Process Data efficiently
        const leadsMap = new Map(leads.map(l => [l.id, l]));
        const closedWonColumn = columns.find(c => c.title.toLowerCase() === 'fechamento');
    
        if (!closedWonColumn) {
            return {
                labels: buckets.map(b => b.label),
                datasets: [
                    { label: 'Receita', data: buckets.map(() => 0), color: '#8b5cf6' },
                    { label: 'Novos Leads', data: buckets.map(() => 0), color: '#3b82f6' },
                    { label: 'Churn', data: buckets.map(() => 0), color: '#ef4444' },
                ],
            };
        }
        
        const findBucketIndex = (dateStr?: string) => {
            if (!dateStr) return -1;
            const date = new Date(dateStr);
            return buckets.findIndex(b => date >= b.startDate && date <= b.endDate);
        };
    
        leads.forEach(lead => {
            const creationBucketIndex = findBucketIndex(lead.createdAt);
            if (creationBucketIndex !== -1) {
                buckets[creationBucketIndex].newLeads++;
            }
    
            if (lead.groupInfo?.churned) {
                const churnBucketIndex = findBucketIndex(lead.groupInfo.exitDate);
                if (churnBucketIndex !== -1) {
                    buckets[churnBucketIndex].churn++;
                }
            }
        });
    
        activities.forEach(activity => {
            if (activity.type === 'status_change' && activity.text.includes(`'${closedWonColumn.title}'`)) {
                const activityBucketIndex = findBucketIndex(activity.timestamp);
                if (activityBucketIndex !== -1) {
                    // FIX: Explicitly cast the result of `leadsMap.get` to resolve a type inference issue.
                    const lead = leadsMap.get(activity.leadId) as Lead | undefined;
                    if (lead) {
                        buckets[activityBucketIndex].revenue += lead.value;
                    }
                }
            }
        });
    
        return {
            labels: buckets.map(b => b.label),
            datasets: [
                { label: 'Receita', data: buckets.map(b => b.revenue), color: '#8b5cf6' },
                { label: 'Novos Leads', data: buckets.map(b => b.newLeads), color: '#3b82f6' },
                { label: 'Churn', data: buckets.map(b => b.churn), color: '#ef4444' },
            ],
        };
    }, [leads, activities, columns, timeRange]);

     const columnMap = useMemo(() => {
        return columns.reduce((acc, col) => {
            acc[col.id] = {title: col.title, color: col.color};
            return acc;
        }, {} as Record<string, {title: string, color: string}>);
    }, [columns]);

    const handleDownload = () => {
        // ... (existing download logic)
    };
    
    // SVG Chart Component
    const PerformanceChart = ({ data }: { data: typeof timeSeriesData }) => {
        const svgWidth = 800;
        const svgHeight = 300;
        const padding = 50;
        
        const maxRevenue = Math.max(...data.datasets[0].data, 1);
        const maxCount = Math.max(...data.datasets[1].data, ...data.datasets[2].data, 5); // Max for leads and churn

        const revenuePoints = data.datasets[0].data.map((val, i) => ({
            x: padding + i * (svgWidth - 2 * padding) / (data.labels.length - 1 || 1),
            y: svgHeight - padding - (val / maxRevenue) * (svgHeight - 2 * padding)
        })).map(p => `${p.x},${p.y}`).join(' ');

        const leadsPoints = data.datasets[1].data.map((val, i) => ({
            x: padding + i * (svgWidth - 2 * padding) / (data.labels.length - 1 || 1),
            y: svgHeight - padding - (val / maxCount) * (svgHeight - 2 * padding)
        })).map(p => `${p.x},${p.y}`).join(' ');

         const churnPoints = data.datasets[2].data.map((val, i) => ({
            x: padding + i * (svgWidth - 2 * padding) / (data.labels.length - 1 || 1),
            y: svgHeight - padding - (val / maxCount) * (svgHeight - 2 * padding)
        })).map(p => `${p.x},${p.y}`).join(' ');

        return (
            <div className="flex flex-col h-full">
                <div className="flex-1">
                    <svg width="100%" height="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="xMidYMid meet">
                        {/* Grid lines */}
                        {[...Array(5)].map((_, i) => (
                            <line key={i} x1={padding} y1={padding + i * (svgHeight - 2 * padding) / 4} x2={svgWidth - padding} y2={padding + i * (svgHeight - 2 * padding) / 4} stroke="#404040" strokeWidth="1" />
                        ))}
                        {/* Y-axis labels (Revenue) */}
                        {[...Array(5)].map((_, i) => (
                            <text key={i} x={padding - 10} y={padding + i * (svgHeight - 2 * padding) / 4 + 5} fill="#a1a1aa" textAnchor="end" fontSize="12">{currencyFormatter.format(maxRevenue * (1 - i / 4)).replace('R$', '')}</text>
                        ))}
                         {/* Y-axis labels (Count) */}
                        {[...Array(6)].map((_, i) => (
                            <text key={i} x={svgWidth - padding + 10} y={padding + i * (svgHeight - 2 * padding) / 5 + 5} fill="#a1a1aa" textAnchor="start" fontSize="12">{Math.round(maxCount * (1 - i / 5))}</text>
                        ))}

                        {/* Data lines */}
                        <polyline points={revenuePoints} fill="none" stroke={data.datasets[0].color} strokeWidth="3" />
                        <polyline points={leadsPoints} fill="none" stroke={data.datasets[1].color} strokeWidth="3" />
                        <polyline points={churnPoints} fill="none" stroke={data.datasets[2].color} strokeWidth="3" />
                        
                        {/* X-axis labels */}
                        {data.labels.map((label, i) => (
                            <text key={label} x={padding + i * (svgWidth - 2 * padding) / (data.labels.length - 1 || 1)} y={svgHeight - padding + 20} fill="#a1a1aa" textAnchor="middle" fontSize="12">{label}</text>
                        ))}
                    </svg>
                </div>
                 <div className="flex justify-center items-center gap-6 pt-4">
                    {data.datasets.map(ds => (
                        <div key={ds.label} className="flex items-center gap-2 text-sm">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ds.color }} />
                            <span className="text-zinc-300">{ds.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        )
    }


    return (
        <div className="flex flex-col gap-6">
             <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <BarChart className="w-8 h-8 text-violet-500" />
                    <div>
                        <h1 className="text-2xl font-bold text-white">Relatórios</h1>
                        <p className="text-zinc-400">Análise detalhada de desempenho e métricas</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                     <div className="relative" ref={filterMenuRef}>
                        <button onClick={() => setFilterMenuOpen(p => !p)} className="flex items-center gap-2 text-sm text-zinc-300 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 px-3 py-1.5 rounded-md">
                            <span>{timeRangeOptions.find(o => o.key === timeRange)?.label}</span>
                            <ChevronDown className="w-4 h-4 text-zinc-500" />
                        </button>
                        <AnimatePresence>
                            {isFilterMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute top-full right-0 mt-2 w-48 bg-zinc-800 rounded-lg border border-zinc-700 shadow-lg z-20 py-1"
                                >
                                    {timeRangeOptions.map(option => (
                                        <button key={option.key} onClick={() => { setTimeRange(option.key); setFilterMenuOpen(false); }}
                                            className="w-full text-left px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-700/50">
                                            {option.label}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <button className="p-2 text-zinc-300 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 rounded-md" title="Atualizar dados">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                     <button onClick={handleDownload} className="p-2 text-zinc-300 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 rounded-md" title="Baixar relatório">
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
                                <p className="text-sm text-zinc-400 w-28 truncate" title={stage.title}>{stage.title}</p>
                                <div className="flex-1 bg-zinc-700 rounded-full h-4">
                                    <div 
                                        className="h-4 rounded-full text-white text-xs flex items-center pl-2 transition-all duration-500 ease-out"
                                        style={{ 
                                            width: `${reportData.totalLeads > 0 ? (stage.count / reportData.totalLeads) * 100 : 0}%`,
                                            backgroundColor: stage.color,
                                            minWidth: stage.count > 0 ? '24px' : '0'
                                        }}
                                    >{stage.count > 0 ? stage.count : ''}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-zinc-800 p-5 rounded-lg border border-zinc-700 flex flex-col">
                    <h3 className="font-semibold text-white mb-4">Desempenho ao Longo do Tempo</h3>
                     <div className="flex-1 min-h-[300px]">
                        {timeSeriesData.labels.length > 0 ? (
                           <PerformanceChart data={timeSeriesData} />
                        ) : (
                           <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
                                <p>Não há dados suficientes para o período selecionado.</p>
                           </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Top Leads Table */}
            <div className="bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden">
                <h3 className="font-semibold text-white p-5">Top 10 Leads por Valor ({timeRangeOptions.find(o => o.key === timeRange)?.label})</h3>
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
                                    <td className="px-5 py-4 whitespace-nowrap text-sm text-zinc-400">{lead.dueDate ? new Date(lead.dueDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—'}</td>
                                </tr>
                            ))}
                             {reportData.topLeads.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-10 text-zinc-500">
                                        Nenhum lead encontrado para este período.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                 </div>
            </div>
        </div>
    );
};

export default ReportsPage;
