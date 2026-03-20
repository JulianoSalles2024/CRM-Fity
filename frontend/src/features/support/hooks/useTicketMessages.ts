import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';
import type { SupportMessage } from '../support.types';

export function useTicketMessages(ticketId: string | null, isAdmin: boolean) {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!ticketId) return;
    setLoading(true);
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    const all = (data ?? []) as SupportMessage[];
    // Sellers don't see internal notes
    setMessages(isAdmin ? all : all.filter(m => !m.is_internal));
    setLoading(false);
  }, [ticketId, isAdmin]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // Realtime: new INSERT on current ticket → refetch
  useEffect(() => {
    if (!ticketId) return;
    const channel = supabase
      .channel(`support_messages:${ticketId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_messages',
        filter: `ticket_id=eq.${ticketId}`,
      }, () => { fetchMessages(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [ticketId, fetchMessages]);

  const sendMessage = async (content: string, isInternal = false) => {
    const { error } = await supabase.from('support_messages').insert({
      ticket_id: ticketId,
      content,
      is_internal: isInternal,
    });
    if (!error) fetchMessages();
    return { error };
  };

  return { messages, loading, sendMessage };
}
