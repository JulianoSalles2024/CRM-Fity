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


export type CreateLeadData = Partial<Omit<Lead, 'id'>>;
export type UpdateLeadData = Partial<Omit<Lead, 'id'>>;
export type CreateTaskData = Omit<Task, 'id' | 'userId'>;
export type UpdateTaskData = Partial<CreateTaskData>;
export type CreateEmailDraftData = Omit<EmailDraft, 'id' | 'createdAt'>;