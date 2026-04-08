import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, QrCode, FileText, CreditCard, ArrowRight, ArrowLeft,
  CheckCircle2, Copy, Check, Loader2, AlertCircle, ExternalLink,
} from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/features/auth/AuthContext';
import { useBilling } from '@/src/contexts/BillingContext';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type PaymentType = 'pix' | 'boleto' | 'credit_card';
export type BillingInterval = 'monthly' | 'yearly';

export interface CheckoutPlan {
  id:       string;
  name:     string;
  price:    number;            // mensal
  gradient: string;
}

interface CheckoutResult {
  invoice_id:        string;
  payment_url?:      string;
  bank_slip_url?:    string;
  pix_qr_code?:      string;
  pix_qr_code_image?: string;
  confirmed?:        boolean;
}

interface Props {
  plan:     CheckoutPlan;
  interval: BillingInterval;
  onClose:  () => void;
}

// ─── Formatadores ─────────────────────────────────────────────────────────────

function formatCPF(v: string) {
  return v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d{1,2})$/, '$1-$2').slice(0, 14);
}
function formatPhone(v: string) {
  return v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2')
          .replace(/(\d{5})(\d)/, '$1-$2').slice(0, 15);
}
function onlyDigits(v: string) { return v.replace(/\D/g, ''); }

// ─── Step 1: Escolher método de pagamento ─────────────────────────────────────

