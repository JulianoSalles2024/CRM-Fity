export type Id = string | number;

export interface Tag {
  id: Id;
  name: string;
  color: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export type GroupStatus = 'Ativo' | 'Lotado' | 'Arquivado';

export interface Group {
  id: Id;
  name: string;
  description?: string;
  accessLink?: string;
  status: GroupStatus;
  memberGoal?: number;
}

export interface GroupInfo {
  hasJoined: boolean;
  groupId?: Id;
  isStillInGroup: boolean;
  hasOnboarded: boolean;
  onboardingCallDate?: string; // ISO String
  churned: boolean;
  exitDate?: string; // ISO String
}

export interface Lead {
  id: Id;
  columnId: Id;
  name: string;
  company: string;
  value: number;
  avatarUrl: string;
  tags: Tag[];
  lastActivity: string;
  dueDate?: string; 
  assignedTo?: string;

  // New fields from modal
  description?: string;
  email?: string;
  phone?: string;
  probability?: number;
  status?: string; // e.g., 'Ativo', 'Inativo'
  clientId?: Id; 
  source?: string;
  createdAt?: string;
  groupInfo?: GroupInfo;
}

export interface ColumnData {
  id: Id;
  title: string;
  color: string;
}

export interface Activity {
  id: Id;
  leadId: Id;
  type: 'note' | 'status_change' | 'email_sent';
  text: string;
  authorName: string;
  timestamp: string; // ISO string
}

export interface Task {
    id: Id;
    type: 'task' | 'email' | 'call' | 'meeting' | 'note';
    title: string;
    description?: string;
    dueDate: string; // ISO String for date
    status: 'pending' | 'completed';
    leadId: Id;
    userId: string;
}

export type Tone = 'Amigável' | 'Formal' | 'Urgente' | 'Persuasivo' | 'Profissional' | 'Entusiástico' | 'Educacional';

export interface EmailDraft {
  id: Id;
  leadId: Id;
  objective: string;
  tones: Tone[];
  subject: string;
  body: string;
  createdAt: string;
}

export interface CardDisplaySettings {
  showCompany: boolean;
  showValue: boolean;
  showTags: boolean;
  showProbability: boolean;
  showDueDate: boolean;
  showAssignedTo: boolean;
  showEmail: boolean;
  showPhone: boolean;
  showCreatedAt: boolean;
  showStage: boolean;
}

export interface ListDisplaySettings {
  showStatus: boolean;
  showValue: boolean;
  showTags: boolean;
  showLastActivity: boolean;
  showEmail: boolean;
  showPhone: boolean;
  showCreatedAt: boolean;
}

export interface ChatMessage {
    id: Id;
    conversationId: Id;
    senderId: string; // 'user1' (current user) or leadId
    text: string;
    timestamp: string; // ISO String
}

export type ChatConversationStatus = 'not_started' | 'waiting' | 'open' | 'automation' | 'finished' | 'failed';

export interface ChatConversation {
    id: Id;
    leadId: Id;
    lastMessage: string;
    lastMessageTimestamp: string;
    unreadCount: number;
    status: ChatConversationStatus;
}


export type CreateLeadData = Partial<Omit<Lead, 'id'>>;
export type UpdateLeadData = Partial<Omit<Lead, 'id'>>;
export type CreateTaskData = Omit<Task, 'id' | 'userId'>;
export type UpdateTaskData = Partial<CreateTaskData>;
export type CreateEmailDraftData = Omit<EmailDraft, 'id' | 'createdAt'>;
export type CreateGroupData = Omit<Group, 'id'>;
export type UpdateGroupData = Partial<CreateGroupData>;