import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/features/auth/AuthContext';

/**
 * Lightweight hook — only fetches the count of AI-escalated conversations.
 * Used by Sidebar to show a badge on "Omnichannel" without loading full conversation data.
 *
 * Escalated = status IN ('in_progress') AND ai_agent_id IS NOT NULL AND assignee_id = me
 */
export function useAiEscalationCount(): number {
  const { user, companyId } = useAuth();
  const [count, setCount] = useState(0);

  const fetchCount = async () => {
    if (!companyId || !user?.id) return;
    const { count: c } = await supabase
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('assignee_id', user.id)
      .eq('status', 'in_progress')
      .not('ai_agent_id', 'is', null);
    setCount(c ?? 0);
  };

  const fetchRef = useRef(fetchCount);
  useEffect(() => { fetchRef.current = fetchCount; });

  useEffect(() => {
    fetchRef.current();
  }, [companyId, user?.id]);

  // Subscribe to conversation changes — refetch count on any change
  useEffect(() => {
    if (!companyId) return;
    const channel = supabase
      .channel(`ai-escalation-count-${companyId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `company_id=eq.${companyId}`,
      }, () => fetchRef.current())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [companyId]);

  return count;
}
