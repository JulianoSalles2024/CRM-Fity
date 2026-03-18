import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/features/auth/AuthContext';

export type AgentFunctionType =
  | 'hunter' | 'sdr' | 'closer' | 'followup' | 'curator' | 'supervisor';

export type AgentTone =
  | 'formal' | 'consultivo' | 'descontraido' | 'tecnico' | 'agressivo';

export interface AIAgent {
  id: string;
  company_id: string;
  name: string;
  avatar_icon: string;
  avatar_color: string;
  function_type: AgentFunctionType;
  tone: AgentTone;
  niche: string | null;
  client_type: 'low' | 'medium' | 'high';
  monthly_goal: number | null;
  goal_metric: 'leads' | 'meetings' | 'sales' | 'revenue' | 'qualified';
  channels: string[];
  lead_sources: string[];
  work_hours_start: string;
  work_hours_end: string;
  timezone: string;
  playbook_id: string | null;
  opening_script: string | null;
  escalate_rules: {
    max_followups: number;
    min_ticket_to_escalate: number | null;
    keywords: string[];
    escalate_on_high_interest: boolean;
  };
  is_active: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export type AgentInsert = Omit<AIAgent,
  'id' | 'company_id' | 'created_at' | 'updated_at' | 'is_archived'
>;

export interface AgentRanking {
  agent_id: string;
  agent_name: string;
  function_type: AgentFunctionType;
  avatar_color: string;
  is_active: boolean;
  total_approaches: number;
  total_responses: number;
  total_qualified: number;
  total_meetings: number;
  total_sales: number;
  total_escalations: number;
  total_revenue: number;
  total_tokens: number;
  response_rate: number;
  conversion_rate: number;
}

export function useAgents() {
  const { companyId } = useAuth();
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgents = useCallback(async () => {
    if (!companyId) return;
    const { data } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_archived', false)
      .order('created_at', { ascending: true });
    setAgents(data ?? []);
    setLoading(false);
  }, [companyId]);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  // Realtime
  useEffect(() => {
    if (!companyId) return;
    const channel = supabase
      .channel('ai_agents_realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ai_agents',
        filter: `company_id=eq.${companyId}`,
      }, fetchAgents)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [companyId, fetchAgents]);

  const createAgent = useCallback(async (data: AgentInsert) => {
    if (!companyId) return null;
    const { data: created, error } = await supabase
      .from('ai_agents')
      .insert({ ...data, company_id: companyId })
      .select()
      .single();
    if (error) throw error;
    return created as AIAgent;
  }, [companyId]);

  const updateAgent = useCallback(async (id: string, data: Partial<AIAgent>) => {
    const { error } = await supabase
      .from('ai_agents')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  }, []);

  const toggleActive = useCallback(async (id: string, isActive: boolean) => {
    await updateAgent(id, { is_active: isActive });
  }, [updateAgent]);

  const archiveAgent = useCallback(async (id: string) => {
    await updateAgent(id, { is_archived: true, is_active: false });
  }, [updateAgent]);

  // Ranking via RPC
  const fetchRanking = useCallback(async (
    start?: string, end?: string
  ): Promise<AgentRanking[]> => {
    if (!companyId) return [];
    const { data, error } = await supabase.rpc('get_agent_ranking', {
      p_company_id: companyId,
      ...(start ? { p_start: start } : {}),
      ...(end   ? { p_end:   end   } : {}),
    });
    if (error) throw error;
    return (data ?? []) as AgentRanking[];
  }, [companyId]);

  return {
    agents,
    loading,
    createAgent,
    updateAgent,
    toggleActive,
    archiveAgent,
    fetchRanking,
    refetch: fetchAgents,
  };
}
