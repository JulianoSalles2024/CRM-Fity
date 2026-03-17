import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/src/lib/supabase';

export interface ChannelConnection {
  id: string;
  company_id: string;
  owner_id: string | null;
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

export function useChannelConnections(
  companyId: string | null,
  options?: { userId?: string; role?: string }
) {
  const [connections, setConnections] = useState<ChannelConnection[]>([]);
  const [loading, setLoading] = useState(true);

  // useRef para evitar stale closure no callback do Realtime
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const fetchConnections = useCallback(async () => {
    if (!companyId) { setConnections([]); setLoading(false); return; }
    setLoading(true);
    let query = supabase
      .from('channel_connections')
      .select('*')
      .eq('company_id', companyId);

    // Sellers veem apenas a própria conexão
    const opts = optionsRef.current;
    if (opts?.role && opts.role !== 'admin' && opts?.userId) {
      query = query.eq('owner_id', opts.userId);
    }

    const { data, error } = await query.order('created_at', { ascending: true });
    if (!error && data) setConnections(data as ChannelConnection[]);
    setLoading(false);
  }, [companyId]); // companyId é a única dependência real

  // Fetch inicial
  useEffect(() => { fetchConnections(); }, [fetchConnections]);

  // Realtime — usa fetchRef para nunca ter stale closure
  const fetchRef = useRef(fetchConnections);
  fetchRef.current = fetchConnections;

  useEffect(() => {
    if (!companyId) return;

    const channelName = `channel_connections:${companyId}`;
    const sub = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'channel_connections',
          filter: `company_id=eq.${companyId}`,
        },
        () => fetchRef.current()
      )
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [companyId]); // só recria quando companyId muda

  const updateLocalState = useCallback((id: string, patch: Partial<ChannelConnection>) => {
    setConnections(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
  }, []);

  return { connections, loading, refetch: fetchConnections, updateLocalState };
}
