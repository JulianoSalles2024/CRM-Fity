import React from 'react';
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { AnimatePresence } from 'framer-motion';

import type { Id, ColumnData, Lead, CreateLeadData, UpdateLeadData, User, Activity, Task, CreateTaskData, UpdateTaskData, Tag, CardDisplaySettings, ListDisplaySettings, EmailDraft, CreateEmailDraftData } from './types';
import { initialColumns, initialLeads, initialActivities, initialUsers, initialTasks, initialTags, initialEmailDrafts } from './data';


import Sidebar from './components/Sidebar';
import Header from './components/Header';
import KanbanBoard from './components/KanbanBoard';
import Card from './components/Card';
import LeadDetailSlideover from './components/LeadDetailSlideover';
import CreateEditLeadModal from './components/CreateEditLeadModal';
import CreateEditTaskModal from './components/CreateEditTaskModal';
import Dashboard from './components/Dashboard';
import { Loader2 } from 'lucide-react';
import LeadListView from './components/LeadListView';
import ActivitiesView from './components/ActivitiesView';
import SettingsPage from './components/SettingsPage';
import CalendarPage from './components/CalendarPage';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import Notification from './components/Notification';
import PipelineHeader from './components/PipelineHeader';
import ReportsPage from './components/ReportsPage';
import FAB from './components/FAB';


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

const initialListDisplaySettings: ListDisplaySettings = {
  showStatus: true,
  showValue: true,
  showTags: true,
  showLastActivity: true,
  showEmail: false,
  showPhone: false,
  showCreatedAt: false,
};


