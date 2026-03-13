import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/features/auth/AuthContext';

export interface OmniMessage {
  id: string;
  company_id: string;
  conversation_id: string;
  external_message_id: string | null;
  direction: 'inbound' | 'outbound';
  sender_type: 'lead' | 'agent' | 'bot' | 'system';
  sender_id: string | null;
  content: string | null;
  content_type: string;
  status: string | null;
  metadata: Record<string, any>;
  sent_at: string;
  created_at: string;
}

export function useMessages(conversationId: string | null) {
  const { companyId } = useAuth();
  const [messages, setMessages] = useState<OmniMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!conversationId || !companyId) { setMessages([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('company_id', companyId)
      .order('created_at', { ascending: true });
    if (!error && data) setMessages(data as OmniMessage[]);
    setLoading(false);
  }, [conversationId, companyId]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`omni-messages-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as OmniMessage]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  return { messages, loading };
}
