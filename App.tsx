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
import AuthPage from './components/AuthPage';
import SettingsPage from './components/SettingsPage';
import ActivitiesView from './components/ActivitiesView';
import CalendarPage from './components/CalendarPage';
import ReportsPage from './components/ReportsPage';
import LeadListView from './components/LeadListView';
import ChatView from './components/ChatView';
import GroupsView from './components/GroupsView';
import GroupsDashboard from './components/GroupsDashboard';
import CreateEditGroupModal from './components/CreateEditGroupModal';
import ConfigurationNotice from './components/ConfigurationNotice';

// API & Types
import * as api from './api';
import { isSupabaseConfigured } from './services/supabaseClient';
import type { User, ColumnData, Lead, Activity, Task, Id, CreateLeadData, UpdateLeadData, CreateTaskData, UpdateTaskData, CardDisplaySettings, ListDisplaySettings, Tag, EmailDraft, CreateEmailDraftData, ChatConversation, ChatMessage, ChatConversationStatus, Group, CreateGroupData, UpdateGroupData, ChatChannel, GroupAnalysis, CreateGroupAnalysisData, UpdateGroupAnalysisData } from './types';

// Data (for initial structure if backend is empty)
import { initialColumns, initialTags, initialGroups, initialConversations, initialMessages } from './data';


