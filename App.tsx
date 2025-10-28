import React from 'react';
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { AnimatePresence } from 'framer-motion';

import * as api from './api';
import { isSupabaseConfigured } from './services/supabaseClient';
import type { Id, ColumnData, Lead, CreateLeadData, UpdateLeadData, User, Activity, Task, CreateTaskData, UpdateTaskData, Tag, CardDisplaySettings } from './types';
import { initialColumns, initialLeads, initialActivities, initialUsers, initialTasks, initialTags } from './data';


import Sidebar from './components/Sidebar';
import KanbanBoard from './components/KanbanBoard';
import Card from './components/Card';
import LeadDetailSlideover from './components/LeadDetailSlideover';
import CreateEditLeadModal from './components/CreateEditLeadModal';
import CreateEditTaskModal from './components/CreateEditTaskModal';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Register from './components/Register';
import { Loader2, Columns, Users, Contact, Plus, Activity as ActivityIcon, Settings, Calendar, BarChart } from 'lucide-react';
import LeadListView from './components/LeadListView';
import ActivitiesView from './components/ActivitiesView';
import ConfigurationNotice from './components/ConfigurationNotice';
import SettingsPage from './components/SettingsPage';
import CalendarPage from './components/CalendarPage';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import Notification from './components/Notification';
import PipelineHeader from './components/PipelineHeader';
import ReportsPage from './components/ReportsPage';


type AuthView = 'login' | 'register';
type NotificationType = 'success' | 'error' | 'info';
interface NotificationData {
  message: string;
  type: NotificationType;
}

