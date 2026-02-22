import React from 'react';
import { ProfileView } from '@/src/features/profile';
import KanbanBoard from '@/components/KanbanBoard';
import Dashboard from '@/components/Dashboard';
import SettingsPage from '@/components/SettingsPage';
import ActivitiesView from '@/components/ActivitiesView';
import CalendarPage from '@/components/CalendarPage';
import ReportsPage from '@/components/ReportsPage';
import LeadListView from '@/components/LeadListView';
import ChatView from '@/components/ChatView';
import GroupsView from '@/components/GroupsView';
import GroupsDashboard from '@/components/GroupsDashboard';
import IntegrationsPage from '@/components/IntegrationsPage';
import NotificationsView from '@/components/NotificationsView';
import PlaybookSettings from '@/components/PlaybookSettings';
import PrintableLeadsReport from '@/components/PrintableLeadsReport';
import RecoveryView from '@/components/RecoveryView';
import InboxView from '@/components/InboxView';
import Painel360Layout from '@/components/Painel360/Painel360Layout';
import Perfil360Page from '@/components/Painel360/Perfil360Page';

interface AppRouterProps {
  activeView: string;
  // ... all other props needed by views
  [key: string]: any; 
}

export const AppRouter: React.FC<AppRouterProps> = (props) => {
  const { 
    activeView, 
    leadsToPrint, 
    setLeadsToPrint,
    tasks,
    activities,
    searchedLeads,
    inboxMode,
    notifications,
    setActiveView,
    setNotifications,
    leads,
    columns,
    showNotification,
    handleExportPDF,
    handleStartAnalysis,
    users,
    cardDisplaySettings,
    handleUpdateLeadColumn,
    handleCardClick,
    selectedLeadForPlaybookId,
    setEditingLead,
    setCreateLeadModalOpen,
    setCardDisplaySettings,
    minimizedLeads,
    setMinimizedLeads,
    minimizedColumns,
    setMinimizedColumns,
    selectedLeadForPlaybook,
    setPlaybookModalOpen,
    boards,
    activeBoardId,
    setActiveBoardId,
    setCreateBoardModalOpen,
    playbooks,
    setPlaybooks,
    listDisplaySettings,
    setListDisplaySettings,
    tags,
    listSelectedTags,
    setListSelectedTags,
    listStatusFilter,
    setListStatusFilter,
    setCreateTaskModalOpen,
    setEditingTask,
    handleDeleteTask,
    handleUpdateTaskStatus,
    handleReactivateLead,
    handleDeleteLead,
    conversations,
    messages,
    localUser,
    setMessages,
    setConversations,
    selectedGroupForView,
    setSelectedGroupForView,
    analysisForGroup,
    setLeads,
    setSelectedLead,
    createActivityLog,
    selectedLead,
    handleCreateOrUpdateGroupAnalysis,
    handleDeleteGroupAnalysis,
    groups,
    setEditingGroup,
    setGroupModalOpen,
    handleDeleteGroup,
    setPreselectedDataForTask,
    handleResetApplication,
    settingsTab,
    setColumns,
    calculateProbabilityForStage,
    onUpdateUsers,
    selectedSellerId,
    setSelectedSellerId,
  } = props;

  if (leadsToPrint) {
    return <PrintableLeadsReport leads={leadsToPrint} tasks={tasks} activities={activities} onPrintEnd={() => setLeadsToPrint(null)} />;
  }

  const filteredLeads = searchedLeads;
  let listViewFilteredLeads: any[];

  switch (activeView) {
    case 'Meu Perfil':
      return <ProfileView />;
    case 'Inbox':
      return <InboxView
          mode={inboxMode}
          tasks={tasks}
          notifications={notifications}
          leads={leads}
          onNavigate={(view: string) => setActiveView(view)}
          onMarkNotificationRead={(id: string) => setNotifications((curr: any[]) => curr.map(n => n.id === id ? { ...n, isRead: true } : n))}
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
          onToggleLeadMinimize={(leadId: any) => setMinimizedLeads((p: any[]) => (p || []).includes(leadId) ? (p || []).filter(id => id !== leadId) : [...(p || []), leadId])}
          minimizedColumns={minimizedColumns}
          onToggleColumnMinimize={(colId: any) => setMinimizedColumns((p: any[]) => (p || []).includes(colId) ? (p || []).filter(id => id !== colId) : [...(p || []), colId])}
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
      listViewFilteredLeads = filteredLeads.filter((l: any) => l.columnId !== 'closed');
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
      listViewFilteredLeads = filteredLeads.filter((l: any) => l.columnId === 'closed');
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
                    onEditTask={(task: any) => { setEditingTask(task); setCreateTaskModalOpen(true); }}
                    onDeleteTask={handleDeleteTask} onUpdateTaskStatus={handleUpdateTaskStatus}
               />;
    case 'Relatórios':
        return <ReportsPage leads={leads} columns={columns} tasks={tasks} activities={activities} />;
    case 'Recuperação':
        const recoveryLeads = leads.filter((l: any) => l.reactivationDate);
        return <RecoveryView 
            leads={recoveryLeads} 
            onReactivateLead={handleReactivateLead} 
            onExportPDF={handleExportPDF} 
            onDeleteLead={handleDeleteLead}
            onLeadClick={handleCardClick}
        />;
    case 'Chat':
        return <ChatView
            conversations={conversations} messages={messages} leads={filteredLeads} currentUser={localUser}
            onSendMessage={(convId: string, text: string, channel: string) => {
                const newMessage = { id: `msg-${Date.now()}`, conversationId: convId, senderId: localUser.id, text, timestamp: new Date().toISOString(), channel };
                setMessages((curr: any[]) => [...curr, newMessage]);
                setConversations((curr: any[]) => curr.map(c => c.id === convId ? {...c, lastMessage: text, lastMessageTimestamp: newMessage.timestamp, lastMessageChannel: channel, unreadCount: 0 } : c));
            }}
            onUpdateConversationStatus={(convId: string, status: string) => setConversations((curr: any[]) => curr.map(c => c.id === convId ? {...c, status} : c))}
            showNotification={showNotification}
         />;
    case 'Grupos':
        if (selectedGroupForView) {
            const group = groups.find((g: any) => g.id === selectedGroupForView);
            const groupLeads = leads.filter((l: any) => l.groupInfo?.groupId === selectedGroupForView);
            if (!group) { setSelectedGroupForView(null); return null; }
            return <GroupsView
                        group={group}
                        leads={groupLeads}
                        analysis={analysisForGroup}
                        onUpdateLead={(leadId: string, updates: any) => {
                            const lead = leads.find((l: any) => l.id === leadId);
                            if (lead) {
                                const updatedLead = { ...lead, ...updates, lastActivity: 'agora', lastActivityTimestamp: new Date().toISOString() };
                                setLeads((current: any[]) => current.map(l => (l.id === leadId ? updatedLead : l)));
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
            onAddGroup={() => { setEditingGroup(null); setGroupModalOpen(true); }}
            onEditGroup={(group: any) => { setEditingGroup(group); setGroupModalOpen(true); }}
            onDeleteGroup={handleDeleteGroup}
         />;
    case 'Integrações':
        return <IntegrationsPage showNotification={showNotification} />;
    case 'Calendário':
        return <CalendarPage
            tasks={tasks} leads={filteredLeads}
            onNewActivity={(date: string) => { setPreselectedDataForTask({ leadId: leads[0]?.id, date }); setCreateTaskModalOpen(true); }}
            onEditActivity={(task: any) => { setEditingTask(task); setCreateTaskModalOpen(true); }}
            onDeleteTask={handleDeleteTask}
            onUpdateTaskStatus={handleUpdateTaskStatus}
         />;
    case 'Notificações':
        return <NotificationsView
            notifications={notifications}
            onMarkAsRead={(id: string) => setNotifications((curr: any[]) => curr.map(n => n.id === id ? { ...n, isRead: true } : n))}
            onMarkAllAsRead={() => setNotifications((curr: any[]) => curr.map(n => ({...n, isRead: true})))}
            onClearAll={() => setNotifications([])}
            onNavigate={(link: any) => {
                if (link) {
                    if (link.view) setActiveView(link.view);
                    if (link.leadId) {
                        const leadToSelect = leads.find((l: any) => l.id === link.leadId);
                        if (leadToSelect) setSelectedLead(leadToSelect);
                    }
                }
            }}
        />
    case 'Painel360': {
        if (selectedSellerId) {
            const seller = users.find((u: any) => u.id === selectedSellerId) ?? null;
            return (
                <Perfil360Page
                    seller={seller}
                    sellerId={selectedSellerId}
                    onBack={() => setSelectedSellerId(null)}
                />
            );
        }
        return (
            <Painel360Layout
                users={users}
                onSelectSeller={(seller: any) => setSelectedSellerId(seller.id)}
            />
        );
    }
    case 'Configurações':
        return <SettingsPage
            currentUser={localUser}
            users={users}
            columns={columns}
            onUpdateProfile={() => showNotification("Perfil atualizado!", 'success')}
            onUpdatePipeline={(newColumns: any[]) => {
                setColumns(newColumns);
                setLeads((currentLeads: any[]) => currentLeads.map(lead => ({
                    ...lead,
                    probability: calculateProbabilityForStage(lead.columnId, newColumns)
                })));
                showNotification("Pipeline salvo!", 'success');
            }}
            onUpdateUsers={onUpdateUsers}
            onResetApplication={handleResetApplication}
            initialTab={settingsTab}
        />;
    default:
        return <div>View not found</div>;
  }
};
