

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';

// Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import KanbanBoard from './components/KanbanBoard';
import Dashboard from './components/Dashboard';
import LeadDetailSlideover from './components/LeadDetailSlideover';
import CreateEditLeadModal from './components/CreateEditLeadModal';
import CreateEditTaskModal from './components/CreateEditTaskModal';
import Notification from './components/Notification';
import FAB from './components/FAB';
import SettingsPage from './components/SettingsPage';
import ActivitiesView from './components/ActivitiesView';
import CalendarPage from './components/CalendarPage';
import ReportsPage from './components/ReportsPage';
import LeadListView from './components/LeadListView';
import ChatView from './components/ChatView';
import GroupsView from './components/GroupsView';
import GroupsDashboard from './components/GroupsDashboard';
import CreateEditGroupModal from './components/CreateEditGroupModal';
import IntegrationsPage from './components/IntegrationsPage';
import NotificationsView from './components/NotificationsView';
import PlaybookModal from './components/PlaybookModal';


// Types
import type { User, ColumnData, Lead, Activity, Task, Id, CreateLeadData, UpdateLeadData, CreateTaskData, UpdateTaskData, CardDisplaySettings, ListDisplaySettings, Tag, EmailDraft, CreateEmailDraftData, ChatConversation, ChatMessage, ChatConversationStatus, Group, CreateGroupData, UpdateGroupData, ChatChannel, GroupAnalysis, CreateGroupAnalysisData, UpdateGroupAnalysisData, Notification as NotificationType, Playbook, PlaybookHistoryEntry } from './types';

// Data
import { initialColumns, initialTags, initialLeads, initialTasks, initialActivities, initialUsers, initialGroups, initialConversations, initialMessages, initialNotifications, initialPlaybooks } from './data';

const localUser: User = { id: 'local-user', name: 'Usuário Local', email: 'user@local.com' };

// --- Local Storage Hook ---
function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(storedValue));
        } catch (error) {
            console.error(error);
        }
    }, [key, storedValue]);

    return [storedValue, setStoredValue];
}


