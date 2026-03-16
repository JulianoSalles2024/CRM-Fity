import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';

export interface ChannelConnection {
  id: string;
  company_id: string;
  channel: 'whatsapp' | 'email' | 'instagram' | 'telegram' | 'webchat';
  name: string;
  status: 'active' | 'inactive' | 'error';
  external_id: string | null;
  config: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Enriched by health check
  evolutionState?: 'open' | 'connecting' | 'close' | 'unknown' | 'checking';
  lastHealthCheck?: string;
}

export function useChannelConnections(companyId: string | null) {
  const [connections, setConnections] = useState<ChannelConnection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!companyId) { setConnections([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('channel_connections')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setConnections(data as ChannelConnection[]);
    }
    setLoading(false);
  }, [companyId]);

  useEffect(() => { fetch(); }, [fetch]);

  // Realtime
  useEffect(() => {
    if (!companyId) return;
    const sub = supabase
      .channel('channel_connections_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'channel_connections',
      }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [companyId, fetch]);

  const updateLocalState = useCallback((id: string, patch: Partial<ChannelConnection>) => {
    setConnections(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
  }, []);

  return { connections, loading, refetch: fetch, updateLocalState };
}