const initialCardDisplaySettings: CardDisplaySettings = {
  showCompany: true,
  showValue: true,
  showTags: true,
  showProbability: true,
  showDueDate: true,
  showAssignedTo: true,
  showEmail: false,
  showPhone: false,
  showCreatedAt: false,
  showStage: false,
};


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [authView, setAuthView] = React.useState<AuthView>('login');
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = React.useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = React.useState(true);


  const [columns, setColumns] = React.useState<ColumnData[]>([]);
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [activities, setActivities] = React.useState<Activity[]>([]);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [users, setUsers] = React.useState<User[]>([]);
  const [tags, setTags] = React.useState<Tag[]>([]);
  const [isDataLoading, setIsDataLoading] = React.useState(true);
  
  const [notification, setNotification] = React.useState<NotificationData | null>(null);
  const notificationTimerRef = React.useRef<number | null>(null);

  const [isCreateEditLeadModalOpen, setCreateEditLeadModalOpen] = React.useState(false);
  const [editingLead, setEditingLead] = React.useState<Lead | null>(null);
  const [leadToDelete, setLeadToDelete] = React.useState<Lead | null>(null);

  const [isCreateEditTaskModalOpen, setCreateEditTaskModalOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);
  const [preselectedLeadIdForTask, setPreselectedLeadIdForTask] = React.useState<Id | null>(null);
  const [preselectedDateForTask, setPreselectedDateForTask] = React.useState<string | null>(null);
  
  const [activeView, setActiveView] = React.useState('Dashboard');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  const [cardDisplaySettings, setCardDisplaySettings] = React.useState<CardDisplaySettings>(initialCardDisplaySettings);


  const showNotification = React.useCallback((message: string, type: NotificationType = 'info') => {
      if (notificationTimerRef.current) {
          clearTimeout(notificationTimerRef.current);
      }
      setNotification({ message, type });
      notificationTimerRef.current = window.setTimeout(() => {
          setNotification(null);
      }, 5000);
  }, []);

  React.useEffect(() => {
    if (!isSupabaseConfigured) {
      setCurrentUser({ id: 'mock-user', name: 'Juliano', email: 'jukasalleso@gmail.com', avatarUrl: 'https://i.pravatar.cc/150?u=juliano' });
      setIsAuthLoading(false);
      return;
    }
    const checkSession = async () => {
      try {
        const user = await api.getCurrentUser();
        setCurrentUser(user);
      } catch (e) {
        // No active session
      } finally {
        setIsAuthLoading(false);
      }
    };
    checkSession();
  }, []);

  React.useEffect(() => {
    if (!currentUser) {
      setColumns([]);
      setLeads([]);
      setActivities([]);
      setTasks([]);
      setUsers([]);
      setTags([]);
      setIsDataLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      setIsDataLoading(true);

      const storedLeads = localStorage.getItem('fity_crm_leads');
      const storedColumns = localStorage.getItem('fity_crm_columns');
      const storedActivities = localStorage.getItem('fity_crm_activities');
      const storedTasks = localStorage.getItem('fity_crm_tasks');
      const storedUsers = localStorage.getItem('fity_crm_users');
      const storedTags = localStorage.getItem('fity_crm_tags');
      const storedCardSettings = localStorage.getItem('fity_crm_card_settings');
      
      setLeads(storedLeads ? JSON.parse(storedLeads) : initialLeads);
      setColumns(storedColumns ? JSON.parse(storedColumns) : initialColumns);
      setActivities(storedActivities ? JSON.parse(storedActivities) : initialActivities);
      setTasks(storedTasks ? JSON.parse(storedTasks) : initialTasks);
      setUsers(storedUsers ? JSON.parse(storedUsers) : initialUsers);
      setTags(storedTags ? JSON.parse(storedTags) : initialTags);
      
      const savedSettings = storedCardSettings ? JSON.parse(storedCardSettings) : initialCardDisplaySettings;
      // Merge saved settings with defaults to ensure new settings are included
      setCardDisplaySettings({ ...initialCardDisplaySettings, ...savedSettings });

      setIsDataLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setIsDataLoading(true);
        const [fetchedColumns, fetchedLeads, fetchedActivities, fetchedUsers, fetchedTasks] = await Promise.all([
          api.getColumns(),
          api.getLeads(),
          api.getActivities(),
          api.getUsers(),
          api.getTasks(),
        ]);
        setColumns(fetchedColumns);
        setLeads(fetchedLeads);
        setActivities(fetchedActivities);
        setUsers(fetchedUsers);
        setTasks(fetchedTasks);
      } catch (err) {
        showNotification('Falha ao buscar os dados. Por favor, tente novamente mais tarde.', 'error');
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchData();
  }, [currentUser, showNotification]);

  // Effect to persist data to localStorage in demo mode
  React.useEffect(() => {
    if (!isSupabaseConfigured && currentUser && !isDataLoading) {
      localStorage.setItem('fity_crm_leads', JSON.stringify(leads));
      localStorage.setItem('fity_crm_columns', JSON.stringify(columns));
      localStorage.setItem('fity_crm_activities', JSON.stringify(activities));
      localStorage.setItem('fity_crm_tasks', JSON.stringify(tasks));
      localStorage.setItem('fity_crm_users', JSON.stringify(users));
      localStorage.setItem('fity_crm_tags', JSON.stringify(tags));
      localStorage.setItem('fity_crm_card_settings', JSON.stringify(cardDisplaySettings));
    }
  }, [leads, columns, activities, tasks, users, tags, cardDisplaySettings, currentUser, isSupabaseConfigured, isDataLoading]);

  const filteredLeads = React.useMemo(() => {
    if (!searchQuery) return leads;
    const lowercasedQuery = searchQuery.toLowerCase();
    return leads.filter(lead => 
      lead.name.toLowerCase().includes(lowercasedQuery) ||
      lead.company.toLowerCase().includes(lowercasedQuery)
    );
  }, [leads, searchQuery]);

  const leadsByColumn = React.useMemo(() => {
    return filteredLeads.reduce((acc, lead) => {
      if (!acc[lead.columnId]) acc[lead.columnId] = [];
      acc[lead.columnId].push(lead);
      return acc;
    }, {} as Record<Id, Lead[]>);
  }, [filteredLeads]);

  const [activeLead, setActiveLead] = React.useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 3 } }));

  const handleCreateActivity = React.useCallback(async (activityData: Omit<Activity, 'id' | 'timestamp'>) => {
    if (!isSupabaseConfigured) {
        const newActivity: Activity = {
            ...activityData,
            id: `mock-activity-${Date.now()}`,
            timestamp: new Date().toISOString(),
        };
        setActivities(prev => [newActivity, ...prev]);
        return;
    }
    try {
        const newActivity = await api.createActivity(activityData);
        setActivities(prev => [newActivity, ...prev]);
    } catch {
        showNotification('Falha ao registrar a atividade.', 'error');
    }
  }, [showNotification]);

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === 'Lead') {
      setActiveLead(event.active.data.current.lead);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const isActiveALead = active.data.current?.type === 'Lead';
    if (!isActiveALead) return;

    const activeId = active.id;
    const overId = over.id;
    const isOverAColumn = over.data.current?.type === 'Column';

    setLeads(currentLeads => {
        const activeIndex = currentLeads.findIndex(l => l.id === activeId);
        let overIndex;

        if (isOverAColumn) {
            if (currentLeads[activeIndex].columnId !== overId) {
                currentLeads[activeIndex].columnId = overId;
            }
            return arrayMove(currentLeads, activeIndex, activeIndex); 
        } else {
            overIndex = currentLeads.findIndex(l => l.id === overId);
            if (currentLeads[activeIndex].columnId !== currentLeads[overIndex].columnId) {
                currentLeads[activeIndex].columnId = currentLeads[overIndex].columnId;
                return arrayMove(currentLeads, activeIndex, overIndex);
            }
            return arrayMove(currentLeads, activeIndex, overIndex);
        }
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveLead(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
  
    const originalLead = leads.find(l => l.id === active.id);
    const destinationColumn = over.data.current?.type === 'Column' ? over.id : over.data.current?.lead?.columnId;
    if (!originalLead || !destinationColumn) return;
  
    const didColumnChange = originalLead.columnId !== destinationColumn;
    
    if (!isSupabaseConfigured) {
        if (didColumnChange && currentUser) {
            const originalColumnName = columns.find(c => c.id === originalLead.columnId)?.title;
            const destinationColumnName = columns.find(c => c.id === destinationColumn)?.title;
            if (originalColumnName && destinationColumnName) {
                handleCreateActivity({
                    leadId: originalLead.id,
                    type: 'status_change',
                    text: `Status alterado de '${originalColumnName}' para '${destinationColumnName}'.`,
                    authorName: currentUser.name,
                });
            }
        }
        return;
    }
    
    const previousLeads = [...leads];
    
    api.updateLead(originalLead.id, { columnId: destinationColumn }).then(() => {
        if (didColumnChange && currentUser) {
            const originalColumnName = columns.find(c => c.id === originalLead.columnId)?.title;
            const destinationColumnName = columns.find(c => c.id === destinationColumn)?.title;
            if (originalColumnName && destinationColumnName) {
                handleCreateActivity({
                    leadId: originalLead.id,
                    type: 'status_change',
                    text: `Status alterado de '${originalColumnName}' para '${destinationColumnName}'.`,
                    authorName: currentUser.name,
                });
            }
        }
    }).catch(() => {
      showNotification('Falha ao mover o lead. Revertendo a alteração.', 'error');
      setLeads(previousLeads);
    });
  };
  
  const handleOpenCreateLeadModal = () => {
    setEditingLead(null);
    setCreateEditLeadModalOpen(true);
  };
  
  const handleOpenEditLeadModal = (lead: Lead) => {
    setEditingLead(lead);
    setCreateEditLeadModalOpen(true);
  };

  const handleCreateOrUpdateLead = async (data: CreateLeadData | UpdateLeadData) => {
    if (!isSupabaseConfigured) {
        if (editingLead) {
            const updatedLead = { ...editingLead, ...data };
            setLeads(leads.map(l => (l.id === editingLead.id ? updatedLead : l)));
            setSelectedLead(prev => (prev && prev.id === editingLead.id ? updatedLead : prev));
        } else {
            const newLead: Lead = {
                id: `mock-lead-${Date.now()}`,
                columnId: data.columnId || columns[0]?.id,
                name: data.name || 'Novo Lead',
                company: data.company || '',
                value: data.value || 0,
                avatarUrl: `https://picsum.photos/seed/${Date.now()}/100/100`,
                tags: data.tags || [],
                lastActivity: 'agora',
                createdAt: new Date().toISOString(),
                ...data,
            };
            setLeads(prevLeads => [newLead, ...prevLeads]);
        }
        showNotification(editingLead ? 'Lead atualizado com sucesso!' : 'Lead criado com sucesso!', 'success');
        setCreateEditLeadModalOpen(false);
        setEditingLead(null);
        return;
    }
    
    if (editingLead) { // Update
      const previousLeads = [...leads];
      setLeads(leads.map(l => l.id === editingLead.id ? { ...l, ...data } as Lead : l));
      setSelectedLead(prev => prev && prev.id === editingLead.id ? { ...prev, ...data } as Lead : prev);
      setCreateEditLeadModalOpen(false);
      try {
        const updatedLead = await api.updateLead(editingLead.id, data);
        setLeads(leads => leads.map(l => l.id === updatedLead.id ? updatedLead : l));
        showNotification('Lead atualizado com sucesso!', 'success');
      } catch {
        showNotification('Falha ao atualizar o lead.', 'error');
        setLeads(previousLeads);
      }
    } else { // Create
        setCreateEditLeadModalOpen(false);
        try {
            const newLead = await api.createLead(data as CreateLeadData);
            setLeads(prevLeads => [newLead, ...prevLeads]);
            showNotification('Lead criado com sucesso!', 'success');
        } catch {
            showNotification('Falha ao criar o lead.', 'error');
        }
    }
  };

  const handleDeleteLead = (lead: Lead) => {
    setLeadToDelete(lead);
  };

  const confirmDeleteLead = async () => {
    if (!leadToDelete) return;
    const leadId = leadToDelete.id;

    const previousLeads = [...leads];
    const previousActivities = [...activities];
    const previousTasks = [...tasks];

    setLeads(leads.filter(l => l.id !== leadId));
    setActivities(activities.filter(a => a.leadId !== leadId));
    setTasks(tasks.filter(t => t.leadId !== leadId));
    setSelectedLead(null);
    setLeadToDelete(null);

    if (!isSupabaseConfigured) {
        showNotification('Lead deletado com sucesso (modo de demonstração).', 'success');
        return;
    }

    try {
        await api.deleteLead(leadId);
        showNotification('Lead e dados associados deletados com sucesso.', 'success');
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Falha ao deletar o lead.';
        showNotification(errorMessage, 'error');
        setLeads(previousLeads);
        setActivities(previousActivities);
        setTasks(previousTasks);
    }
  };


  const handleCardClick = React.useCallback((lead: Lead) => {
    setSelectedLead(lead);
  }, []);

  const handleAddNote = React.useCallback(async (leadId: Id, noteText: string) => {
    if (!currentUser) return;
    try {
        await handleCreateActivity({
            leadId,
            text: noteText,
            type: 'note',
            authorName: currentUser.name,
        });
        showNotification('Nota adicionada com sucesso.', 'success');
    } catch {
        // Error already handled in handleCreateActivity
    }
  }, [currentUser, handleCreateActivity, showNotification]);

  const handleOpenCreateTaskModal = (leadId: Id | null = null, date: string | null = null) => {
    setEditingTask(null);
    setPreselectedLeadIdForTask(leadId);
    setPreselectedDateForTask(date);
    setCreateEditTaskModalOpen(true);
  };

  const handleOpenEditTaskModal = (task: Task) => {
    setEditingTask(task);
    setPreselectedLeadIdForTask(null);
    setPreselectedDateForTask(null);
    setCreateEditTaskModalOpen(true);
  };

  const handleCreateOrUpdateTask = async (data: CreateTaskData | UpdateTaskData) => {
    setCreateEditTaskModalOpen(false);
    if (!isSupabaseConfigured) {
        if (editingTask) {
            const updatedTask = { ...editingTask, ...data };
            setTasks(tasks.map(t => (t.id === editingTask.id ? updatedTask : t)));
        } else {
            const newTask: Task = {
                id: `mock-task-${Date.now()}`,
                userId: currentUser!.id,
                status: 'pending',
                type: 'task', // Default type
                ...(data as CreateTaskData),
            };
            setTasks(prevTasks => [...prevTasks, newTask]);
        }
        showNotification(editingTask ? 'Tarefa atualizada com sucesso!' : 'Tarefa criada com sucesso!', 'success');
        setEditingTask(null);
        setPreselectedLeadIdForTask(null);
        return;
    }

    if (editingTask) { // Update
        try {
            const updatedTask = await api.updateTask(editingTask.id, data);
            setTasks(tasks.map(t => t.id === editingTask.id ? updatedTask : t));
            showNotification('Tarefa atualizada com sucesso!', 'success');
        } catch {
            showNotification('Falha ao atualizar a tarefa.', 'error');
        }
    } else { // Create
        try {
            const newTask = await api.createTask(data as CreateTaskData);
            setTasks(prevTasks => [...prevTasks, newTask]);
            showNotification('Tarefa criada com sucesso!', 'success');
        } catch {
            showNotification('Falha ao criar a tarefa.', 'error');
        }
    }
    setEditingTask(null);
    setPreselectedLeadIdForTask(null);
  };

  const handleDeleteTask = async (taskId: Id) => {
      const previousTasks = [...tasks];
      setTasks(tasks.filter(t => t.id !== taskId));
      if (!isSupabaseConfigured) {
          showNotification('Tarefa deletada com sucesso (modo de demonstração).', 'success');
          return;
      }
      try {
          await api.deleteTask(taskId);
          showNotification('Tarefa deletada com sucesso.', 'success');
      } catch {
          showNotification('Falha ao deletar a tarefa.', 'error');
          setTasks(previousTasks);
      }
  };

  const handleUpdateTaskStatus = async (taskId: Id, status: 'pending' | 'completed') => {
      const originalTask = tasks.find(t => t.id === taskId);
      if (!originalTask) return;
      
      const updatedTask = { ...originalTask, status };
      setTasks(tasks.map(t => t.id === taskId ? updatedTask : t));

      if (!isSupabaseConfigured) {
          showNotification('Status da tarefa atualizado.', 'success');
          return;
      }

      try {
          await api.updateTask(taskId, { status });
          showNotification('Status da tarefa atualizado.', 'success');
      } catch {
          showNotification('Falha ao atualizar status da tarefa.', 'error');
          setTasks(tasks.map(t => t.id === taskId ? originalTask : t)); // Revert
      }
  };
  
  const handleLogin = async (email: string, password: string) => {
      setAuthError(null);
      setAuthSuccess(null);
      try {
          const user = await api.loginUser(email, password);
          setCurrentUser(user);
      } catch (err: any) {
          setAuthError(err.message || 'Falha no login.');
      }
  };
  
  const handleRegister = async (name: string, email: string, password: string) => {
      setAuthError(null);
      setAuthSuccess(null);
      try {
          await api.registerUser(name, email, password);
          setAuthSuccess('Registro bem-sucedido! Por favor, verifique seu e-mail e faça o login.');
          setAuthView('login');
      } catch (err: any) {
          setAuthError(err.message || 'Falha no registro.');
      }
  };

  const handleLogout = async () => {
    if (!isSupabaseConfigured) {
        showNotification("O logout está desabilitado no modo de demonstração.", 'info');
        return;
    }
    await api.logoutUser();
    setCurrentUser(null);
  };

  const handleUpdateProfile = async (name: string, avatarFile?: File) => {
    if (!currentUser) return;
    if (!isSupabaseConfigured) {
        const updatedUser = { ...currentUser, name };
        if (avatarFile) {
            updatedUser.avatarUrl = URL.createObjectURL(avatarFile);
        }
        setCurrentUser(updatedUser);
        setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
        showNotification('Perfil atualizado com sucesso.', 'success');
        return;
    }
    showNotification('Funcionalidade de atualização de perfil (backend) ainda não implementada.', 'info');
  };

  const handleUpdatePipeline = async (newColumns: ColumnData[]) => {
      if(!isSupabaseConfigured) {
          setColumns(newColumns);
          showNotification('Pipeline atualizado com sucesso.', 'success');
          return;
      }
      showNotification('Funcionalidade de atualização de pipeline (backend) ainda não implementada.', 'info');
  }

  const handleUpdateCardSettings = (newSettings: CardDisplaySettings) => {
    setCardDisplaySettings(newSettings);
    // Optional: Could add a notification, but it might be too noisy for instant toggles.
  };
  
  const renderView = () => {
    switch (activeView) {
      case 'Dashboard':
        return <Dashboard leads={filteredLeads} columns={columns} activities={activities} tasks={tasks} onNavigate={setActiveView} />;
      case 'Pipeline':
        return (
            <div>
                <PipelineHeader
                    onOpenCreateLeadModal={handleOpenCreateLeadModal}
                    cardDisplaySettings={cardDisplaySettings}
                    onUpdateCardSettings={handleUpdateCardSettings}
                />
                <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
                    <KanbanBoard columns={columns} leadsByColumn={leadsByColumn} onCardClick={handleCardClick} selectedLeadId={selectedLead?.id} users={users} cardDisplaySettings={cardDisplaySettings} />
                    <DragOverlay>{activeLead && <Card lead={activeLead} users={users} cardDisplaySettings={cardDisplaySettings} isOverlay column={columns.find(c => c.id === activeLead.columnId)!} />}</DragOverlay>
                </DndContext>
            </div>
        );
      case 'Leads':
      case 'Clientes':
        const isClientsView = activeView === 'Clientes';
        return (
            <div>
                 <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                         {isClientsView ? <Contact className="w-8 h-8 text-[#14ff00]" /> : <Users className="w-8 h-8 text-[#14ff00]" />}
                        <div>
                            <h1 className="text-2xl font-bold text-white">{isClientsView ? 'Clientes' : 'Leads'}</h1>
                            <p className="text-zinc-400">{isClientsView ? 'Gerencie seus clientes e relacionamentos' : 'Gerencie todos os seus leads e clientes'}</p>
                        </div>
                    </div>
                    <button onClick={handleOpenCreateLeadModal} className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-violet-700 transition-colors">
                        <Plus className="w-4 h-4" />
                        <span>{isClientsView ? 'Novo Cliente' : 'Novo Lead'}</span>
                    </button>
                </div>
                <LeadListView
                    leads={filteredLeads}
                    columns={columns}
                    onLeadClick={handleCardClick}
                />
            </div>
        );
        case 'Atividades':
            return (
                <div>
                     <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                             <ActivityIcon className="w-8 h-8 text-[#14ff00]" />
                            <div>
                                <h1 className="text-2xl font-bold text-white">Atividades</h1>
                                <p className="text-zinc-400">Gerencie suas tarefas e próximos passos</p>
                            </div>
                        </div>
                        <button onClick={() => handleOpenCreateTaskModal()} className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-violet-700 transition-colors">
                            <Plus className="w-4 h-4" />
                            <span>Nova Tarefa</span>
                        </button>
                    </div>
                    <ActivitiesView 
                        tasks={tasks}
                        leads={leads}
                        onEditTask={handleOpenEditTaskModal}
                        onDeleteTask={handleDeleteTask}
                        onUpdateTaskStatus={handleUpdateTaskStatus}
                    />
                </div>
            );
         case 'Calendário':
            return (
                <CalendarPage 
                    tasks={tasks}
                    leads={leads}
                    onNewActivity={(date) => handleOpenCreateTaskModal(null, date)}
                    onEditActivity={handleOpenEditTaskModal}
                    onDeleteTask={handleDeleteTask}
                    onUpdateTaskStatus={handleUpdateTaskStatus}
                />
            );
        case 'Relatórios':
            return (
                <ReportsPage
                    leads={leads}
                    columns={columns}
                    tasks={tasks}
                />
            );
        case 'Configurações':
            return (
                <div>
                     <div className="flex items-center gap-4 mb-6">
                        <Settings className="w-8 h-8 text-[#14ff00]" />
                        <div>
                            <h1 className="text-2xl font-bold text-white">Configurações</h1>
                            <p className="text-zinc-400">Gerencie suas preferências e configurações da conta</p>
                        </div>
                    </div>
                    <SettingsPage 
                        currentUser={currentUser!}
                        columns={columns}
                        onUpdateProfile={handleUpdateProfile}
                        onUpdatePipeline={handleUpdatePipeline}
                    />
                </div>
            );
      default:
        return (
          <div className="flex items-center justify-center h-full bg-zinc-800 rounded-lg border border-zinc-700">
            <p className="text-zinc-400">Visualização para '{activeView}' ainda não implementada.</p>
          </div>
        );
    }
  };

  if (isAuthLoading) {
    return (
        <div className="flex items-center justify-center h-screen w-full bg-zinc-900">
            <Loader2 className="w-10 h-10 animate-spin text-[#14ff00]" />
        </div>
    );
  }

  if (!isSupabaseConfigured && !currentUser) {
    return <ConfigurationNotice />;
  }

  if (!currentUser) {
    if (authView === 'login') {
      return <Login onLogin={handleLogin} error={authError} onNavigateToRegister={() => { setAuthView('register'); setAuthError(null); }} successMessage={authSuccess} />;
    }
    return <Register onRegister={handleRegister} onNavigateToLogin={() => { setAuthView('login'); setAuthError(null); setAuthSuccess(null); }} error={authError} />;
  }

  return (
    <div className="flex h-screen w-full bg-zinc-900 text-gray-300">
      <Sidebar 
        activeView={activeView} 
        onNavigate={setActiveView} 
        currentUser={currentUser} 
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(p => !p)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-x-auto overflow-y-auto p-6 md:p-8">
        {isDataLoading ? (
             <div className="flex items-center justify-center h-full w-full">
                <Loader2 className="w-10 h-10 animate-spin text-[#14ff00]" />
            </div>
        ) : renderView()}
        </main>
      </div>
      <AnimatePresence>
        {selectedLead && (
          <LeadDetailSlideover
            lead={selectedLead}
            activities={activities.filter(a => a.leadId === selectedLead.id)}
            onClose={() => setSelectedLead(null)}
            onEdit={() => handleOpenEditLeadModal(selectedLead)}
            onDelete={() => handleDeleteLead(selectedLead)}
            onAddNote={(noteText) => handleAddNote(selectedLead.id, noteText)}
            onAddTask={() => handleOpenCreateTaskModal(selectedLead.id)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isCreateEditLeadModalOpen && (
            <CreateEditLeadModal
                lead={editingLead}
                columns={columns}
                allTags={tags}
                onClose={() => setCreateEditLeadModalOpen(false)}
                onSubmit={handleCreateOrUpdateLead}
            />
        )}
      </AnimatePresence>
       <AnimatePresence>
        {isCreateEditTaskModalOpen && (
            <CreateEditTaskModal
                task={editingTask}
                leads={leads}
                preselectedLeadId={preselectedLeadIdForTask}
                preselectedDate={preselectedDateForTask}
                onClose={() => { 
                    setCreateEditTaskModalOpen(false); 
                    setEditingTask(null); 
                    setPreselectedLeadIdForTask(null);
                    setPreselectedDateForTask(null); 
                }}
                onSubmit={handleCreateOrUpdateTask}
            />
        )}
      </AnimatePresence>
       <AnimatePresence>
        {leadToDelete && (
            <ConfirmDeleteModal
                onClose={() => setLeadToDelete(null)}
                onConfirm={confirmDeleteLead}
                title="Confirmar Exclusão de Lead"
                message={
                    <>
                        <p>Tem certeza que deseja deletar o lead <strong className="text-white">{leadToDelete.name}</strong>?</p>

                        <p className="mt-2 text-sm text-zinc-500">
                            Esta ação não pode ser desfeita. Todas as tarefas e atividades associadas também serão removidas.
                        </p>
                    </>
                }
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