const App: React.FC = () => {
    // --- STATE MANAGEMENT (LOCAL STORAGE) ---
    const [users, setUsers] = useLocalStorage<User[]>('crm-users', initialUsers);
    const [columns, setColumns] = useLocalStorage<ColumnData[]>('crm-columns', initialColumns);
    const [leads, setLeads] = useLocalStorage<Lead[]>('crm-leads', initialLeads);
    const [activities, setActivities] = useLocalStorage<Activity[]>('crm-activities', initialActivities);
    const [tasks, setTasks] = useLocalStorage<Task[]>('crm-tasks', initialTasks);
    const [tags, setTags] = useLocalStorage<Tag[]>('crm-tags', initialTags);
    const [emailDrafts, setEmailDrafts] = useLocalStorage<EmailDraft[]>('crm-emailDrafts', []);
    const [conversations, setConversations] = useLocalStorage<ChatConversation[]>('crm-conversations', initialConversations);
    const [messages, setMessages] = useLocalStorage<ChatMessage[]>('crm-messages', initialMessages);
    const [groups, setGroups] = useLocalStorage<Group[]>('crm-groups', initialGroups);
    const [groupAnalyses, setGroupAnalyses] = useLocalStorage<GroupAnalysis[]>('crm-groupAnalyses', []);
    const [notifications, setNotifications] = useLocalStorage<NotificationType[]>('crm-notifications', initialNotifications);
    const [playbooks, setPlaybooks] = useLocalStorage<Playbook[]>('crm-playbooks', initialPlaybooks);


    const [activeView, setActiveView] = useState('Dashboard');
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('crm-theme') as 'dark' | 'light') || 'dark');
    const [isChatEnabled, setIsChatEnabled] = useState(false);

    // Modal & Slideover States
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [isCreateLeadModalOpen, setCreateLeadModalOpen] = useState(false);
    const [editingLead, setEditingLead] = useState<Lead | null>(null);
    const [isCreateTaskModalOpen, setCreateTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [preselectedDataForTask, setPreselectedDataForTask] = useState<{leadId: Id, date?: string} | null>(null);
    const [isGroupModalOpen, setGroupModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);

    // Notification State
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    
    // Playbook states
    const [selectedLeadForPlaybookId, setSelectedLeadForPlaybookId] = useState<Id | null>(null);
    const [isPlaybookModalOpen, setPlaybookModalOpen] = useState(false);
    const selectedLeadForPlaybook = useMemo(() => leads.find(l => l.id === selectedLeadForPlaybookId), [leads, selectedLeadForPlaybookId]);


    // Display Settings
    const [cardDisplaySettings, setCardDisplaySettings] = useLocalStorage<CardDisplaySettings>('crm-cardSettings', {
        showCompany: true, showValue: true, showTags: true, showAssignedTo: true, showDueDate: false, showProbability: false, showEmail: false, showPhone: false, showCreatedAt: false, showStage: false,
    });
    const [listDisplaySettings, setListDisplaySettings] = useLocalStorage<ListDisplaySettings>('crm-listSettings', {
        showStatus: true, showValue: true, showTags: true, showLastActivity: true, showEmail: true, showPhone: false, showCreatedAt: true,
    });
    const [minimizedLeads, setMinimizedLeads] = useState<Id[]>([]);
    const [minimizedColumns, setMinimizedColumns] = useState<Id[]>([]);
    const [listSelectedTags, setListSelectedTags] = useState<Tag[]>([]);
    const [listStatusFilter, setListStatusFilter] = useState<'all' | 'Ativo' | 'Inativo'>('all');
    const [selectedGroupForView, setSelectedGroupForView] = useState<Id | null>(null);

    const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => setNotification({ message, type }), []);
    
    // Theme effect
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('crm-theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('crm-theme', 'light');
        }
    }, [theme]);


    // --- COMPUTED DATA ---
    const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);
    const filteredLeads = useMemo(() => leads.filter(lead => {
        const searchLower = searchQuery.toLowerCase();
        return (lead.name.toLowerCase().includes(searchLower) || lead.company.toLowerCase().includes(searchLower) || (lead.email && lead.email.toLowerCase().includes(searchLower)));
    }), [leads, searchQuery]);
    const listViewFilteredLeads = useMemo(() => leads.filter(lead => {
        const statusMatch = listStatusFilter === 'all' || lead.status === listStatusFilter;
        const tagMatch = listSelectedTags.length === 0 || listSelectedTags.every(st => lead.tags.some(lt => lt.id === st.id));
        return statusMatch && tagMatch;
    }), [leads, listStatusFilter, listSelectedTags]);
    const analysisForGroup = useMemo(() => (selectedGroupForView ? groupAnalyses.find(a => a.groupId === selectedGroupForView) || null : null), [groupAnalyses, selectedGroupForView]);

    // --- HANDLERS (LOCAL STATE LOGIC) ---
    
    // Activity Log
    const createActivityLog = useCallback((leadId: Id, type: Activity['type'], text: string) => {
        const newActivity: Activity = {
            id: `activity-${Date.now()}`,
            leadId,
            type,
            text,
            authorName: localUser.name || "Sistema",
            timestamp: new Date().toISOString()
        };
        setActivities(current => [newActivity, ...current]);
    }, [setActivities]);
    
    // Leads
    const handleCreateOrUpdateLead = async (data: CreateLeadData | UpdateLeadData) => {
        if (editingLead && editingLead.id) { // UPDATE
            const updatedLead = { ...leads.find(l => l.id === editingLead.id)!, ...data };
            setLeads(current => current.map(lead => lead.id === editingLead.id ? updatedLead : lead));
            showNotification(`Lead "${updatedLead.name}" atualizado.`, 'success');
            createActivityLog(updatedLead.id, 'note', `Lead atualizado.`);
        } else { // CREATE
            const newLead: Lead = {
                id: `lead-${Date.now()}`,
                ...data,
                // Required fields for a new lead
                columnId: data.columnId || columns[0].id,
                name: data.name || 'Novo Lead',
                company: data.company || '',
                value: data.value || 0,
                avatarUrl: data.avatarUrl || `https://i.pravatar.cc/150?u=${Date.now()}`,
                tags: data.tags || [],
                lastActivity: 'agora',
                createdAt: new Date().toISOString(),
            };
            setLeads(current => [newLead, ...current]);
            showNotification(`Lead "${newLead.name}" criado.`, 'success');
        }
        setCreateLeadModalOpen(false);
        setEditingLead(null);
    };

    const handleDeleteLead = async (leadId: Id) => {
        setLeads(current => current.filter(lead => lead.id !== leadId));
        setSelectedLead(null);
        showNotification(`Lead deletado.`, 'success');
    };

    const handleUpdateLeadColumn = async (leadId: Id, newColumnId: Id) => {
        const leadToMove = leads.find(l => l.id === leadId);
        if (!leadToMove || leadToMove.columnId === newColumnId) return;

        setLeads(currentLeads =>
            currentLeads.map(l =>
                l.id === leadId ? { ...l, columnId: newColumnId, lastActivity: 'agora', activePlaybook: undefined } : l
            )
        );
        
        const oldColumnName = columns.find(c => c.id === leadToMove.columnId)?.title;
        const newColumnName = columns.find(c => c.id === newColumnId)?.title;
        if(oldColumnName && newColumnName) {
            createActivityLog(leadId, 'status_change', `Status alterado de '${oldColumnName}' para '${newColumnName}'.`);
        }
    };

    const handleUpdateLeadDetails = async (leadId: Id, updates: UpdateLeadData) => {
        setLeads(current => current.map(lead => lead.id === leadId ? { ...lead, ...updates } : lead));
        showNotification("Detalhes do lead atualizados.", 'success');
    };

    // Tasks
    const handleCreateOrUpdateTask = async (data: CreateTaskData | UpdateTaskData) => {
        if (editingTask) { // UPDATE
            setTasks(current => current.map(t => t.id === editingTask.id ? { ...t, ...data } : t));
            showNotification(`Tarefa atualizada.`, 'success');
        } else { // CREATE
            const newTask: Task = {
                id: `task-${Date.now()}`,
                userId: localUser.id,
                status: 'pending',
                ...data as CreateTaskData,
            };
            setTasks(current => [newTask, ...current]);
            showNotification(`Tarefa criada.`, 'success');
        }
        setCreateTaskModalOpen(false);
        setEditingTask(null);
        setPreselectedDataForTask(null);
    };

    const handleDeleteTask = async (taskId: Id) => {
        setTasks(current => current.filter(t => t.id !== taskId));
        showNotification("Tarefa deletada.", 'success');
    };

    const handleUpdateTaskStatus = async (taskId: Id, status: 'pending' | 'completed') => {
        let taskToUpdate: Task | undefined;
        const newTasks = tasks.map(t => {
            if (t.id === taskId) {
                taskToUpdate = { ...t, status };
                return taskToUpdate;
            }
            return t;
        });
        setTasks(newTasks);

        if (status === 'completed' && taskToUpdate?.playbookId) {
            const lead = leads.find(l => l.id === taskToUpdate!.leadId);
            const playbook = playbooks.find(p => p.id === taskToUpdate!.playbookId);
            if (!lead || !lead.activePlaybook || !playbook) return;

            const playbookTasks = newTasks.filter(t => t.leadId === lead.id && t.playbookId === playbook.id);
            const allComplete = playbookTasks.every(t => t.status === 'completed');

            if (allComplete && playbookTasks.length >= playbook.steps.length) {
                const historyEntry: PlaybookHistoryEntry = {
                    playbookId: playbook.id,
                    playbookName: playbook.name,
                    startedAt: lead.activePlaybook.startedAt,
                    completedAt: new Date().toISOString(),
                };

                const currentStageIndex = columns.findIndex(c => c.id === lead.columnId);
                const nextStage = columns[currentStageIndex + 1];
                const nextColumnId = (nextStage && nextStage.id !== 'lost' && nextStage.id !== 'closed') ? nextStage.id : lead.columnId;

                const updatedLead: Lead = { 
                    ...lead, 
                    activePlaybook: undefined, 
                    playbookHistory: [...(lead.playbookHistory || []), historyEntry],
                    columnId: nextColumnId, 
                    lastActivity: 'agora' 
                };
                
                setLeads(current => current.map(l => l.id === lead.id ? updatedLead : l));

                if (nextColumnId !== lead.columnId) {
                    showNotification(`Playbook concluído! Lead movido para ${nextStage.title}.`, 'success');
                    createActivityLog(lead.id, 'status_change', `Status alterado de '${columns[currentStageIndex].title}' para '${nextStage.title}' (Playbook Automático).`);
                } else {
                    showNotification(`Playbook "${playbook.name}" concluído!`, 'success');
                }
            }
        }
    };

    // Pipeline
    const handleUpdatePipeline = async (newColumns: ColumnData[]) => {
        setColumns(newColumns);
        showNotification("Funil de vendas atualizado.", 'success');
    };
    
    // Playbooks
    const handleUpdatePlaybooks = (updatedPlaybooks: Playbook[]) => {
        setPlaybooks(updatedPlaybooks);
        showNotification("Playbooks atualizados com sucesso.", 'success');
    };
    const handleSelectLeadForPlaybook = (leadId: Id) => {
        if (selectedLeadForPlaybookId === leadId) {
            const leadToView = leads.find(l => l.id === leadId);
            if (leadToView) setSelectedLead(leadToView);
            setSelectedLeadForPlaybookId(null);
        } else {
            setSelectedLead(null);
            setSelectedLeadForPlaybookId(leadId);
        }
    };

    const handleApplyPlaybook = (playbookId: Id) => {
        if (!selectedLeadForPlaybook) return;

        if (selectedLeadForPlaybook.activePlaybook) {
            showNotification("Este lead já possui um playbook ativo.", "error");
            setPlaybookModalOpen(false);
            return;
        }

        const playbook = playbooks.find(p => p.id === playbookId);
        if (!playbook) return;

        const newTasks: Task[] = playbook.steps.map((step, index) => {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + step.day);
            return {
                id: `task-${Date.now()}-${index}`,
                leadId: selectedLeadForPlaybook.id,
                userId: localUser.id,
                type: step.type,
                title: step.instructions,
                dueDate: dueDate.toISOString(),
                status: 'pending',
                playbookId: playbook.id,
                playbookStepIndex: index,
            };
        });

        setTasks(current => [...current, ...newTasks]);
        
        const updatedLead: Lead = {
            ...selectedLeadForPlaybook,
            activePlaybook: {
                playbookId: playbook.id,
                playbookName: playbook.name,
                startedAt: new Date().toISOString(),
            }
        };

        setLeads(current => current.map(l => l.id === updatedLead.id ? updatedLead : l));
        
        showNotification(`Playbook "${playbook.name}" aplicado a ${selectedLeadForPlaybook.name}. ${newTasks.length} tarefas criadas.`, 'success');
        
        setPlaybookModalOpen(false);
        setSelectedLeadForPlaybookId(null);
    };


    // Notifications
    const handleMarkAsRead = async (notificationId: Id) => setNotifications(c => c.map(n => n.id === notificationId ? {...n, isRead: true} : n));
    const handleMarkAllAsRead = async () => setNotifications(c => c.map(n => ({...n, isRead: true})));
    const handleClearAllNotifications = async () => { setNotifications([]); showNotification("Notificações limpas.", 'info'); };
    const handleNotificationClick = (link: NotificationType['link']) => {
        if (!link) return;
        setActiveView(link.view);
        if (link.leadId) {
            const leadToSelect = leads.find(l => l.id === link.leadId);
            if (leadToSelect) setSelectedLead(leadToSelect);
        }
    };
    
    // Email Drafts
    const handleSaveDraft = async (draftData: CreateEmailDraftData) => {
        const newDraft: EmailDraft = { ...draftData, id: `draft-${Date.now()}`, createdAt: new Date().toISOString() };
        setEmailDrafts(c => [newDraft, ...c]);
        showNotification("Rascunho salvo.", 'success');
    };

    const handleDeleteDraft = async (draftId: Id) => {
        setEmailDrafts(c => c.filter(d => d.id !== draftId));
        showNotification("Rascunho deletado.", 'success');
    };

    // Chat (Simplified Local Logic)
    const handleSendMessage = async (conversationId: Id, text: string, channel: ChatChannel, leadId: Id) => {
        const newMessage: ChatMessage = { id: `msg-${Date.now()}`, conversationId, senderId: localUser.id, text, channel, timestamp: new Date().toISOString() };
        setMessages(c => [...c, newMessage]);
        setConversations(c => c.map(conv => conv.id === conversationId ? { ...conv, lastMessage: text, lastMessageTimestamp: newMessage.timestamp, lastMessageChannel: channel } : conv));
    };
    const handleUpdateConversationStatus = async (conversationId: Id, status: ChatConversationStatus) => {
        setConversations(c => c.map(conv => conv.id === conversationId ? { ...conv, status } : conv));
        showNotification("Status da conversa atualizado.", 'success');
    };

    // Groups
    const handleCreateOrUpdateGroup = async (data: CreateGroupData | UpdateGroupData) => {
        if (editingGroup) {
            setGroups(c => c.map(g => g.id === editingGroup.id ? { ...g, ...data } : g));
            showNotification("Grupo atualizado.", 'success');
        } else {
            const newGroup: Group = { id: `group-${Date.now()}`, ...data as CreateGroupData };
            setGroups(c => [newGroup, ...c]);
            showNotification("Grupo criado.", 'success');
        }
        setGroupModalOpen(false); setEditingGroup(null);
    };
    const handleDeleteGroup = async (groupId: Id) => {
        setGroups(c => c.filter(g => g.id !== groupId));
        showNotification("Grupo deletado.", 'success');
    };
    
    // UI Handlers
    const handleOpenCreateLeadModal = (columnId?: Id) => {
        setEditingLead(null);
        if (columnId) {
             const newLeadTemplate: Partial<Lead> = { columnId: columnId };
             setEditingLead(newLeadTemplate as Lead);
        }
        setCreateLeadModalOpen(true);
    };
    const handleOpenEditLeadModal = (lead: Lead) => {
        setEditingLead(lead);
        setSelectedLead(null);
        setCreateLeadModalOpen(true);
    };
    const handleOpenCreateTaskModal = (leadId?: Id, date?: string) => {
        setEditingTask(null);
        setPreselectedDataForTask(leadId ? { leadId, date } : null);
        setCreateTaskModalOpen(true);
    };
    const handleOpenEditTaskModal = (task: Task) => {
        setEditingTask(task);
        setCreateTaskModalOpen(true);
    };
    const handleOpenCreateEditGroupModal = (group: Group | null) => {
        setEditingGroup(group);
        setGroupModalOpen(true);
    };

    return (
        <div className="flex h-screen w-full bg-gray-50 dark:bg-zinc-900 text-zinc-800 dark:text-gray-200 font-sans antialiased overflow-hidden">
            <Sidebar activeView={activeView} onNavigate={setActiveView} isCollapsed={isSidebarCollapsed} onToggle={() => setSidebarCollapsed(p => !p)} isChatEnabled={isChatEnabled} />
            
            <div className="flex flex-col flex-1 overflow-hidden">
                <Header 
                    currentUser={localUser}
                    onLogout={() => { /* No action needed in local mode */ }}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onOpenCreateLeadModal={() => handleOpenCreateLeadModal()}
                    onOpenCreateTaskModal={() => handleOpenCreateTaskModal()}
                    theme={theme}
                    onThemeToggle={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                    unreadCount={unreadCount}
                />
                
                <main className="flex-1 p-6 overflow-auto dark:bg-zinc-800">
                     {activeView === 'Dashboard' && <Dashboard leads={leads} columns={columns} activities={activities} tasks={tasks} onNavigate={setActiveView} />}
                    {activeView === 'Pipeline' && <KanbanBoard columns={columns} leads={filteredLeads} users={users} cardDisplaySettings={cardDisplaySettings} onUpdateLeadColumn={handleUpdateLeadColumn} onSelectLead={handleSelectLeadForPlaybook} selectedLeadId={selectedLeadForPlaybookId} onAddLead={handleOpenCreateLeadModal} onUpdateCardSettings={setCardDisplaySettings} minimizedLeads={minimizedLeads} onToggleLeadMinimize={(id) => setMinimizedLeads(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id])} minimizedColumns={minimizedColumns} onToggleColumnMinimize={(id) => setMinimizedColumns(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id])} isPlaybookActionEnabled={!!selectedLeadForPlaybookId} onApplyPlaybookClick={() => setPlaybookModalOpen(true)} />}
                    {activeView === 'Leads' && <LeadListView viewType="Leads" leads={listViewFilteredLeads} columns={columns} onLeadClick={setSelectedLead} listDisplaySettings={listDisplaySettings} onUpdateListSettings={setListDisplaySettings} allTags={tags} selectedTags={listSelectedTags} onSelectedTagsChange={setListSelectedTags} statusFilter={listStatusFilter} onStatusFilterChange={setListStatusFilter} />}
                    {activeView === 'Clientes' && <LeadListView viewType="Clientes" leads={listViewFilteredLeads.filter(l => l.columnId === 'closed')} columns={columns} onLeadClick={setSelectedLead} listDisplaySettings={listDisplaySettings} onUpdateListSettings={setListDisplaySettings} allTags={tags} selectedTags={listSelectedTags} onSelectedTagsChange={setListSelectedTags} statusFilter={listStatusFilter} onStatusFilterChange={setListStatusFilter} />}
                    {activeView === 'Tarefas' && <ActivitiesView tasks={tasks} leads={leads} onEditTask={handleOpenEditTaskModal} onDeleteTask={handleDeleteTask} onUpdateTaskStatus={handleUpdateTaskStatus} />}
                    {activeView === 'Calendário' && <CalendarPage tasks={tasks} leads={leads} onNewActivity={(date) => handleOpenCreateTaskModal(undefined, date)} onEditActivity={handleOpenEditTaskModal} onDeleteTask={handleDeleteTask} onUpdateTaskStatus={handleUpdateTaskStatus} />}
                    {activeView === 'Relatórios' && <ReportsPage leads={leads} columns={columns} tasks={tasks} activities={activities} />}
                    {isChatEnabled && activeView === 'Chat' && <ChatView conversations={conversations} messages={messages} leads={leads} currentUser={localUser} onSendMessage={handleSendMessage} onUpdateConversationStatus={handleUpdateConversationStatus} showNotification={showNotification} />}
                    {activeView === 'Grupos' && (
                        !selectedGroupForView ? (
                            <GroupsDashboard 
                                groups={groups} 
                                leads={leads}
                                onSelectGroup={setSelectedGroupForView}
                                onAddGroup={() => handleOpenCreateEditGroupModal(null)}
                                onEditGroup={(group) => handleOpenCreateEditGroupModal(group)}
                                onDeleteGroup={handleDeleteGroup}
                            />
                        ) : (
                            <GroupsView
                                group={groups.find(g => g.id === selectedGroupForView)!}
                                leads={leads.filter(l => l.groupInfo?.groupId === selectedGroupForView)}
                                analysis={analysisForGroup}
                                onUpdateLead={handleUpdateLeadDetails}
                                onBack={() => setSelectedGroupForView(null)}
                                onCreateOrUpdateAnalysis={() => { /* Not implemented for local */ }}
                                onDeleteAnalysis={() => { /* Not implemented for local */ }}
                                showNotification={showNotification}
                            />
                        )
                    )}
                    {activeView === 'Integrações' && <IntegrationsPage showNotification={showNotification} />}
                    {activeView === 'Notificações' && <NotificationsView notifications={notifications} onMarkAsRead={handleMarkAsRead} onMarkAllAsRead={handleMarkAllAsRead} onClearAll={handleClearAllNotifications} onNavigate={handleNotificationClick} />}
                    {activeView === 'Configurações' && <SettingsPage currentUser={localUser} onUpdateProfile={() => {}} columns={columns} onUpdatePipeline={handleUpdatePipeline} playbooks={playbooks} onUpdatePlaybooks={handleUpdatePlaybooks}/>}
                </main>
            </div>
            
            <FAB onOpenCreateLeadModal={() => handleOpenCreateLeadModal()} onOpenCreateTaskModal={() => handleOpenCreateTaskModal()} />

            <AnimatePresence>
                {selectedLead && (
                    <LeadDetailSlideover 
                        lead={selectedLead}
                        activities={activities.filter(a => a.leadId === selectedLead.id)}
                        emailDrafts={emailDrafts.filter(d => d.leadId === selectedLead.id)}
                        tasks={tasks}
                        playbooks={playbooks}
                        onClose={() => setSelectedLead(null)}
                        onEdit={() => handleOpenEditLeadModal(selectedLead)}
                        onDelete={() => handleDeleteLead(selectedLead.id)}
                        onAddNote={(noteText) => createActivityLog(selectedLead.id, 'note', noteText)}
                        onSendEmailActivity={(subject) => createActivityLog(selectedLead.id, 'email_sent', `Email enviado: ${subject}`)}
                        onAddTask={() => handleOpenCreateTaskModal(selectedLead.id)}
                        onSaveDraft={handleSaveDraft}
                        onDeleteDraft={handleDeleteDraft}
                        showNotification={showNotification}
                        onUpdateTaskStatus={handleUpdateTaskStatus}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                 {(isCreateLeadModalOpen || editingLead) && (
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
                 {(isCreateTaskModalOpen || editingTask) && (
                    <CreateEditTaskModal 
                        task={editingTask} 
                        leads={leads}
                        preselectedLeadId={preselectedDataForTask?.leadId || null}
                        preselectedDate={preselectedDataForTask?.date || null}
                        onClose={() => { setCreateTaskModalOpen(false); setEditingTask(null); setPreselectedDataForTask(null); }} 
                        onSubmit={handleCreateOrUpdateTask}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {(isGroupModalOpen || editingGroup) && (
                    <CreateEditGroupModal
                        group={editingGroup}
                        onClose={() => { setGroupModalOpen(false); setEditingGroup(null); }}
                        onSubmit={handleCreateOrUpdateGroup}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {notification && (
                    <Notification 
                        message={notification.message} 
                        type={notification.type} 
                        onClose={() => setNotification(null)}
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
        </div>
    );
};

export default App;