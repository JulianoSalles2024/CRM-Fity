import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/features/auth/AuthContext';

export type MemoryStage =
  | 'new' | 'approached' | 'responded' | 'qualifying' | 'qualified'
  | 'meeting_scheduled' | 'proposal_sent' | 'negotiating'
  | 'closed_won' | 'closed_lost' | 'inactive';

export interface AgentLeadMemory {
  id: string;
  agent_id: string;
  lead_id: string;
  company_id: string;
  stage: MemoryStage;
  interest_level: 'low' | 'medium' | 'high' | 'very_high' | null;
  detected_objections: string[];
  presented_product_id: string | null;
  budget_detected: number | null;
  decision_maker: boolean | null;
  timeline_detected: string | null;
  last_action: string | null;
  last_action_at: string | null;
  next_action: string | null;
  next_action_at: string | null;
  next_action_type: 'followup' | 'call' | 'meeting' | 'proposal' | 'none' | null;
  approach_count: number;
  followup_count: number;
  response_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentRun {
  id: string;
  agent_id: string;
  lead_id: string;
  run_type: string;
  channel: string;
  input_text: string | null;
  output_text: string | null;
  outcome: string | null;
  decision: Record<string, unknown> | null;
  tokens_input: number | null;
  tokens_output: number | null;
  created_at: string;
}

export function useAgentLeadMemory(agentId?: string, leadId?: string) {
  const { companyId } = useAuth();
  const [memory, setMemory] = useState<AgentLeadMemory | null>(null);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMemory = useCallback(async () => {
    if (!agentId || !leadId) return;
    setLoading(true);
    const [memRes, runsRes] = await Promise.all([
      supabase
        .from('agent_lead_memory')
        .select('*')
        .eq('agent_id', agentId)
        .eq('lead_id', leadId)
        .maybeSingle(),
      supabase
        .from('agent_runs')
        .select('id,agent_id,lead_id,run_type,channel,input_text,output_text,outcome,decision,tokens_input,tokens_output,created_at')
        .eq('agent_id', agentId)
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);
    setMemory((memRes.data as AgentLeadMemory) ?? null);
    setRuns((runsRes.data ?? []) as AgentRun[]);
    setLoading(false);
  }, [agentId, leadId]);

  useEffect(() => { fetchMemory(); }, [fetchMemory]);

  // Fila do agente (leads pendentes)
  const fetchAgentQueue = useCallback(async (limit = 20) => {
    if (!agentId || !companyId) return [];
    const { data } = await supabase
      .rpc('get_agent_lead_queue', { p_agent_id: agentId, p_limit: limit });
    return data ?? [];
  }, [agentId, companyId]);

  return { memory, runs, loading, fetchAgentQueue, refetch: fetchMemory };
}