const App: React.FC = () => {
    // --- STATE MANAGEMENT ---
    const [isLoading, setIsLoading] = useState(true);
    const [users, setUsers] = useState<User[]>([]);
    const [columns, setColumns] = useState<ColumnData[]>(initialColumns);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [tags, setTags] = useState<Tag[]>(initialTags);
    const [emailDrafts, setEmailDrafts] = useState<EmailDraft[]>([]);
    const [conversations, setConversations] = useState<ChatConversation[]>(initialConversations);
    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
    const [groups, setGroups] = useState<Group[]>(initialGroups);
    const [groupAnalyses, setGroupAnalyses] = useState<GroupAnalysis[]>([]);

    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [authError, setAuthError] = useState<string | null>(null);
    
    const [activeView, setActiveView] = useState('Grupos');
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

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
    
    // Display Settings (still local)
    const [cardDisplaySettings, setCardDisplaySettings] = useState<CardDisplaySettings>({
        showCompany: true, showValue: true, showTags: true, showAssignedTo: true, showDueDate: false, showProbability: false, showEmail: false, showPhone: false, showCreatedAt: false, showStage: false,
    });
    const [listDisplaySettings, setListDisplaySettings] = useState<ListDisplaySettings>({
        showStatus: true, showValue: true, showTags: true, showLastActivity: true, showEmail: true, showPhone: false, showCreatedAt: true,
    });
    const [minimizedLeads, setMinimizedLeads] = useState<Id[]>([]);
    const [minimizedColumns, setMinimizedColumns] = useState<Id[]>([]);
    const [listSelectedTags, setListSelectedTags] = useState<Tag[]>([]);
    const [listStatusFilter, setListStatusFilter] = useState<'all' | 'Ativo' | 'Inativo'>('all');
    const [selectedGroupForView, setSelectedGroupForView] = useState<Id | null>(null);

    // --- INITIAL DATA FETCH ---
    useEffect(() => {
        if (!isSupabaseConfigured) {
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                setIsLoading(true);
                const [
                    fetchedUser,
                    fetchedLeads,
                    fetchedTasks,
                    // fetchedActivities,
                    // fetchedColumns, 
                    // fetchedTags 
                ] = await Promise.all([
                    api.getCurrentUser(),
                    api.getLeads(),
                    api.getTasks(),
                    // api.getActivities(),
                    // api.getColumns(),
                    // api.getTags(),
                ]);

                setCurrentUser(fetchedUser);
                setLeads(fetchedLeads);
                setTasks(fetchedTasks);
                // setActivities(fetchedActivities);
                // setColumns(fetchedColumns.length ? fetchedColumns : initialColumns);
                // setTags(fetchedTags.length ? fetchedTags : initialTags);
            } catch (error) {
                console.error("Error fetching initial data:", error);
                showNotification("Falha ao carregar dados do servidor.", 'error');
                if (error instanceof Error && error.message.includes('Auth session missing')) {
                    setCurrentUser(null); // Force logout if session is invalid
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
        
        // Listen for auth changes
        const authListener = api.onAuthStateChange((_event, session) => {
            const user = session?.user ? { id: session.user.id, name: session.user.user_metadata.name, email: session.user.email! } : null;
            setCurrentUser(user);
            if (user) {
                fetchData(); // Refetch data on login
            }
        });

        return () => {
            authListener?.unsubscribe();
        };

    }, []);

    // Other useEffects
     useEffect(() => {
        if (activeView !== 'Grupos') {
            setSelectedGroupForView(null);
        }
    }, [activeView]);
    useEffect(() => {
        if (theme === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [theme]);


    // --- COMPUTED DATA ---
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

    // --- HANDLERS ---
    const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => setNotification({ message, type }), []);
    
    // Auth
    const handleLogin = async (email: string, password: string) => {
        try {
            setAuthError(null);
            const user = await api.loginUser(email, password);
            setCurrentUser(user);
            showNotification(`Bem-vindo de volta, ${user.name}!`, 'success');
        } catch (error: any) {
            if (error && error.message === 'Email not confirmed') {
                setAuthError("Por favor, confirme seu e-mail para ativar sua conta antes de fazer o login.");
            } else {
                setAuthError("Email ou senha inválidos.");
            }
        }
    };
    const handleRegister = async (name: string, email: string, password: string) => {
         try {
            setAuthError(null);
            await api.registerUser(name, email, password);
            showNotification("Conta criada! Verifique sua caixa de entrada para confirmar seu e-mail.", 'success');
        } catch (error) {
            setAuthError("Este email já está em uso ou a senha é muito fraca.");
        }
    };
    const handleLogout = async () => {
        await api.logoutUser();
        setCurrentUser(null);
        showNotification("Você saiu com sucesso.", 'info');
    };
    const handleUpdateProfile = (name: string, avatarFile?: File) => {
        // This would be an API call
    };

    // Activity Log
    const createActivityLog = useCallback(async (leadId: Id, type: Activity['type'], text: string) => {
        if (!currentUser) return;
        const newActivity = await api.createActivity({
            leadId,
            type,
            text,
            authorName: currentUser.name || "Sistema",
        });
        setActivities(prev => [newActivity, ...prev]);
    }, [currentUser]);
    
    // Leads
    const handleCreateOrUpdateLead = async (data: CreateLeadData | UpdateLeadData) => {
        try {
            if (editingLead && editingLead.id) { // Update
                const updatedLead = await api.updateLead(editingLead.id, data);
                setLeads(leads.map(l => l.id === editingLead.id ? updatedLead : l));
                showNotification(`Lead "${data.name}" atualizado.`, 'success');
                createActivityLog(editingLead.id, 'note', `Lead atualizado por ${currentUser?.name}.`);
            } else { // Create
                const newLead = await api.createLead(data);
                setLeads(prev => [...prev, newLead]);
                showNotification(`Lead "${newLead.name}" criado.`, 'success');
            }
            setCreateLeadModalOpen(false);
            setEditingLead(null);
        } catch (error) {
            showNotification("Falha ao salvar o lead.", 'error');
        }
    };
    const handleDeleteLead = async (leadId: Id) => {
        const leadName = leads.find(l => l.id === leadId)?.name || 'Lead';
        try {
            await api.deleteLead(leadId);
            setLeads(leads.filter(l => l.id !== leadId));
            setSelectedLead(null);
            showNotification(`"${leadName}" foi deletado.`, 'success');
        } catch (error) {
            showNotification("Falha ao deletar o lead.", 'error');
        }
    };
    const handleUpdateLeadColumn = async (leadId: Id, newColumnId: Id) => {
        const lead = leads.find(l => l.id === leadId);
        if (lead && lead.columnId !== newColumnId) {
            try {
                const updatedLead = await api.updateLead(leadId, { columnId: newColumnId, lastActivity: new Date().toISOString() });
                setLeads(leads.map(l => l.id === leadId ? updatedLead : l));
                const oldColumnName = columns.find(c => c.id === lead.columnId)?.title;
                const newColumnName = columns.find(c => c.id === newColumnId)?.title;
                createActivityLog(leadId, 'status_change', `Status alterado de '${oldColumnName}' para '${newColumnName}'.`);
            } catch (error) {
                showNotification("Falha ao mover o lead.", 'error');
            }
        }
    };
    const handleUpdateLeadDetails = async (leadId: Id, updates: UpdateLeadData) => {
         try {
            const updatedLead = await api.updateLead(leadId, updates);
            setLeads(prevLeads => prevLeads.map(lead => lead.id === leadId ? updatedLead : lead));
        } catch (error) {
             showNotification("Falha ao atualizar detalhes do lead.", 'error');
        }
    };

    // Tasks
    const handleCreateOrUpdateTask = async (data: CreateTaskData | UpdateTaskData) => {
        try {
            if (editingTask) { // Update
                const updatedTask = await api.updateTask(editingTask.id, data);
                setTasks(tasks.map(t => t.id === editingTask.id ? updatedTask : t));
                showNotification(`Tarefa "${data.title}" atualizada.`, 'success');
            } else { // Create
                const newTask = await api.createTask(data as CreateTaskData);
                setTasks(prev => [newTask, ...prev]);
                showNotification(`Tarefa "${newTask.title}" criada.`, 'success');
            }
            setCreateTaskModalOpen(false);
            setEditingTask(null);
            setPreselectedDataForTask(null);
        } catch (error) {
            showNotification("Falha ao salvar a tarefa.", 'error');
        }
    };
    const handleDeleteTask = async (taskId: Id) => {
        try {
            await api.deleteTask(taskId);
            setTasks(tasks.filter(t => t.id !== taskId));
            showNotification("Tarefa deletada.", 'success');
        } catch(error) {
            showNotification("Falha ao deletar a tarefa.", 'error');
        }
    };
    const handleUpdateTaskStatus = async (taskId: Id, status: 'pending' | 'completed') => {
        try {
            const updatedTask = await api.updateTask(taskId, { status });
            setTasks(tasks.map(t => t.id === taskId ? updatedTask : t));
            showNotification(`Tarefa marcada como ${status === 'completed' ? 'concluída' : 'pendente'}.`, 'info');
        } catch (error) {
            showNotification("Falha ao atualizar status da tarefa.", 'error');
        }
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


    // --- RENDER LOGIC ---
    if (!isSupabaseConfigured) {
        return <ConfigurationNotice />;
    }
    
    if (isLoading) {
        return <div className="flex h-screen w-full items-center justify-center bg-zinc-900 text-white">Carregando...</div>;
    }

    if (!currentUser) {
        return <AuthPage onLogin={handleLogin} onRegister={handleRegister} onSignInWithGoogle={api.signInWithGoogle} error={authError} />;
    }

    // Dummy handlers, to be implemented
    const handleAddNote = (noteText: string) => {};
    const handleSendEmailActivity = (subject: string) => {};
    const handleSaveDraft = (draftData: CreateEmailDraftData) => {};
    const handleDeleteDraft = (draftId: Id) => {};
    const handleSendMessage = (conversationId: Id, text: string, channel: ChatChannel) => {};
    const handleUpdateConversationStatus = (conversationId: Id, status: ChatConversationStatus) => {};
    const handleUpdatePipeline = (newColumns: ColumnData[]) => {};
    const handleCreateOrUpdateGroup = (data: CreateGroupData | UpdateGroupData) => {};
    const handleDeleteGroup = (groupId: Id) => {};
    const handleCreateOrUpdateGroupAnalysis = (data: CreateGroupAnalysisData | UpdateGroupAnalysisData, analysisId?: Id) => {};
    const handleDeleteGroupAnalysis = (analysisId: Id) => {};

    return (
        <div className="flex h-screen w-full bg-gray-50 dark:bg-zinc-900 text-zinc-800 dark:text-gray-200 font-sans antialiased overflow-hidden">
            <Sidebar activeView={activeView} onNavigate={setActiveView} isCollapsed={isSidebarCollapsed} onToggle={() => setSidebarCollapsed(p => !p)} />
            
            <div className="flex flex-col flex-1 overflow-hidden">
                <Header 
                    currentUser={currentUser}
                    onLogout={handleLogout}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onOpenCreateLeadModal={() => handleOpenCreateLeadModal()}
                    onOpenCreateTaskModal={() => handleOpenCreateTaskModal()}
                    theme={theme}
                    onThemeToggle={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                />
                
                <main className="flex-1 p-6 overflow-auto">
                     {activeView === 'Dashboard' && <Dashboard leads={leads} columns={columns} activities={activities} tasks={tasks} onNavigate={setActiveView} />}
                    {activeView === 'Pipeline' && <KanbanBoard columns={columns} leads={filteredLeads} users={users} cardDisplaySettings={cardDisplaySettings} onUpdateLeadColumn={handleUpdateLeadColumn} onLeadClick={setSelectedLead} onAddLead={handleOpenCreateLeadModal} onUpdateCardSettings={setCardDisplaySettings} minimizedLeads={minimizedLeads} onToggleLeadMinimize={(id) => setMinimizedLeads(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id])} minimizedColumns={minimizedColumns} onToggleColumnMinimize={(id) => setMinimizedColumns(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id])} />}
                    {activeView === 'Leads' && <LeadListView viewType="Leads" leads={listViewFilteredLeads} columns={columns} onLeadClick={setSelectedLead} listDisplaySettings={listDisplaySettings} onUpdateListSettings={setListDisplaySettings} allTags={tags} selectedTags={listSelectedTags} onSelectedTagsChange={setListSelectedTags} statusFilter={listStatusFilter} onStatusFilterChange={setListStatusFilter} />}
                    {activeView === 'Clientes' && <LeadListView viewType="Clientes" leads={listViewFilteredLeads} columns={columns} onLeadClick={setSelectedLead} listDisplaySettings={listDisplaySettings} onUpdateListSettings={setListDisplaySettings} allTags={tags} selectedTags={listSelectedTags} onSelectedTagsChange={setListSelectedTags} statusFilter={listStatusFilter} onStatusFilterChange={setListStatusFilter} />}
                    {activeView === 'Tarefas' && <ActivitiesView tasks={tasks} leads={leads} onEditTask={handleOpenEditTaskModal} onDeleteTask={handleDeleteTask} onUpdateTaskStatus={handleUpdateTaskStatus} />}
                    {activeView === 'Calendário' && <CalendarPage tasks={tasks} leads={leads} onNewActivity={(date) => handleOpenCreateTaskModal(undefined, date)} onEditActivity={handleOpenEditTaskModal} onDeleteTask={handleDeleteTask} onUpdateTaskStatus={handleUpdateTaskStatus} />}
                    {activeView === 'Relatórios' && <ReportsPage leads={leads} columns={columns} tasks={tasks} activities={activities} />}
                    {activeView === 'Chat' && <ChatView conversations={conversations} messages={messages} leads={leads} currentUser={currentUser} onSendMessage={handleSendMessage} onUpdateConversationStatus={handleUpdateConversationStatus} showNotification={showNotification} />}
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
                                onCreateOrUpdateAnalysis={handleCreateOrUpdateGroupAnalysis}
                                onDeleteAnalysis={handleDeleteGroupAnalysis}
                                showNotification={showNotification}
                            />
                        )
                    )}
                    {activeView === 'Configurações' && <SettingsPage currentUser={currentUser} onUpdateProfile={handleUpdateProfile} columns={columns} onUpdatePipeline={handleUpdatePipeline}/>}
                </main>
            </div>
            
            <FAB onOpenCreateLeadModal={() => handleOpenCreateLeadModal()} onOpenCreateTaskModal={() => handleOpenCreateTaskModal()} />

            <AnimatePresence>
                {selectedLead && (
                    <LeadDetailSlideover 
                        lead={selectedLead}
                        activities={activities.filter(a => a.leadId === selectedLead.id)}
                        emailDrafts={emailDrafts.filter(d => d.leadId === selectedLead.id)}
                        onClose={() => setSelectedLead(null)}
                        onEdit={() => handleOpenEditLeadModal(selectedLead)}
                        onDelete={() => handleDeleteLead(selectedLead.id)}
                        onAddNote={handleAddNote}
                        onSendEmailActivity={handleSendEmailActivity}
                        onAddTask={() => handleOpenCreateTaskModal(selectedLead.id)}
                        onSaveDraft={handleSaveDraft}
                        onDeleteDraft={handleDeleteDraft}
                        showNotification={showNotification}
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
        </div>
    );
};

export default App;