import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/features/auth/AuthContext';
import type { WeekDay } from '../AllowedScheduleModal';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DelayUnit = 'minutes' | 'hours' | 'days';

export interface FollowupRule {
  id:                 string;
  company_id:         string;
  created_by:         string | null;
  delay_value:        number;
  delay_unit:         DelayUnit;
  prompt:             string;
  allowed_days:       WeekDay[];
  allowed_start_time: string;
  allowed_end_time:   string;
  sequence_order:     number;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFollowupRules() {
  const { companyId, user } = useAuth();

  const [rules,     setRules]     = useState<FollowupRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving,  setIsSaving]  = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchRules = useCallback(async () => {
    if (!companyId) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('followup_rules')
      .select('*')
      .eq('company_id', companyId)
      .order('sequence_order', { ascending: true });

    if (error) {
      setError('Não foi possível carregar as regras. Verifique se a migration foi aplicada no Supabase.');
    } else {
      setRules((data ?? []) as FollowupRule[]);
      setError(null);
    }
    setIsLoading(false);
  }, [companyId]);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  // ── Add ────────────────────────────────────────────────────────────────────

  const addRule = async () => {
    if (!companyId || !user) return;
    setIsSaving(true);

    const { error } = await supabase.from('followup_rules').insert({
      company_id:         companyId,
      created_by:         user.id,
      delay_value:        1,
      delay_unit:         'hours',
      prompt:             '',
      allowed_days:       ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      allowed_start_time: '08:00',
      allowed_end_time:   '18:00',
      sequence_order:     rules.length + 1,
    });

    if (error) setError('Erro ao criar regra: ' + error.message);
    else await fetchRules();

    setIsSaving(false);
  };

  // ── Update ─────────────────────────────────────────────────────────────────

  const updateRule = async (rule: FollowupRule) => {
    setIsSaving(true);

    const { error } = await supabase
      .from('followup_rules')
      .update({
        delay_value:        rule.delay_value,
        delay_unit:         rule.delay_unit,
        prompt:             rule.prompt,
        allowed_days:       rule.allowed_days,
        allowed_start_time: rule.allowed_start_time,
        allowed_end_time:   rule.allowed_end_time,
      })
      .eq('id', rule.id)
      .eq('company_id', companyId!);

    if (!error) setRules(prev => prev.map(r => r.id === rule.id ? rule : r));

    setIsSaving(false);
  };

  // ── Delete + renumber ──────────────────────────────────────────────────────

  const deleteRule = async (id: string) => {
    setIsSaving(true);

    const { error } = await supabase
      .from('followup_rules')
      .delete()
      .eq('id', id)
      .eq('company_id', companyId!);

    if (!error) {
      const remaining = rules.filter(r => r.id !== id);
      // Renumera localmente enquanto salva em paralelo no banco
      const renumbered = remaining.map((r, i) => ({ ...r, sequence_order: i + 1 }));
      setRules(renumbered);

      await Promise.all(
        renumbered.map(r =>
          supabase
            .from('followup_rules')
            .update({ sequence_order: r.sequence_order })
            .eq('id', r.id)
        )
      );
    }

    setIsSaving(false);
  };

  return { rules, isLoading, isSaving, error, addRule, updateRule, deleteRule };
}
