import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { User, ColumnData, Lead, Activity, Task, Id, CreateLeadData, UpdateLeadData, CreateTaskData, UpdateTaskData, CardDisplaySettings, ListDisplaySettings, Tag, EmailDraft, ChatConversation, ChatMessage, Group, CreateGroupData, UpdateGroupData, GroupAnalysis, CreateGroupAnalysisData, UpdateGroupAnalysisData, Notification as NotificationType, Playbook, PlaybookHistoryEntry, Board } from '@/shared/types';
import { initialTags, initialLeads, initialTasks, initialActivities, initialUsers, initialGroups, initialConversations, initialMessages, initialNotifications, initialPlaybooks, initialBoards } from '@/data';

// --- Local Storage Hook (Optimized with Debounce) ---
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

    // Use a ref to track the latest value for the effect without triggering it
    const valueRef = useRef(storedValue);
    valueRef.current = storedValue;

    useEffect(() => {
        const handler = setTimeout(() => {
            try {
                window.localStorage.setItem(key, JSON.stringify(valueRef.current));
            } catch (error) {
                console.error('Error saving to localStorage:', error);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(handler);
    }, [key, storedValue]);

    return [storedValue, setStoredValue];
}

export const localUser: User = {
    id: 'local-user',
    name: 'Usuário Local',
    email: 'user@local.com',
    role: 'Admin',
    joinedAt: new Date().toISOString()
};

export function useAppState() {
    // --- STATE MANAGEMENT (LOCAL STORAGE) ---
    const [users, setUsers] = useLocalStorage<User[]>('crm-users', initialUsers);
    const [boards, setBoards] = useLocalStorage<Board[]>('crm-boards', initialBoards);
    const [activeBoardId, setActiveBoardId] = useLocalStorage<Id>('crm-active-board', initialBoards[0].id);

    const activeBoard = useMemo(() => boards.find(b => b.id === activeBoardId) || boards[0], [boards, activeBoardId]);
    const columns = activeBoard.columns;

    const setColumns = useCallback((newColumnsOrUpdater: ColumnData[] | ((prev: ColumnData[]) => ColumnData[])) => {
        setBoards(currentBoards => {
            return currentBoards.map(board => {
                if (board.id === activeBoardId) {
                    const newColumns = typeof newColumnsOrUpdater === 'function'
                        ? newColumnsOrUpdater(board.columns)
                        : newColumnsOrUpdater;
                    return { ...board, columns: newColumns };
                }
                return board;
            });
        });
    }, [activeBoardId, setBoards]);

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

    const [activeView, setActiveView] = useState('Inbox');
    const [inboxMode, setInboxMode] = useState<'standard' | 'analysis'>('standard');
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
    const [isSdrBotOpen, setSdrBotOpen] = useState(false);
    const [isCreateBoardModalOpen, setCreateBoardModalOpen] = useState(false);
    const [settingsTab, setSettingsTab] = useState<string | undefined>(undefined);

    // Notification State
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

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

    const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => setNotification({ message, type }), []);

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

    // Switch to standard inbox mode when leaving Inbox view
    useEffect(() => {
        if (activeView !== 'Inbox') {
            setInboxMode('standard');
        }
    }, [activeView]);

    // Helper for AI check
    const checkAiConfiguration = () => {
        const config = localStorage.getItem('crm-ai-config');
        if (config) {
            const parsed = JSON.parse(config);
            return !!parsed.apiKey;
        }
        return false;
    };

    const handleOpenSdrBot = () => {
        setSdrBotOpen(true);
    };

    const isAiConfigured = checkAiConfiguration();

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
                    dueDate: new Date().toISOString(),
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
    }, [leads, setTasks, setNotifications, showNotification]);

    // --- COMPUTED DATA & UTILS ---
    const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

    const calculateProbabilityForStage = useCallback((stageId: Id, allColumns: ColumnData[]): number => {
        const stage = allColumns.find(c => c.id === stageId);
        if (!stage) return 0;

        if (stage.type === 'lost') return 0;
        if (stage.type === 'won') return 100;

        const openStages = allColumns.filter(c => c.type === 'open' || c.type === 'qualification');
        const followUpStages = allColumns.filter(c => c.type === 'follow-up');
        const schedulingStages = allColumns.filter(c => c.type === 'scheduling');

        if (stage.type === 'open' || stage.type === 'qualification') {
            const currentIndex = openStages.findIndex(c => c.id === stageId);
            const total = openStages.length;
            if (total <= 1) return 25;
            const base = 10;
            const range = 40;
            return Math.round(base + (currentIndex / (total - 1)) * range);
        }

        if (stage.type === 'follow-up') {
            const currentIndex = followUpStages.findIndex(c => c.id === stageId);
            const total = followUpStages.length;
            if (total <= 1) return 60;
            const base = 41;
            const range = 39;
            return Math.round(base + (currentIndex / (total - 1)) * range);
        }

        if (stage.type === 'scheduling') {
            const currentIndex = schedulingStages.findIndex(c => c.id === stageId);
            const total = schedulingStages.length;
            if (total <= 1) return 90;
            const base = 81;
            const range = 18;
            return Math.round(base + (currentIndex / (total - 1)) * range);
        }

        return 0;
    }, []);

    const searchedLeads = useMemo(() => {
        const searchLower = searchQuery.toLowerCase();
        const boardLeads = leads.filter(l => l.boardId === activeBoardId || (!l.boardId && activeBoardId === 'board-sales'));

        const filtered = boardLeads.filter(lead =>
            lead.name.toLowerCase().includes(searchLower) ||
            lead.company.toLowerCase().includes(searchLower) ||
            (lead.email && lead.email.toLowerCase().includes(searchLower))
        );

        if (activeView === 'Leads' || activeView === 'Clientes') {
            return filtered.filter(lead => {
                const statusMatch = listStatusFilter === 'all' || lead.status === listStatusFilter;
                const tagMatch = listSelectedTags.length === 0 || listSelectedTags.every(st => lead.tags.some(lt => lt.id === st.id));
                return statusMatch && tagMatch;
            });
        }
        return filtered;
    }, [leads, searchQuery, activeView, listStatusFilter, listSelectedTags, activeBoardId]);

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
        const now = new Date().toISOString();
        if (editingLead && editingLead.id) { // UPDATE
            const oldLead = leads.find(l => l.id === editingLead.id)!;
            const newColumnId = data.columnId || oldLead.columnId;
            const newProbability = calculateProbabilityForStage(newColumnId, columns);
            const updatedLead = { ...oldLead, ...data, probability: newProbability, lastActivity: 'agora', lastActivityTimestamp: now };

            setLeads(current => current.map(lead => lead.id === editingLead.id ? updatedLead : lead));
            showNotification(`Lead "${updatedLead.name}" atualizado.`, 'success');
            createActivityLog(updatedLead.id, 'note', `Lead atualizado.`);
        } else { // CREATE
            const newLead: Lead = {
                id: `lead-${Date.now()}`,
                ...data,
                boardId: activeBoardId,
                columnId: data.columnId || columns[0].id,
                name: data.name || 'Novo Lead',
                company: data.company || '',
                value: data.value || 0,
                avatarUrl: data.avatarUrl || `https://i.pravatar.cc/150?u=${Date.now()}`,
                tags: data.tags || [],
                lastActivity: 'agora',
                lastActivityTimestamp: now,
                createdAt: now,
                qualificationStatus: 'pending',
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

    const handleUpdateLeadColumn = (leadId: Id, newColumnId: Id, isAutomated: boolean = false) => {
        const leadToMove = leads.find(l => l.id === leadId);
        const newColumn = columns.find(c => c.id === newColumnId);
        const oldColumn = columns.find(c => c.id === leadToMove?.columnId);

        if (!leadToMove || !newColumn) return;

        // --- LOST LEAD MODAL ---
        if (newColumn.type === 'lost' && leadToMove.columnId !== newColumn.id) {
            setLostLeadInfo({ lead: leadToMove, columnId: newColumnId });
            return;
        }

        // --- DIRECT MOVE ---
        const now = new Date().toISOString();
        const newProbability = calculateProbabilityForStage(newColumnId, columns);
        let updatedLead = { ...leadToMove, columnId: newColumnId, lastActivity: 'agora', lastActivityTimestamp: now, probability: newProbability };

        // --- PLAYBOOK LOGIC ---
        if (updatedLead.activePlaybook && !updatedLead.playbookHistory?.some(h => h.playbookId === updatedLead.activePlaybook?.playbookId)) {
            const playbookDef = playbooks.find(p => p.id === updatedLead.activePlaybook?.playbookId);
            if (playbookDef && !playbookDef.stages.includes(newColumnId)) {
                const historyEntry: PlaybookHistoryEntry = {
                    playbookId: updatedLead.activePlaybook.playbookId,
                    playbookName: updatedLead.activePlaybook.playbookName,
                    startedAt: updatedLead.activePlaybook.startedAt,
                    completedAt: now,
                };
                updatedLead.playbookHistory = [...(updatedLead.playbookHistory || []), historyEntry];
                updatedLead.activePlaybook = undefined;

                setTasks(currentTasks => currentTasks.filter(task =>
                    !(task.leadId === updatedLead.id && task.playbookId === historyEntry.playbookId && task.status === 'pending')
                ));
            }
        }

        // Re-activate a playbook if moving back to its stage
        const lastCompletedPlaybook = updatedLead.playbookHistory?.[updatedLead.playbookHistory.length - 1];
        if (lastCompletedPlaybook) {
            const playbookDef = playbooks.find(p => p.id === lastCompletedPlaybook.playbookId);
            if (playbookDef?.stages.includes(newColumnId)) {
                updatedLead.activePlaybook = {
                    playbookId: lastCompletedPlaybook.playbookId,
                    playbookName: lastCompletedPlaybook.playbookName,
                    startedAt: lastCompletedPlaybook.startedAt,
                };
                updatedLead.playbookHistory = updatedLead.playbookHistory?.slice(0, -1);
                showNotification(`Playbook "${updatedLead.activePlaybook.playbookName}" reativado.`, 'info');
            }
        }

        // AUTOMATION: Create a task when moving to "Agendamento"
        if (newColumn.type === 'scheduling' && oldColumn?.type !== 'scheduling') {
            const newTask: Task = {
                id: `task-sched-${updatedLead.id}-${Date.now()}`,
                userId: localUser.id,
                leadId: updatedLead.id,
                type: 'meeting',
                title: `Agendar reunião com ${updatedLead.name}`,
                description: 'Lead movido para o estágio de agendamento.',
                dueDate: new Date().toISOString(),
                status: 'pending',
            };
            setTasks(current => [newTask, ...current]);
            showNotification(`Tarefa de agendamento criada para ${updatedLead.name}.`, 'info');
        }

        setLeads(current => current.map(l => l.id === leadId ? updatedLead : l));
        if (oldColumn && oldColumn.id !== newColumn.id && !isAutomated) {
            createActivityLog(leadId, 'status_change', `Movido de "${oldColumn.title}" para "${newColumn.title}".`);
        }
    };

    const handleProcessLostLead = (reason: string, reactivationDate: string | null) => {
        if (!lostLeadInfo) return;
        const { lead, columnId } = lostLeadInfo;
        const now = new Date().toISOString();
        const newProbability = calculateProbabilityForStage(columnId, columns);

        const updatedLead = {
            ...lead,
            columnId,
            lastActivity: 'agora',
            lastActivityTimestamp: now,
            probability: newProbability,
            lostReason: reason,
            reactivationDate: reactivationDate ? new Date(reactivationDate).toISOString() : undefined,
        };

        setLeads(current => current.map(l => (l.id === lead.id ? updatedLead : l)));
        createActivityLog(lead.id, 'status_change', `Lead movido para "${columns.find(c => c.id === columnId)?.title}" (Motivo: ${reason}).`);
        setLostLeadInfo(null);
    };

    const handleReactivateLead = (leadId: Id) => {
        const lead = leads.find(l => l.id === leadId);
        if (!lead) return;

        const firstColumn = columns.find(c => c.type === 'open' || c.type === 'qualification') || columns[0];

        const updatedLead = {
            ...lead,
            columnId: firstColumn.id,
            lostReason: undefined,
            reactivationDate: undefined,
            lastActivity: 'agora',
            lastActivityTimestamp: new Date().toISOString(),
        };
        updatedLead.probability = calculateProbabilityForStage(updatedLead.columnId, columns);

        setLeads(current => current.map(l => (l.id === leadId ? updatedLead : l)));
        showNotification(`Lead "${lead.name}" foi reativado!`, 'success');
        createActivityLog(leadId, 'status_change', `Lead reativado da lista de recuperação.`);
    };

    // Tasks
    const handleCreateOrUpdateTask = (data: CreateTaskData | UpdateTaskData) => {
        if (editingTask && editingTask.id) { // Update
            const updatedTask: Task = { ...editingTask, ...data };
            setTasks(current => current.map(t => t.id === editingTask.id ? updatedTask : t));
            showNotification(`Tarefa "${updatedTask.title}" atualizada.`, 'success');
        } else { // Create
            const newTask: Task = {
                id: `task-${Date.now()}`,
                userId: localUser.id,
                ...data as CreateTaskData
            };
            setTasks(current => [newTask, ...current]);
            showNotification(`Tarefa "${newTask.title}" criada.`, 'success');
        }
        setCreateTaskModalOpen(false);
        setEditingTask(null);
        setPreselectedDataForTask(null);
    };

    const handleDeleteTask = (taskId: Id) => {
        setTasks(current => current.filter(t => t.id !== taskId));
        showNotification('Tarefa deletada.', 'success');
    };

    const handleUpdateTaskStatus = (taskId: Id, status: 'pending' | 'completed') => {
        let leadToMove: Lead | null = null;
        let targetColumnId: Id | null = null;

        setTasks(current => {
            const updatedTasks = current.map(task => {
                if (task.id === taskId) {
                    const updatedTask = { ...task, status };

                    const lead = leads.find(l => l.id === task.leadId);
                    if (lead?.activePlaybook && task.playbookId === lead.activePlaybook.playbookId) {
                        const playbook = playbooks.find(p => p.id === task.playbookId);
                        if (playbook) {
                            const allPlaybookTasks = current.filter(t => t.leadId === lead.id && t.playbookId === playbook.id);
                            const otherTasks = allPlaybookTasks.filter(t => t.id !== taskId);

                            const areAllOtherTasksCompleted = otherTasks.every(t => t.status === 'completed');

                            if (status === 'completed' && areAllOtherTasksCompleted) {
                                const currentStageIndex = columns.findIndex(c => c.id === lead.columnId);
                                const nextColumn = columns[currentStageIndex + 1];
                                if (nextColumn) {
                                    leadToMove = lead;
                                    targetColumnId = nextColumn.id;
                                }
                            }
                        }
                    }
                    return updatedTask;
                }
                return task;
            });
            return updatedTasks;
        });

        if (leadToMove && targetColumnId) {
            handleUpdateLeadColumn(leadToMove.id, targetColumnId, true);
        }
    };

    // Playbooks
    const handleSelectLeadForPlaybook = (leadId: Id) => {
        if (selectedLeadForPlaybookId === leadId) {
            setSelectedLeadForPlaybookId(null);
        } else {
            setSelectedLeadForPlaybookId(leadId);
        }
    };

    const handleApplyPlaybook = (playbookId: Id) => {
        if (!selectedLeadForPlaybook) return;

        const playbook = playbooks.find(p => p.id === playbookId);
        if (!playbook) return;

        const now = new Date();
        const newTasks: Task[] = playbook.steps.map((step, index) => {
            const dueDate = new Date(now);
            dueDate.setDate(now.getDate() + step.day);
            return {
                id: `task-pb-${selectedLeadForPlaybook.id}-${playbookId}-${index}-${Date.now()}`,
                userId: localUser.id,
                leadId: selectedLeadForPlaybook.id,
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
        showNotification(`Playbook "${playbook.name}" aplicado a ${updatedLead.name}.`, 'success');
        setPlaybookModalOpen(false);
        setSelectedLeadForPlaybookId(null);
    };

    const handleDeactivatePlaybook = (leadId: Id) => {
        const lead = leads.find(l => l.id === leadId);
        if (!lead || !lead.activePlaybook) return;

        const playbookId = lead.activePlaybook.playbookId;

        setTasks(current => current.filter(task =>
            !(task.leadId === leadId && task.playbookId === playbookId && task.status === 'pending')
        ));

        const { activePlaybook, ...restOfLead } = lead;
        const updatedLead = restOfLead;

        setLeads(current => current.map(l => (l.id === leadId ? updatedLead : l)));
        setSelectedLead(updatedLead);
        showNotification(`Cadência desativada para ${lead.name}.`, 'info');
    };

    // Groups
    const handleCreateOrUpdateGroup = (data: CreateGroupData | UpdateGroupData) => {
        if (editingGroup && editingGroup.id) { // UPDATE
            const updatedGroup: Group = { ...editingGroup, ...data };
            setGroups(current => current.map(g => g.id === editingGroup.id ? updatedGroup : g));
            showNotification(`Grupo "${updatedGroup.name}" atualizado.`, 'success');
        } else { // CREATE
            const newGroup: Group = { id: `group-${Date.now()}`, ...data as CreateGroupData };
            setGroups(current => [newGroup, ...current]);
            showNotification(`Grupo "${newGroup.name}" criado.`, 'success');
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
            setGroupAnalyses(current => current.map(a => a.id === analysisId ? { ...a, ...data } : a));
            showNotification('Análise atualizada.', 'success');
        } else {
            const newAnalysis: GroupAnalysis = {
                id: `analysis-${Date.now()}`,
                createdAt: new Date().toISOString(),
                ...data as CreateGroupAnalysisData
            };
            // FIX: Type assertion to ensure 'groupId' exists on 'data' in the creation path.
            setGroupAnalyses(current => [...current.filter(a => a.groupId !== (data as CreateGroupAnalysisData).groupId), newAnalysis]);
            showNotification('Análise salva.', 'success');
        }
    };

    const handleDeleteGroupAnalysis = (analysisId: Id) => {
        setGroupAnalyses(current => current.filter(a => a.id !== analysisId));
        showNotification('Rascunho da análise descartado.', 'info');
    };

    const handleExportPDF = (leadsToExport: Lead[]) => {
        setLeadsToPrint(leadsToExport);
    };

    const handleCreateBoard = (newBoardData: Omit<Board, 'id'>) => {
        const newBoard: Board = {
            id: `board-${Date.now()}`,
            ...newBoardData,
            isDefault: false
        };
        setBoards(prev => [...prev, newBoard]);
        setActiveBoardId(newBoard.id);
        showNotification(`Board "${newBoard.name}" criado com sucesso!`, 'success');
    };

    const handleResetApplication = () => {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('crm-')) {
                localStorage.removeItem(key);
            }
        });
        window.location.reload();
    };

    const handleCardClick = (lead: Lead) => {
        setSelectedLead(lead);
        setSelectedLeadForPlaybookId(lead.id);
    };

    const handleStartAnalysis = () => {
        setActiveView('Inbox');
        setInboxMode('analysis');
    };

    return {
        // Data (localStorage)
        users, setUsers,
        boards, setBoards,
        activeBoardId, setActiveBoardId,
        activeBoard,
        columns, setColumns,
        leads, setLeads,
        activities, setActivities,
        tasks, setTasks,
        tags, setTags,
        emailDrafts, setEmailDrafts,
        conversations, setConversations,
        messages, setMessages,
        groups, setGroups,
        groupAnalyses, setGroupAnalyses,
        notifications, setNotifications,
        playbooks, setPlaybooks,
        // UI state
        activeView, setActiveView,
        inboxMode, setInboxMode,
        isSidebarCollapsed, setSidebarCollapsed,
        searchQuery, setSearchQuery,
        theme, setTheme,
        isChatEnabled, setIsChatEnabled,
        // Modal states
        selectedLead, setSelectedLead,
        isCreateLeadModalOpen, setCreateLeadModalOpen,
        editingLead, setEditingLead,
        isCreateTaskModalOpen, setCreateTaskModalOpen,
        editingTask, setEditingTask,
        preselectedDataForTask, setPreselectedDataForTask,
        isGroupModalOpen, setGroupModalOpen,
        editingGroup, setEditingGroup,
        lostLeadInfo, setLostLeadInfo,
        isSdrBotOpen, setSdrBotOpen,
        isCreateBoardModalOpen, setCreateBoardModalOpen,
        settingsTab, setSettingsTab,
        notification, setNotification,
        selectedLeadForPlaybookId, setSelectedLeadForPlaybookId,
        isPlaybookModalOpen, setPlaybookModalOpen,
        selectedLeadForPlaybook,
        leadsToPrint, setLeadsToPrint,
        // Display settings
        cardDisplaySettings, setCardDisplaySettings,
        listDisplaySettings, setListDisplaySettings,
        minimizedLeads, setMinimizedLeads,
        minimizedColumns, setMinimizedColumns,
        listSelectedTags, setListSelectedTags,
        listStatusFilter, setListStatusFilter,
        selectedGroupForView, setSelectedGroupForView,
        // Computed
        unreadCount,
        searchedLeads,
        analysisForGroup,
        isAiConfigured,
        // Handlers
        showNotification,
        handleOpenSdrBot,
        createActivityLog,
        calculateProbabilityForStage,
        handleCreateOrUpdateLead,
        handleDeleteLead,
        handleUpdateLeadColumn,
        handleProcessLostLead,
        handleReactivateLead,
        handleCreateOrUpdateTask,
        handleDeleteTask,
        handleUpdateTaskStatus,
        handleSelectLeadForPlaybook,
        handleApplyPlaybook,
        handleDeactivatePlaybook,
        handleCreateOrUpdateGroup,
        handleDeleteGroup,
        handleCreateOrUpdateGroupAnalysis,
        handleDeleteGroupAnalysis,
        handleExportPDF,
        handleCreateBoard,
        handleResetApplication,
        handleCardClick,
        handleStartAnalysis,
    };
}

export type AppState = ReturnType<typeof useAppState>;
