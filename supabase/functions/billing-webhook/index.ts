// ============================================================
// EDGE FUNCTION: billing-webhook
// POST /functions/v1/billing-webhook
// ============================================================
// Recebe webhooks do Asaas (público, validado por token fixo).
// Retorna 200 imediatamente; processa de forma síncrona mas rápida.
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ASAAS_WEBHOOK_TOKEN   = Deno.env.get('ASAAS_WEBHOOK_TOKEN')!

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  'https://www.asaas.com',
  'Access-Control-Allow-Headers': 'content-type, asaas-access-token',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  // ── 1. Validar token ──────────────────────────────────────
  const webhookToken = req.headers.get('asaas-access-token')
  if (!ASAAS_WEBHOOK_TOKEN || webhookToken !== ASAAS_WEBHOOK_TOKEN) {
    console.error('[billing-webhook] Token inválido:', webhookToken?.slice(0, 8))
    return new Response('Unauthorized', { status: 401 })
  }

  // ── 2. Parsear payload ────────────────────────────────────
  let payload: AsaasWebhookPayload
  try { payload = await req.json() } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const { event, payment } = payload
  if (!event || !payment?.id) {
    return new Response('Invalid payload', { status: 400 })
  }

  const eventId = `${payment.id}:${event}`

  // ── 3. Idempotência: registrar evento ─────────────────────
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
    auth: { persistSession: false },
  })

  const { data: inserted, error: insertError } = await db
    .from('billing_events')
    .insert({
      gateway:    'asaas',
      event_id:   eventId,
      event_type: event,
      payload,
      processed:  false,
    })
    .select('id')
    .single()

  if (insertError) {
    if (insertError.code === '23505') {
      console.log('[billing-webhook] Duplicado ignorado:', eventId)
      return new Response('OK', { status: 200 })
    }
    console.error('[billing-webhook] Erro ao inserir evento:', insertError)
    return new Response('OK', { status: 200 }) // evita flood de reenvios
  }

  // ── 4. Processar evento ───────────────────────────────────
  await processEvent(db, inserted.id, event, payment).catch((err) => {
    console.error('[billing-webhook] Erro no processamento:', err)
  })

  return new Response('OK', { status: 200 })
})

// ─────────────────────────────────────────────────────────────

