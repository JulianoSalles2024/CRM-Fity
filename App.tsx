

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
import PlaybookSettings from './components/PlaybookSettings';
import PrintableLeadsReport from './components/PrintableLeadsReport';
import LostLeadModal from './components/LostLeadModal';
import RecoveryView from './components/RecoveryView';


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
    const [lostLeadInfo, setLostLeadInfo] = useState<{lead: Lead, columnId: Id} | null>(null);


    // Notification State
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    
    // Playbook states
    const [selectedLeadForPlaybookId, setSelectedLeadForPlaybookId] = useState<Id | null>(null);
    const [isPlaybookModalOpen, setPlaybookModalOpen] = useState(false);
    const selectedLeadForPlaybook = useMemo(() => leads.find(l => l.id === selectedLeadForPlaybookId), [leads, selectedLeadForPlaybookId]);

    // Printing state
    const [leadsToPrint, setLeadsToPrint] = useState<Lead[] | null>(null);


    // Display Settings
    const [cardDisplaySettings, setCardDisplaySettings] = useLocalStorage<CardDisplaySettings>('crm-cardSettings', {
        showCompany: true, showSegment: true, showValue: true, showTags: true, showAssignedTo: true, showDueDate: false, showProbability: true, showEmail: false, showPhone: false, showCreatedAt: false, showStage: false,
    });
    const [listDisplaySettings, setListDisplaySettings] = useLocalStorage<ListDisplaySettings>('crm-listSettings', {
        showStatus: true, showValue: true, showTags: true, showLastActivity: true, showEmail: true, showPhone: false, showCreatedAt: true,
    });
    const [minimizedLeads, setMinimizedLeads] = useLocalStorage<Id[]>('crm-minimizedLeads', []);
    const [minimizedColumns, setMinimizedColumns] = useLocalStorage<Id[]>('crm-minimizedColumns', []);
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
    
    // Reactivation Task/Notification Effect
    useEffect(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const leadsToNotify = leads.filter(lead => {
            if (!lead.reactivationDate) return false;
            const reactivationDate = new Date(lead.reactivationDate);
            reactivationDate.setHours(0, 0, 0, 0);
            return reactivationDate <= today;
        });

        const newTasks: Task[] = [];
        const newNotifications: NotificationType[] = [];

        leadsToNotify.forEach(lead => {
            const taskExists = tasks.some(task => task.leadId === lead.id && task.title.includes('Reativar contato'));
            if (!taskExists) {
                newTasks.push({
                    id: `task-reactivate-${lead.id}-${Date.now()}`,
                    userId: localUser.id,
                    leadId: lead.id,
                    type: 'task',
                    title: `Reativar contato: ${lead.name}`,
                    description: `Lead perdido por "${lead.lostReason}". Hora de tentar um novo contato.`,
                    dueDate: new Date().toISOString(), // Due today
                    status: 'pending',
                });
                newNotifications.push({
                    id: `notif-reactivate-${lead.id}`,
                    userId: localUser.id,
                    type: 'lead_reactivation',
                    text: `Lembrete para reativar o lead "${lead.name}" hoje.`,
                    link: { view: 'Recuperação', leadId: lead.id },
                    isRead: false,
                    createdAt: new Date().toISOString(),
                });
            }
        });

        if (newTasks.length > 0) {
            setTasks(current => [...current, ...newTasks]);
            setNotifications(current => [...current, ...newNotifications]);
            showNotification(`Você tem ${newTasks.length} lead(s) para reativar hoje.`, 'info');
        }
    }, [leads]);


    // --- COMPUTED DATA & UTILS ---
    const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);
    
    const calculateProbabilityForStage = useCallback((stageId: Id, allColumns: ColumnData[]): number => {
        const stage = allColumns.find(c => c.id === stageId);
        if (!stage) return 0;

        if (stage.type === 'lost') return 0;
        if (stage.type === 'won') return 100;

        const openStages = allColumns.filter(c => c.type === 'open');
        const followUpStages = allColumns.filter(c => c.type === 'follow-up');
        const schedulingStages = allColumns.filter(c => c.type === 'scheduling');

        if (stage.type === 'open') {
            const currentIndex = openStages.findIndex(c => c.id === stageId);
            const total = openStages.length;
            if (total <= 1) return 25; // Midpoint of 10-40 range
            const base = 10;
            const range = 40 - base;
            return Math.round(base + (currentIndex / (total - 1)) * range);
        }

        if (stage.type === 'follow-up') {
            const currentIndex = followUpStages.findIndex(c => c.id === stageId);
            const total = followUpStages.length;
            if (total <= 1) return 60; // Midpoint of 41-80 range
            const base = 41;
            const range = 80 - base;
            return Math.round(base + (currentIndex / (total - 1)) * range);
        }

        if (stage.type === 'scheduling') {
            const currentIndex = schedulingStages.findIndex(c => c.id === stageId);
            const total = schedulingStages.length;
            if (total <= 1) return 90; // Midpoint of 81-99 range
            const base = 81;
            const range = 99 - base;
            return Math.round(base + (currentIndex / (total - 1)) * range);
        }

        return 0;
    }, []);

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
            const oldLead = leads.find(l => l.id === editingLead.id)!;
            const newColumnId = data.columnId || oldLead.columnId;
            const newProbability = calculateProbabilityForStage(newColumnId, columns);
            const updatedLead = { ...oldLead, ...data, probability: newProbability };

            setLeads(current => current.map(lead => lead.id === editingLead.id ? updatedLead : lead));
            showNotification(`Lead "${updatedLead.name}" atualizado.`, 'success');
            createActivityLog(updatedLead.id, 'note', `Lead atualizado.`);
        } else { // CREATE
            const newLead: Lead = {
                id: `lead-${Date.now()}`,
                ...data,
                columnId: data.columnId || columns[0].id,
                name: data.name || 'Novo Lead',
                company: data.company || '',
                value: data.value || 0,
                avatarUrl: data.avatarUrl || `https://i.pravatar.cc/150?u=${Date.now()}`,
                tags: data.tags || [],
                lastActivity: 'agora',
                createdAt: new Date().toISOString(),
            };
            newLead.probability = calculateProbabilityForStage(newLead.columnId, columns);
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

    const handleUpdateLeadColumn = (leadId: Id, newColumnId: Id) => {
        const leadToMove = leads.find(l => l.id === leadId);
        const newColumn = columns.find(c => c.id === newColumnId);
        
        if (!leadToMove || !newColumn) return;

        // Open LostLeadModal if moving to a 'lost' stage
        if (newColumn.type === 'lost' && leadToMove.columnId !== newColumn.id) {
            setLostLeadInfo({ lead: leadToMove, columnId: newColumnId });
            return; 
        }

        setLeads(prevLeads => {
            const newProbability = calculateProbabilityForStage(newColumnId, columns);
            let updatedLead = { ...leadToMove, columnId: newColumnId, lastActivity: 'agora', probability: newProbability };

            // SMART PLAYBOOK LOGIC
            const lastCompletedPlaybook = leadToMove.playbookHistory?.[(leadToMove.playbookHistory?.length || 0) - 1];
            if (lastCompletedPlaybook) {
                const playbookDef = playbooks.find(p => p.id === lastCompletedPlaybook.playbookId);
                if (playbookDef && playbookDef.stages.includes(newColumnId)) {
                    updatedLead.activePlaybook = {
                        playbookId: lastCompletedPlaybook.playbookId,
                        playbookName: lastCompletedPlaybook.playbookName,
                        startedAt: lastCompletedPlaybook.startedAt,
                    };
                    updatedLead.playbookHistory = leadToMove.playbookHistory?.slice(0, -1);
                    showNotification(`Playbook "${updatedLead.activePlaybook.playbookName}" reativado.`, 'info');
                }
            }
            
            if (updatedLead.activePlaybook && !updatedLead.playbookHistory?.some(h => h.playbookId === updatedLead.activePlaybook?.playbookId)) {
                 const playbookDef = playbooks.find(p => p.id === updatedLead.activePlaybook?.playbookId);
                 if (playbookDef && !playbookDef.stages.includes(newColumnId)) {
                     const historyEntry: PlaybookHistoryEntry = {
                         playbookId: updatedLead.activePlaybook.playbookId,
                         playbookName: updatedLead.activePlaybook.playbookName,
                         startedAt: updatedLead.activePlaybook.startedAt,
                         completedAt: new Date().toISOString(),
                     };
                     updatedLead.playbookHistory = [...(updatedLead.playbookHistory || []), historyEntry];
                     updatedLead.activePlaybook = undefined;
                     showNotification(`Playbook "${historyEntry.playbookName}" concluído e arquivado.`, 'info');
                 }
            }

            createActivityLog(leadId, 'status_change', `Movido para "${columns.find(c => c.id === newColumnId)?.title}".`);
            
            // AGENDAMENTO AUTOMATION
            if (newColumn?.type === 'scheduling') {
                const newTask: Task = {
                    id: `task-${Date.now()}`,
                    userId: localUser.id,
                    leadId: leadId,
                    type: 'meeting',
                    title: `Agendar reunião com ${leadToMove.name}`,
                    dueDate: new Date().toISOString(),
                    status: 'pending',
                };
                setTasks(current => [newTask, ...current]);
                showNotification(`Tarefa de reunião criada para "${leadToMove.name}".`, 'success');
            }

            return prevLeads.map(l => l.id === leadId ? updatedLead : l);
        });
    };

     const handleProcessLostLead = (leadId: Id, columnId: Id, reason: string, reactivationDate: string | null) => {
        const newProbability = calculateProbabilityForStage(columnId, columns);
        setLeads(prevLeads => prevLeads.map(l => 
            l.id === leadId 
            ? { 
                ...l, 
                columnId, 
                lostReason: reason, 
                reactivationDate: reactivationDate || undefined, 
                lastActivity: 'agora',
                probability: newProbability,
              } 
            : l
        ));
        const leadName = leads.find(l => l.id === leadId)?.name;
        showNotification(`Lead "${leadName}" movido para Perdido.`, 'info');
        setLostLeadInfo(null);
    };
    
    const handleReactivateLead = (leadId: Id) => {
        const firstColumnId = columns.find(c => c.type === 'open')?.id || columns[0].id;
        setLeads(prevLeads => {
            const leadToUpdate = prevLeads.find(l => l.id === leadId);
            if (!leadToUpdate) return prevLeads;
            
            const newProbability = calculateProbabilityForStage(firstColumnId, columns);
            
            return prevLeads.map(l => 
                l.id === leadId
                ? { ...l, columnId: firstColumnId, lostReason: undefined, reactivationDate: undefined, lastActivity: 'agora', probability: newProbability }
                : l
            );
        });
        const leadName = leads.find(l => l.id === leadId)?.name;
        showNotification(`Lead "${leadName}" reativado!`, 'success');
    };
    
    const handleCardClick = (lead: Lead) => {
        setSelectedLead(lead);
        setSelectedLeadForPlaybookId(lead.id);
    };
    
    // Tasks
    const handleCreateOrUpdateTask = (data: CreateTaskData | UpdateTaskData) => {
        if (editingTask) { // UPDATE
            const updatedTask = { ...tasks.find(t => t.id === editingTask.id)!, ...data };
            setTasks(current => current.map(t => t.id === editingTask.id ? updatedTask : t));
            showNotification('Atividade atualizada.', 'success');
        } else { // CREATE
             const newTask: Task = {
                id: `task-${Date.now()}`,
                userId: localUser.id,
                ...data as CreateTaskData,
             };
             setTasks(current => [newTask, ...current]);
             showNotification('Nova atividade criada.', 'success');
        }
        setCreateTaskModalOpen(false);
        setEditingTask(null);
        setPreselectedDataForTask(null);
    };

    const handleDeleteTask = (taskId: Id) => {
        setTasks(current => current.filter(t => t.id !== taskId));
        showNotification('Atividade deletada.', 'success');
    };
    
    const handleUpdateTaskStatus = (taskId: Id, status: 'pending' | 'completed') => {
        setTasks(prevTasks => {
            const newTasks = prevTasks.map(t => t.id === taskId ? { ...t, status } : t);
            
            const updatedTask = newTasks.find(t => t.id === taskId);
            const lead = leads.find(l => l.id === updatedTask?.leadId);

            if (status === 'completed' && lead && lead.activePlaybook && updatedTask?.playbookId === lead.activePlaybook.playbookId) {
                const playbook = playbooks.find(p => p.id === lead.activePlaybook?.playbookId);
                const tasksForThisPlaybook = newTasks.filter(t => t.leadId === lead.id && t.playbookId === playbook?.id);
                
                if (playbook && tasksForThisPlaybook.length === playbook.steps.length && tasksForThisPlaybook.every(t => t.status === 'completed')) {
                    const currentColumnIndex = columns.findIndex(c => c.id === lead.columnId);
                    const nextColumn = columns[currentColumnIndex + 1];
                    
                    if (nextColumn) {
                        const newProbability = calculateProbabilityForStage(nextColumn.id, columns);
                        const updatedLead = { 
                            ...lead, 
                            columnId: nextColumn.id,
                            probability: newProbability, 
                            activePlaybook: undefined,
                            playbookHistory: [
                                ...(lead.playbookHistory || []),
                                {
                                    playbookId: lead.activePlaybook.playbookId,
                                    playbookName: lead.activePlaybook.playbookName,
                                    startedAt: lead.activePlaybook.startedAt,
                                    completedAt: new Date().toISOString(),
                                }
                            ]
                        };
                        setLeads(prevLeads => prevLeads.map(l => l.id === lead.id ? updatedLead : l));
                        showNotification(`Playbook concluído! Lead movido para "${nextColumn.title}".`, 'success');
                    }
                }
            }

            return newTasks;
        });
    };
    
    // Email Drafts
    const handleSaveDraft = (draftData: CreateEmailDraftData) => {
        const newDraft: EmailDraft = {
            id: `draft-${Date.now()}`,
            createdAt: new Date().toISOString(),
            ...draftData
        };
        setEmailDrafts(current => [newDraft, ...current]);
        showNotification('Rascunho salvo!', 'success');
    };
    
    const handleDeleteDraft = (draftId: Id) => {
        setEmailDrafts(current => current.filter(d => d.id !== draftId));
        showNotification('Rascunho deletado.', 'success');
    };

    // Groups
    const handleCreateOrUpdateGroup = (data: CreateGroupData | UpdateGroupData) => {
        if (editingGroup) {
            setGroups(current => current.map(g => g.id === editingGroup.id ? { ...g, ...data } as Group : g));
            showNotification('Grupo atualizado.', 'success');
        } else {
            const newGroup: Group = { id: `group-${Date.now()}`, ...data as CreateGroupData };
            setGroups(current => [newGroup, ...current]);
            showNotification('Grupo criado.', 'success');
        }
        setGroupModalOpen(false);
        setEditingGroup(null);
    };

    const handleDeleteGroup = (groupId: Id) => {
        setGroups(current => current.filter(g => g.id !== groupId));
        showNotification('Grupo deletado.', 'success');
    };
    
    // Group Analysis
    const handleCreateOrUpdateGroupAnalysis = (data: CreateGroupAnalysisData | UpdateGroupAnalysisData, analysisId?: Id) => {
        if (analysisId) {
             setGroupAnalyses(current => current.map(a => a.id === analysisId ? { ...a, ...data } as GroupAnalysis : a));
             showNotification('Análise atualizada.', 'success');
        } else {
            const newAnalysis: GroupAnalysis = { id: `analysis-${Date.now()}`, createdAt: new Date().toISOString(), ...data as CreateGroupAnalysisData };
            setGroupAnalyses(current => [newAnalysis, ...current]);
            showNotification('Análise salva.', 'success');
        }
    };
    
    const handleDeleteGroupAnalysis = (analysisId: Id) => {
        setGroupAnalyses(current => current.filter(a => a.id !== analysisId));
        showNotification('Análise descartada.', 'success');
    };
    
    // Notifications
    const handleMarkNotificationAsRead = (id: Id) => {
        setNotifications(current => current.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    const handleMarkAllNotificationsRead = () => {
        setNotifications(current => current.map(n => ({ ...n, isRead: true })));
    };
    
    const handleClearAllNotifications = () => {
        setNotifications([]);
        showNotification('Todas as notificações foram limpas.', 'info');
    };
    
    // Pipeline settings
    const handleUpdatePipeline = (newColumns: ColumnData[]) => {
        setColumns(newColumns);
        setLeads(currentLeads => 
            currentLeads.map(lead => ({
                ...lead,
                probability: calculateProbabilityForStage(lead.columnId, newColumns)
            }))
        );
        showNotification('Pipeline atualizado.', 'success');
    };
    
    // Card/List Display Toggles
    const onToggleLeadMinimize = useCallback((leadId: Id) => {
        setMinimizedLeads(prev => (prev || []).includes(leadId) ? (prev || []).filter(id => id !== leadId) : [...(prev || []), leadId]);
    }, [setMinimizedLeads]);

    const onToggleColumnMinimize = useCallback((columnId: Id) => {
        setMinimizedColumns(prev => (prev || []).includes(columnId) ? (prev || []).filter(id => id !== columnId) : [...(prev || []), columnId]);
    }, [setMinimizedColumns]);
    
    // Playbook handlers
    const handleApplyPlaybook = (playbookId: Id) => {
        const playbook = playbooks.find(p => p.id === playbookId);
        const lead = leads.find(l => l.id === selectedLeadForPlaybookId);

        if (!playbook || !lead) {
            showNotification('Erro ao aplicar playbook.', 'error');
            return;
        }
        
        if (lead.activePlaybook) {
            showNotification('Este lead já possui um playbook ativo.', 'error');
            return;
        }

        const newTasks: Task[] = playbook.steps.map((step, index) => {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + step.day);
            return {
                id: `task-${Date.now()}-${index}`,
                userId: localUser.id,
                leadId: lead.id,
                type: step.type,
                title: step.instructions,
                dueDate: dueDate.toISOString(),
                status: 'pending',
                playbookId: playbook.id,
                playbookStepIndex: index,
            };
        });

        setTasks(current => [...current, ...newTasks]);
        
        setLeads(current => current.map(l => l.id === lead.id ? { 
            ...l, 
            activePlaybook: { 
                playbookId: playbook.id, 
                playbookName: playbook.name,
                startedAt: new Date().toISOString(),
            } 
        } : l));
        
        showNotification(`Playbook "${playbook.name}" aplicado com sucesso.`, 'success');
        setPlaybookModalOpen(false);
        setSelectedLeadForPlaybookId(null);
    };

    const handleUpdatePlaybooks = (updatedPlaybooks: Playbook[]) => {
        setPlaybooks(updatedPlaybooks);
        showNotification('Playbooks salvos com sucesso.', 'success');
    };
    
    // PDF Export
    const handleExportPDF = useCallback((leadsToExport: Lead[]) => {
        setLeadsToPrint(leadsToExport);
    }, []);

    const handlePrintEnd = useCallback(() => {
        setLeadsToPrint(null);
    }, []);

    const renderView = () => {
        const groupForView = groups.find(g => g.id === selectedGroupForView);
        if (selectedGroupForView && groupForView) {
            const leadsForGroup = leads.filter(l => l.groupInfo?.groupId === selectedGroupForView);
            return <GroupsView 
                        group={groupForView} 
                        leads={leadsForGroup}
                        analysis={analysisForGroup}
                        onUpdateLead={(leadId, updates) => setLeads(current => current.map(l => l.id === leadId ? {...l, ...updates} : l))}
                        onBack={() => setSelectedGroupForView(null)} 
                        onCreateOrUpdateAnalysis={handleCreateOrUpdateGroupAnalysis}
                        onDeleteAnalysis={handleDeleteGroupAnalysis}
                        showNotification={showNotification}
                   />;
        }
        
        switch (activeView) {
            case 'Dashboard':
                return <Dashboard leads={filteredLeads} columns={columns} activities={activities} tasks={tasks} onNavigate={setActiveView} />;
            case 'Pipeline':
                return <KanbanBoard 
                            columns={columns} 
                            leads={filteredLeads} 
                            users={users} 
                            onUpdateLeadColumn={handleUpdateLeadColumn} 
                            onSelectLead={handleCardClick}
                            selectedLeadId={selectedLeadForPlaybookId}
                            onAddLead={(columnId) => { setEditingLead(null); setCreateLeadModalOpen(true); }}
                            cardDisplaySettings={cardDisplaySettings}
                            onUpdateCardSettings={setCardDisplaySettings}
                            minimizedLeads={minimizedLeads}
                            onToggleLeadMinimize={onToggleLeadMinimize}
                            minimizedColumns={minimizedColumns}
                            onToggleColumnMinimize={onToggleColumnMinimize}
                            isPlaybookActionEnabled={!!selectedLeadForPlaybookId}
                            onApplyPlaybookClick={() => setPlaybookModalOpen(true)}
                        />;
            case 'Playbooks':
                 return <PlaybookSettings initialPlaybooks={playbooks} pipelineColumns={columns} onSave={handleUpdatePlaybooks} />;
            case 'Leads':
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
                            onOpenCreateLeadModal={() => { setEditingLead(null); setCreateLeadModalOpen(true); }}
                            onOpenCreateTaskModal={() => { setEditingTask(null); setCreateTaskModalOpen(true); }}
                        />;
            case 'Clientes':
                 const clientes = filteredLeads.filter(l => columns.find(c => c.id === l.columnId)?.type === 'won');
                 return <LeadListView 
                            leads={clientes} 
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
                            onExportPDF={() => handleExportPDF(clientes)}
                            onOpenCreateLeadModal={() => { setEditingLead(null); setCreateLeadModalOpen(true); }}
                            onOpenCreateTaskModal={() => { setEditingTask(null); setCreateTaskModalOpen(true); }}
                        />;
            case 'Tarefas':
                return <ActivitiesView 
                            tasks={tasks} 
                            leads={leads} 
                            onEditTask={(task) => { setEditingTask(task); setCreateTaskModalOpen(true); }}
                            onDeleteTask={handleDeleteTask}
                            onUpdateTaskStatus={handleUpdateTaskStatus}
                        />;
            case 'Calendário':
                return <CalendarPage 
                            tasks={tasks} 
                            leads={leads}
                            onNewActivity={(date) => { setPreselectedDataForTask({ leadId: leads[0]?.id, date }); setEditingTask(null); setCreateTaskModalOpen(true); }}
                            onEditActivity={(task) => { setEditingTask(task); setCreateTaskModalOpen(true); }}
                            onDeleteTask={handleDeleteTask}
                            onUpdateTaskStatus={handleUpdateTaskStatus}
                        />;
            case 'Relatórios':
                return <ReportsPage leads={leads} columns={columns} tasks={tasks} activities={activities} />;
            case 'Recuperação':
                const recoveryLeads = leads.filter(l => l.reactivationDate && columns.some(c => c.id === l.columnId && c.type === 'lost'));
                return <RecoveryView 
                            leads={recoveryLeads}
                            onReactivateLead={handleReactivateLead}
                            onExportPDF={handleExportPDF}
                            onDeleteLead={handleDeleteLead}
                        />;
            case 'Chat':
                return <ChatView
                            conversations={conversations}
                            messages={messages}
                            leads={leads}
                            currentUser={localUser}
                            onSendMessage={(convId, text, channel, leadId) => setMessages(curr => [...curr, {id: `msg-${Date.now()}`, conversationId: convId, senderId: localUser.id, text, timestamp: new Date().toISOString(), channel}])}
                            onUpdateConversationStatus={(convId, status) => setConversations(curr => curr.map(c => c.id === convId ? {...c, status} : c))}
                            showNotification={showNotification}
                        />
            case 'Grupos':
                return <GroupsDashboard 
                            groups={groups} 
                            leads={leads}
                            onSelectGroup={setSelectedGroupForView}
                            onAddGroup={() => { setEditingGroup(null); setGroupModalOpen(true); }}
                            onEditGroup={(group) => { setEditingGroup(group); setGroupModalOpen(true); }}
                            onDeleteGroup={handleDeleteGroup}
                        />;
            case 'Integrações':
                return <IntegrationsPage showNotification={showNotification} />;
            case 'Notificações':
                 return <NotificationsView
                            notifications={notifications}
                            onMarkAsRead={handleMarkNotificationAsRead}
                            onMarkAllAsRead={handleMarkAllNotificationsRead}
                            onClearAll={handleClearAllNotifications}
                            onNavigate={(link) => {
                                if (link?.view) setActiveView(link.view);
                                if (link?.leadId) {
                                    const leadToSelect = leads.find(l => l.id === link.leadId);
                                    if(leadToSelect) setSelectedLead(leadToSelect);
                                }
                            }}
                        />;
            case 'Configurações':
                return <SettingsPage
                            currentUser={localUser}
                            columns={columns}
                            onUpdateProfile={() => showNotification("Perfil atualizado!", "success")}
                            onUpdatePipeline={handleUpdatePipeline}
                        />;
            default:
                return <div>Página não encontrada</div>;
        }
    };

    if (leadsToPrint) {
        return <PrintableLeadsReport leads={leadsToPrint} tasks={tasks} activities={activities} onPrintEnd={handlePrintEnd} />;
    }

    return (
        <div className={`flex h-screen bg-gray-100 dark:bg-zinc-800 text-zinc-900 dark:text-gray-200 transition-colors`}>
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
                    onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    unreadCount={unreadCount}
                />
                <main className="flex-1 overflow-y-auto p-6">
                    {renderView()}
                </main>
            </div>

            {/* Modals and Slideovers */}
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
                        onAddNote={(note) => createActivityLog(selectedLead.id, 'note', note)}
                        onSendEmailActivity={(subject) => createActivityLog(selectedLead.id, 'email_sent', `Email enviado: "${subject}"`)}
                        onAddTask={() => { setPreselectedDataForTask({ leadId: selectedLead.id }); setEditingTask(null); setCreateTaskModalOpen(true); }}
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
                {(isCreateTaskModalOpen || editingTask || preselectedDataForTask) && (
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
                {(isGroupModalOpen || editingGroup) && (
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
                        onSubmit={(reason, date) => handleProcessLostLead(lostLeadInfo.lead.id, lostLeadInfo.columnId, reason, date)}
                    />
                )}
            </AnimatePresence>


            {/* Global UI */}
            <AnimatePresence>
                {notification && (
                    <Notification
                        message={notification.message}
                        type={notification.type}
                        onClose={() => setNotification(null)}
                    />
                )}
            </AnimatePresence>
            
            <FAB onOpenCreateLeadModal={() => { setEditingLead(null); setCreateLeadModalOpen(true); }} onOpenCreateTaskModal={() => { setEditingTask(null); setCreateTaskModalOpen(true); }} />
        </div>
    );
};

export default App;