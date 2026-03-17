import React, { useMemo, useState, useRef, useEffect } from 'react';
import { ChevronLeft, Download, Users, UserCheck, UserX, Goal, Trash2, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Lead, Id, GroupInfo, UpdateLeadData, Group, GroupAnalysis, CreateGroupAnalysisData, UpdateGroupAnalysisData } from '@/types';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import { GlassSection } from '@/src/shared/components/GlassSection';
import FlatCard from '@/components/ui/FlatCard';

interface GroupsViewProps {
    group: Group;
    groups: Group[];
    leads: Lead[];
    analysis: GroupAnalysis | null;
    onUpdateLead: (leadId: Id, updates: UpdateLeadData) => void;
    onBack: () => void;
    onSelectGroup: (id: Id) => void;
    onCreateOrUpdateAnalysis: (data: CreateGroupAnalysisData | UpdateGroupAnalysisData, analysisId?: Id) => void;
    onDeleteAnalysis: (analysisId: Id) => void;
    showNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

// ── Custom Checkbox ────────────────────────────────────────────────────────────
interface CheckboxCellProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    variant?: 'default' | 'success' | 'danger';
}

const variantStyles = {
    default: {
        on:  'bg-sky-500 border-sky-400 shadow-[0_0_8px_rgba(14,165,233,0.5)]',
        off: 'bg-slate-800 border-slate-700 hover:border-slate-500',
    },
    success: {
        on:  'bg-emerald-500 border-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.45)]',
        off: 'bg-slate-800 border-slate-700 hover:border-emerald-700',
    },
    danger: {
        on:  'bg-red-500 border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.45)]',
        off: 'bg-slate-800 border-slate-700 hover:border-red-700',
    },
};

const CheckboxCell: React.FC<CheckboxCellProps> = ({ checked, onChange, variant = 'default' }) => {
    const styles = variantStyles[variant];
    return (
        <div className="flex items-center justify-center">
            <button
                type="button"
                role="checkbox"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`
                    relative w-5 h-5 rounded-md border transition-all duration-150 ease-in-out
                    flex items-center justify-center cursor-pointer flex-shrink-0
                    focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:ring-offset-1 focus:ring-offset-slate-900
                    ${checked ? styles.on : styles.off}
                `}
            >
                <AnimatePresence>
                    {checked && (
                        <motion.span
                            key="check"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 0.12, ease: 'easeOut' }}
                        >
                            <Check className="w-3 h-3 text-white stroke-[3]" />
                        </motion.span>
                    )}
                </AnimatePresence>
            </button>
        </div>
    );
};


