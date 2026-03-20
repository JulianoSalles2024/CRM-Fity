import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/features/auth/AuthContext';
import type { AgentRun } from './useAgentLeadMemory';

export interface AgentQueueItem {
  lead_id: string;
  lead_name: string;
  stage: string;
  interest_level: string | null;
  next_action_at: string | null;
  next_action_type: string | null;
  approach_count: number;
  followup_count: number;
}

export interface AgentTodayPerf {
  approaches: number;
  responses: number;
  escalations: number;
  sales: number;
  qualified: number;
  tokens_used: number;
}

export function useAgentDetail(agentId: string | null) {
  const { companyId } = useAuth();
  const [queue, setQueue] = useState<AgentQueueItem[]>([]);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [perf, setPerf] = useState<AgentTodayPerf | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!agentId || !companyId) return;
    setLoading(true);

    const today = new Date().toISOString().slice(0, 10);

    const [queueRes, runsRes, perfRes] = await Promise.all([
      supabase.rpc('get_agent_lead_queue', { p_agent_id: agentId, p_limit: 30 }),
      supabase
        .from('agent_runs')
        .select('id,agent_id,lead_id,run_type,channel,input_text,output_text,outcome,decision,tokens_input,tokens_output,created_at')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(30),
      supabase
        .from('agent_performance')
        .select('approaches,responses,escalations,sales,qualified,tokens_used')
        .eq('agent_id', agentId)
        .eq('period_date', today)
        .maybeSingle(),
    ]);

    setQueue((queueRes.data ?? []) as AgentQueueItem[]);
    setRuns((runsRes.data ?? []) as AgentRun[]);
    setPerf(perfRes.data ?? { approaches: 0, responses: 0, escalations: 0, sales: 0, qualified: 0, tokens_used: 0 });
    setLoading(false);
  }, [agentId, companyId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { queue, runs, perf, loading, refetch: fetch };
}
