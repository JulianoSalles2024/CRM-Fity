import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Zap, Rocket, Crown, ArrowRight, Sparkles, Clock, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { useBilling } from '@/src/contexts/BillingContext';

// ─── Planos ───────────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 297,
    icon: Zap,
    gradient: 'from-blue-600 to-cyan-500',
    glow: 'shadow-blue-500/20',
    border: 'border-blue-500/25',
    ring: 'ring-blue-500/30',
    color: 'blue',
    badge: null,
    features: [
      '1 pipeline de vendas',
      '500 leads ativos',
      'Agente IA básico (SDR)',
      '1 usuário',
      'WhatsApp integrado',
      'Relatórios essenciais',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 697,
    icon: Rocket,
    gradient: 'from-violet-600 to-purple-500',
    glow: 'shadow-violet-500/25',
    border: 'border-violet-500/35',
    ring: 'ring-violet-500/40',
    color: 'violet',
    badge: 'Mais popular',
    popular: true,
    features: [
      '3 pipelines de vendas',
      '2.000 leads ativos',
      'Agente IA avançado',
      '5 usuários',
      'WhatsApp + automações',
      'Relatórios completos',
      'Follow-up automático',
    ],
  },
  {
    id: 'scale',
    name: 'Scale',
    price: 1497,
    icon: Crown,
    gradient: 'from-amber-500 to-orange-500',
    glow: 'shadow-amber-500/20',
    border: 'border-amber-500/25',
    ring: 'ring-amber-500/30',
    color: 'amber',
    badge: null,
    features: [
      'Pipelines ilimitados',
      'Leads ilimitados',
      'Agente IA premium (full)',
      'Usuários ilimitados',
      'Tudo do Growth +',
      'Suporte prioritário',
      'Onboarding dedicado',
      'API de integração',
    ],
  },
] as const;

const WA_LINK = 'https://wa.me/5551985488078';

// ─── Status badge do plano atual ─────────────────────────────────────────────

function CurrentPlanBadge() {
  const { billing, daysRemaining, isTrial, isActive, isTrialExpired } = useBilling();

  if (!billing) return null;

  if (isTrialExpired) return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
      <AlertCircle className="w-3.5 h-3.5" />
      Trial expirado — escolha um plano abaixo
    </div>
  );

  if (isTrial) return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium">
      <Clock className="w-3.5 h-3.5" />
      Plano Thrill (Trial) · {daysRemaining} dias restantes
    </div>
  );

  if (isActive) return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
      <CheckCircle2 className="w-3.5 h-3.5" />
      Plano {billing.plan_slug} · Ativo
    </div>
  );

  return null;
}

// ─── Card de plano ────────────────────────────────────────────────────────────

function PlanCard({ plan, index }: { plan: typeof PLANS[number]; index: number }) {
  const [hovered, setHovered] = useState(false);
  const Icon = plan.icon;

  const colorMap: Record<string, string> = {
    blue: 'text-blue-400', violet: 'text-violet-400', amber: 'text-amber-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative flex flex-col"
    >
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <div className={`bg-gradient-to-r ${plan.gradient} text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg`}>
            ✦ {plan.badge}
          </div>
        </div>
      )}

      <motion.div
        animate={{ y: hovered ? -3 : 0 }}
        transition={{ duration: 0.2 }}
        className={`relative flex flex-col flex-1 rounded-2xl border p-5 overflow-hidden backdrop-blur-xl bg-white/[0.02]
          ${plan.border}
          ${plan.popular ? `ring-1 ${plan.ring} shadow-xl ${plan.glow}` : 'shadow-md'}
          ${hovered ? `shadow-2xl ${plan.glow}` : ''}
          transition-shadow duration-300`}
      >
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-[0.035] pointer-events-none`}
            />
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="mb-4">
          <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br ${plan.gradient} mb-3 shadow-md`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-base font-bold text-white">{plan.name}</h3>
        </div>

        {/* Preço */}
        <div className="mb-5">
          <div className="flex items-end gap-1">
            <span className="text-xs text-slate-400 mb-1">R$</span>
            <span className="text-3xl font-black text-white leading-none">{plan.price.toLocaleString('pt-BR')}</span>
            <span className="text-xs text-slate-400 mb-1">/mês</span>
          </div>
        </div>

        {/* Features */}
        <ul className="space-y-2 flex-1 mb-5">
          {plan.features.map((feat, i) => (
            <motion.li
              key={feat}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + i * 0.03 + 0.25 }}
              className="flex items-center gap-2"
            >
              <Check className={`w-3.5 h-3.5 shrink-0 ${colorMap[plan.color]}`} strokeWidth={3} />
              <span className="text-xs text-slate-300">{feat}</span>
            </motion.li>
          ))}
        </ul>

        {/* CTA */}
        <a
          href={`${WA_LINK}?text=${encodeURIComponent(`Olá! Quero assinar o plano ${plan.name} do NextSales (R$${plan.price}/mês).`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`group flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200
            bg-gradient-to-r ${plan.gradient} text-white shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]`}
        >
          Assinar {plan.name}
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </a>
      </motion.div>
    </motion.div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function BillingPage() {
  const { isTrial, isTrialExpired, daysRemaining } = useBilling();

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <Sparkles className="w-4 h-4 text-violet-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Plano & Assinatura</h1>
          </div>
          <p className="text-sm text-slate-400">
            Gerencie seu plano e faça upgrade para desbloquear mais recursos.
          </p>
        </div>
        <CurrentPlanBadge />
      </motion.div>

      {/* Aviso de urgência */}
      <AnimatePresence>
        {isTrial && !isTrialExpired && daysRemaining <= 3 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/8"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-sm text-red-300">
              <span className="font-semibold">Atenção:</span> seu trial expira em {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}.
              Escolha um plano abaixo para não perder o acesso.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* O que está incluído no trial */}
      {isTrial && !isTrialExpired && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl border border-white/6 bg-white/[0.02]"
        >
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-semibold text-white">Seu plano Thrill inclui</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {['Acesso completo', 'Agente IA', 'WhatsApp', 'Suporte'].map((item) => (
              <div key={item} className="flex items-center gap-1.5 text-xs text-slate-300">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Cards de planos */}
      <div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-4"
        >
          Escolha seu plano
        </motion.p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {PLANS.map((plan, i) => <PlanCard key={plan.id} plan={plan} index={i} />)}
        </div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center pb-4"
      >
        <p className="text-xs text-slate-500">
          Dúvidas sobre qual plano escolher?{' '}
          <a href={WA_LINK} target="_blank" rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors">
            Fale com a gente pelo WhatsApp
          </a>
        </p>
        <p className="text-[10px] text-slate-600 mt-1">
          Sem taxas escondidas · Cancele quando quiser · Suporte em português
        </p>
      </motion.div>
    </div>
  );
}