const KpiCard: React.FC<{ icon: React.ElementType; title: string; value: string; colorClass: string }> = ({ icon: Icon, title, value, colorClass }) => (
    <GlassSection className="flex items-center gap-4 transition-all duration-200 ease-in-out hover:bg-slate-700/50 hover:-translate-y-1">
        <div className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center ${colorClass.replace('text-', 'bg-')}/20`}>
            <Icon className={`w-5 h-5 ${colorClass}`} />
        </div>
        <div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-sm text-slate-400">{title}</p>
        </div>
    </GlassSection>
);

// ── Table header cell ──────────────────────────────────────────────────────────
const Th: React.FC<{ children: React.ReactNode; center?: boolean }> = ({ children, center }) => (
    <th className={`px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap ${center ? 'text-center' : 'text-left'}`}>
        {children}
    </th>
);

// ── Date input ─────────────────────────────────────────────────────────────────
const DateInput: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => (
    <input
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-300 placeholder-slate-600
                   focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/20
                   transition-colors [color-scheme:dark]"
    />
);


// ── Main component ─────────────────────────────────────────────────────────────
const GroupsView: React.FC<GroupsViewProps> = ({ group, groups, leads, analysis, onUpdateLead, onBack, onSelectGroup, onCreateOrUpdateAnalysis, onDeleteAnalysis, showNotification }) => {
    const [leadToRemove, setLeadToRemove] = useState<Lead | null>(null);
    const [groupPickerOpen, setGroupPickerOpen] = useState(false);
    const groupPickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (groupPickerRef.current && !groupPickerRef.current.contains(e.target as Node))
                setGroupPickerOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleGroupInfoChange = (leadId: Id, field: keyof GroupInfo, value: any) => {
        const lead = leads.find(l => l.id === leadId);
        if (!lead) return;

        const currentGroupInfo: GroupInfo = lead.groupInfo || {
            hasJoined: false,
            isStillInGroup: false,
            hasOnboarded: false,
            churned: false,
            groupId: group.id,
        };

        let updatedGroupInfo: GroupInfo = { ...currentGroupInfo, [field]: value };

        if (field === 'isStillInGroup') {
            if (value === true) {
                updatedGroupInfo.churned = false;
                updatedGroupInfo.exitDate = undefined;
            } else {
                updatedGroupInfo.churned = true;
                if (!updatedGroupInfo.exitDate) updatedGroupInfo.exitDate = new Date().toISOString();
            }
        } else if (field === 'churned') {
            if (value === true) {
                updatedGroupInfo.isStillInGroup = false;
                if (!updatedGroupInfo.exitDate) updatedGroupInfo.exitDate = new Date().toISOString();
            } else {
                updatedGroupInfo.isStillInGroup = true;
                updatedGroupInfo.exitDate = undefined;
            }
        } else if (field === 'hasJoined') {
            if (value === false) {
                updatedGroupInfo = {
                    hasJoined: false, isStillInGroup: false, hasOnboarded: false,
                    onboardingCallDate: undefined, churned: false, exitDate: undefined, groupId: group.id,
                };
            } else if (!currentGroupInfo.hasJoined) {
                updatedGroupInfo.isStillInGroup = true;
                updatedGroupInfo.churned = false;
                updatedGroupInfo.exitDate = undefined;
            }
        }

        onUpdateLead(leadId, { groupInfo: updatedGroupInfo });
    };

    const formatDateForInput = (isoDate?: string) => {
        if (!isoDate) return '';
        try { return new Date(isoDate).toISOString().split('T')[0]; } catch { return ''; }
    };

    const groupMetrics = useMemo(() => {
        const totalJoined    = leads.filter(l => l.groupInfo?.hasJoined).length;
        const currentMembers = leads.filter(l => l.groupInfo?.isStillInGroup).length;
        const totalOnboarded = leads.filter(l => l.groupInfo?.hasOnboarded).length;
        const totalChurned   = leads.filter(l => l.groupInfo?.churned).length;
        const onboardingRate = totalJoined > 0 ? (totalOnboarded / totalJoined) * 100 : 0;
        const churnRate      = totalJoined > 0 ? (totalChurned   / totalJoined) * 100 : 0;
        return { currentMembers, onboardingRate, churnRate, totalJoined, totalOnboarded, totalChurned };
    }, [leads]);

    const handleExportCSV = () => {
        const headers = ['Nome', 'Empresa', 'Email', 'Telefone', 'Entrou no Grupo', 'Permanece no Grupo', 'Fechado', 'Data Fechamento', 'Churn', 'Data de Saída'];
        const escapeCsvCell = (cellData: any): string => {
            if (cellData == null) return '';
            const s = String(cellData);
            return (s.includes(',') || s.includes('"') || s.includes('\n')) ? `"${s.replace(/"/g, '""')}"` : s;
        };
        const rows = leads.map(lead => {
            const gi = lead.groupInfo || { hasJoined: false, isStillInGroup: false, hasOnboarded: false, onboardingCallDate: undefined, churned: false, exitDate: undefined };
            return [
                escapeCsvCell(lead.name), escapeCsvCell(lead.company),
                escapeCsvCell(lead.email || ''), escapeCsvCell(lead.phone || ''),
                gi.hasJoined ? 'Sim' : 'Não', gi.isStillInGroup ? 'Sim' : 'Não',
                gi.hasOnboarded ? 'Sim' : 'Não',
                gi.onboardingCallDate ? new Date(gi.onboardingCallDate).toLocaleDateString('pt-BR') : '',
                gi.churned ? 'Sim' : 'Não',
                gi.exitDate ? new Date(gi.exitDate).toLocaleDateString('pt-BR') : '',
            ].join(',');
        });
        const csvString = '\uFEFF' + [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.setAttribute('href', URL.createObjectURL(blob));
        link.setAttribute('download', `membros_grupo_${group.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleConfirmRemove = () => {
        if (!leadToRemove) return;
        const lead = leads.find(l => l.id === leadToRemove.id);
        if (lead?.groupInfo) {
            onUpdateLead(leadToRemove.id, { groupInfo: { ...lead.groupInfo, isStillInGroup: false, churned: true, exitDate: new Date().toISOString() } });
        }
        setLeadToRemove(null);
    };

    return (
        <>
            <div className="flex flex-col gap-6 h-full">

                {/* ── Page header ─────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <button onClick={onBack} className="p-2 rounded-full text-slate-400 hover:bg-slate-800 transition-colors flex-shrink-0">
                            <ChevronLeft className="w-5 h-5 text-blue-500/70 hover:text-blue-500" />
                        </button>

                        {/* Group picker */}
                        <div className="relative min-w-0" ref={groupPickerRef}>
                            <button
                                onClick={() => setGroupPickerOpen(p => !p)}
                                className="flex items-center gap-2 group"
                            >
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <h1 className="text-2xl font-bold text-white truncate">{group.name}</h1>
                                        <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-150 ${groupPickerOpen ? 'rotate-180' : ''}`} />
                                    </div>
                                    <p className="text-sm text-slate-500 text-left">{group.description || 'Gerencie os membros deste grupo.'}</p>
                                </div>
                            </button>

                            <AnimatePresence>
                                {groupPickerOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                        transition={{ duration: 0.12 }}
                                        className="absolute top-full left-0 mt-2 w-64 bg-slate-900 border border-slate-700/80 rounded-xl shadow-xl z-20 py-1 overflow-hidden"
                                    >
                                        {groups.map(g => (
                                            <button
                                                key={g.id}
                                                onClick={() => { onSelectGroup(g.id); setGroupPickerOpen(false); }}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors
                                                    ${g.id === group.id
                                                        ? 'bg-sky-500/10 text-sky-400'
                                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                                    }`}
                                            >
                                                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
                                                    <Users className="w-3.5 h-3.5 text-slate-400" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium truncate">{g.name}</p>
                                                    {g.description && <p className="text-xs text-slate-500 truncate">{g.description}</p>}
                                                </div>
                                                {g.id === group.id && <Check className="w-3.5 h-3.5 text-sky-400 ml-auto flex-shrink-0" />}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <button onClick={handleExportCSV} className="flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-slate-600 transition-colors flex-shrink-0">
                        <Download className="w-4 h-4" /><span>Exportar CSV</span>
                    </button>
                </div>

                {/* ── KPI cards ───────────────────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard icon={Users}     title="Membros Atuais" value={groupMetrics.currentMembers.toString()} colorClass="text-violet-400" />
                    <KpiCard icon={UserCheck} title="Fechado"        value={`${groupMetrics.onboardingRate.toFixed(0)}%`} colorClass="text-green-400" />
                    <KpiCard icon={UserX}     title="Churn"          value={`${groupMetrics.churnRate.toFixed(1)}%`}      colorClass="text-red-400" />
                    {group.memberGoal ? (
                        <KpiCard icon={Goal} title="Meta" value={`${groupMetrics.currentMembers} / ${group.memberGoal}`} colorClass="text-blue-400" />
                    ) : (
                        <GlassSection className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center bg-slate-700/50">
                                <Goal className="w-5 h-5 text-slate-500" />
                            </div>
                            <div><p className="text-sm text-slate-400">Nenhuma meta definida</p></div>
                        </GlassSection>
                    )}
                </div>

                {/* ── Members table ───────────────────────────────────────── */}
                <FlatCard className="overflow-hidden flex-1 flex flex-col p-0">
                    <div className="overflow-auto h-full">
                        <table className="min-w-full">
                            <thead className="bg-[#050c18]/95 backdrop-blur-sm sticky top-0 z-10 border-b border-white/5">
                                <tr>
                                    <Th>Lead</Th>
                                    <Th center>Entrou</Th>
                                    <Th center>Permanece</Th>
                                    <Th center>Fechado</Th>
                                    <Th>Data Fechamento</Th>
                                    <Th center>Churn</Th>
                                    <Th>Data de Saída</Th>
                                    <Th center>Ações</Th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {leads.length > 0 ? leads.map(lead => {
                                    const gi = lead.groupInfo || {
                                        hasJoined: false, isStillInGroup: false,
                                        hasOnboarded: false, churned: false, groupId: group.id,
                                    };
                                    return (
                                        <tr key={lead.id} className="group/row hover:bg-slate-800/30 transition-colors duration-100">

                                            {/* Lead identity */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <p className="text-sm font-semibold text-white">{lead.name}</p>
                                                {lead.company && <p className="text-xs text-slate-500 mt-0.5">{lead.company}</p>}
                                            </td>

                                            {/* Entrou */}
                                            <td className="px-4 py-3 text-center">
                                                <CheckboxCell checked={!!gi.hasJoined} onChange={val => handleGroupInfoChange(lead.id, 'hasJoined', val)} variant="default" />
                                            </td>

                                            {/* Permanece */}
                                            <td className="px-4 py-3 text-center">
                                                <CheckboxCell checked={!!gi.isStillInGroup} onChange={val => handleGroupInfoChange(lead.id, 'isStillInGroup', val)} variant="success" />
                                            </td>

                                            {/* Fechado */}
                                            <td className="px-4 py-3 text-center">
                                                <CheckboxCell checked={!!gi.hasOnboarded} onChange={val => handleGroupInfoChange(lead.id, 'hasOnboarded', val)} variant="success" />
                                            </td>

                                            {/* Data Fechamento */}
                                            <td className="px-4 py-3">
                                                <DateInput
                                                    value={formatDateForInput(gi.onboardingCallDate)}
                                                    onChange={v => handleGroupInfoChange(lead.id, 'onboardingCallDate', v ? new Date(v).toISOString() : undefined)}
                                                />
                                            </td>

                                            {/* Churn */}
                                            <td className="px-4 py-3 text-center">
                                                <CheckboxCell checked={!!gi.churned} onChange={val => handleGroupInfoChange(lead.id, 'churned', val)} variant="danger" />
                                            </td>

                                            {/* Data de Saída */}
                                            <td className="px-4 py-3">
                                                <DateInput
                                                    value={formatDateForInput(gi.exitDate)}
                                                    onChange={v => handleGroupInfoChange(lead.id, 'exitDate', v ? new Date(v).toISOString() : undefined)}
                                                />
                                            </td>

                                            {/* Ações */}
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => setLeadToRemove(lead)}
                                                    title={`Remover ${lead.name} do grupo`}
                                                    className="p-1.5 rounded-md text-slate-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover/row:opacity-100 transition-all duration-150"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={8} className="text-center py-16 text-slate-500 text-sm">
                                            Nenhum membro encontrado neste grupo.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </FlatCard>
            </div>

            <AnimatePresence>
                {leadToRemove && (
                    <ConfirmDeleteModal
                        onClose={() => setLeadToRemove(null)}
                        onConfirm={handleConfirmRemove}
                        title={`Remover ${leadToRemove.name}?`}
                        message={`Tem certeza que deseja remover ${leadToRemove.name} do grupo "${group.name}"? Esta ação marcará o lead como churn e inativo no grupo.`}
                        confirmText="Remover"
                        confirmVariant="danger"
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default GroupsView;
