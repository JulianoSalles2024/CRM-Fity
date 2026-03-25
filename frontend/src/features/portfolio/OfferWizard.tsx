import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Check, ChevronRight, ChevronLeft,
  Package, Link, Building2, Plus, Trash2,
} from 'lucide-react';
import type {
  Offer, OfferType, OfferCategory, JourneyType, OfferPriority,
  PriceRecurrence, AffiliatePlatform, SaleConfirmation, PartnerCommissionType,
  OfferObjection,
} from './types';

// ── Mock agents for step 4 ────────────────────────────────────────────────────
const MOCK_AGENTS = [
  { id: 'agent-1', name: 'Agente Atlas', type: 'SDR' },
  { id: 'agent-2', name: 'Agente Vega', type: 'SDR' },
  { id: 'agent-3', name: 'Agente Orion', type: 'Closer' },
  { id: 'agent-4', name: 'Agente Lyra', type: 'Follow-up' },
];

// ── Step definitions ──────────────────────────────────────────────────────────
const STEPS = [
  { label: 'Tipo', desc: 'Tipo de oferta' },
  { label: 'Identidade', desc: 'Nome e categoria' },
  { label: 'Configuração', desc: 'Detalhes por tipo' },
  { label: 'Agentes', desc: 'Atribuição e prioridade' },
];

// ── Form state type ───────────────────────────────────────────────────────────
interface FormData {
  offer_type: OfferType;
  name: string;
  description: string;
  category: OfferCategory;
  journey_type: JourneyType;
  price: number | '';
  price_recurrence: PriceRecurrence;
  // Own
  checkout_url: string;
  selling_arguments: string;
  objections: OfferObjection[];
  // Affiliate
  affiliate_platform: AffiliatePlatform;
  affiliate_link: string;
  commission_pct: number | '';
  cookie_days: number | '';
  sale_confirmation: SaleConfirmation;
  // Partner
  partner_name: string;
  partner_contact: string;
  partner_commission_type: PartnerCommissionType;
  partner_sla_hours: number | '';
  // Step 4
  assigned_agent_ids: string[];
  priority: OfferPriority;
}

