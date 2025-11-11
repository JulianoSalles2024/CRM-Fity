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


// Data & Types
import { initialUsers, initialColumns, initialLeads, initialActivities, initialTasks, initialTags, initialEmailDrafts, initialConversations, initialMessages, initialGroups } from './data';
import type { User, ColumnData, Lead, Activity, Task, Id, CreateLeadData, UpdateLeadData, CreateTaskData, UpdateTaskData, CardDisplaySettings, ListDisplaySettings, Tag, EmailDraft, CreateEmailDraftData, ChatConversation, ChatMessage, ChatConversationStatus, Group, CreateGroupData, UpdateGroupData, ChatChannel, GroupAnalysis, CreateGroupAnalysisData, UpdateGroupAnalysisData } from './types';


// Custom hook for localStorage persistence
// NOTE FOR PRODUCTION: This demo uses localStorage for simplicity. In a real-world application,
// this hook would be replaced with a custom hook that fetches and mutates data
// via secure, authenticated API calls to a backend server (e.g., using React Query or SWR).
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

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Use the functional update form of useState's setter to prevent stale state.
      setStoredValue(currentValue => {
          const valueToStore = value instanceof Function ? value(currentValue) : value;
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          return valueToStore;
      });
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}


const App: React.FC = () => {
    // --- STATE MANAGEMENT ---
    const [users, setUsers] = useLocalStorage<User[]>('crm-users', initialUsers);
    const [columns, setColumns] = useLocalStorage<ColumnData[]>('crm-columns', initialColumns);
    const [leads, setLeads] = useLocalStorage<Lead[]>('crm-leads', initialLeads);
    const [activities, setActivities] = useLocalStorage<Activity[]>('crm-activities', initialActivities);
    const [tasks, setTasks] = useLocalStorage<Task[]>('crm-tasks', initialTasks);
    const [tags, setTags] = useLocalStorage<Tag[]>('crm-tags', initialTags);
    const [emailDrafts, setEmailDrafts] = useLocalStorage<EmailDraft[]>('crm-email-drafts', initialEmailDrafts);
    const [conversations, setConversations] = useLocalStorage<ChatConversation[]>('crm-conversations', initialConversations);
    const [messages, setMessages] = useLocalStorage<ChatMessage[]>('crm-messages', initialMessages);
    const [groups, setGroups] = useLocalStorage<Group[]>('crm-groups', initialGroups);
    const [groupAnalyses, setGroupAnalyses] = useLocalStorage<GroupAnalysis[]>('crm-group-analyses', []);


    const [currentUser, setCurrentUser] = useLocalStorage<User | null>('crm-currentUser', null);
    const [authError, setAuthError] = useState<string | null>(null);
    const [authSuccessMessage, setAuthSuccessMessage] = useState<string | null>(null);
    
    const [activeView, setActiveView] = useState('Grupos');
    const [isSidebarCollapsed, setSidebarCollapsed] = useLocalStorage('crm-sidebarCollapsed', false);
    const [searchQuery, setSearchQuery] = useState('');
    const [theme, setTheme] = useLocalStorage<'dark' | 'light'>('crm-theme', 'dark');

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
    
    // Display Settings
    const [cardDisplaySettings, setCardDisplaySettings] = useLocalStorage<CardDisplaySettings>('crm-cardSettings', {
        showCompany: true, showValue: true, showTags: true, showAssignedTo: true, showDueDate: false, showProbability: false, showEmail: false, showPhone: false, showCreatedAt: false, showStage: false,
    });
    const [listDisplaySettings, setListDisplaySettings] = useLocalStorage<ListDisplaySettings>('crm-listSettings', {
        showStatus: true, showValue: true, showTags: true, showLastActivity: true, showEmail: true, showPhone: false, showCreatedAt: true,
    });
    const [minimizedLeads, setMinimizedLeads] = useLocalStorage<Id[]>('crm-minimizedLeads', []);
    const [minimizedColumns, setMinimizedColumns] = useLocalStorage<Id[]>('crm-minimizedColumns', []);


    // List View Filters
    const [listSelectedTags, setListSelectedTags] = useState<Tag[]>([]);
    const [listStatusFilter, setListStatusFilter] = useState<'all' | 'Ativo' | 'Inativo'>('all');

    // Groups View State
    const [selectedGroupForView, setSelectedGroupForView] = useState<Id | null>(null);
     useEffect(() => {
        if (activeView !== 'Grupos') {
            setSelectedGroupForView(null);
        }
    }, [activeView]);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);


    // --- COMPUTED DATA ---
    const filteredLeads = useMemo(() => {
        return leads
            .filter(lead => {
                const searchLower = searchQuery.toLowerCase();
                return (
                    lead.name.toLowerCase().includes(searchLower) ||
                    lead.company.toLowerCase().includes(searchLower) ||
                    (lead.email && lead.email.toLowerCase().includes(searchLower))
                );
            });
    }, [leads, searchQuery]);

    const listViewFilteredLeads = useMemo(() => {
        return leads.filter(lead => {
            const statusMatch = listStatusFilter === 'all' || lead.status === listStatusFilter;
            const tagMatch = listSelectedTags.length === 0 || listSelectedTags.every(st => lead.tags.some(lt => lt.id === st.id));
            return statusMatch && tagMatch;
        })
    }, [leads, listStatusFilter, listSelectedTags]);

    const analysisForGroup = useMemo(() => {
        if (!selectedGroupForView) return null;
        return groupAnalyses
            .filter(a => a.groupId === selectedGroupForView)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            [0] || null;
    }, [groupAnalyses, selectedGroupForView]);


    // --- NOTIFICATION HANDLER ---
    const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setNotification({ message, type });
    }, []);

    // --- AUTHENTICATION ---
    const handleLogin = async (email: string, password: string) => {
        const user = users.find(u => u.email === email); // Password check is omitted for this demo
        if (user) {
            setCurrentUser(user);
            setAuthError(null);
            setAuthSuccessMessage(null);
            showNotification(`Bem-vindo de volta, ${user.name}!`, 'success');
        } else {
            setAuthError("Email ou senha inválidos.");
            setAuthSuccessMessage(null);
        }
    };
    const handleRegister = async (name: string, email: string, password: string) => {
        if (users.some(u => u.email === email)) {
            setAuthError("Este email já está em uso.");
            setAuthSuccessMessage(null);
            return;
        }
        const newUser: User = { id: `user-${Date.now()}`, name, email };
        setUsers(prev => [...prev, newUser]);
        setAuthSuccessMessage("Conta criada com sucesso! Por favor, faça o login.");
        setAuthError(null);
    };
    const handleLogout = () => {
        setCurrentUser(null);
        showNotification("Você saiu com sucesso.", 'info');
    };
    const handleUpdateProfile = (name: string, avatarFile?: File) => {
        if (currentUser) {
            const avatarUrl = avatarFile ? URL.createObjectURL(avatarFile) : currentUser.avatarUrl;
            const updatedUser = { ...currentUser, name, avatarUrl };
            setCurrentUser(updatedUser);
            setUsers(users.map(u => u.id === currentUser.id ? updatedUser : u));
            showNotification("Perfil atualizado com sucesso!", 'success');
        }
    };


    // --- DATA HANDLERS ---
    const createActivityLog = useCallback((leadId: Id, type: Activity['type'], text: string) => {
        const newActivity: Activity = {
            id: `activity-${Date.now()}`,
            leadId,
            type,
            text,
            authorName: currentUser?.name || "Sistema",
            timestamp: new Date().toISOString()
        };
        setActivities(prev => [newActivity, ...prev]);
    }, [currentUser, setActivities]);
    
    // Leads
    // NOTE FOR PRODUCTION: In a real app, this function would make an API call to a backend endpoint.
    // For example: `await api.updateLead(editingLead.id, data)` or `await api.createLead(data)`.
    // The local state would then be updated based on the successful API response.
    const handleCreateOrUpdateLead = (data: CreateLeadData | UpdateLeadData) => {
        if (editingLead) { // Update
            setLeads(leads.map(l => l.id === editingLead.id ? { ...l, ...data, id: editingLead.id } : l));
            showNotification(`Lead "${data.name}" atualizado.`, 'success');
            createActivityLog(editingLead.id, 'note', `Lead atualizado por ${currentUser?.name}.`);
        } else { // Create
            const newLead: Lead = {
                id: `lead-${Date.now()}`,
                columnId: data.columnId || columns[0].id,
                name: data.name || 'Novo Lead',
                company: data.company || '',
                value: data.value || 0,
                avatarUrl: `https://i.pravatar.cc/150?u=${Date.now()}`,
                tags: data.tags || [],
                lastActivity: new Date().toLocaleDateString(),
                createdAt: new Date().toISOString(),
                ...data,
            };
            setLeads(prev => [...prev, newLead]);
            showNotification(`Lead "${newLead.name}" criado.`, 'success');
        }
        setCreateLeadModalOpen(false);
        setEditingLead(null);
    };

    const handleDeleteLead = (leadId: Id) => {
        const leadName = leads.find(l => l.id === leadId)?.name || 'Lead';
        setLeads(leads.filter(l => l.id !== leadId));
        setSelectedLead(null);
        showNotification(`"${leadName}" foi deletado.`, 'success');
    };

    const handleUpdateLeadColumn = (leadId: Id, newColumnId: Id) => {
        const lead = leads.find(l => l.id === leadId);
        if (lead && lead.columnId !== newColumnId) {
            const oldColumnName = columns.find(c => c.id === lead.columnId)?.title;
            const newColumnName = columns.find(c => c.id === newColumnId)?.title;
            setLeads(leads.map(l => l.id === leadId ? { ...l, columnId: newColumnId, lastActivity: new Date().toLocaleDateString() } : l));
            createActivityLog(leadId, 'status_change', `Status alterado de '${oldColumnName}' para '${newColumnName}'.`);
        }
    };
    
    const handleUpdateLeadDetails = (leadId: Id, updates: UpdateLeadData) => {
        setLeads(prevLeads =>
            prevLeads.map(lead =>
                lead.id === leadId ? { ...lead, ...updates } : lead
            )
        );
    };

    const handleToggleLeadMinimize = useCallback((leadId: Id) => {
        setMinimizedLeads(prev => 
            prev.includes(leadId) 
                ? prev.filter(id => id !== leadId) 
                : [...prev, leadId]
        );
    }, [setMinimizedLeads]);

    const handleToggleColumnMinimize = useCallback((columnId: Id) => {
        setMinimizedColumns(prev =>
            prev.includes(columnId)
                ? prev.filter(id => id !== columnId)
                : [...prev, columnId]
        );
    }, [setMinimizedColumns]);


    // Tasks
    const handleCreateOrUpdateTask = (data: CreateTaskData | UpdateTaskData) => {
         if (editingTask) { // Update
            setTasks(tasks.map(t => t.id === editingTask.id ? { ...t, ...data, id: editingTask.id, userId: editingTask.userId } : t));
            showNotification(`Tarefa "${data.title}" atualizada.`, 'success');
        } else { // Create
            const newTask: Task = {
                id: `task-${Date.now()}`,
                userId: currentUser!.id,
                status: 'pending',
                ...(data as CreateTaskData),
            };
            setTasks(prev => [newTask, ...prev]);
            showNotification(`Tarefa "${newTask.title}" criada.`, 'success');
        }
        setCreateTaskModalOpen(false);
        setEditingTask(null);
        setPreselectedDataForTask(null);
    };
    
    const handleDeleteTask = (taskId: Id) => {
        setTasks(tasks.filter(t => t.id !== taskId));
        showNotification("Tarefa deletada.", 'success');
    };

    const handleUpdateTaskStatus = (taskId: Id, status: 'pending' | 'completed') => {
        setTasks(tasks.map(t => t.id === taskId ? { ...t, status } : t));
        const taskTitle = tasks.find(t => t.id === taskId)?.title;
        showNotification(`Tarefa "${taskTitle}" marcada como ${status === 'completed' ? 'concluída' : 'pendente'}.`, 'info');
    };
    
    // Activities, Drafts & Chat
    const handleAddNote = (noteText: string) => {
        if (selectedLead) {
            createActivityLog(selectedLead.id, 'note', noteText);
            showNotification("Nota adicionada.", "success");
        }
    };

    const handleSendEmailActivity = (subject: string) => {
        if(selectedLead) {
            createActivityLog(selectedLead.id, 'email_sent', `Email enviado: "${subject}"`);
        }
    };

    const handleSaveDraft = (draftData: CreateEmailDraftData) => {
        const newDraft: EmailDraft = {
            id: `draft-${Date.now()}`,
            createdAt: new Date().toISOString(),
            ...draftData
        };
        setEmailDrafts(prev => [newDraft, ...prev]);
        showNotification("Rascunho salvo!", "success");
    };

    const handleDeleteDraft = (draftId: Id) => {
        setEmailDrafts(emailDrafts.filter(d => d.id !== draftId));
        showNotification("Rascunho deletado.", "success");
    };
    
    const generateBotReply = (userMessage: string, leadName: string): string => {
        const lowerMessage = userMessage.toLowerCase();
        if (lowerMessage.includes('demonstração') || lowerMessage.includes('demo')) {
            return `Claro, ${leadName}! Qual seria o melhor horário para uma breve demonstração?`;
        }
        if (lowerMessage.includes('preço') || lowerMessage.includes('valor')) {
            return "O plano Pro custa R$249/mês e te dá acesso a todas as funcionalidades. Acha que faz sentido para você?";
        }
        if (lowerMessage.includes('olá') || lowerMessage.includes('oi') || lowerMessage.includes('tudo bem')) {
            return `Olá! Tudo bem por aqui. Como posso te ajudar hoje?`;
        }
        if (lowerMessage.includes('obrigado')) {
            return `De nada, ${leadName}! Se precisar de mais alguma coisa, é só chamar.`;
        }
        // Default reply
        return "Entendido. Vou verificar essa informação e já te retorno, ok?";
    };
    
    const handleSendMessage = useCallback((conversationId: Id, text: string, channel: ChatChannel) => {
        if (!currentUser) return;
    
        // 1. Add user's message
        const newMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            conversationId,
            senderId: currentUser.id,
            text,
            timestamp: new Date().toISOString(),
            channel,
        };
        setMessages(prev => [...prev, newMessage]);

        const conversation = conversations.find(c => c.id === conversationId);
        if (!conversation) return;
        
        const lead = leads.find(l => l.id === conversation.leadId);
        if (!lead) return;

        // 2. Update conversation with user's message and set status to 'open'
        setConversations(convs => convs.map(c => 
            c.id === conversationId 
                ? { 
                    ...c, 
                    lastMessage: text, 
                    lastMessageTimestamp: newMessage.timestamp, 
                    status: 'open' as ChatConversationStatus,
                    lastMessageChannel: channel,
                  } 
                : c
        ));

        // 3. Simulate bot reply
        setTimeout(() => {
            const botReplyText = generateBotReply(text, lead.name);
            const botReplyChannel: ChatChannel = 'whatsapp'; // Simulate bot always replies on whatsapp
            const botMessage: ChatMessage = {
                id: `msg-${Date.now() + 1}`, // ensure unique id
                conversationId,
                senderId: lead.id,
                text: botReplyText,
                timestamp: new Date().toISOString(),
                channel: botReplyChannel,
            };
            setMessages(prev => [...prev, botMessage]);
            
            // 4. Update conversation again with bot's reply
            setConversations(convs => convs.map(c => 
                c.id === conversationId 
                    ? { 
                        ...c, 
                        lastMessage: botReplyText, 
                        lastMessageTimestamp: botMessage.timestamp, 
                        status: 'waiting' as ChatConversationStatus,
                        lastMessageChannel: botReplyChannel,
                      } 
                    : c
            ));

        }, 1500 + Math.random() * 1000); // Simulate typing delay

    }, [currentUser, setMessages, setConversations, conversations, leads]);
    
    const handleUpdateConversationStatus = useCallback((conversationId: Id, status: ChatConversationStatus) => {
        setConversations(prev => 
            prev.map(c => 
                c.id === conversationId 
                    ? { ...c, status } 
                    : c
            )
        );
        const conv = conversations.find(c => c.id === conversationId);
        if (conv) {
            const leadName = leads.find(l => l.id === conv.leadId)?.name;
            showNotification(`Status da conversa com "${leadName}" atualizado.`, 'info');
        }
    }, [setConversations, conversations, leads, showNotification]);

    const handleUpdatePipeline = (newColumns: ColumnData[]) => {
        setColumns(newColumns);
        showNotification("Estrutura do pipeline atualizada!", "success");
    };

    // Groups
    const handleCreateOrUpdateGroup = (data: CreateGroupData | UpdateGroupData) => {
        if (editingGroup) { // Update
            setGroups(groups.map(g => g.id === editingGroup.id ? { ...g, ...data, id: editingGroup.id } : g));
            showNotification(`Grupo "${data.name}" atualizado.`, 'success');
        } else { // Create
            const newGroup: Group = {
                id: `group-${Date.now()}`,
                ...(data as CreateGroupData),
            };
            setGroups(prev => [...prev, newGroup]);
            showNotification(`Grupo "${newGroup.name}" criado.`, 'success');
        }
        setGroupModalOpen(false);
        setEditingGroup(null);
    };

    const handleDeleteGroup = (groupId: Id) => {
        // Optional: Check if group has members before deleting
        const groupName = groups.find(g => g.id === groupId)?.name || 'Grupo';
        setGroups(groups.filter(g => g.id !== groupId));
        // Also unset this group from any leads
        setLeads(leads.map(lead => {
            if (lead.groupInfo?.groupId === groupId) {
                return { ...lead, groupInfo: { ...lead.groupInfo, groupId: undefined }};
            }
            return lead;
        }));
        showNotification(`Grupo "${groupName}" foi deletado.`, 'success');
    };
    
    // Group Analysis Handlers
    const handleCreateOrUpdateGroupAnalysis = (data: CreateGroupAnalysisData | UpdateGroupAnalysisData, analysisId?: Id) => {
        if (analysisId) { // Update
            setGroupAnalyses(analyses => analyses.map(a => a.id === analysisId ? { ...a, ...data, id: analysisId } : a));
            showNotification('Análise atualizada.', 'success');
        } else { // Create
            const newAnalysis: GroupAnalysis = {
                id: `analysis-${Date.now()}`,
                createdAt: new Date().toISOString(),
                ...(data as CreateGroupAnalysisData),
            };
            // Replace any existing analysis for that group to keep only the latest one.
            setGroupAnalyses(prev => [...prev.filter(a => a.groupId !== newAnalysis.groupId), newAnalysis]);
            showNotification(`Análise salva como ${data.status === 'draft' ? 'rascunho' : 'final'}.`, 'success');
        }
    };

    const handleDeleteGroupAnalysis = (analysisId: Id) => {
        setGroupAnalyses(analyses => analyses.filter(a => a.id !== analysisId));
        showNotification('Análise descartada.', 'success');
    };


    // --- UI HANDLERS ---
    const handleOpenCreateLeadModal = (columnId?: Id) => {
        setEditingLead(null);
        if (columnId) {
             const newLeadTemplate: Partial<Lead> = { columnId: columnId };
             setEditingLead(newLeadTemplate as Lead); // Use template to pre-select stage
        }
        setCreateLeadModalOpen(true);
    };
    const handleOpenEditLeadModal = (lead: Lead) => {
        setEditingLead(lead);
        setSelectedLead(null); // Close slideover
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

    if (!currentUser) {
        return <AuthPage onLogin={handleLogin} onRegister={handleRegister} onSignInWithGoogle={async () => {}} error={authError} successMessage={authSuccessMessage} />;
    }

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
                    {activeView === 'Pipeline' && <KanbanBoard columns={columns} leads={filteredLeads} users={users} cardDisplaySettings={cardDisplaySettings} onUpdateLeadColumn={handleUpdateLeadColumn} onLeadClick={setSelectedLead} onAddLead={handleOpenCreateLeadModal} onUpdateCardSettings={setCardDisplaySettings} minimizedLeads={minimizedLeads} onToggleLeadMinimize={handleToggleLeadMinimize} minimizedColumns={minimizedColumns} onToggleColumnMinimize={handleToggleColumnMinimize} />}
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
                    {activeView === 'Notificações' && <div className="text-center p-10 bg-white dark:bg-zinc-800/50 rounded-lg border-2 border-dashed border-zinc-200 dark:border-zinc-700"><h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Notificações</h2><p className="text-zinc-500 dark:text-zinc-400 mt-2">Esta seção estará disponível em breve!</p></div>}
                    {activeView === 'Dúvidas' && <div className="text-center p-10 bg-white dark:bg-zinc-800/50 rounded-lg border-2 border-dashed border-zinc-200 dark:border-zinc-700"><h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Dúvidas e Suporte</h2><p className="text-zinc-500 dark:text-zinc-400 mt-2">Esta seção estará disponível em breve!</p></div>}
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