import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { SupabaseClient } from '@supabase/supabase-js';

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
import SampleDataPrompt from './components/SampleDataPrompt';
import IntegrationsPage from './components/IntegrationsPage';
import NotificationsView from './components/NotificationsView';


// API & Types
import * as api from './api';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
import type { User, ColumnData, Lead, Activity, Task, Id, CreateLeadData, UpdateLeadData, CreateTaskData, UpdateTaskData, CardDisplaySettings, ListDisplaySettings, Tag, EmailDraft, CreateEmailDraftData, ChatConversation, ChatMessage, ChatConversationStatus, Group, CreateGroupData, UpdateGroupData, ChatChannel, GroupAnalysis, CreateGroupAnalysisData, UpdateGroupAnalysisData, Notification as NotificationType } from './types';

// Data (for initial structure if backend is empty)
import { initialColumns, initialTags, initialLeads, initialTasks as sampleInitialTasks } from './data';


// Helper to map Supabase snake_case to our camelCase
const mapLeadFromDb = (dbLead: any): Lead => ({
    id: dbLead.id,
    columnId: dbLead.column_id,
    name: dbLead.name,
    company: dbLead.company,
    value: dbLead.value,
    avatarUrl: dbLead.avatar_url,
    tags: dbLead.tags || [],
    lastActivity: dbLead.last_activity,
    dueDate: dbLead.due_date,
    assignedTo: dbLead.assigned_to,
    description: dbLead.description,
    email: dbLead.email,
    phone: dbLead.phone,
    probability: dbLead.probability,
    status: dbLead.status,
    clientId: dbLead.client_id,
    source: dbLead.source,
    createdAt: dbLead.created_at,
    groupInfo: dbLead.group_info,
});

const mapTaskFromDb = (dbTask: any): Task => ({
    id: dbTask.id,
    type: dbTask.type,
    title: dbTask.title,
    description: dbTask.description,
    dueDate: dbTask.due_date,
    status: dbTask.status,
    leadId: dbTask.lead_id,
    userId: dbTask.user_id,
});

const mapActivityFromDb = (dbActivity: any): Activity => ({
    id: dbActivity.id,
    leadId: dbActivity.lead_id,
    type: dbActivity.type,
    text: dbActivity.text,
    authorName: dbActivity.author_name,
    timestamp: dbActivity.timestamp,
});

const mapMessageFromDb = (dbMessage: any): ChatMessage => ({
    id: dbMessage.id,
    conversationId: dbMessage.conversation_id,
    senderId: dbMessage.sender_id,
    text: dbMessage.text,
    timestamp: dbMessage.timestamp,
    channel: dbMessage.channel,
});

