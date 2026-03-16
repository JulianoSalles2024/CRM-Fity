import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket, Target, TrendingUp, ArrowRight, Trophy,
  ChevronRight, Sparkles, Kanban, Users, Star,
  CheckCircle2, Circle, Zap,
} from 'lucide-react';

interface PipelineOnboardingProps {
  onCreatePipeline: () => void;
  userName?: string;
}

/* ─── Mini Kanban Preview ──────────────────────────────────────────────── */
const PREVIEW_STAGES = [
  { label: 'Novo Lead', color: '#3b82f6', cards: ['Maria Costa', 'João Silva'] },
  { label: 'Em Contato', color: '#eab308', cards: ['Pedro Alves'] },
  { label: 'Proposta', color: '#8b5cf6', cards: ['Ana Lima'] },
  { label: 'Fechado ✓', color: '#10b981', cards: [] },
];

const MiniKanban: React.FC = () => {
  const [activeCard, setActiveCard] = useState<{ col: number; card: number } | null>(null);
  const [floatingCard, setFloatingCard] = useState<string | null>(null);

  useEffect(() => {
    // Animate card "moving" between columns
    const interval = setInterval(() => {
      setFloatingCard('Pedro Alves');
      setTimeout(() => setFloatingCard(null), 1800);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex gap-2 p-3 rounded-xl bg-[#060d1a] border border-white/5 overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />

      {PREVIEW_STAGES.map((stage, ci) => (
        <motion.div
          key={stage.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: ci * 0.12, duration: 0.4 }}
          className="flex-1 min-w-0"
        >
          {/* Column header */}
          <div className="flex items-center gap-1.5 mb-2 px-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
            <span className="text-[9px] font-semibold text-slate-400 truncate">{stage.label}</span>
          </div>

          {/* Cards */}
          <div className="space-y-1.5">
            {stage.cards.map((name, ri) => (
              <motion.div
                key={name}
                animate={floatingCard === name ? { opacity: 0.3, scale: 0.95 } : { opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-[#0F172A] border border-white/8 rounded-lg p-2"
              >
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 mb-1.5 flex items-center justify-center">
                  <span className="text-[7px] font-bold text-white">{name[0]}</span>
                </div>
                <div className="text-[9px] text-slate-300 font-medium leading-tight">{name}</div>
                <div className="w-full h-0.5 bg-slate-800 rounded mt-1.5">
                  <div
                    className="h-full rounded"
                    style={{ backgroundColor: stage.color, width: `${55 + ri * 22}%` }}
                  />
                </div>
              </motion.div>
            ))}

            {/* Empty slot indicator */}
            {stage.cards.length === 0 && (
              <div className="border border-dashed border-slate-700/60 rounded-lg p-2 flex items-center justify-center">
                <span className="text-[9px] text-slate-600">vazio</span>
              </div>
            )}
          </div>
        </motion.div>
      ))}

      {/* Floating card animation */}
      <AnimatePresence>
        {floatingCard && (
          <motion.div
            initial={{ opacity: 0, x: -20, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, x: 60, y: -5, scale: 1.05 }}
            exit={{ opacity: 0, x: 120, y: 5, scale: 0.9 }}
            transition={{ duration: 1.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute top-[52px] left-[30%] bg-[#1e293b] border border-blue-500/40 rounded-lg p-2 shadow-lg shadow-blue-500/20 z-10 pointer-events-none"
          >
            <div className="text-[9px] text-white font-semibold">{floatingCard}</div>
            <div className="text-[8px] text-blue-400 mt-0.5">movendo →</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Step Badge ────────────────────────────────────────────────────────── */
interface StepProps {
  number: number;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  active?: boolean;
  done?: boolean;
  delay: number;
}

const Step: React.FC<StepProps> = ({ number, label, sublabel, icon: Icon, active, done, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5, ease: 'easeOut' }}
    className={`relative flex items-start gap-3 p-4 rounded-xl border transition-all ${
      active
        ? 'bg-blue-600/10 border-blue-500/40 shadow-[0_0_24px_rgba(59,130,246,0.08)]'
        : done
        ? 'bg-emerald-500/5 border-emerald-500/20'
        : 'bg-white/[0.02] border-white/5'
    }`}
  >
    {/* Step number / icon */}
    <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
      active
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
        : done
        ? 'bg-emerald-500/20 text-emerald-400'
        : 'bg-slate-800 text-slate-500'
    }`}>
      {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
    </div>

    <div className="flex-1 min-w-0">
      <div className={`text-sm font-semibold ${active ? 'text-white' : done ? 'text-emerald-400' : 'text-slate-500'}`}>
        {label}
      </div>
      <div className="text-xs text-slate-500 mt-0.5">{sublabel}</div>
    </div>

    {active && (
      <div className="shrink-0 flex items-center gap-1 text-blue-400">
        <span className="text-xs font-medium">Agora</span>
        <Zap className="w-3 h-3" />
      </div>
    )}
  </motion.div>
);

/* ─── Main Component ────────────────────────────────────────────────────── */
const PipelineOnboarding: React.FC<PipelineOnboardingProps> = ({ onCreatePipeline, userName }) => {
  const firstName = userName?.split(' ')[0] ?? 'Vendedor';

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden bg-[#060d1a]">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[10%] w-[500px] h-[500px] rounded-full bg-blue-600/6 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[5%] w-[400px] h-[400px] rounded-full bg-purple-600/5 blur-[80px]" />
        {/* Grid lines */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

          {/* ── Left column ── */}
          <div>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-xs font-semibold text-blue-400 tracking-wide uppercase">Passo 1 de 3</span>
            </motion.div>

            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6, ease: 'easeOut' }}
            >
              <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-[1.1] tracking-tight mb-2">
                Olá, {firstName}.
              </h1>
              <h2 className="text-4xl lg:text-5xl font-extrabold leading-[1.1] tracking-tight mb-5">
                <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-400 bg-clip-text text-transparent">
                  Configure sua
                </span>
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-400 bg-clip-text text-transparent">
                  pipeline.
                </span>
              </h2>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-slate-400 text-base leading-relaxed mb-8 max-w-md"
            >
              Antes de começar, você precisa de uma pipeline — ela organiza seus leads por etapa
              e é o motor do seu processo de vendas.
            </motion.p>

            {/* Steps */}
            <div className="space-y-2.5 mb-8">
              <Step
                number={1}
                icon={Kanban}
                label="Criar sua pipeline"
                sublabel="Escolha um template ou crie do zero"
                active
                delay={0.3}
              />
              <Step
                number={2}
                icon={Users}
                label="Adicionar seus primeiros leads"
                sublabel="Importe ou crie manualmente"
                delay={0.4}
              />
              <Step
                number={3}
                icon={Trophy}
                label="Fechar negócios"
                sublabel="Mova leads pelas etapas e registre vitórias"
                delay={0.5}
              />
            </div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <motion.button
                onClick={onCreatePipeline}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative inline-flex items-center gap-3 px-7 py-4 rounded-2xl text-base font-bold text-white overflow-hidden shadow-xl shadow-blue-600/20 transition-all"
                style={{
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e40af 100%)',
                }}
              >
                {/* Shine */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/8 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <Sparkles className="w-5 h-5" />
                Criar minha pipeline agora
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </motion.button>
              <p className="text-xs text-slate-600 mt-3">
                Leva menos de 1 minuto · Templates prontos disponíveis
              </p>
            </motion.div>
          </div>

          {/* ── Right column ── */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.7, ease: 'easeOut' }}
            className="hidden lg:flex flex-col gap-5"
          >
            {/* Preview card */}
            <div className="bg-[#0B1220] border border-white/6 rounded-2xl p-5 shadow-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-blue-500/10">
                  <Kanban className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-sm font-semibold text-white">Pipeline de Vendas</span>
                <span className="ml-auto text-xs text-slate-500">3 leads ativos</span>
              </div>
              <MiniKanban />
            </div>

            {/* Stat chips */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Target, value: '3×', label: 'mais conversões', color: 'text-blue-400', bg: 'bg-blue-500/10' },
                { icon: TrendingUp, value: '47%', label: 'mais receita', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                { icon: Star, value: '#1', label: 'ferramenta de times', color: 'text-amber-400', bg: 'bg-amber-500/10' },
              ].map(({ icon: Icon, value, label, color, bg }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.08, duration: 0.4 }}
                  className="bg-[#0B1220] border border-white/6 rounded-xl p-3 text-center"
                >
                  <div className={`inline-flex p-1.5 rounded-lg ${bg} mb-2`}>
                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                  </div>
                  <div className={`text-lg font-extrabold ${color}`}>{value}</div>
                  <div className="text-[10px] text-slate-500 leading-tight">{label}</div>
                </motion.div>
              ))}
            </div>

            {/* Quote / social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="bg-[#0B1220] border border-white/6 rounded-xl p-4"
            >
              <div className="flex gap-0.5 mb-2">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className="w-3 h-3 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed italic">
                "Criar o pipeline foi a primeira coisa que fiz. Em 2 semanas já tinha o dobro de negócios organizados."
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[9px] font-bold text-white">R</div>
                <span className="text-[10px] text-slate-500">Rafael M. · Vendedor NextSales</span>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default PipelineOnboarding;
