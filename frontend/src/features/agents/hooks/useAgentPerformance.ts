import { useState, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/features/auth/AuthContext';

export interface AgentDailyPerformance {
  id: string;
  agent_id: string;
  company_id: string;
  period_date: string;
  leads_found: number;
  approaches: number;
  responses: number;
  qualified: number;
  meetings: number;
  sales: number;
  escalations: number;
  revenue: number;
  commission: number;
  tokens_used: number;
}

export type PerformancePeriod = 'today' | 'week' | 'month' | 'custom';

function getPeriodDates(period: PerformancePeriod): { start: string; end: string } {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const today = fmt(now);

  if (period === 'today') return { start: today, end: today };

  if (period === 'week') {
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    return { start: fmt(start), end: today };
  }

  if (period === 'month') {
    return { start: fmt(new Date(now.getFullYear(), now.getMonth(), 1)), end: today };
  }

  return { start: today, end: today };
}

export function useAgentPerformance() {
  const { companyId } = useAuth();
  const [loading, setLoading] = useState(false);

  const fetchRanking = useCallback(async (
    period: PerformancePeriod,
    customStart?: string,
    customEnd?: string
  ) => {
    if (!companyId) return [];
    setLoading(true);
    const { start, end } = period === 'custom' && customStart && customEnd
      ? { start: customStart, end: customEnd }
      : getPeriodDates(period);
    try {
      const { data, error } = await supabase.rpc('get_agent_ranking', {
        p_company_id: companyId,
        p_start: start,
        p_end: end,
      });
      if (error) throw error;
      return data ?? [];
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const fetchAgentDaily = useCallback(async (
    agentId: string,
    period: PerformancePeriod,
    customStart?: string,
    customEnd?: string
  ): Promise<AgentDailyPerformance[]> => {
    if (!companyId) return [];
    const { start, end } = period === 'custom' && customStart && customEnd
      ? { start: customStart, end: customEnd }
      : getPeriodDates(period);

    const { data } = await supabase
      .from('agent_performance')
      .select('*')
      .eq('agent_id', agentId)
      .gte('period_date', start)
      .lte('period_date', end)
      .order('period_date', { ascending: true });
    return (data ?? []) as AgentDailyPerformance[];
  }, [companyId]);

  // Totais do dia para a Central de Comando
  const fetchTodayTotals = useCallback(async () => {
    if (!companyId) return null;
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('agent_performance')
      .select('approaches,responses,qualified,meetings,sales,revenue,escalations')
      .eq('company_id', companyId)
      .eq('period_date', today);

    if (!data || data.length === 0) return null;

    return data.reduce((acc, row) => ({
      approaches:  acc.approaches  + (row.approaches  ?? 0),
      responses:   acc.responses   + (row.responses   ?? 0),
      qualified:   acc.qualified   + (row.qualified   ?? 0),
      meetings:    acc.meetings    + (row.meetings    ?? 0),
      sales:       acc.sales       + (row.sales       ?? 0),
      revenue:     acc.revenue     + (row.revenue     ?? 0),
      escalations: acc.escalations + (row.escalations ?? 0),
    }), { approaches: 0, responses: 0, qualified: 0, meetings: 0, sales: 0, revenue: 0, escalations: 0 });
  }, [companyId]);

  return { loading, fetchRanking, fetchAgentDaily, fetchTodayTotals };
}
