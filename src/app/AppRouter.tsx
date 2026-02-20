import React from 'react';
import type { AppState } from './useAppState';
import { localUser } from './useAppState';

import InboxView from '@/features/inbox/InboxView';
import Dashboard from '@/features/dashboard/Dashboard';
import KanbanBoard from '@/features/pipeline/KanbanBoard';
import PlaybookSettings from '@/features/playbooks/PlaybookSettings';
import LeadListView from '@/features/leads/LeadListView';
import ActivitiesView from '@/features/tasks/ActivitiesView';
import ReportsPage from '@/features/reports/ReportsPage';
import RecoveryView from '@/features/recovery/RecoveryView';
import ChatView from '@/features/chat/ChatView';
import GroupsView from '@/features/groups/GroupsView';
import GroupsDashboard from '@/features/groups/GroupsDashboard';
import IntegrationsPage from '@/features/integrations/IntegrationsPage';
import CalendarPage from '@/features/calendar/CalendarPage';
import NotificationsView from '@/features/notifications/NotificationsView';
import SettingsPage from '@/features/settings/SettingsPage';
import PrintableLeadsReport from '@/features/leads/PrintableLeadsReport';
import type { Lead, ChatMessage } from '@/shared/types';

const AppRouter: React.FC<AppState> = (props) => {
    const {
        activeView,
        leadsToPrint, setLeadsToPrint,
        tasks, activities,
        searchedLeads,
        inboxMode,
        notifications, setNotifications,
        leads, setLeads,
        columns, setColumns,
        users, setUsers,
        cardDisplaySettings, setCardDisplaySettings,
        minimizedLeads, setMinimizedLeads,
        minimizedColumns, setMinimizedColumns,
        selectedLeadForPlaybookId,
        selectedLeadForPlaybook,
        boards, activeBoardId, setActiveBoardId,
        setCreateBoardModalOpen,
        selectedLead, setSelectedLead,
        setEditingLead,
        playbooks, setPlaybooks,
        listDisplaySettings, setListDisplaySettings,
        tags,
        listSelectedTags, setListSelectedTags,
        listStatusFilter, setListStatusFilter,
        conversations, messages, setMessages, setConversations,
        groups, selectedGroupForView, setSelectedGroupForView,
        analysisForGroup,
        setEditingGroup, setGroupModalOpen,
        editingTask, setEditingTask,
        setCreateTaskModalOpen,
        preselectedDataForTask, setPreselectedDataForTask,
        settingsTab,
        setActiveView,
        handleExportPDF,
        showNotification,
        handleUpdateLeadColumn,
        handleCardClick,
        setPlaybookModalOpen,
        setCreateLeadModalOpen,
        handleDeleteTask,
        handleUpdateTaskStatus,
        handleReactivateLead,
        handleDeleteLead,
        setSelectedLead,
        handleCreateOrUpdateGroupAnalysis,
        handleDeleteGroupAnalysis,
        handleDeleteGroup,
        calculateProbabilityForStage,
        handleResetApplication,
        handleStartAnalysis,
        createActivityLog,
    } = props;

    if (leadsToPrint) {
        return <PrintableLeadsReport leads={leadsToPrint} tasks={tasks} activities={activities} onPrintEnd={() => setLeadsToPrint(null)} />;
    }

    const filteredLeads = searchedLeads;
    // FIX: Define listViewFilteredLeads here to be available for both Leads and Clientes views.
    let listViewFilteredLeads: Lead[];

    switch (activeView) {
        case 'Inbox':
            return <InboxView
                mode={inboxMode}
                tasks={tasks}
                notifications={notifications}
                leads={leads}
                onNavigate={(view) => setActiveView(view)}
                onMarkNotificationRead={(id) => setNotifications(curr => curr.map(n => n.id === id ? { ...n, isRead: true } : n))}
            />;
        case 'Dashboard':
            return <Dashboard
                leads={leads}
                columns={columns}
                activities={activities}
                tasks={tasks}
                onNavigate={setActiveView}
                onAnalyzePortfolio={handleStartAnalysis}
                showNotification={showNotification}
                onExportReport={() => handleExportPDF(leads)}
            />;
        case 'Pipeline':
            return <KanbanBoard
                columns={columns}
                leads={filteredLeads}
                users={users}
                tasks={tasks}
                cardDisplaySettings={cardDisplaySettings}
                onUpdateLeadColumn={handleUpdateLeadColumn}
                onSelectLead={handleCardClick}
                selectedLeadId={selectedLeadForPlaybookId}
                onAddLead={() => { setEditingLead(null); setCreateLeadModalOpen(true); }}
                onUpdateCardSettings={setCardDisplaySettings}
                minimizedLeads={minimizedLeads}
                onToggleLeadMinimize={(leadId) => setMinimizedLeads(p => (p || []).includes(leadId) ? (p || []).filter(id => id !== leadId) : [...(p || []), leadId])}
                minimizedColumns={minimizedColumns}
                onToggleColumnMinimize={(colId) => setMinimizedColumns(p => (p || []).includes(colId) ? (p || []).filter(id => id !== colId) : [...(p || []), colId])}
                isPlaybookActionEnabled={!!selectedLeadForPlaybook}
                onApplyPlaybookClick={() => setPlaybookModalOpen(true)}
                boards={boards}
                activeBoardId={activeBoardId}
                onSelectBoard={setActiveBoardId}
                onCreateBoardClick={() => setCreateBoardModalOpen(true)}
            />;
        case 'Playbooks':
            return <PlaybookSettings initialPlaybooks={playbooks} pipelineColumns={columns} onSave={setPlaybooks} />;
        case 'Leads': {
            listViewFilteredLeads = filteredLeads.filter(l => l.columnId !== 'closed');
            return <LeadListView
                leads={listViewFilteredLeads}
                columns={columns}
                onLeadClick={setSelectedLead}
                viewType="Leads"
                listDisplaySettings={listDisplaySettings}
                onUpdateListSettings={setListDisplaySettings}
                allTags={tags}
                selectedTags={listSelectedTags}
                onSelectedTagsChange={setListSelectedTags}
                statusFilter={listStatusFilter}
                onStatusFilterChange={setListStatusFilter}
                onExportPDF={() => handleExportPDF(listViewFilteredLeads)}
                onOpenCreateLeadModal={() => setCreateLeadModalOpen(true)}
                onOpenCreateTaskModal={() => setCreateTaskModalOpen(true)}
            />;
        }
        case 'Clientes': {
            listViewFilteredLeads = filteredLeads.filter(l => l.columnId === 'closed');
            return <LeadListView
                leads={listViewFilteredLeads}
                columns={columns}
                onLeadClick={setSelectedLead}
                viewType="Clientes"
                listDisplaySettings={listDisplaySettings}
                onUpdateListSettings={setListDisplaySettings}
                allTags={tags}
                selectedTags={listSelectedTags}
                onSelectedTagsChange={setListSelectedTags}
                statusFilter={listStatusFilter}
                onStatusFilterChange={setListStatusFilter}
                onExportPDF={() => handleExportPDF(listViewFilteredLeads)}
                onOpenCreateLeadModal={() => setCreateLeadModalOpen(true)}
                onOpenCreateTaskModal={() => setCreateTaskModalOpen(true)}
            />;
        }
        case 'Tarefas':
            return <ActivitiesView tasks={tasks} leads={filteredLeads}
                onEditTask={(task) => { setEditingTask(task); setCreateTaskModalOpen(true); }}
                onDeleteTask={handleDeleteTask} onUpdateTaskStatus={handleUpdateTaskStatus}
            />;
        case 'Relatórios':
            return <ReportsPage leads={leads} columns={columns} tasks={tasks} activities={activities} />;
        case 'Recuperação': {
            const recoveryLeads = leads.filter(l => l.reactivationDate);
            return <RecoveryView
                leads={recoveryLeads}
                onReactivateLead={handleReactivateLead}
                onExportPDF={handleExportPDF}
                onDeleteLead={handleDeleteLead}
                onLeadClick={handleCardClick}
            />;
        }
        case 'Chat':
            return <ChatView
                conversations={conversations} messages={messages} leads={filteredLeads} currentUser={localUser}
                onSendMessage={(convId, text, channel) => {
                    const newMessage: ChatMessage = { id: `msg-${Date.now()}`, conversationId: convId, senderId: localUser.id, text, timestamp: new Date().toISOString(), channel };
                    setMessages(curr => [...curr, newMessage]);
                    setConversations(curr => curr.map(c => c.id === convId ? { ...c, lastMessage: text, lastMessageTimestamp: newMessage.timestamp, lastMessageChannel: channel, unreadCount: 0 } : c));
                }}
                onUpdateConversationStatus={(convId, status) => setConversations(curr => curr.map(c => c.id === convId ? { ...c, status } : c))}
                showNotification={showNotification}
            />;
        case 'Grupos':
            if (selectedGroupForView) {
                const group = groups.find(g => g.id === selectedGroupForView);
                const groupLeads = leads.filter(l => l.groupInfo?.groupId === selectedGroupForView);
                if (!group) { setSelectedGroupForView(null); return null; }
                return <GroupsView
                    group={group}
                    leads={groupLeads}
                    analysis={analysisForGroup}
                    onUpdateLead={(leadId, updates) => {
                        const lead = leads.find(l => l.id === leadId);
                        if (lead) {
                            const updatedLead = { ...lead, ...updates, lastActivity: 'agora', lastActivityTimestamp: new Date().toISOString() };
                            setLeads(current => current.map(l => (l.id === leadId ? updatedLead : l)));
                            if (selectedLead?.id === leadId) {
                                setSelectedLead(updatedLead);
                            }
                            createActivityLog(leadId, 'note', 'Informações de grupo do lead atualizadas.');
                            showNotification('Informações de grupo atualizadas.', 'success');
                        }
                    }}
                    onBack={() => setSelectedGroupForView(null)}
                    onCreateOrUpdateAnalysis={handleCreateOrUpdateGroupAnalysis}
                    onDeleteAnalysis={handleDeleteGroupAnalysis}
                    showNotification={showNotification}
                />;
            }
            return <GroupsDashboard
                groups={groups}
                leads={leads}
                onSelectGroup={setSelectedGroupForView}
                onAddGroup={() => { setGroupModalOpen(true); }}
                onEditGroup={(group) => { setEditingGroup(group); setGroupModalOpen(true); }}
                onDeleteGroup={handleDeleteGroup}
            />;
        case 'Integrações':
            return <IntegrationsPage showNotification={showNotification} />;
        case 'Calendário':
            return <CalendarPage
                tasks={tasks} leads={filteredLeads}
                onNewActivity={(date) => { setPreselectedDataForTask({ leadId: leads[0]?.id, date }); setCreateTaskModalOpen(true); }}
                onEditActivity={(task) => { setEditingTask(task); setCreateTaskModalOpen(true); }}
                onDeleteTask={handleDeleteTask}
                onUpdateTaskStatus={handleUpdateTaskStatus}
            />;
        case 'Notificações':
            return <NotificationsView
                notifications={notifications}
                onMarkAsRead={(id) => setNotifications(curr => curr.map(n => n.id === id ? { ...n, isRead: true } : n))}
                onMarkAllAsRead={() => setNotifications(curr => curr.map(n => ({ ...n, isRead: true })))}
                onClearAll={() => setNotifications([])}
                onNavigate={(link) => {
                    if (link) {
                        if (link.view) setActiveView(link.view);
                        if (link.leadId) {
                            const leadToSelect = leads.find(l => l.id === link.leadId);
                            if (leadToSelect) setSelectedLead(leadToSelect);
                        }
                    }
                }}
            />;
        case 'Configurações':
            return <SettingsPage
                currentUser={localUser}
                users={users}
                columns={columns}
                onUpdateProfile={() => showNotification("Perfil atualizado!", 'success')}
                onUpdatePipeline={(newColumns) => {
                    setColumns(newColumns);
                    setLeads(currentLeads => currentLeads.map(lead => ({
                        ...lead,
                        probability: calculateProbabilityForStage(lead.columnId, newColumns)
                    })));
                    showNotification("Pipeline salvo!", 'success');
                }}
                onUpdateUsers={setUsers}
                onResetApplication={handleResetApplication}
                initialTab={settingsTab}
            />;
        default:
            return <div>View not found</div>;
    }
};

export default AppRouter;
