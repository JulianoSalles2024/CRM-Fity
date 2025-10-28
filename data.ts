import { ColumnData, Lead, Activity, User, Task, Tag } from './types';

export const initialUsers: User[] = [
  { id: 'user1', name: 'John Doe', email: 'john.doe@example.com' },
  { id: 'user2', name: 'Jane Smith', email: 'jane.smith@example.com' },
  { id: 'user3', name: 'Peter Jones', email: 'peter.jones@example.com' },
];

export const initialColumns: ColumnData[] = [
  { id: 'prospect', title: 'Prospecção', color: '#3b82f6' },
  { id: 'qualify', title: 'Qualificação', color: '#8b5cf6' },
  { id: 'proposal', title: 'Proposta', color: '#ec4899' },
  { id: 'negotiation', title: 'Negociação', color: '#f97316' },
  { id: 'closed', title: 'Fechamento', color: '#10b981' },
];

export const initialTags: Tag[] = [
  { id: 'tag-1', name: 'Urgente', color: '#ef4444' }, // red-500
  { id: 'tag-2', name: 'Médio', color: '#f97316' },   // orange-500
  { id: 'tag-3', name: 'Baixo', color: '#3b82f6' },    // blue-500
  { id: 'tag-4', name: 'Follow-up', color: '#eab308' }, // yellow-500
  { id: 'tag-5', name: 'Novo Cliente', color: '#10b981' }, // emerald-500
];

export const initialLeads: Lead[] = [
    {
        id: 'lead-1',
        columnId: 'prospect',
        name: 'Juliano',
        company: 'Zenius IA',
        value: 249.00,
        avatarUrl: 'https://i.pravatar.cc/150?u=juliano',
        tags: [initialTags[0], initialTags[4]], // Urgente, Novo Cliente
        lastActivity: 'agora',
        dueDate: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString(),
        assignedTo: 'user1',
        description: 'Lead promissor interessado na solução de IA para otimização de processos.',
        email: 'juliano.zenius@example.com',
        phone: '(11) 98765-4321',
        probability: 75,
        status: 'Ativo',
        source: 'Indicação',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    }
];


export const initialActivities: Activity[] = [
    {
        id: 'activity-1',
        leadId: 'lead-1',
        type: 'note',
        text: 'Primeiro contato realizado. Cliente demonstrou interesse.',
        authorName: 'Juliano',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    },
    {
        id: 'activity-2',
        leadId: 'lead-1',
        type: 'status_change',
        text: "Status alterado de 'Backlog' para 'Prospecção'.",
        authorName: 'Sistema',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    }
];

export const initialTasks: Task[] = [];