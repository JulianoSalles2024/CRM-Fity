import { useEffect, useState } from 'react'
import { supabase } from '@/src/lib/supabase'

export interface PlanConfig {
  slug: string
  display_name: string
  description: string | null
  is_popular: boolean
  is_active: boolean
  sort_order: number
  price_monthly_cents: number
  price_yearly_cents: number
  max_pipelines: number | null
  max_leads: number | null
  max_users: number | null
  max_agents: number | null
  max_whatsapp_instances: number | null
  max_playbooks: number | null
  max_custom_fields: number | null
  max_sellers: number | null
  max_admins: number | null
}

export function usePlanConfigs() {
  const [plans, setPlans] = useState<PlanConfig[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('plan_configs')
      .select('*')
      .eq('is_active', true)
      .neq('slug', 'trial')
      .order('sort_order')
      .then(({ data }) => {
        if (data) setPlans(data as PlanConfig[])
        setLoading(false)
      })
  }, [])

  /** Preço mensal em reais (centavos / 100) */
  function monthlyPrice(slug: string): number {
    const plan = plans.find(p => p.slug === slug)
    return plan ? plan.price_monthly_cents / 100 : 0
  }

  return { plans, loading, monthlyPrice }
}