const defaultForm = (): FormData => ({
  offer_type: 'own',
  name: '',
  description: '',
  category: 'saas',
  journey_type: 'consultative',
  price: '',
  price_recurrence: 'month',
  checkout_url: '',
  selling_arguments: '',
  objections: [],
  affiliate_platform: 'hotmart',
  affiliate_link: '',
  commission_pct: '',
  cookie_days: 30,
  sale_confirmation: 'webhook',
  partner_name: '',
  partner_contact: '',
  partner_commission_type: 'sale',
  partner_sla_hours: 48,
  assigned_agent_ids: ['agent-1', 'agent-2', 'agent-4'],
  priority: 'medium',
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const CATEGORY_OPTIONS: { value: OfferCategory; label: string }[] = [
  { value: 'saas', label: 'SaaS' },
  { value: 'service', label: 'Serviço' },
  { value: 'infoproduct', label: 'Infoproduto' },
  { value: 'physical', label: 'Produto Físico' },
  { value: 'subscription', label: 'Assinatura' },
  { value: 'consulting', label: 'Consultoria' },
  { value: 'other', label: 'Outro' },
];

const JOURNEY_OPTIONS: { value: JourneyType; label: string; desc: string }[] = [
  { value: 'immediate', label: 'Venda imediata', desc: 'Decisão rápida, ticket baixo' },
  { value: 'consultative', label: 'Consultiva', desc: 'Envolve diagnóstico e proposta' },
  { value: 'scheduling', label: 'Agendamento', desc: 'Requer reunião ou demo' },
  { value: 'reactivation', label: 'Recuperação de lead', desc: 'Reengajamento de oportunidades frias' },
];

const RECURRENCE_OPTIONS: { value: PriceRecurrence; label: string }[] = [
  { value: 'month', label: 'mês' },
  { value: 'year', label: 'ano' },
  { value: 'one_time', label: 'único' },
  { value: 'variable', label: 'variável' },
];

const PLATFORM_OPTIONS: { value: AffiliatePlatform; label: string }[] = [
  { value: 'hotmart', label: 'Hotmart' },
  { value: 'eduzz', label: 'Eduzz' },
  { value: 'monetizze', label: 'Monetizze' },
  { value: 'kiwify', label: 'Kiwify' },
  { value: 'other', label: 'Outro' },
];

const SALE_CONFIRMATION_OPTIONS: { value: SaleConfirmation; label: string }[] = [
  { value: 'webhook', label: 'Webhook da plataforma' },
  { value: 'manual', label: 'Registro manual' },
  { value: 'api', label: 'Integração via API' },
];

const PARTNER_COMMISSION_OPTIONS: { value: PartnerCommissionType; label: string }[] = [
  { value: 'sale', label: 'venda' },
  { value: 'qualified_lead', label: 'lead qualificado' },
  { value: 'meeting', label: 'reunião' },
];

const PRIORITY_OPTIONS: { value: OfferPriority; label: string; desc: string; color: string }[] = [
  { value: 'high', label: 'Alta', desc: 'Agentes priorizam este produto nas abordagens', color: 'text-red-400' },
  { value: 'medium', label: 'Média', desc: 'Balanceado com outros produtos do portfólio', color: 'text-amber-400' },
  { value: 'low', label: 'Baixa', desc: 'Mencionado apenas quando relevante ao contexto', color: 'text-slate-400' },
];

// ── Component ─────────────────────────────────────────────────────────────────
interface Props {
  onClose: () => void;
  onSave: (data: Omit<Offer, 'id' | 'agents_count' | 'sales_this_month' | 'revenue_this_month'>) => void;
}

export const OfferWizard: React.FC<Props> = ({ onClose, onSave }) => {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [saving, setSaving] = useState(false);

  const update = (patch: Partial<FormData>) => setForm(f => ({ ...f, ...patch }));

  const goNext = () => {
    setDirection(1);
    setStep(s => s + 1);
  };

  const goBack = () => {
    setDirection(-1);
    setStep(s => s - 1);
  };

  const canNext = () => {
    if (step === 0) return true;
    if (step === 1) return form.name.trim().length >= 2 && form.price !== '';
    return true;
  };

  const handleSave = () => {
    setSaving(true);
    const offer: Omit<Offer, 'id' | 'agents_count' | 'sales_this_month' | 'revenue_this_month'> = {
      name: form.name,
      description: form.description,
      offer_type: form.offer_type,
      category: form.category,
      journey_type: form.journey_type,
      price: Number(form.price) || 0,
      price_recurrence: form.price_recurrence,
      priority: form.priority,
      is_active: true,
      objections: form.objections,
      ...(form.offer_type === 'own' && {
        checkout_url: form.checkout_url || undefined,
        selling_arguments: form.selling_arguments || undefined,
      }),
      ...(form.offer_type === 'affiliate' && {
        affiliate_platform: form.affiliate_platform,
        affiliate_link: form.affiliate_link || undefined,
        commission_pct: Number(form.commission_pct) || undefined,
        cookie_days: Number(form.cookie_days) || undefined,
        sale_confirmation: form.sale_confirmation,
      }),
      ...(form.offer_type === 'partner' && {
        partner_name: form.partner_name || undefined,
        partner_contact: form.partner_contact || undefined,
        commission_pct: Number(form.commission_pct) || undefined,
        partner_commission_type: form.partner_commission_type,
        partner_sla_hours: Number(form.partner_sla_hours) || undefined,
      }),
    };
    onSave(offer);
    setSaving(false);
  };

  // ── Step renderers ──────────────────────────────────────────────────────────

  const renderStep0 = () => (
    <div className="space-y-3">
      <p className="text-xs text-slate-500 mb-4">Selecione como este produto se encaixa no seu portfólio.</p>
      {([
        { value: 'own' as OfferType, icon: Package, title: 'Produto Próprio', desc: 'Você vende diretamente. Receita 100% sua.' },
        { value: 'affiliate' as OfferType, icon: Link, title: 'Afiliado', desc: 'Você promove produto de terceiro via link rastreado.' },
        { value: 'partner' as OfferType, icon: Building2, title: 'Parceiro Comercial', desc: 'Outra empresa te contrata para distribuir.' },
      ] as const).map(opt => {
        const Icon = opt.icon;
        const active = form.offer_type === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => update({ offer_type: opt.value })}
            className={`w-full flex items-start gap-4 p-4 rounded-xl border transition-all duration-150 text-left ${
              active
                ? 'border-blue-500/40 bg-blue-500/10'
                : 'border-white/5 bg-slate-900/40 hover:border-white/10 hover:bg-slate-900/70'
            }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
              active ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500'
            }`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className={`text-sm font-semibold ${active ? 'text-blue-300' : 'text-white'}`}>{opt.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
            </div>
            {active && (
              <div className="ml-auto flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      {/* Nome */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">
          Nome do produto <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={e => update({ name: e.target.value })}
          placeholder="Ex: NextSales CRM Growth"
          className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
        />
      </div>

      {/* Descrição */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">Descrição curta</label>
        <textarea
          value={form.description}
          onChange={e => update({ description: e.target.value })}
          placeholder="O que torna este produto relevante para o lead..."
          rows={2}
          className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 resize-none"
        />
      </div>

      {/* Categoria */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">Categoria</label>
        <select
          value={form.category}
          onChange={e => update({ category: e.target.value as OfferCategory })}
          className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
        >
          {CATEGORY_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Tipo de jornada */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">Tipo de jornada</label>
        <div className="space-y-2">
          {JOURNEY_OPTIONS.map(o => (
            <label
              key={o.value}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                form.journey_type === o.value
                  ? 'border-blue-500/30 bg-blue-500/5'
                  : 'border-white/5 hover:border-white/10'
              }`}
            >
              <input
                type="radio"
                name="journey_type"
                value={o.value}
                checked={form.journey_type === o.value}
                onChange={() => update({ journey_type: o.value })}
                className="mt-0.5 accent-blue-500"
              />
              <div>
                <p className="text-xs font-medium text-white">{o.label}</p>
                <p className="text-[11px] text-slate-500">{o.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Ticket médio */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">
          Ticket médio <span className="text-red-400">*</span>
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">R$</span>
            <input
              type="number"
              min="0"
              value={form.price}
              onChange={e => update({ price: e.target.value === '' ? '' : Number(e.target.value) })}
              placeholder="0,00"
              className="w-full bg-slate-900/60 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
            />
          </div>
          <select
            value={form.price_recurrence}
            onChange={e => update({ price_recurrence: e.target.value as PriceRecurrence })}
            className="bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 w-28"
          >
            {RECURRENCE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep2Own = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">Link de checkout / landing page</label>
        <input
          type="url"
          value={form.checkout_url}
          onChange={e => update({ checkout_url: e.target.value })}
          placeholder="https://..."
          className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">Argumentos de venda</label>
        <textarea
          value={form.selling_arguments}
          onChange={e => update({ selling_arguments: e.target.value })}
          placeholder="Benefícios e diferenciais que o agente deve usar nas abordagens..."
          rows={3}
          className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 resize-none"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-slate-400">Objeções e respostas</label>
          <button
            onClick={() => {
              const newObj: OfferObjection = {
                id: `obj-${Date.now()}`,
                objection_text: '',
                suggested_reply: '',
              };
              update({ objections: [...form.objections, newObj] });
            }}
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Adicionar objeção
          </button>
        </div>

        {form.objections.length === 0 && (
          <p className="text-xs text-slate-600 py-2">Nenhuma objeção cadastrada. Adicione abaixo.</p>
        )}

        <div className="space-y-3">
          {form.objections.map((obj, idx) => (
            <div key={obj.id} className="bg-slate-900/40 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 uppercase tracking-wide">Objeção {idx + 1}</span>
                <button
                  onClick={() => update({ objections: form.objections.filter(o => o.id !== obj.id) })}
                  className="text-slate-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="text"
                value={obj.objection_text}
                onChange={e => update({
                  objections: form.objections.map(o =>
                    o.id === obj.id ? { ...o, objection_text: e.target.value } : o
                  ),
                })}
                placeholder="Ex: Está caro"
                className="w-full bg-slate-800/60 border border-white/5 rounded-md px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/40"
              />
              <input
                type="text"
                value={obj.suggested_reply}
                onChange={e => update({
                  objections: form.objections.map(o =>
                    o.id === obj.id ? { ...o, suggested_reply: e.target.value } : o
                  ),
                })}
                placeholder="Resposta sugerida para o agente usar..."
                className="w-full bg-slate-800/60 border border-white/5 rounded-md px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/40"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep2Affiliate = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-2">Plataforma</label>
        <div className="grid grid-cols-3 gap-2">
          {PLATFORM_OPTIONS.map(p => (
            <button
              key={p.value}
              onClick={() => update({ affiliate_platform: p.value })}
              className={`py-2 px-3 text-xs rounded-lg border transition-all ${
                form.affiliate_platform === p.value
                  ? 'border-orange-500/40 bg-orange-500/10 text-orange-300'
                  : 'border-white/5 text-slate-400 hover:border-white/10 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">Link de afiliado</label>
        <input
          type="url"
          value={form.affiliate_link}
          onChange={e => update({ affiliate_link: e.target.value })}
          placeholder="https://hotmart.com/produto/...?ref=..."
          className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Comissão (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={form.commission_pct}
            onChange={e => update({ commission_pct: e.target.value === '' ? '' : Number(e.target.value) })}
            placeholder="Ex: 40"
            className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Prazo de cookie (dias)</label>
          <input
            type="number"
            min="1"
            value={form.cookie_days}
            onChange={e => update({ cookie_days: e.target.value === '' ? '' : Number(e.target.value) })}
            className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-2">Como confirmar venda</label>
        <div className="space-y-2">
          {SALE_CONFIRMATION_OPTIONS.map(o => (
            <label
              key={o.value}
              className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                form.sale_confirmation === o.value
                  ? 'border-orange-500/30 bg-orange-500/5'
                  : 'border-white/5 hover:border-white/10'
              }`}
            >
              <input
                type="radio"
                name="sale_confirmation"
                value={o.value}
                checked={form.sale_confirmation === o.value}
                onChange={() => update({ sale_confirmation: o.value })}
                className="accent-orange-500"
              />
              <span className="text-xs text-white">{o.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep2Partner = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Empresa parceira</label>
          <input
            type="text"
            value={form.partner_name}
            onChange={e => update({ partner_name: e.target.value })}
            placeholder="Ex: TechCorp Solutions"
            className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Contato (e-mail)</label>
          <input
            type="email"
            value={form.partner_contact}
            onChange={e => update({ partner_contact: e.target.value })}
            placeholder="contato@empresa.com"
            className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Comissão acordada (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={form.commission_pct}
            onChange={e => update({ commission_pct: e.target.value === '' ? '' : Number(e.target.value) })}
            placeholder="Ex: 25"
            className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">SLA de resposta (horas)</label>
          <input
            type="number"
            min="1"
            value={form.partner_sla_hours}
            onChange={e => update({ partner_sla_hours: e.target.value === '' ? '' : Number(e.target.value) })}
            className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-2">Comissão por</label>
        <div className="flex gap-2">
          {PARTNER_COMMISSION_OPTIONS.map(o => (
            <button
              key={o.value}
              onClick={() => update({ partner_commission_type: o.value })}
              className={`flex-1 py-2 px-3 text-xs rounded-lg border transition-all ${
                form.partner_commission_type === o.value
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                  : 'border-white/5 text-slate-400 hover:border-white/10 hover:text-white'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-5">
      {/* Agent list */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-2">Agentes que vendem este produto</label>
        <div className="space-y-2">
          {MOCK_AGENTS.map(agent => {
            const checked = form.assigned_agent_ids.includes(agent.id);
            return (
              <label
                key={agent.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  checked
                    ? 'border-blue-500/30 bg-blue-500/5'
                    : 'border-white/5 hover:border-white/10'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    if (checked) {
                      update({ assigned_agent_ids: form.assigned_agent_ids.filter(id => id !== agent.id) });
                    } else {
                      update({ assigned_agent_ids: [...form.assigned_agent_ids, agent.id] });
                    }
                  }}
                  className="accent-blue-500"
                />
                <div>
                  <p className="text-sm font-medium text-white">{agent.name}</p>
                  <p className="text-[11px] text-slate-500">{agent.type}</p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Priority */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-2">Prioridade de abordagem</label>
        <div className="space-y-2">
          {PRIORITY_OPTIONS.map(p => (
            <label
              key={p.value}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                form.priority === p.value
                  ? 'border-blue-500/30 bg-blue-500/5'
                  : 'border-white/5 hover:border-white/10'
              }`}
            >
              <input
                type="radio"
                name="priority"
                value={p.value}
                checked={form.priority === p.value}
                onChange={() => update({ priority: p.value })}
                className="mt-0.5 accent-blue-500"
              />
              <div>
                <p className={`text-xs font-semibold ${p.color}`}>{p.label}</p>
                <p className="text-[11px] text-slate-500">{p.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 0: return renderStep0();
      case 1: return renderStep1();
      case 2: {
        if (form.offer_type === 'own') return renderStep2Own();
        if (form.offer_type === 'affiliate') return renderStep2Affiliate();
        return renderStep2Partner();
      }
      case 3: return renderStep3();
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-[#0B1220] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Adicionar Produto</h2>
              <p className="text-xs text-slate-500">{STEPS[step].desc}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center px-6 py-3 gap-0 border-b border-white/5">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.label}>
              <div
                className="flex items-center gap-1.5"
                onClick={() => i < step && setStep(i)}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i < step
                    ? 'bg-blue-600 text-white cursor-pointer'
                    : i === step
                    ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/40'
                    : 'bg-slate-800 text-slate-600'
                }`}>
                  {i < step ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                <span className={`text-xs hidden sm:inline ${
                  i === step ? 'text-white' : i < step ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-2 ${i < step ? 'bg-blue-600/40' : 'bg-slate-800'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Animated body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: direction * 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -24 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              {renderCurrentStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
          <button
            onClick={step === 0 ? onClose : goBack}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 0 ? 'Cancelar' : 'Voltar'}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={goNext}
              disabled={!canNext()}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                canNext()
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed'
              }`}
            >
              Próximo
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              <Check className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Salvar e Ativar Produto'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
