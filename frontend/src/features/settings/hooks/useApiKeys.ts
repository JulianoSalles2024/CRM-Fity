import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';

export interface ApiKey {
  id: string;
  name: string;
  key_preview: string;
  last_used_at: string | null;
  created_at: string;
}

export function useApiKeys(companyId: string | null) {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!companyId) { setKeys([]); setLoading(false); return; }
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/api-keys', {
      headers: { Authorization: `Bearer ${session?.access_token ?? ''}` },
    });
    if (res.ok) {
      const body = await res.json();
      setKeys(body.keys ?? []);
    }
    setLoading(false);
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  // Realtime — refreshes list on any change to api_keys
  useEffect(() => {
    if (!companyId) return;
    const sub = supabase
      .channel('api_keys_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'api_keys' }, load)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [companyId, load]);

  /** Creates a key via backend. Returns the plain token (show once). */
  const create = useCallback(async (name: string): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/api-keys', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token ?? ''}`,
      },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? 'Erro ao criar chave.');
    }
    const data = await res.json();
    await load();
    return data.key as string;
  }, [load]);

  /** Revokes (deletes) a key. Optimistic removal. */
  const revoke = useCallback(async (id: string) => {
    setKeys(prev => prev.filter(k => k.id !== id));
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`/api/api-keys/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session?.access_token ?? ''}` },
    });
    if (!res.ok) await load(); // rollback on error
  }, [load]);

  return { keys, loading, create, revoke, refetch: load };
}
