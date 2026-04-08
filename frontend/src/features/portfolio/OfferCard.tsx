import React from 'react';
import {
  Package, Link, Building2,
  Bot, TrendingUp, DollarSign,
  Edit2, ChevronDown, MoreVertical,
} from 'lucide-react';
import type { Offer, OfferType } from './types';

const fmtBRL = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

const RECURRENCE_LABEL: Record<string, string> = {
  month: '/mês',
  year: '/ano',
  one_time: '',
  variable: '',
};

const RECURRENCE_SUFFIX: Record<string, string> = {
  month: '/mês',
  year: '/ano',
  one_time: 'único',
  variable: 'variável',
};

const CATEGORY_LABELS: Record<string, string> = {
  saas: 'SaaS',
  service: 'Serviço',
  infoproduct: 'Infoproduto',
  physical: 'Produto Físico',
  subscription: 'Assinatura',
  consulting: 'Consultoria',
  other: 'Outro',
};

const PLATFORM_LABELS: Record<string, string> = {
  hotmart: 'Hotmart',
  eduzz: 'Eduzz',
  monetizze: 'Monetizze',
  kiwify: 'Kiwify',
  other: 'Outro',
};

const TYPE_META: Record<OfferType, {
  label: string;
  borderClass: string;
  accentColor: string;
  textClass: string;
  bgClass: string;
  icon: React.ElementType;
}> = {
  own: {
    label: 'Próprio',
    borderClass: 'border-l-blue-500',
    accentColor: '#3b82f6',
    textClass: 'text-sky-400',
    bgClass: 'bg-sky-500/5',
    icon: Package,
  },
  affiliate: {
    label: 'Afiliado',
    borderClass: 'border-l-orange-500',
    accentColor: '#f97316',
    textClass: 'text-orange-400',
    bgClass: 'bg-orange-500/10',
    icon: Link,
  },
  partner: {
    label: 'Parceiro',
    borderClass: 'border-l-emerald-500',
    accentColor: '#10b981',
    textClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500/10',
    icon: Building2,
  },
};

interface OfferCardProps {
  offer: Offer;
  onEdit: (offer: Offer) => void;
}

export const OfferCard: React.FC<OfferCardProps> = ({ offer, onEdit }) => {
  const meta = TYPE_META[offer.offer_type];
  const TypeIcon = meta.icon;
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <div
      className={`relative group bg-[#0B1220] border border-white/5 border-l-2 ${meta.borderClass} rounded-xl overflow-hidden transition-all duration-200
        hover:border-white/10 hover:border-l-2 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30
        ${!offer.is_active ? 'opacity-60' : ''}`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 min-w-0">
            {/* Type icon badge */}
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.bgClass}`}
              style={{ color: meta.accentColor }}
            >
              <TypeIcon className="w-4 h-4" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-white leading-tight truncate">{offer.name}</p>
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                {CATEGORY_LABELS[offer.category]}
                <span className="mx-1 text-slate-700">·</span>
                <span className={meta.textClass}>{meta.label}</span>
              </p>
            </div>
          </div>

          {/* Menu */}
          <div className="relative flex-shrink-0 ml-2" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="p-1 rounded-md text-slate-600 hover:text-slate-300 hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-6 z-20 w-36 bg-[#0F172A] border border-white/10 rounded-lg shadow-xl py-1">
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 hover:text-white"
                  onClick={() => { setMenuOpen(false); onEdit(offer); }}
                >
                  <Edit2 className="w-3 h-3" /> Editar produto
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1.5 mb-3">
          <span className="text-base font-bold text-white">
            {fmtBRL(offer.price)}
          </span>
          {offer.price_recurrence !== 'one_time' && offer.price_recurrence !== 'variable' && (
            <span className="text-xs text-slate-500">{RECURRENCE_LABEL[offer.price_recurrence]}</span>
          )}
          {(offer.price_recurrence === 'one_time' || offer.price_recurrence === 'variable') && (
            <span className="text-xs text-slate-500">{RECURRENCE_SUFFIX[offer.price_recurrence]}</span>
          )}
        </div>

        {/* Affiliate-specific info */}
        {offer.offer_type === 'affiliate' && offer.commission_pct != null && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full">
              {offer.commission_pct}% comissão
            </span>
            {offer.affiliate_platform && (
              <span className="text-xs text-slate-500">
                {PLATFORM_LABELS[offer.affiliate_platform]}
              </span>
            )}
          </div>
        )}

        {/* Partner-specific info */}
        {offer.offer_type === 'partner' && offer.commission_pct != null && offer.partner_name && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">
              {offer.commission_pct}% por venda
            </span>
            <span className="text-xs text-slate-500 truncate">{offer.partner_name}</span>
          </div>
        )}

        {/* Metrics row */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-slate-900/40 rounded-lg px-3 py-2">
            <div className="flex items-center gap-1.5 text-slate-500 mb-0.5">
              <Bot className="w-3 h-3" />
              <span className="text-[10px]">Agentes</span>
            </div>
            <p className="text-sm font-semibold text-white">{offer.agents_count}</p>
          </div>
          <div className="bg-slate-900/40 rounded-lg px-3 py-2">
            <div className="flex items-center gap-1.5 text-slate-500 mb-0.5">
              <TrendingUp className="w-3 h-3" />
              <span className="text-[10px]">Vendas/mês</span>
            </div>
            <p className="text-sm font-semibold text-white">{offer.sales_this_month}</p>
          </div>
        </div>

        {/* Revenue highlight */}
        <div className="flex items-center justify-between bg-slate-900/40 rounded-lg px-3 py-2 mb-3">
          <div className="flex items-center gap-1.5 text-slate-500">
            <DollarSign className="w-3 h-3" />
            <span className="text-[10px]">Receita este mês</span>
          </div>
          <span className="text-sm font-bold text-emerald-400">{fmtBRL(offer.revenue_this_month)}</span>
        </div>

        {/* Footer: status badge + action buttons */}
        <div className="flex items-center justify-between">
          <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
            offer.is_active
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-slate-700/50 text-slate-500'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              offer.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
            }`} />
            {offer.is_active ? 'Ativo' : 'Inativo'}
          </span>

          <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => onEdit(offer)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
            >
              <Edit2 className="w-3 h-3" />
              Editar
            </button>
            <button
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
            >
              Agentes
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Active glow on hover */}
      {offer.is_active && (
        <div
          className="absolute inset-0 rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ boxShadow: `inset 0 0 30px ${meta.accentColor}08` }}
        />
      )}
    </div>
  );
};