const App: React.FC = () => {
  const [currentUser] = React.useState<User>({ id: 'mock-user', name: 'Juliano', email: 'jukasalleso@gmail.com', avatarUrl: 'https://i.pravatar.cc/150?u=juliano' });

  const [columns, setColumns] = React.useState<ColumnData[]>([]);
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [activities, setActivities] = React.useState<Activity[]>([]);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [emailDrafts, setEmailDrafts] = React.useState<EmailDraft[]>([]);
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
  const [listDisplaySettings, setListDisplaySettings] = React.useState<ListDisplaySettings>(initialListDisplaySettings);


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
      setIsDataLoading(true);

      const storedLeads = localStorage.getItem('fity_crm_leads');
      const storedColumns = localStorage.getItem('fity_crm_columns');
      const storedActivities = localStorage.getItem('fity_crm_activities');
      const storedTasks = localStorage.getItem('fity_crm_tasks');
      const storedEmailDrafts = localStorage.getItem('fity_crm_email_drafts');
      const storedUsers = localStorage.getItem('fity_crm_users');
      const storedTags = localStorage.getItem('fity_crm_tags');
      const storedCardSettings = localStorage.getItem('fity_crm_card_settings');
      const storedListSettings = localStorage.getItem('fity_crm_list_settings');
      
      setLeads(storedLeads ? JSON.parse(storedLeads) : initialLeads);
      setColumns(storedColumns ? JSON.parse(storedColumns) : initialColumns);
      setActivities(storedActivities ? JSON.parse(storedActivities) : initialActivities);
      setTasks(storedTasks ? JSON.parse(storedTasks) : initialTasks);
      setEmailDrafts(storedEmailDrafts ? JSON.parse(storedEmailDrafts) : initialEmailDrafts);
      setUsers(storedUsers ? JSON.parse(storedUsers) : initialUsers);
      setTags(storedTags ? JSON.parse(storedTags) : initialTags);
      
      const savedCardSettings = storedCardSettings ? JSON.parse(storedCardSettings) : initialCardDisplaySettings;
      setCardDisplaySettings({ ...initialCardDisplaySettings, ...savedCardSettings });
      
      const savedListSettings = storedListSettings ? JSON.parse(storedListSettings) : initialListDisplaySettings;
      setListDisplaySettings({ ...initialListDisplaySettings, ...savedListSettings });

      setIsDataLoading(false);
  }, []);

  // Effect to persist data to localStorage
  React.useEffect(() => {
    if (!isDataLoading) {
      localStorage.setItem('fity_crm_leads', JSON.stringify(leads));
      localStorage.setItem('fity_crm_columns', JSON.stringify(columns));
      localStorage.setItem('fity_crm_activities', JSON.stringify(activities));
      localStorage.setItem('fity_crm_tasks', JSON.stringify(tasks));
      localStorage.setItem('fity_crm_email_drafts', JSON.stringify(emailDrafts));
      localStorage.setItem('fity_crm_users', JSON.stringify(users));
      localStorage.setItem('fity_crm_tags', JSON.stringify(tags));
      localStorage.setItem('fity_crm_card_settings', JSON.stringify(cardDisplaySettings));
      localStorage.setItem('fity_crm_list_settings', JSON.stringify(listDisplaySettings));
    }
  }, [leads, columns, activities, tasks, emailDrafts, users, tags, cardDisplaySettings, listDisplaySettings, isDataLoading]);

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
    const newActivity: Activity = {
        ...activityData,
        id: `mock-activity-${Date.now()}`,
        timestamp: new Date().toISOString(),
    };
    setActivities(prev => [newActivity, ...prev]);
  }, []);

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
    if (editingLead) {
        const updatedLead = { ...editingLead, ...data } as Lead;
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
  };

  const handleDeleteLead = (lead: Lead) => {
    setLeadToDelete(lead);
  };

  const confirmDeleteLead = async () => {
    if (!leadToDelete) return;
    const leadId = leadToDelete.id;

    setLeads(leads.filter(l => l.id !== leadId));
    setActivities(activities.filter(a => a.leadId !== leadId));
    setTasks(tasks.filter(t => t.leadId !== leadId));
    setSelectedLead(null);
    setLeadToDelete(null);
    showNotification('Lead deletado com sucesso (modo de demonstração).', 'success');
  };


  const handleCardClick = React.useCallback((lead: Lead) => {
    setSelectedLead(lead);
  }, []);

  const handleAddNote = React.useCallback(async (leadId: Id, noteText: string) => {
    if (!currentUser) return;
    await handleCreateActivity({
        leadId,
        text: noteText,
        type: 'note',
        authorName: currentUser.name,
    });
    showNotification('Nota adicionada com sucesso.', 'success');
  }, [currentUser, handleCreateActivity, showNotification]);

  const handleSendEmailActivity = React.useCallback(async (leadId: Id, subject: string) => {
    if (!currentUser) return;
    await handleCreateActivity({
        leadId,
        text: `Email enviado: "${subject}"`,
        type: 'email_sent',
        authorName: currentUser.name,
    });
  }, [currentUser, handleCreateActivity]);

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
    if (editingTask) {
        const updatedTask = { ...editingTask, ...data } as Task;
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
  };

  const handleDeleteTask = async (taskId: Id) => {
      setTasks(tasks.filter(t => t.id !== taskId));
      showNotification('Tarefa deletada com sucesso (modo de demonstração).', 'success');
  };

  const handleUpdateTaskStatus = async (taskId: Id, status: 'pending' | 'completed') => {
      const originalTask = tasks.find(t => t.id === taskId);
      if (!originalTask) return;
      
      const updatedTask = { ...originalTask, status };
      setTasks(tasks.map(t => t.id === taskId ? updatedTask : t));
      showNotification('Status da tarefa atualizado.', 'success');
  };
  
  const handleSaveEmailDraft = (draftData: CreateEmailDraftData) => {
    const newDraft: EmailDraft = {
        ...draftData,
        id: `mock-draft-${Date.now()}`,
        createdAt: new Date().toISOString(),
    };
    setEmailDrafts(prev => [newDraft, ...prev]);
    showNotification('Rascunho salvo com sucesso!', 'success');
  };

  const handleDeleteEmailDraft = (draftId: Id) => {
    setEmailDrafts(prev => prev.filter(d => d.id !== draftId));
    showNotification('Rascunho deletado.', 'success');
  };

  const handleLogout = async () => {
    showNotification("Logout não aplicável no modo de demonstração.", 'info');
  };

  const handleUpdateProfile = async (name: string, avatarFile?: File) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, name };
    if (avatarFile) {
        updatedUser.avatarUrl = URL.createObjectURL(avatarFile);
    }
    // Since currentUser is from a read-only state, we can't update it directly.
    // In a real app with auth state management, this would work.
    // For now, we update the 'users' list if the user is in there.
    setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
    showNotification('Perfil atualizado com sucesso. A alteração na barra superior requer recarregamento.', 'success');
  };

  const handleUpdatePipeline = async (newColumns: ColumnData[]) => {
      setColumns(newColumns);
      showNotification('Pipeline atualizado com sucesso.', 'success');
  }

  const handleUpdateCardSettings = (newSettings: CardDisplaySettings) => {
    setCardDisplaySettings(newSettings);
  };
  
  const handleUpdateListSettings = (newSettings: ListDisplaySettings) => {
    setListDisplaySettings(newSettings);
  };
  
  const renderView = () => {
    switch (activeView) {
      case 'Dashboard':
        return <Dashboard leads={filteredLeads} columns={columns} activities={activities} tasks={tasks} onNavigate={setActiveView} />;
      case 'Pipeline':
        return (
            <div>
                <PipelineHeader
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
        return (
            <LeadListView
                leads={filteredLeads}
                columns={columns}
                onLeadClick={handleCardClick}
                viewType={activeView as 'Leads' | 'Clientes'}
                listDisplaySettings={listDisplaySettings}
                onUpdateListSettings={handleUpdateListSettings}
            />
        );
        case 'Tarefas':
            return (
                <ActivitiesView 
                    tasks={tasks}
                    leads={leads}
                    onEditTask={handleOpenEditTaskModal}
                    onDeleteTask={handleDeleteTask}
                    onUpdateTaskStatus={handleUpdateTaskStatus}
                />
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
                <SettingsPage 
                    currentUser={currentUser!}
                    columns={columns}
                    onUpdateProfile={handleUpdateProfile}
                    onUpdatePipeline={handleUpdatePipeline}
                />
            );
      default:
        return (
          <div className="flex items-center justify-center h-full bg-zinc-800 rounded-lg border border-zinc-700">
            <p className="text-zinc-400">Visualização para '{activeView}' ainda não implementada.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen w-full bg-zinc-900 text-gray-300">
      <Sidebar 
        activeView={activeView} 
        onNavigate={setActiveView} 
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(p => !p)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header 
            currentUser={currentUser}
            onLogout={handleLogout}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenCreateLeadModal={handleOpenCreateLeadModal}
            onOpenCreateTaskModal={() => handleOpenCreateTaskModal()}
        />
        <main className="flex-1 overflow-x-auto overflow-y-auto p-6 md:p-8">
        {isDataLoading ? (
             <div className="flex items-center justify-center h-full w-full">
                <Loader2 className="w-10 h-10 animate-spin text-violet-500" />
            </div>
        ) : renderView()}
        </main>
      </div>
      <FAB
        onOpenCreateLeadModal={handleOpenCreateLeadModal}
        onOpenCreateTaskModal={() => handleOpenCreateTaskModal()}
      />
      <AnimatePresence>
        {selectedLead && (
          <LeadDetailSlideover
            lead={selectedLead}
            activities={activities.filter(a => a.leadId === selectedLead.id)}
            emailDrafts={emailDrafts.filter(d => d.leadId === selectedLead.id)}
            onClose={() => setSelectedLead(null)}
            onEdit={() => handleOpenEditLeadModal(selectedLead)}
            onDelete={() => handleDeleteLead(selectedLead)}
            onAddNote={(noteText) => handleAddNote(selectedLead.id, noteText)}
            onSendEmailActivity={(subject) => handleSendEmailActivity(selectedLead.id, subject)}
            onAddTask={() => handleOpenCreateTaskModal(selectedLead.id)}
            onSaveDraft={handleSaveEmailDraft}
            onDeleteDraft={handleDeleteEmailDraft}
            showNotification={showNotification}
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