const mapConversationFromDb = (dbConv: any): ChatConversation => ({
    id: dbConv.id,
    leadId: dbConv.lead_id,
    lastMessage: dbConv.last_message,
    lastMessageTimestamp: dbConv.last_message_timestamp,
    unreadCount: dbConv.unread_count,
    status: dbConv.status,
    lastMessageChannel: dbConv.last_message_channel,
});


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
    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [groupAnalyses, setGroupAnalyses] = useState<GroupAnalysis[]>([]);
    const [notifications, setNotifications] = useState<NotificationType[]>([]);


    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [authError, setAuthError] = useState<string | null>(null);
    
    const [activeView, setActiveView] = useState('Dashboard');
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [isChatEnabled, setIsChatEnabled] = useState(true);

    // Modal & Slideover States
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [isCreateLeadModalOpen, setCreateLeadModalOpen] = useState(false);
    const [editingLead, setEditingLead] = useState<Lead | null>(null);
    const [isCreateTaskModalOpen, setCreateTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [preselectedDataForTask, setPreselectedDataForTask] = useState<{leadId: Id, date?: string} | null>(null);
    const [isGroupModalOpen, setGroupModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);
    const [showSampleDataPrompt, setShowSampleDataPrompt] = useState(false);

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

    const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => setNotification({ message, type }), []);

    // --- INITIAL DATA FETCH ---
    const fetchData = useCallback(async () => {
        if (!isSupabaseConfigured) {
            setIsLoading(false);
            return;
        }
        try {
            setIsLoading(true);

            // Fetch core data first
            const [
                fetchedLeads, fetchedTasks, fetchedActivities,
                fetchedGroups, fetchedNotifications, fetchedEmailDrafts, fetchedGroupAnalyses
            ] = await Promise.all([
                api.getLeads(), api.getTasks(), api.getActivities(),
                api.getGroups(), api.getNotifications(), api.getEmailDrafts(), api.getGroupAnalyses(),
            ]);

            setLeads(fetchedLeads);
            setTasks(fetchedTasks);
            setActivities(fetchedActivities);
            setGroups(fetchedGroups);
            setNotifications(fetchedNotifications);
            setEmailDrafts(fetchedEmailDrafts);
            setGroupAnalyses(fetchedGroupAnalyses);

            // Fetch chat data separately and handle errors gracefully
            try {
                const [fetchedConversations, fetchedMessages] = await Promise.all([
                    api.getConversations(),
                    api.getMessages(),
                ]);
                setConversations(fetchedConversations);
                setMessages(fetchedMessages);
                setIsChatEnabled(true);
            } catch (chatError: any) {
                const errorMsg = chatError.message || '';
                if (errorMsg.includes('does not exist') || errorMsg.includes('Could not find the table')) {
                    console.warn("Chat feature disabled: 'conversations' and/or 'messages' tables not found. Please run the chat schema migrations.");
                    showNotification("Funcionalidade de Chat desabilitada: Tabelas do banco de dados não encontradas.", 'info');
                    setConversations([]);
                    setMessages([]);
                    setIsChatEnabled(false);
                    if (activeView === 'Chat') {
                        setActiveView('Dashboard');
                    }
                } else {
                    throw chatError; // Re-throw other chat-related errors
                }
            }


            if (fetchedLeads.length === 0 && !localStorage.getItem('sampleDataPromptDismissed')) {
                setShowSampleDataPrompt(true);
            }
        } catch (error) {
            console.error("Error fetching initial data:", error);
            showNotification("Falha ao carregar dados do servidor.", 'error');
        } finally {
            setIsLoading(false);
        }
    }, [showNotification]);

    // Auth listener effect - runs ONCE to set up listeners
    useEffect(() => {
        // Set initial user state on page load
        api.getCurrentUser().then((user) => {
            if (!user) {
                setIsLoading(false); // If no user, stop loading, show login page
            }
            setCurrentUser(user);
        });
        
        // Listen for auth changes (login, logout)
        const handleAuthChange = (_event: string, session: any) => {
            const user = session?.user ? { id: session.user.id, name: session.user.user_metadata.name || session.user.email, email: session.user.email! } : null;
            setCurrentUser(user);
        };
        
        const subscription = api.onAuthStateChange(handleAuthChange);

        return () => {
            subscription?.unsubscribe();
        };
    }, []); // Empty dependency array means this runs only once on mount

    // Data fetching effect - runs when user state changes
    useEffect(() => {
        if (currentUser) {
            fetchData();
        } else {
            // When currentUser is null (logout or initial state), clear data
            setLeads([]);
            setTasks([]);
            setActivities([]);
            setGroups([]);
            setConversations([]);
            setMessages([]);
            setNotifications([]);
            setEmailDrafts([]);
            setGroupAnalyses([]);
        }
    }, [currentUser, fetchData]);


    // --- REALTIME SUBSCRIPTIONS ---
    useEffect(() => {
        if (!currentUser || !supabase) return;

        console.log("Setting up Supabase real-time subscriptions...");

        const handleLeadInsert = (payload: any) => {
            const newLead = mapLeadFromDb(payload.new);
            setLeads(current => {
                // Prevent duplicates from local update vs. realtime
                if (current.some(lead => lead.id === newLead.id)) {
                    return current;
                }
                return [newLead, ...current];
            });
        };
        const handleLeadUpdate = (payload: any) => setLeads(current => current.map(lead => lead.id === payload.new.id ? mapLeadFromDb(payload.new) : lead));
        const handleLeadDelete = (payload: any) => setLeads(current => current.filter(lead => lead.id !== payload.old.id));
        
        const handleTaskInsert = (payload: any) => setTasks(current => [...current, mapTaskFromDb(payload.new)]);
        const handleTaskUpdate = (payload: any) => setTasks(current => current.map(task => task.id === payload.new.id ? mapTaskFromDb(payload.new) : task));
        const handleTaskDelete = (payload: any) => setTasks(current => current.filter(task => task.id !== payload.old.id));

        const handleActivityInsert = (payload: any) => setActivities(current => [mapActivityFromDb(payload.new), ...current]);

        const leadsChannel = supabase.channel('public:leads')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, handleLeadInsert)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'leads' }, handleLeadUpdate)
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'leads' }, handleLeadDelete)
            .subscribe();

        const tasksChannel = supabase.channel('public:tasks')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tasks' }, handleTaskInsert)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tasks' }, handleTaskUpdate)
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'tasks' }, handleTaskDelete)
            .subscribe();
            
        const activitiesChannel = supabase.channel('public:activities')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activities' }, handleActivityInsert)
            .subscribe();
        
        if (isChatEnabled) {
            const handleMessageInsert = (payload: any) => setMessages(current => [...current, mapMessageFromDb(payload.new)]);
            const handleConversationUpdate = (payload: any) => {
                const updatedConversation = mapConversationFromDb(payload.new);
                setConversations(current => {
                    const index = current.findIndex(c => c.id === updatedConversation.id);
                    const newConversations = index > -1 ? [...current] : [updatedConversation, ...current];
                    if (index > -1) newConversations[index] = updatedConversation;
                    
                    return newConversations.sort((a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime());
                });
            };

            const messagesChannel = supabase.channel('public:messages')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, handleMessageInsert)
                .subscribe();

            const conversationsChannel = supabase.channel('public:conversations')
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations' }, handleConversationUpdate)
                .subscribe();
        }
        
        return () => {
            console.log("Removing Supabase channels.");
            supabase.removeAllChannels();
        };

    }, [currentUser, isChatEnabled]);


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

    // --- HANDLERS ---
    
    // Auth
    const handleLogin = async (email: string, password: string) => {
        try {
            setAuthError(null);
            await api.loginUser(email, password);
        } catch (error: any) {
            setAuthError("Email ou senha inválidos.");
        }
    };
    const handleRegister = async (name: string, email: string, password: string) => {
         try {
            setAuthError(null);
            await api.registerUser(name, email, password);
            showNotification("Conta criada! Verifique sua caixa de entrada para confirmar seu e-mail.", 'success');
        } catch (error: any) {
            setAuthError(error.message || "Ocorreu um erro ao criar a conta.");
        }
    };
    const handleLogout = async () => {
        await api.logoutUser();
        showNotification("Você saiu com sucesso.", 'info');
    };
    const handleForgotPassword = async (email: string) => {
        await api.sendPasswordResetEmail(email);
    };
    const handleUpdateProfile = (name: string, avatarFile?: File) => {
        // This would be an API call
    };

    // Activity Log
    const createActivityLog = useCallback(async (leadId: Id, type: Activity['type'], text: string) => {
        if (!currentUser) return;
        try {
            await api.createActivity({
                leadId,
                type,
                text,
                authorName: currentUser.name || "Sistema",
            });
        } catch (error) {
            console.error("Failed to create activity log", error);
            // Don't show UI notification for this background task
        }
    }, [currentUser]);
    
    // Leads
    const handleCreateOrUpdateLead = async (data: CreateLeadData | UpdateLeadData) => {
        try {
            if (editingLead && editingLead.id) {
                const updatedLead = await api.updateLead(editingLead.id, data);
                setLeads(current => current.map(lead => lead.id === updatedLead.id ? updatedLead : lead));
                showNotification(`Lead "${updatedLead.name}" atualizado.`, 'success');
                createActivityLog(updatedLead.id, 'note', `Lead atualizado.`);
            } else {
                const newLead = await api.createLead(data as CreateLeadData);
                // No need for setLeads here if realtime subscription is working, but it provides a faster UI update
                setLeads(current => [newLead, ...current]);
                showNotification(`Lead "${newLead.name}" criado.`, 'success');
            }
            setCreateLeadModalOpen(false);
            setEditingLead(null);
        } catch (error) {
            showNotification("Falha ao salvar o lead.", 'error');
            console.error("Error saving lead:", error);
        }
    };
    const handleDeleteLead = async (leadId: Id) => {
        try {
            await api.deleteLead(leadId);
            setSelectedLead(null);
            showNotification(`Lead deletado.`, 'success');
        } catch (error) {
            showNotification("Falha ao deletar o lead.", 'error');
        }
    };
    const handleUpdateLeadColumn = async (leadId: Id, newColumnId: Id) => {
        const leadToMove = leads.find(l => l.id === leadId);
        if (!leadToMove || leadToMove.columnId === newColumnId) {
            return; // No change needed
        }

        const originalLeads = leads; // Store original state for rollback
        const oldColumnId = leadToMove.columnId;

        // Optimistic UI Update
        setLeads(currentLeads =>
            currentLeads.map(l =>
                l.id === leadId ? { ...l, columnId: newColumnId, lastActivity: 'agora' } : l
            )
        );

        try {
            // Persist change to the backend
            await api.updateLead(leadId, { columnId: newColumnId, lastActivity: new Date().toISOString() });
            
            // Log activity on success
            const oldColumnName = columns.find(c => c.id === oldColumnId)?.title;
            const newColumnName = columns.find(c => c.id === newColumnId)?.title;
            if(oldColumnName && newColumnName) {
                createActivityLog(leadId, 'status_change', `Status alterado de '${oldColumnName}' para '${newColumnName}'.`);
            }
        } catch (error) {
            // Rollback on failure
            showNotification("Falha ao mover o lead. Revertendo.", 'error');
            console.error("Error moving lead:", error);
            setLeads(originalLeads); // Revert to the state before the optimistic update
        }
    };
    const handleUpdateLeadDetails = async (leadId: Id, updates: UpdateLeadData) => {
         try {
            await api.updateLead(leadId, updates);
            showNotification("Detalhes do lead atualizados.", 'success');
        } catch (error) {
             showNotification("Falha ao atualizar detalhes do lead.", 'error');
        }
    };

    // Tasks
    const handleCreateOrUpdateTask = async (data: CreateTaskData | UpdateTaskData) => {
        try {
            if (editingTask) {
                await api.updateTask(editingTask.id, data);
                showNotification(`Tarefa atualizada.`, 'success');
            } else {
                await api.createTask(data as CreateTaskData);
                showNotification(`Tarefa criada.`, 'success');
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
            showNotification("Tarefa deletada.", 'success');
        } catch(error) {
            showNotification("Falha ao deletar a tarefa.", 'error');
        }
    };
    const handleUpdateTaskStatus = async (taskId: Id, status: 'pending' | 'completed') => {
        try {
            await api.updateTask(taskId, { status });
        } catch (error) {
            showNotification("Falha ao atualizar status da tarefa.", 'error');
        }
    };
    
    // Notifications
    const handleMarkAsRead = async (notificationId: Id) => {
        try { await api.updateNotification(notificationId, { is_read: true }); } catch (e) { console.error(e); }
    };
    const handleMarkAllAsRead = async () => {
        try { await api.markAllNotificationsRead(); } catch (e) { console.error(e); }
    };
    const handleClearAllNotifications = async () => {
        try { await api.clearAllNotifications(); showNotification("Notificações limpas.", 'info'); } catch (e) { console.error(e); }
    };
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
        try { await api.createEmailDraft(draftData); showNotification("Rascunho salvo.", 'success'); } catch (e) { showNotification("Falha ao salvar rascunho.", 'error'); }
    };
    const handleDeleteDraft = async (draftId: Id) => {
        try { await api.deleteEmailDraft(draftId); showNotification("Rascunho deletado.", 'success'); } catch (e) { showNotification("Falha ao deletar rascunho.", 'error'); }
    };

    // Chat
    const handleSendMessage = async (conversationId: Id, text: string, channel: ChatChannel, leadId: Id) => {
        if(!currentUser) return;
        try { await api.sendMessage({ conversationId, senderId: currentUser.id, text, channel, leadId }); } catch (e) { showNotification("Falha ao enviar mensagem.", 'error'); }
    };
    const handleUpdateConversationStatus = async (conversationId: Id, status: ChatConversationStatus) => {
        try { await api.updateConversationStatus(conversationId, status); showNotification("Status da conversa atualizado.", 'success'); } catch (e) { showNotification("Falha ao atualizar status.", 'error'); }
    };

    // Groups
    const handleCreateOrUpdateGroup = async (data: CreateGroupData | UpdateGroupData) => {
        try {
            if (editingGroup) { await api.updateGroup(editingGroup.id, data); showNotification("Grupo atualizado.", 'success');}
            else { await api.createGroup(data as CreateGroupData); showNotification("Grupo criado.", 'success'); }
            setGroupModalOpen(false); setEditingGroup(null);
        } catch(e) { showNotification("Falha ao salvar grupo.", 'error');}
    };
    const handleDeleteGroup = async (groupId: Id) => {
        try { await api.deleteGroup(groupId); showNotification("Grupo deletado.", 'success'); } catch(e) { showNotification("Falha ao deletar grupo.", 'error'); }
    };
    const handleCreateOrUpdateGroupAnalysis = async (data: CreateGroupAnalysisData | UpdateGroupAnalysisData, analysisId?: Id) => {
        try {
            if (analysisId) { await api.updateGroupAnalysis(analysisId, data); }
            else { await api.createGroupAnalysis(data as CreateGroupAnalysisData); }
            showNotification("Análise salva.", 'success');
        } catch (e) { showNotification("Falha ao salvar análise.", 'error'); }
    };
    const handleDeleteGroupAnalysis = async (analysisId: Id) => {
        try { await api.deleteGroupAnalysis(analysisId); showNotification("Análise descartada.", 'success'); } catch (e) { showNotification("Falha ao descartar análise.", 'error'); }
    };


    // Sample Data Handlers
    const handleDismissSampleDataPrompt = () => {
        localStorage.setItem('sampleDataPromptDismissed', 'true');
        setShowSampleDataPrompt(false);
    };

    const handlePopulateSampleData = async () => {
        try {
            await api.addSampleData(initialLeads, sampleInitialTasks);
            showNotification("Dados de exemplo adicionados! Atualizando...", 'success');
            await fetchData(); // Refetch all data
            setShowSampleDataPrompt(false);
            localStorage.setItem('sampleDataPromptDismissed', 'true');
        } catch (error) {
            console.error("Error populating sample data:", error);
            showNotification("Falha ao adicionar dados de exemplo.", 'error');
            setShowSampleDataPrompt(false);
            localStorage.setItem('sampleDataPromptDismissed', 'true');
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
        return <AuthPage onLogin={handleLogin} onRegister={handleRegister} onSignInWithGoogle={api.signInWithGoogle} onForgotPassword={handleForgotPassword} error={authError} />;
    }
    
    return (
        <div className="flex h-screen w-full bg-gray-50 dark:bg-zinc-900 text-zinc-800 dark:text-gray-200 font-sans antialiased overflow-hidden">
            <Sidebar activeView={activeView} onNavigate={setActiveView} isCollapsed={isSidebarCollapsed} onToggle={() => setSidebarCollapsed(p => !p)} isChatEnabled={isChatEnabled} />
            
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
                    unreadCount={unreadCount}
                />
                
                <main className="flex-1 p-6 overflow-auto">
                     {activeView === 'Dashboard' && <Dashboard leads={leads} columns={columns} activities={activities} tasks={tasks} onNavigate={setActiveView} />}
                    {activeView === 'Pipeline' && <KanbanBoard columns={columns} leads={filteredLeads} users={users} cardDisplaySettings={cardDisplaySettings} onUpdateLeadColumn={handleUpdateLeadColumn} onLeadClick={setSelectedLead} onAddLead={handleOpenCreateLeadModal} onUpdateCardSettings={setCardDisplaySettings} minimizedLeads={minimizedLeads} onToggleLeadMinimize={(id) => setMinimizedLeads(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id])} minimizedColumns={minimizedColumns} onToggleColumnMinimize={(id) => setMinimizedColumns(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id])} />}
                    {activeView === 'Leads' && <LeadListView viewType="Leads" leads={listViewFilteredLeads} columns={columns} onLeadClick={setSelectedLead} listDisplaySettings={listDisplaySettings} onUpdateListSettings={setListDisplaySettings} allTags={tags} selectedTags={listSelectedTags} onSelectedTagsChange={setListSelectedTags} statusFilter={listStatusFilter} onStatusFilterChange={setListStatusFilter} />}
                    {activeView === 'Clientes' && <LeadListView viewType="Clientes" leads={listViewFilteredLeads} columns={columns} onLeadClick={setSelectedLead} listDisplaySettings={listDisplaySettings} onUpdateListSettings={setListDisplaySettings} allTags={tags} selectedTags={listSelectedTags} onSelectedTagsChange={setListSelectedTags} statusFilter={listStatusFilter} onStatusFilterChange={setListStatusFilter} />}
                    {activeView === 'Tarefas' && <ActivitiesView tasks={tasks} leads={leads} onEditTask={handleOpenEditTaskModal} onDeleteTask={handleDeleteTask} onUpdateTaskStatus={handleUpdateTaskStatus} />}
                    {activeView === 'Calendário' && <CalendarPage tasks={tasks} leads={leads} onNewActivity={(date) => handleOpenCreateTaskModal(undefined, date)} onEditActivity={handleOpenEditTaskModal} onDeleteTask={handleDeleteTask} onUpdateTaskStatus={handleUpdateTaskStatus} />}
                    {activeView === 'Relatórios' && <ReportsPage leads={leads} columns={columns} tasks={tasks} activities={activities} />}
                    {isChatEnabled && activeView === 'Chat' && <ChatView conversations={conversations} messages={messages} leads={leads} currentUser={currentUser} onSendMessage={handleSendMessage} onUpdateConversationStatus={handleUpdateConversationStatus} showNotification={showNotification} />}
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
                    {activeView === 'Integrações' && <IntegrationsPage showNotification={showNotification} />}
                    {activeView === 'Notificações' && <NotificationsView notifications={notifications} onMarkAsRead={handleMarkAsRead} onMarkAllAsRead={handleMarkAllAsRead} onClearAll={handleClearAllNotifications} onNavigate={handleNotificationClick} />}
                    {activeView === 'Configurações' && <SettingsPage currentUser={currentUser} onUpdateProfile={handleUpdateProfile} columns={columns} onUpdatePipeline={() => {}}/>}
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
                        onAddNote={(noteText) => createActivityLog(selectedLead.id, 'note', noteText)}
                        onSendEmailActivity={(subject) => createActivityLog(selectedLead.id, 'email_sent', `Email enviado: ${subject}`)}
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
            <AnimatePresence>
                {showSampleDataPrompt && (
                    <SampleDataPrompt
                        onConfirm={handlePopulateSampleData}
                        onDismiss={handleDismissSampleDataPrompt}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default App;