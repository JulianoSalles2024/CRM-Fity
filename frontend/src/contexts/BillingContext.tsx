import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/features/auth/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PlanStatus = 'trial' | 'active' | 'suspended';
export type PlanSlug   = 'trial' | 'legacy' | 'starter' | 'growth' | 'scale';
export type SubStatus  = 'trialing' | 'active' | 'past_due' | 'unpaid' | 'canceled' | 'suspended';

export interface BillingData {
  plan_status:           PlanStatus;
  plan_slug:             PlanSlug;
  trial_ends_at:         string | null;
  plan_expires_at:       string | null;
  sub_status?:           SubStatus;
  billing_interval?:     'monthly' | 'yearly';
  current_period_end?:   string | null;
  grace_period_end?:     string | null;
  cancel_at_period_end?: boolean;
}

export interface BillingContextValue {
  billing:       BillingData | null;
  isLoading:     boolean;
  daysRemaining: number;
  isTrialExpired: boolean;
  isTrial:       boolean;
  isActive:      boolean;
  refetch:       () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────

const BillingContext = createContext<BillingContextValue | null>(null);

export const BillingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { companyId } = useAuth();
  const [billing, setBilling]   = useState<BillingData | null>(null);
  const [isLoading, setLoading] = useState(true);

  const fetchBilling = useCallback(async () => {
    if (!companyId) { setLoading(false); return; }
    setLoading(true);

    // Tentar RPC consolidado (migration 118)
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_billing_status', { p_company_id: companyId });

    if (!rpcError && rpcData) {
      setBilling(rpcData as BillingData);
    } else {
      // Fallback para companies direto
      const { data } = await supabase
        .from('companies')
        .select('plan_status, plan_slug, trial_ends_at, plan_expires_at')
        .eq('id', companyId)
        .maybeSingle();
      if (data) setBilling(data as BillingData);
    }

    setLoading(false);
  }, [companyId]);

  useEffect(() => { fetchBilling(); }, [fetchBilling]);

  // ── Realtime: escuta companies + subscriptions ─────────────
  useEffect(() => {
    if (!companyId) return;

    const channel = supabase
      .channel(`billing:${companyId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'companies',
        filter: `id=eq.${companyId}`,
      }, () => fetchBilling())
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'subscriptions',
        filter: `company_id=eq.${companyId}`,
      }, () => fetchBilling())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [companyId, fetchBilling]);

  // ── Derivados ──────────────────────────────────────────────
  const now      = Date.now();
  const trialEnd = billing?.trial_ends_at ? new Date(billing.trial_ends_at).getTime() : null;
  const daysRemaining = trialEnd
    ? Math.max(0, Math.floor((trialEnd - now) / 86_400_000))
    : 0;

  const isTrial        = billing?.plan_status === 'trial';
  const isTrialExpired = isTrial && daysRemaining === 0;
  const isActive       = billing?.plan_status === 'active';

  return (
    <BillingContext.Provider value={{
      billing, isLoading, daysRemaining, isTrialExpired, isTrial, isActive,
      refetch: fetchBilling,
    }}>
      {children}
    </BillingContext.Provider>
  );
};

export function useBilling(): BillingContextValue {
  const ctx = useContext(BillingContext);
  if (!ctx) throw new Error('useBilling must be used inside <BillingProvider>');
  return ctx;
}
