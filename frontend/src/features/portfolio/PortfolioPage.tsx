import React, { useState } from 'react';
import { Package, Plus, Search, ChevronDown } from 'lucide-react';
import { useAuth } from '@/src/features/auth/AuthContext';
import { OfferCard } from './OfferCard';
import { OfferWizard } from './OfferWizard';
import { MOCK_OFFERS } from './mockData';
import type { Offer, OfferType } from './types';

type TypeFilter = 'all' | OfferType;
type StatusFilter = 'all' | 'active' | 'inactive';

// ── Small reusable select ─────────────────────────────────────────────────────
const FilterSelect: React.FC<{
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}> = ({ value, onChange, options }) => (
  <div className="relative">
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="appearance-none bg-slate-900/60 border border-white/10 rounded-lg pl-3 pr-7 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50 hover:border-white/20 transition-colors cursor-pointer"
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────
export const PortfolioPage: React.FC = () => {
  useAuth(); // follows project pattern

  const [offers, setOffers] = useState<Offer[]>(MOCK_OFFERS);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');

  const filtered = offers.filter(o => {
    if (typeFilter !== 'all' && o.offer_type !== typeFilter) return false;
    if (statusFilter === 'active' && !o.is_active) return false;
    if (statusFilter === 'inactive' && o.is_active) return false;
    if (search && !o.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleSave = (data: Omit<Offer, 'id' | 'agents_count' | 'sales_this_month' | 'revenue_this_month'>) => {
    if (editingOffer) {
      setOffers(prev => prev.map(o =>
        o.id === editingOffer.id
          ? { ...o, ...data }
          : o
      ));
    } else {
      const newOffer: Offer = {
        ...data,
        id: `offer-${Date.now()}`,
        agents_count: 0,
        sales_this_month: 0,
        revenue_this_month: 0,
      };
      setOffers(prev => [newOffer, ...prev]);
    }
    setWizardOpen(false);
    setEditingOffer(null);
  };

  const handleEdit = (offer: Offer) => {
    setEditingOffer(offer);
    setWizardOpen(true);
  };

  const activeCount = offers.filter(o => o.is_active).length;

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#060d18]">

      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0B1220]/80 backdrop-blur-sm flex-shrink-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border bg-blue-950/40 border-blue-500/30 text-blue-400 shadow-sm shadow-blue-900/20 cursor-default">
              <Package className="w-4 h-4 flex-shrink-0" />
              <span>Portfólio de Produtos</span>
            </button>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500 pl-1">
            <span>{offers.length} produtos no total</span>
            <span className="text-slate-700">•</span>
            <span className="text-emerald-500">{activeCount} ativos</span>
          </div>
        </div>

        <button
          onClick={() => { setEditingOffer(null); setWizardOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shadow-blue-900/30"
        >
          <Plus className="w-4 h-4" />
          Adicionar Produto
        </button>
      </div>

      {/* Filters bar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-white/5 bg-[#0B1220]/60 flex-shrink-0">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar produto..."
            className="w-full bg-slate-900/60 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 hover:border-white/20 transition-colors"
          />
        </div>

        <FilterSelect
          value={typeFilter}
          onChange={v => setTypeFilter(v as TypeFilter)}
          options={[
            { value: 'all', label: 'Tipo: Todos' },
            { value: 'own', label: 'Próprio' },
            { value: 'affiliate', label: 'Afiliado' },
            { value: 'partner', label: 'Parceiro' },
          ]}
        />

        <FilterSelect
          value={statusFilter}
          onChange={v => setStatusFilter(v as StatusFilter)}
          options={[
            { value: 'all', label: 'Status: Todos' },
            { value: 'active', label: 'Ativo' },
            { value: 'inactive', label: 'Inativo' },
          ]}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {filtered.length === 0 && offers.length === 0 ? (
          /* Empty state — no products at all */
          <div className="flex flex-col items-center justify-center py-24 text-slate-600">
            <div className="w-16 h-16 rounded-2xl bg-slate-900/60 border border-white/5 flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-slate-700" />
            </div>
            <p className="text-sm text-slate-500 font-medium mb-1">Nenhum produto cadastrado</p>
            <p className="text-xs text-slate-600 mb-4">Adicione seu primeiro produto para que os agentes possam vender</p>
            <button
              onClick={() => { setEditingOffer(null); setWizardOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar primeiro produto
            </button>
          </div>
        ) : filtered.length === 0 ? (
          /* Empty state — filter returned nothing */
          <div className="flex flex-col items-center justify-center py-16 text-slate-600">
            <Package className="w-10 h-10 mb-3 text-slate-700" />
            <p className="text-sm text-slate-500">Nenhum produto encontrado para este filtro</p>
            <button
              onClick={() => { setSearch(''); setTypeFilter('all'); setStatusFilter('all'); }}
              className="mt-3 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map(offer => (
              <OfferCard
                key={offer.id}
                offer={offer}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}
      </div>

      {/* Wizard */}
      {wizardOpen && (
        <OfferWizard
          onClose={() => { setWizardOpen(false); setEditingOffer(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};
