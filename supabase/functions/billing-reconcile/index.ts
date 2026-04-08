// ============================================================
// EDGE FUNCTION: billing-reconcile
// POST /functions/v1/billing-reconcile
// ============================================================
// Cron diário (03:00 BRT) que mantém billing consistente.
// Header obrigatório: x-cron-secret
//
// Responsabilidades:
//   1. Expirar trials que passaram de trial_ends_at
//   2. Gerar cobranças de renovação para subscriptions ativas vencidas
//   3. Escalar past_due sem grace period para suspended
//   4. Cancelar suspensos > 14 dias
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ASAAS_API_KEY         = Deno.env.get('ASAAS_API_KEY')!
const ASAAS_API_URL         = Deno.env.get('ASAAS_API_URL') ?? 'https://sandbox.asaas.com/api/v3'
const BILLING_CRON_SECRET   = Deno.env.get('BILLING_CRON_SECRET')!

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  const secret = req.headers.get('x-cron-secret')
  if (!BILLING_CRON_SECRET || secret !== BILLING_CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 })
  }

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
    auth: { persistSession: false },
  })

  const now = new Date()
  const report = {
    trials_expired:     0,
    renewals_generated: 0,
    grace_escalated:    0,
    canceled:           0,
    errors:             [] as string[],
  }

  // ── 1. Expirar trials vencidos ────────────────────────────
  try {
    const { data: expiredTrials } = await db
      .from('companies')
      .select('id')
      .eq('plan_status', 'trial')
      .lt('trial_ends_at', now.toISOString())

    for (const company of (expiredTrials ?? [])) {
      await db.from('companies').update({ plan_status: 'suspended' }).eq('id', company.id)
      await db.from('subscriptions').update({ status: 'canceled' }).eq('company_id', company.id).eq('status', 'trialing')
      report.trials_expired++
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    report.errors.push(`trials: ${msg}`)
  }

  // ── 2. Gerar renovações ───────────────────────────────────
  try {
    const { data: toRenew } = await db
      .from('subscriptions')
      .select('id, company_id, gateway_customer_id, billing_interval, payment_type, plan_slug')
      .eq('status', 'active')
      .eq('cancel_at_period_end', false)
      .lt('current_period_end', now.toISOString())

    for (const sub of (toRenew ?? [])) {
      try {
        const amountCents = getPlanPrice(sub.plan_slug, sub.billing_interval)
        if (!amountCents) continue

        const dueDate    = addDays(now, 3)
        const dueDateStr = formatDate(dueDate)

        const asaasPayment = await asaasFetch('POST', '/payments', {
          customer:          sub.gateway_customer_id,
          billingType:       toBillingType(sub.payment_type ?? 'pix'),
          value:             amountCents / 100,
          dueDate:           dueDateStr,
          description:       `Renovação ${sub.plan_slug} - ${sub.billing_interval === 'yearly' ? 'Anual' : 'Mensal'} (NextSales)`,
          externalReference: sub.company_id,
        })

        if (asaasPayment.id) {
          await db.from('invoices').insert({
            company_id:         sub.company_id,
            gateway_invoice_id: asaasPayment.id,
            plan_slug:          sub.plan_slug,
            status:             'pending',
            payment_type:       sub.payment_type ?? 'pix',
            amount_cents:       amountCents,
            due_date:           dueDateStr,
            payment_url:        asaasPayment.invoiceUrl ?? null,
            description:        `Renovação ${sub.plan_slug}`,
            gateway_response:   asaasPayment,
          })

          const gracePeriodEnd = addDays(now, 7)
          await db.from('subscriptions').update({
            status:           'past_due',
            grace_period_end: gracePeriodEnd.toISOString(),
          }).eq('id', sub.id)

          report.renewals_generated++
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        report.errors.push(`renewal ${sub.company_id}: ${msg}`)
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    report.errors.push(`renewals: ${msg}`)
  }

  // ── 3. Escalar past_due com grace period expirado ─────────
  try {
    const { data: overdue } = await db
      .from('subscriptions')
      .select('company_id')
      .eq('status', 'past_due')
      .lt('grace_period_end', now.toISOString())

    for (const sub of (overdue ?? [])) {
      await db.from('subscriptions').update({ status: 'unpaid' }).eq('company_id', sub.company_id)
      await db.from('companies').update({ plan_status: 'suspended' }).eq('id', sub.company_id)
      report.grace_escalated++
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    report.errors.push(`grace: ${msg}`)
  }

  // ── 4. Cancelar unpaid > 14 dias ──────────────────────────
  try {
    const cutoff = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    const { data: toCancel } = await db
      .from('subscriptions')
      .select('company_id')
      .eq('status', 'unpaid')
      .lt('updated_at', cutoff.toISOString())

    for (const sub of (toCancel ?? [])) {
      await db.from('subscriptions').update({
        status:      'canceled',
        canceled_at: now.toISOString(),
      }).eq('company_id', sub.company_id)
      report.canceled++
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    report.errors.push(`cancel: ${msg}`)
  }

  console.log('[billing-reconcile] Relatório:', JSON.stringify(report))

  return new Response(JSON.stringify({ ok: true, ...report }), {
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
})

// ── Helpers ───────────────────────────────────────────────────

const PLAN_PRICES: Record<string, Record<string, number>> = {
  starter: { monthly: 29700,  yearly: 267300  },
  growth:  { monthly: 69700,  yearly: 627300  },
  scale:   { monthly: 149700, yearly: 1347300 },
}

function getPlanPrice(slug: string, interval: string): number | null {
  return PLAN_PRICES[slug]?.[interval] ?? null
}

async function asaasFetch(method: string, path: string, body?: unknown) {
  const res = await fetch(`${ASAAS_API_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'access_token': ASAAS_API_KEY },
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json()
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function toBillingType(type: string): string {
  return { boleto: 'BOLETO', pix: 'PIX', credit_card: 'CREDIT_CARD' }[type] ?? 'PIX'
}
