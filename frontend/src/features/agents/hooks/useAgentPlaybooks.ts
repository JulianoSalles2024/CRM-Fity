import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/features/auth/AuthContext';
import type { AgentFunctionType } from './useAgents';

export interface AgentPlaybook {
  id: string;
  company_id: string;
  name: string;
  function_type: AgentFunctionType | 'generic' | null;
  opening_scripts: string[];
  objection_map: Record<string, string>;
  qualification_framework: 'bant' | 'spin' | 'meddic' | 'custom' | 'none';
  qualification_questions: { question: string; key: string }[];
  escalation_triggers: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type PlaybookInsert = Omit<AgentPlaybook,
  'id' | 'company_id' | 'created_at' | 'updated_at'
>;

export function useAgentPlaybooks() {
  const { companyId } = useAuth();
  const [playbooks, setPlaybooks] = useState<AgentPlaybook[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlaybooks = useCallback(async () => {
    if (!companyId) return;
    const { data } = await supabase
      .from('agent_playbooks')
      .select('*')
      .eq('company_id', companyId)
      .order('name', { ascending: true });
    setPlaybooks(data ?? []);
    setLoading(false);
  }, [companyId]);

  useEffect(() => { fetchPlaybooks(); }, [fetchPlaybooks]);

  const createPlaybook = useCallback(async (data: PlaybookInsert) => {
    if (!companyId) return null;
    const { data: created, error } = await supabase
      .from('agent_playbooks')
      .insert({ ...data, company_id: companyId })
      .select()
      .single();
    if (error) throw error;
    return created as AgentPlaybook;
  }, [companyId]);

  const updatePlaybook = useCallback(async (id: string, data: Partial<AgentPlaybook>) => {
    const { error } = await supabase
      .from('agent_playbooks')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    await fetchPlaybooks();
  }, [fetchPlaybooks]);

  const deletePlaybook = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('agent_playbooks')
      .delete()
      .eq('id', id);
    if (error) throw error;
    await fetchPlaybooks();
  }, [fetchPlaybooks]);

  return { playbooks, loading, createPlaybook, updatePlaybook, deletePlaybook, refetch: fetchPlaybooks };
}
