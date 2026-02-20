import React from 'react';
import { AnimatePresence } from 'framer-motion';
import type { AppState } from './useAppState';
import { localUser } from './useAppState';

import AppRouter from './AppRouter';

import Sidebar from '@/shared/components/Sidebar';
import Header from '@/shared/components/Header';
import SdrBotModal from '@/shared/components/SdrBotModal';
import ConfirmDeleteModal from '@/shared/components/ConfirmDeleteModal';

import LeadDetailSlideover from '@/features/leads/LeadDetailSlideover';
import CreateEditLeadModal from '@/features/leads/CreateEditLeadModal';
import LostLeadModal from '@/features/leads/LostLeadModal';
import CreateEditTaskModal from '@/features/tasks/CreateEditTaskModal';
import CreateEditGroupModal from '@/features/groups/CreateEditGroupModal';
import PlaybookModal from '@/features/playbooks/PlaybookModal';
import CreateBoardModal from '@/features/pipeline/CreateBoardModal';
import SdrAssistantChat from '@/features/ai/SdrAssistantChat';
import Notification from '@/features/notifications/Notification';

import type { EmailDraft } from '@/shared/types';

const AppLayout: React.FC<AppState> = (props) => {
    const {
        // Layout state
        isSidebarCollapsed, setSidebarCollapsed,
        activeView, setActiveView,
        searchQuery, setSearchQuery,
        theme, setTheme,
        unreadCount,
        isChatEnabled,
        handleOpenSdrBot,
        // Slideover
        selectedLead, setSelectedLead,
        activities,
        emailDrafts, setEmailDrafts,
        tasks,
        playbooks,
        handleDeleteLead,
        createActivityLog,
        showNotification,
        handleUpdateTaskStatus,
        handleDeactivatePlaybook,
        setEditingLead,
        setCreateLeadModalOpen,
        preselectedDataForTask, setPreselectedDataForTask,
        setCreateTaskModalOpen,
        // Lead modal
        isCreateLeadModalOpen,
        editingLead,
        columns,
        tags,
        groups,
        handleCreateOrUpdateLead,
        // Task modal
        isCreateTaskModalOpen,
        editingTask, setEditingTask,
        leads,
        handleCreateOrUpdateTask,
        // Group modal
        isGroupModalOpen, setGroupModalOpen,
        editingGroup, setEditingGroup,
        handleCreateOrUpdateGroup,
        // Playbook modal
        isPlaybookModalOpen, setPlaybookModalOpen,
        selectedLeadForPlaybook,
        handleApplyPlaybook,
        // Lost lead modal
        lostLeadInfo, setLostLeadInfo,
        handleProcessLostLead,
        // SDR bot
        isSdrBotOpen, setSdrBotOpen,
        isAiConfigured,
        settingsTab, setSettingsTab,
        // Board modal
        isCreateBoardModalOpen, setCreateBoardModalOpen,
        handleCreateBoard,
        // Notification toast
        notification, setNotification,
    } = props;

    return (
        <div className="flex h-screen text-zinc-800 dark:text-gray-300">
            <Sidebar
                activeView={activeView}
                onNavigate={setActiveView}
                isCollapsed={isSidebarCollapsed}
                onToggle={() => setSidebarCollapsed(p => !p)}
                isChatEnabled={isChatEnabled}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header
                    currentUser={localUser}
                    onLogout={() => {}}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    theme={theme}
                    onThemeToggle={() => setTheme(p => p === 'dark' ? 'light' : 'dark')}
                    unreadCount={unreadCount}
                    onOpenSdrBot={handleOpenSdrBot}
                    activeView={activeView}
                />
                <main className="flex-1 overflow-auto p-6">
                    <AppRouter {...props} />
                </main>
            </div>

            <AnimatePresence>
                {selectedLead && (
                    <LeadDetailSlideover
                        lead={selectedLead}
                        activities={activities.filter(a => a.leadId === selectedLead.id)}
                        emailDrafts={emailDrafts.filter(d => d.leadId === selectedLead.id)}
                        tasks={tasks}
                        playbooks={playbooks}
                        onClose={() => setSelectedLead(null)}
                        onEdit={() => { setEditingLead(selectedLead); setCreateLeadModalOpen(true); }}
                        onDelete={() => handleDeleteLead(selectedLead.id)}
                        onAddNote={(text) => createActivityLog(selectedLead.id, 'note', text)}
                        onSendEmailActivity={(subject) => createActivityLog(selectedLead.id, 'email_sent', `Email enviado: "${subject}"`)}
                        onAddTask={() => { setPreselectedDataForTask({ leadId: selectedLead.id }); setCreateTaskModalOpen(true); }}
                        onSaveDraft={(data) => {
                            const newDraft: EmailDraft = { ...data, id: `draft-${Date.now()}`, createdAt: new Date().toISOString() };
                            setEmailDrafts(curr => [...curr, newDraft]);
                            showNotification('Rascunho salvo!', 'success');
                        }}
                        onDeleteDraft={(id) => { setEmailDrafts(curr => curr.filter(d => d.id !== id)); showNotification('Rascunho deletado.', 'info'); }}
                        showNotification={showNotification}
                        onUpdateTaskStatus={handleUpdateTaskStatus}
                        onDeactivatePlaybook={() => handleDeactivatePlaybook(selectedLead.id)}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isCreateLeadModalOpen && (
                    <CreateEditLeadModal
                        lead={editingLead}
                        columns={columns}
                        allTags={tags}
                        groups={groups}
                        onClose={() => { setCreateLeadModalOpen(false); setEditingLead(null); }}
                        onSubmit={handleCreateOrUpdateLead}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isCreateTaskModalOpen && (
                    <CreateEditTaskModal
                        task={editingTask}
                        leads={leads}
                        preselectedLeadId={preselectedDataForTask?.leadId}
                        preselectedDate={preselectedDataForTask?.date}
                        onClose={() => { setCreateTaskModalOpen(false); setEditingTask(null); setPreselectedDataForTask(null); }}
                        onSubmit={handleCreateOrUpdateTask}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isGroupModalOpen && (
                    <CreateEditGroupModal
                        group={editingGroup}
                        onClose={() => { setGroupModalOpen(false); setEditingGroup(null); }}
                        onSubmit={handleCreateOrUpdateGroup}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isPlaybookModalOpen && selectedLeadForPlaybook && (
                    <PlaybookModal
                        lead={selectedLeadForPlaybook}
                        playbooks={playbooks}
                        onClose={() => setPlaybookModalOpen(false)}
                        onApply={handleApplyPlaybook}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {lostLeadInfo && (
                    <LostLeadModal
                        lead={lostLeadInfo.lead}
                        onClose={() => setLostLeadInfo(null)}
                        onSubmit={handleProcessLostLead}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isSdrBotOpen && (
                    isAiConfigured ? (
                        <SdrAssistantChat
                            onClose={() => setSdrBotOpen(false)}
                            leads={leads}
                            tasks={tasks}
                            columns={columns}
                            activities={activities}
                        />
                    ) : (
                        <SdrBotModal
                            onClose={() => setSdrBotOpen(false)}
                            onGoToSettings={() => {
                                setSdrBotOpen(false);
                                setSettingsTab('Inteligência Artificial');
                                setActiveView('Configurações');
                            }}
                        />
                    )
                )}
            </AnimatePresence>

            <CreateBoardModal
                isOpen={isCreateBoardModalOpen}
                onClose={() => setCreateBoardModalOpen(false)}
                onCreateBoard={handleCreateBoard}
            />

            <AnimatePresence>
                {notification && (
                    <Notification
                        message={notification.message}
                        type={notification.type}
                        onClose={() => setNotification(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default AppLayout;
