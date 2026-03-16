import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';

export interface WebhookEvent {
  id: string;
  company_id: string | null;
  source: string;
  external_id: string;
  status: 'received' | 'processed' | 'failed' | 'duplicate';
  payload: Record<string, any>;
  error: string | null;
  created_at: string;
  processed_at: string | null;
}

export function useWebhookEvents(companyId: string | null, limit = 30) {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!companyId) { setEvents([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('webhook_events')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!error && data) setEvents(data as WebhookEvent[]);
    setLoading(false);
  }, [companyId, limit]);

  useEffect(() => { fetch(); }, [fetch]);

  // Realtime — new events pushed as they arrive
  useEffect(() => {
    if (!companyId) return;
    const sub = supabase
      .channel('webhook_events_feed')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'webhook_events',
      }, (payload) => {
        const ev = payload.new as WebhookEvent;
        if (ev.company_id !== companyId) return;
        setEvents(prev => [ev, ...prev].slice(0, limit));
      })
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [companyId, limit, fetch]);

  return { events, loading, refetch: fetch };
}
