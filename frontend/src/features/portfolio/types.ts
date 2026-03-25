export type OfferType = 'own' | 'affiliate' | 'partner';
export type OfferCategory = 'saas' | 'service' | 'infoproduct' | 'physical' | 'subscription' | 'consulting' | 'other';
export type JourneyType = 'immediate' | 'consultative' | 'scheduling' | 'reactivation';
export type OfferPriority = 'high' | 'medium' | 'low';
export type PriceRecurrence = 'month' | 'year' | 'one_time' | 'variable';
export type AffiliatePlatform = 'hotmart' | 'eduzz' | 'monetizze' | 'kiwify' | 'other';
export type SaleConfirmation = 'webhook' | 'manual' | 'api';
export type PartnerCommissionType = 'sale' | 'qualified_lead' | 'meeting';

export interface OfferObjection {
  id: string;
  objection_text: string;
  suggested_reply: string;
}

export interface Offer {
  id: string;
  name: string;
  description: string;
  offer_type: OfferType;
  category: OfferCategory;
  journey_type: JourneyType;
  price: number;
  price_recurrence: PriceRecurrence;
  checkout_url?: string;
  selling_arguments?: string;
  affiliate_platform?: AffiliatePlatform;
  affiliate_link?: string;
  commission_pct?: number;
  cookie_days?: number;
  sale_confirmation?: SaleConfirmation;
  partner_name?: string;
  partner_contact?: string;
  partner_commission_type?: PartnerCommissionType;
  partner_sla_hours?: number;
  priority: OfferPriority;
  is_active: boolean;
  objections: OfferObjection[];
  // Métricas mockadas
  agents_count: number;
  sales_this_month: number;
  revenue_this_month: number;
}