async function processEvent(
  db: ReturnType<typeof createClient>,
  eventDbId: string,
  eventType: string,
  payment: AsaasPayment,
) {
  try {
    switch (eventType) {
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_CONFIRMED':
        await handlePaymentReceived(db, payment)
        break

      case 'PAYMENT_OVERDUE':
        await handlePaymentOverdue(db, payment)
        break

      case 'PAYMENT_DELETED':
      case 'PAYMENT_REFUNDED':
      case 'PAYMENT_CHARGEBACK_REQUESTED':
        await handlePaymentCanceled(db, payment, eventType)
        break

      case 'SUBSCRIPTION_DELETED':
        await handleSubscriptionDeleted(db, payment)
        break

      default:
        console.log('[billing-webhook] Evento não tratado:', eventType)
    }

    await db
      .from('billing_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('id', eventDbId)

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[billing-webhook] Erro ao processar:', eventType, msg)
    await db.from('billing_events').update({ error: msg }).eq('id', eventDbId)
  }
}

// ── Handlers ──────────────────────────────────────────────────

async function handlePaymentReceived(
  db: ReturnType<typeof createClient>,
  payment: AsaasPayment,
) {
  const companyId = await findCompanyByCustomer(db, payment.customer, payment.id)
  if (!companyId) {
    console.warn('[billing-webhook] Empresa não encontrada para customer:', payment.customer)
    return
  }

  // Atualizar invoice
  const { data: updatedRows } = await db
    .from('invoices')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('gateway_invoice_id', payment.id)
    .select('id')

  if (!updatedRows || updatedRows.length === 0) {
    // Fallback: atualizar invoice pendente mais recente
    const { data: pending } = await db
      .from('invoices')
      .select('id')
      .eq('company_id', companyId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (pending) {
      await db
        .from('invoices')
        .update({ status: 'paid', paid_at: new Date().toISOString(), gateway_invoice_id: payment.id })
        .eq('id', pending.id)
    }
  }

  // Buscar subscription para saber plano e intervalo
  const { data: sub } = await db
    .from('subscriptions')
    .select('plan_slug, billing_interval, status')
    .eq('company_id', companyId)
    .single()

  if (!sub) return

  const now     = new Date()
  const days    = sub.billing_interval === 'yearly' ? 365 : 30
  const periodEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

  // Ativar empresa
  await db.from('companies').update({
    plan_status:     'active',
    plan_slug:       sub.plan_slug,
    plan_expires_at: periodEnd.toISOString(),
  }).eq('id', companyId)

  // Ativar subscription
  await db.from('subscriptions').update({
    status:               'active',
    grace_period_end:     null,
    current_period_start: now.toISOString(),
    current_period_end:   periodEnd.toISOString(),
  }).eq('company_id', companyId)

  console.log('[billing-webhook] Pagamento confirmado, empresa ativa:', companyId)

  // Notificar n8n para nova assinatura
  if (sub.status === 'trialing' || sub.status === 'past_due') {
    await notifyN8n(db, companyId, 'nova_assinatura', payment.value)
  }
}

async function handlePaymentOverdue(
  db: ReturnType<typeof createClient>,
  payment: AsaasPayment,
) {
  const companyId = await findCompanyByCustomer(db, payment.customer, payment.id)
  if (!companyId) return

  await db
    .from('invoices')
    .update({ status: 'overdue' })
    .eq('gateway_invoice_id', payment.id)

  const gracePeriodEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await db.from('subscriptions').update({
    status:           'past_due',
    grace_period_end: gracePeriodEnd.toISOString(),
  }).eq('company_id', companyId).in('status', ['active', 'trialing'])

  console.log('[billing-webhook] Vencido, grace period até:', gracePeriodEnd.toISOString())
}

async function handlePaymentCanceled(
  db: ReturnType<typeof createClient>,
  payment: AsaasPayment,
  eventType: string,
) {
  const status = eventType === 'PAYMENT_REFUNDED' ? 'refunded' : 'canceled'
  await db.from('invoices').update({ status }).eq('gateway_invoice_id', payment.id)
}

async function handleSubscriptionDeleted(
  db: ReturnType<typeof createClient>,
  payment: AsaasPayment,
) {
  const companyId = await findCompanyByCustomer(db, payment.customer, payment.id)
  if (!companyId) return

  await db.from('subscriptions').update({
    status:      'canceled',
    canceled_at: new Date().toISOString(),
  }).eq('company_id', companyId)

  await db.from('companies').update({ plan_status: 'suspended' }).eq('id', companyId)

  await notifyN8n(db, companyId, 'cancelamento', payment.value)
}

// ── Helper: encontrar empresa pelo customer Asaas ─────────────

async function findCompanyByCustomer(
  db: ReturnType<typeof createClient>,
  customerId: string,
  paymentId?: string,
): Promise<string | null> {
  // Tentativa 1: subscription.gateway_customer_id
  const { data: sub } = await db
    .from('subscriptions')
    .select('company_id')
    .eq('gateway_customer_id', customerId)
    .single()

  if (sub?.company_id) return sub.company_id

  // Tentativa 2: companies.asaas_customer_id
  const { data: company } = await db
    .from('companies')
    .select('id')
    .eq('asaas_customer_id', customerId)
    .single()

  if (company?.id) return company.id

  // Tentativa 3: invoice.gateway_invoice_id (fallback para novo payment_id)
  if (paymentId) {
    const { data: inv } = await db
      .from('invoices')
      .select('company_id')
      .eq('gateway_invoice_id', paymentId)
      .single()

    if (inv?.company_id) {
      // Salvar customer_id para próximas vezes
      await db.from('subscriptions')
        .update({ gateway_customer_id: customerId })
        .eq('company_id', inv.company_id)
      return inv.company_id
    }
  }

  return null
}

// ── Helper: notificação n8n ───────────────────────────────────

async function notifyN8n(
  db: ReturnType<typeof createClient>,
  companyId: string,
  eventType: 'nova_assinatura' | 'cancelamento',
  amount: number,
) {
  const n8nUrl = Deno.env.get('N8N_WEBHOOK_URL')
  if (!n8nUrl) {
    console.warn('[billing-webhook] N8N_WEBHOOK_URL não configurado')
    return
  }

  try {
    // Buscar admin da empresa
    const { data: adminProfile } = await db
      .from('profiles')
      .select('name, phone')
      .eq('company_id', companyId)
      .eq('role', 'admin')
      .limit(1)
      .single()

    // Buscar email via auth.users
    const { data: adminUser } = adminProfile
      ? await db.auth.admin.listUsers()
      : { data: null }

    // Buscar metadados da subscription (nome/telefone do cliente)
    const { data: sub } = await db
      .from('subscriptions')
      .select('metadata, plan_slug')
      .eq('company_id', companyId)
      .single()

    const meta          = (sub?.metadata as Record<string, string>) ?? {}
    const adminName     = adminProfile?.name ?? 'Admin'
    const adminPhone    = adminProfile?.phone ?? null

    const res = await fetch(`${n8nUrl}/webhook/nextsales-billing`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        event_type:   eventType,
        company_id:   companyId,
        admin_name:   adminName,
        admin_phone:  adminPhone,
        plan_slug:    sub?.plan_slug ?? '',
        amount,
        customer_name:  meta.customer_name  ?? adminName,
        customer_phone: meta.customer_phone ?? adminPhone,
      }),
    })
    console.log('[billing-webhook] n8n notificado:', eventType, res.status)
  } catch (err) {
    console.warn('[billing-webhook] Falha na notificação n8n:', err)
  }
}

// ── Tipos ──────────────────────────────────────────────────────

interface AsaasPayment {
  id:                 string
  customer:           string
  status:             string
  value:              number
  billingType:        string
  dueDate:            string
  bankSlipUrl?:       string
  invoiceUrl?:        string
  externalReference?: string
}

interface AsaasWebhookPayload {
  event:   string
  payment: AsaasPayment
}
