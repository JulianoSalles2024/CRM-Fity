import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';

export interface OutgoingWebhook {
  id: string;
  company_id: string;
  url: string;
  events: string[];
  is_active: boolean;
  created_at: string;
}

export function useOutgoingWebhooks(companyId: string | null) {
  const [webhooks, setWebhooks] = useState<OutgoingWebhook[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!companyId) { setWebhooks([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('outgoing_webhooks')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    if (!error && data) setWebhooks(data as OutgoingWebhook[]);
    setLoading(false);
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  // Realtime
  useEffect(() => {
    if (!companyId) return;
    const sub = supabase
      .channel('outgoing_webhooks_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'outgoing_webhooks' }, load)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [companyId, load]);

  const add = useCallback(async (url: string, events: string[]): Promise<void> => {
    const { error } = await supabase
      .from('outgoing_webhooks')
      .insert({ company_id: companyId, url, events, is_active: true });
    if (error) throw new Error(error.message);
    await load();
  }, [companyId, load]);

  const remove = useCallback(async (id: string): Promise<void> => {
    setWebhooks(prev => prev.filter(w => w.id !== id)); // optimistic
    const { error } = await supabase.from('outgoing_webhooks').delete().eq('id', id);
    if (error) await load(); // rollback
  }, [load]);

  const toggle = useCallback(async (id: string, active: boolean): Promise<void> => {
    setWebhooks(prev => prev.map(w => w.id === id ? { ...w, is_active: active } : w));
    await supabase.from('outgoing_webhooks').update({ is_active: active }).eq('id', id);
  }, []);

  return { webhooks, loading, add, remove, toggle, refetch: load };
}
