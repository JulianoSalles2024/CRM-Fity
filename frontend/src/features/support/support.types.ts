export interface SupportCategory {
  id: string;
  name: string;
  icon: string | null;
  order: number;
  created_at: string;
}

export interface SupportArticle {
  id: string;
  category_id: string | null;
  title: string;
  content: string;
  slug: string;
  published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  category?: SupportCategory;
}

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'reopened';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface SupportTicket {
  id: string;
  company_id: string;
  opened_by: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  category_id: string | null;
  created_at: string;
  updated_at: string;
  category?: SupportCategory;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  author_id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
}