function StepPaymentMethod({
  onSelect, interval, plan,
}: {
  onSelect: (type: PaymentType) => void;
  interval: BillingInterval;
  plan: CheckoutPlan;
}) {
  const price    = interval === 'yearly' ? Math.round(plan.price * 12 * 0.9) : plan.price;
  const subtitle = interval === 'yearly' ? 'cobrado anualmente (10% off)' : 'cobrado mensalmente';

  const methods = [
    { id: 'pix'         as PaymentType, icon: QrCode,     label: 'PIX',           desc: 'Aprovação instantânea' },
    { id: 'boleto'      as PaymentType, icon: FileText,   label: 'Boleto',        desc: 'Vence em 3 dias úteis' },
    { id: 'credit_card' as PaymentType, icon: CreditCard, label: 'Cartão',        desc: 'Débito imediato' },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/15 border border-sky-500/40 text-sky-300 text-sm font-semibold mb-3">
          {plan.name}
        </div>
        <p className="text-3xl font-black text-white">
          R$ {price.toLocaleString('pt-BR')}
        </p>
        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Forma de pagamento</p>
        {methods.map(({ id, icon: Icon, label, desc }) => (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className="group w-full flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-[#0B1220] hover:border-white/10 transition-all"
          >
            <div className="p-2 rounded-lg bg-[#0B1220] border border-white/5">
              <Icon className="w-4 h-4 text-slate-300" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-white">{label}</p>
              <p className="text-xs text-slate-500">{desc}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Step 2: Dados do cliente ─────────────────────────────────────────────────

interface CustomerData {
  name: string; email: string; cpfCnpj: string; phone: string;
}

function StepCustomerData({
  onSubmit, onBack, loading,
}: {
  onSubmit: (data: CustomerData) => void;
  onBack: () => void;
  loading: boolean;
}) {
  const { user } = useAuth() as any;
  const [form, setForm] = useState<CustomerData>({
    name: '', email: user?.email ?? '', cpfCnpj: '', phone: '',
  });

  const set = (k: keyof CustomerData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const inputCls = 'w-full px-3 py-2.5 rounded-lg bg-[#0B1220] border border-white/5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-sky-500/40 transition-colors';
  const labelCls = 'text-xs text-slate-400 font-medium mb-1 block';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelCls}>Nome completo</label>
        <input required className={inputCls} placeholder="João da Silva" value={form.name}
          onChange={set('name')} />
      </div>
      <div>
        <label className={labelCls}>E-mail</label>
        <input required type="email" className={inputCls} placeholder="voce@email.com"
          value={form.email} onChange={set('email')} />
      </div>
      <div>
        <label className={labelCls}>CPF / CNPJ</label>
        <input required className={inputCls} placeholder="000.000.000-00"
          value={form.cpfCnpj}
          onChange={e => setForm(f => ({ ...f, cpfCnpj: formatCPF(e.target.value) }))} />
      </div>
      <div>
        <label className={labelCls}>WhatsApp</label>
        <input required className={inputCls} placeholder="(51) 99999-9999"
          value={form.phone}
          onChange={e => setForm(f => ({ ...f, phone: formatPhone(e.target.value) }))} />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/5 text-slate-400 text-sm hover:border-white/10 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <button type="submit" disabled={loading}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all
            border border-sky-500/30 text-sky-400 bg-sky-500/5 hover:bg-sky-500/10 hover:border-sky-500/50
            disabled:opacity-50 disabled:cursor-not-allowed`}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Gerar cobrança <ArrowRight className="w-4 h-4" /></>}
        </button>
      </div>
    </form>
  );
}

// ─── Step 3: Resultado ────────────────────────────────────────────────────────

function StepResult({
  result, paymentType, onClose,
}: {
  result: CheckoutResult;
  paymentType: PaymentType;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyPix = () => {
    if (result.pix_qr_code) {
      navigator.clipboard.writeText(result.pix_qr_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (result.confirmed) {
    return (
      <div className="text-center space-y-4 py-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
        </motion.div>
        <div>
          <p className="text-xl font-bold text-white">Pagamento confirmado!</p>
          <p className="text-sm text-slate-400 mt-1">Seu plano foi ativado com sucesso.</p>
        </div>
        <button onClick={onClose}
          className="px-6 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/20 transition-colors">
          Fechar
        </button>
      </div>
    );
  }

  if (paymentType === 'pix') {
    return (
      <div className="space-y-5">
        <div className="text-center">
          <QrCode className="w-8 h-8 text-sky-400 mx-auto mb-2" />
          <p className="font-semibold text-white">Escaneie o QR Code</p>
          <p className="text-xs text-slate-500 mt-0.5">O acesso é liberado automaticamente após o pagamento</p>
        </div>

        {result.pix_qr_code_image && (
          <div className="flex justify-center">
            <img
              src={`data:image/png;base64,${result.pix_qr_code_image}`}
              alt="QR Code PIX"
              className="w-48 h-48 rounded-xl border border-white/10 bg-white p-2"
            />
          </div>
        )}

        {result.pix_qr_code && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500">Ou use o Pix Copia e Cola:</p>
            <div className="flex gap-2">
              <div className="flex-1 px-3 py-2 rounded-lg bg-[#0B1220] border border-white/5 text-xs text-slate-400 font-mono truncate">
                {result.pix_qr_code.slice(0, 40)}...
              </div>
              <button onClick={copyPix}
                className="px-3 py-2 rounded-lg border border-white/5 text-slate-400 hover:text-white hover:border-white/10 transition-all">
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        <p className="text-xs text-center text-slate-600">
          Aguardando confirmação... a tela atualiza automaticamente.
        </p>
      </div>
    );
  }

  if (paymentType === 'boleto') {
    return (
      <div className="space-y-5 text-center">
        <FileText className="w-12 h-12 text-blue-400 mx-auto" />
        <div>
          <p className="font-semibold text-white">Boleto gerado!</p>
          <p className="text-xs text-slate-500 mt-1">Vence em 3 dias úteis. Pague em qualquer banco.</p>
        </div>

        {(result.bank_slip_url || result.payment_url) && (
          <a
            href={result.bank_slip_url ?? result.payment_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-300 text-sm font-semibold hover:bg-blue-500/20 transition-colors"
          >
            <ExternalLink className="w-4 h-4" /> Abrir boleto
          </a>
        )}

        <p className="text-xs text-slate-600">
          O acesso é liberado automaticamente após a compensação bancária.
        </p>
      </div>
    );
  }

  return null;
}

// ─── Modal principal ──────────────────────────────────────────────────────────

type Step = 'method' | 'data' | 'result';

export default function CheckoutModal({ plan, interval, onClose }: Props) {
  const { companyId } = useAuth() as any;
  const { refetch }   = useBilling();

  const [step,        setStep]        = useState<Step>('method');
  const [paymentType, setPaymentType] = useState<PaymentType>('pix');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [result,      setResult]      = useState<CheckoutResult | null>(null);

  const handleMethod = (type: PaymentType) => {
    setPaymentType(type);
    setStep('data');
  };

  const handleCustomerData = async (customerData: {
    name: string; email: string; cpfCnpj: string; phone: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const res = await fetch(`${supabaseUrl}/functions/v1/billing-checkout`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          company_id:       companyId,
          plan_slug:        plan.id,
          billing_interval: interval,
          payment_type:     paymentType,
          customer_data: {
            name:      customerData.name,
            email:     customerData.email,
            cpfCnpj:   onlyDigits(customerData.cpfCnpj),
            phone:     onlyDigits(customerData.phone),
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? 'Erro ao processar pagamento');

      setResult(data);
      setStep('result');

      if (data.confirmed) {
        setTimeout(() => refetch(), 1000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const stepTitles: Record<Step, string> = {
    method: 'Escolha o pagamento',
    data:   'Seus dados',
    result: paymentType === 'pix' ? 'PIX gerado' : paymentType === 'boleto' ? 'Boleto gerado' : 'Pagamento processado',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      style={{ background: 'rgba(3,7,18,0.85)', backdropFilter: 'blur(12px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 16 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md bg-[#0B1220] border border-white/5 rounded-xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
              Assinar plano
            </p>
            <h2 className="text-sm font-bold text-white mt-0.5">{stepTitles[step]}</h2>
          </div>
          <button onClick={onClose}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-400 hover:bg-white/5 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-4"
              >
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <p className="text-xs text-red-300">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: step === 'method' ? -12 : 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              {step === 'method' && (
                <StepPaymentMethod onSelect={handleMethod} interval={interval} plan={plan} />
              )}
              {step === 'data' && (
                <StepCustomerData onSubmit={handleCustomerData} onBack={() => setStep('method')} loading={loading} />
              )}
              {step === 'result' && result && (
                <StepResult result={result} paymentType={paymentType} onClose={onClose} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
