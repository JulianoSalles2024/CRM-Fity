

import React from 'react';
import { ChevronLeft } from 'lucide-react';
import type { Lead, Id, GroupInfo, UpdateLeadData, Group } from '../types';

interface GroupsViewProps {
    group: Group;
    leads: Lead[];
    onUpdateLead: (leadId: Id, updates: UpdateLeadData) => void;
    onBack: () => void;
}

const CheckboxCell: React.FC<{ checked: boolean; onChange: (checked: boolean) => void }> = ({ checked, onChange }) => (
    <div className="flex items-center justify-center">
        <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="h-5 w-5 rounded bg-zinc-700 border-zinc-600 text-violet-600 focus:ring-violet-500 focus:ring-offset-zinc-800"
        />
    </div>
);

const GroupsView: React.FC<GroupsViewProps> = ({ group, leads, onUpdateLead, onBack }) => {
    
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

        const updatedGroupInfo: GroupInfo = { ...currentGroupInfo, [field]: value };
        
        onUpdateLead(leadId, { groupInfo: updatedGroupInfo });
    };

    const formatDateForInput = (isoDate?: string) => {
        if (!isoDate) return '';
        try {
            return new Date(isoDate).toISOString().split('T')[0];
        } catch (e) {
            return '';
        }
    };

    return (
        <div className="flex flex-col gap-6 h-full">
            <div className="flex items-center gap-4">
                 <button onClick={onBack} className="p-2 rounded-full text-zinc-400 hover:bg-zinc-800 transition-colors">
                    <ChevronLeft className="w-6 h-6 text-violet-500/70 hover:text-violet-500" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-white">Membros do Grupo: {group.name}</h1>
                    <p className="text-zinc-400">{group.description || 'Gerencie os membros deste grupo.'}</p>
                </div>
            </div>
            
            <div className="bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden flex-1 flex flex-col">
                <div className="overflow-auto h-full">
                    <table className="min-w-full divide-y divide-zinc-700">
                        <thead className="bg-zinc-900/50 sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider w-1/5">Lead</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">Entrou</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">Permanece</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">Onboarding</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Data Call</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">Churn</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Data de Saída</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-700">
                            {leads.map(lead => {
                                const groupInfo = lead.groupInfo || { hasJoined: false, isStillInGroup: false, hasOnboarded: false, churned: false };
                                return (
                                <tr key={lead.id} className="hover:bg-zinc-700/50 transition-colors duration-150">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="text-sm font-medium text-white">{lead.name}</div>
                                        <div className="text-sm text-zinc-400">{lead.company}</div>
                                    </td>
                                    <td className="px-4 py-3 text-center"><CheckboxCell checked={!!groupInfo.hasJoined} onChange={val => handleGroupInfoChange(lead.id, 'hasJoined', val)} /></td>
                                    <td className="px-4 py-3 text-center"><CheckboxCell checked={!!groupInfo.isStillInGroup} onChange={val => handleGroupInfoChange(lead.id, 'isStillInGroup', val)} /></td>
                                    <td className="px-4 py-3 text-center"><CheckboxCell checked={!!groupInfo.hasOnboarded} onChange={val => handleGroupInfoChange(lead.id, 'hasOnboarded', val)} /></td>
                                    <td className="px-4 py-3">
                                        <input type="date" value={formatDateForInput(groupInfo.onboardingCallDate)} onChange={e => handleGroupInfoChange(lead.id, 'onboardingCallDate', e.target.valueAsDate?.toISOString())} className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-violet-500" />
                                    </td>
                                    <td className="px-4 py-3 text-center"><CheckboxCell checked={!!groupInfo.churned} onChange={val => handleGroupInfoChange(lead.id, 'churned', val)} /></td>
                                    <td className="px-4 py-3">
                                        <input type="date" value={formatDateForInput(groupInfo.exitDate)} onChange={e => handleGroupInfoChange(lead.id, 'exitDate', e.target.valueAsDate?.toISOString())} className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-violet-500" />
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default GroupsView;