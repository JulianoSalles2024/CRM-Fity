import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';
import type { SupportTicket, TicketStatus, TicketPriority } from '../support.types';

export function useTickets(isAdmin: boolean, userId: string | null) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCount, setOpenCount] = useState(0);

  const fetchTickets = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    let query = supabase
      .from('support_tickets')
      .select('*, category:support_categories(*)')
      .order('created_at', { ascending: false });

    if (!isAdmin) {
      query = query.eq('opened_by', userId);
    }

    const { data } = await query;
    const result = (data ?? []) as SupportTicket[];
    setTickets(result);
    setOpenCount(result.filter(t => t.status === 'open' || t.status === 'reopened').length);
    setLoading(false);
  }, [isAdmin, userId]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const createTicket = async (subject: string, categoryId: string | null, priority: TicketPriority) => {
    const { error } = await supabase.from('support_tickets').insert({
      subject,
      category_id: categoryId,
      priority,
    });
    if (!error) fetchTickets();
    return { error };
  };

  const updateTicketStatus = async (ticketId: string, status: TicketStatus) => {
    const { error } = await supabase
      .from('support_tickets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', ticketId);
    if (!error) fetchTickets();
    return { error };
  };

  return { tickets, loading, openCount, createTicket, updateTicketStatus, refetch: fetchTickets };
}
