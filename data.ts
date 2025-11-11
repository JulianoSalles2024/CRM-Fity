import { ColumnData, Lead, Activity, User, Task, Tag, EmailDraft, ChatConversation, ChatMessage, Group, Notification } from './types';

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
  { id: 'lost', title: 'Perdido', color: '#ef4444' },
];

export const initialTags: Tag[] = [
  { id: 'tag-1', name: 'Urgente', color: '#ef4444' }, // red-500
  { id: 'tag-2', name: 'Médio', color: '#f97316' },   // orange-500
  { id: 'tag-3', name: 'Baixo', color: '#3b82f6' },    // blue-500
  { id: 'tag-4', name: 'Follow-up', color: '#eab308' }, // yellow-500
  { id: 'tag-5', name: 'Novo Cliente', color: '#10b981' }, // emerald-500
];

export const initialGroups: Group[] = [
    {
        id: 'group-alpha',
        name: 'Grupo Alpha',
        description: 'Grupo para leads de alto potencial e novos clientes do produto Alpha.',
        accessLink: 'https://chat.whatsapp.com/alpha',
        status: 'Ativo',
        memberGoal: 100,
    },
    {
        id: 'group-beta',
        name: 'Grupo Beta',
        description: 'Grupo de teste para o novo produto Beta.',
        accessLink: 'https://t.me/beta_group',
        status: 'Ativo',
        memberGoal: 50,
    },
    {
        id: 'group-onboarding',
        name: 'Onboarding VIP',
        description: 'Grupo exclusivo para clientes que fecharam o plano VIP.',
        status: 'Lotado',
    }
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
        groupInfo: {
            hasJoined: true,
            groupId: 'group-alpha',
            isStillInGroup: true,
            hasOnboarded: true,
            onboardingCallDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), // 1 day ago - new member!
            churned: false,
        },
    },
    {
        id: 'lead-2',
        columnId: 'qualify',
        name: 'Beatriz',
        company: 'InovaTech',
        value: 5000.00,
        avatarUrl: 'https://i.pravatar.cc/150?u=beatriz',
        tags: [initialTags[1]],
        lastActivity: 'ontem',
        status: 'Ativo',
        description: 'Interessada em pacote enterprise.',
        email: 'beatriz@inovatech.com',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    },
    {
        id: 'lead-3',
        columnId: 'closed',
        name: 'Carlos',
        company: 'Soluções Digitais',
        value: 1250.50,
        avatarUrl: 'https://i.pravatar.cc/150?u=carlos',
        tags: [initialTags[4]],
        lastActivity: '2 dias atrás',
        status: 'Ativo',
        description: 'Cliente fechado, aguardando onboarding.',
        email: 'carlos.s@solucoes.co',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
        groupInfo: {
            hasJoined: true,
            groupId: 'group-beta',
            isStillInGroup: true,
            hasOnboarded: true,
            onboardingCallDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(), // older member
            churned: false,
        },
    },
    {
        id: 'lead-4',
        columnId: 'lost',
        name: 'Daniel',
        company: 'DataCorp',
        value: 800.00,
        avatarUrl: 'https://i.pravatar.cc/150?u=daniel',
        tags: [],
        lastActivity: '3 dias atrás',
        status: 'Inativo',
        description: 'Não respondeu aos contatos.',
        email: 'daniel@datacorp.com',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
        groupInfo: {
            hasJoined: true,
            groupId: 'group-beta',
            isStillInGroup: false,
            hasOnboarded: true,
            onboardingCallDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 50).toISOString(),
            churned: true,
            exitDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
        },
    },
    {
        id: 'lead-5',
        columnId: 'prospect',
        name: 'Fernanda',
        company: 'Agile Solutions',
        value: 1800.00,
        avatarUrl: 'https://i.pravatar.cc/150?u=fernanda',
        tags: [initialTags[2]],
        lastActivity: '4 dias atrás',
        status: 'Ativo',
        description: 'Interessada, mas com orçamento limitado.',
        email: 'fernanda@agilesol.com',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
        groupInfo: {
            hasJoined: true,
            groupId: 'group-alpha',
            isStillInGroup: false,
            hasOnboarded: false,
            churned: true,
            exitDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        },
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

export const initialTasks: Task[] = [
    {
        id: 'task-1',
        leadId: 'lead-1', // Juliano
        userId: 'user1',
        type: 'call',
        title: 'Ligar para Juliano para agendar demo',
        description: 'Discutir a apresentação enviada e marcar um horário para a demonstração da plataforma de IA.',
        dueDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(), // Tomorrow
        status: 'pending',
    },
    {
        id: 'task-2',
        leadId: 'lead-2', // Beatriz
        userId: 'user1',
        type: 'email',
        title: 'Enviar follow-up para Beatriz',
        description: 'Enviar e-mail de acompanhamento sobre a proposta do pacote enterprise.',
        dueDate: new Date().toISOString(), // Today
        status: 'pending',
    },
    {
        id: 'task-3',
        leadId: 'lead-3', // Carlos
        userId: 'user1',
        type: 'task',
        title: 'Preparar sessão de onboarding para Carlos',
        description: 'Coletar informações necessárias e preparar materiais para a sessão de onboarding.',
        dueDate: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(),
        status: 'pending',
    },
    {
        id: 'task-4',
        leadId: 'lead-1', // Juliano
        userId: 'user1',
        type: 'meeting',
        title: 'Reunião de Alinhamento Interno sobre Zenius IA',
        description: 'Discutir estratégia de negociação antes da demo.',
        dueDate: new Date().toISOString(),
        status: 'completed',
    }
];
export const initialEmailDrafts: EmailDraft[] = [];

export const initialMessages: ChatMessage[] = [
    // Conversation 1 with Juliano (Omnichannel)
    {
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'user1',
        text: 'Olá Juliano, tudo bem? Vi seu interesse em nossas soluções de IA. Podemos conversar?',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        channel: 'whatsapp',
    },
    {
        id: 'msg-2',
        conversationId: 'conv-1',
        senderId: 'lead-1',
        text: 'Olá! Tudo bem sim. Claro, tenho interesse em saber mais sobre a otimização de processos.',
        timestamp: new Date(Date.now() - 1000 * 60 * 58).toISOString(),
        channel: 'whatsapp',
    },
     {
        id: 'msg-3',
        conversationId: 'conv-1',
        senderId: 'user1',
        text: 'Perfeito! Te enviei um e-mail com mais detalhes e uma apresentação. Por favor, confirme o recebimento.',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        channel: 'email',
    },
    {
        id: 'msg-4',
        conversationId: 'conv-1',
        senderId: 'lead-1',
        text: 'E-mail recebido! Gostei da apresentação. Vi que vocês estão no Instagram também, mandei uma DM lá.',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        channel: 'email',
    },
    {
        id: 'msg-5',
        conversationId: 'conv-1',
        senderId: 'lead-1',
        text: 'Hey! A proposta parece ótima. Qual seria o melhor horário para uma breve demonstração amanhã?',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        channel: 'instagram',
    },

    // Conversation 2 with Beatriz (WhatsApp only)
    {
        id: 'msg-6',
        conversationId: 'conv-2',
        senderId: 'user1',
        text: 'Olá Beatriz, te enviei a proposta por e-mail, ok?',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(),
        channel: 'whatsapp',
    },
    {
        id: 'msg-7',
        conversationId: 'conv-2',
        senderId: 'lead-2',
        text: 'Recebido. Vou analisar e te retorno.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        channel: 'whatsapp',
    },
    // Conversation 3 with Carlos (Internal note)
    {
        id: 'msg-8',
        conversationId: 'conv-3',
        senderId: 'user1',
        text: 'Negócio fechado com Carlos! Cliente super engajado.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        channel: 'internal',
    },
];

export const initialConversations: ChatConversation[] = [
    {
        id: 'conv-1',
        leadId: 'lead-1',
        lastMessage: 'Hey! A proposta parece ótima. Qual seria o melhor horário para uma breve demonstração amanhã?',
        lastMessageTimestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        unreadCount: 1,
        status: 'open',
        lastMessageChannel: 'instagram',
    },
    {
        id: 'conv-2',
        leadId: 'lead-2',
        lastMessage: 'Recebido. Vou analisar e te retorno.',
        lastMessageTimestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        unreadCount: 0,
        status: 'waiting',
        lastMessageChannel: 'whatsapp',
    },
    {
        id: 'conv-3',
        leadId: 'lead-3',
        lastMessage: 'Negócio fechado com Carlos! Cliente super engajado.',
        lastMessageTimestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        unreadCount: 0,
        status: 'finished',
        lastMessageChannel: 'internal',
    }
];

export const initialNotifications: Notification[] = [
    // Today
    {
        id: 'notif-1',
        userId: 'user1',
        type: 'new_message',
        text: 'Beatriz da InovaTech respondeu à sua mensagem.',
        link: { view: 'Chat', itemId: 'conv-2', leadId: 'lead-2' },
        isRead: false,
        createdAt: new Date().toISOString(),
    },
    {
        id: 'notif-2',
        userId: 'user1',
        type: 'task_due_soon',
        text: 'Tarefa "Enviar follow-up para Beatriz" vence hoje.',
        link: { view: 'Tarefas', itemId: 'task-2', leadId: 'lead-2' },
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    },
    // Yesterday
    {
        id: 'notif-3',
        userId: 'user1',
        type: 'lead_assigned',
        text: 'Novo lead "Mariana" foi atribuído a você.',
        link: { view: 'Pipeline', leadId: 'lead-new' }, // Assuming a new lead id
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(), // 25 hours ago
    },
    // Older
     {
        id: 'notif-4',
        userId: 'user1',
        type: 'mention',
        text: 'Jane Smith mencionou você em uma nota no lead "Carlos".',
        link: { view: 'Pipeline', leadId: 'lead-3' },
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
    },
    {
        id: 'notif-5',
        userId: 'user1',
        type: 'system_update',
        text: 'O Fity AI CRM foi atualizado com novos recursos de relatórios.',
        link: { view: 'Relatórios' },
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days ago
    }
];