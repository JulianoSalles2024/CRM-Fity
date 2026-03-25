/**
 * ConsentBanner — NextSales CRM
 *
 * Fixed footer banner asking the user to accept the Privacy Policy (LGPD).
 * - Checks localStorage; if already accepted, renders nothing.
 * - "Ver Política" opens a full-screen modal with the policy text.
 * - "Aceitar" saves to localStorage + inserts an anonymous row in consent_logs.
 */

import React, { useEffect, useState } from 'react';
import { Shield, X } from 'lucide-react';

/* ─── Constants ─────────────────────────────────────────────────────────── */

const CONSENT_KEY     = 'ns_consent_v1';
const POLICY_VERSION  = 'v1.0';

/* ─── Privacy Policy Text ───────────────────────────────────────────────── */

const EMAIL = (
  <a href="mailto:nextsalesia@gmail.com" className="text-blue-400 hover:text-blue-300 underline transition-colors">
    nextsalesia@gmail.com
  </a>
);

const POLICY_SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: '1. Controlador dos Dados',
    body: `A NextSales Tecnologia Ltda., doravante denominada "NextSales", é a controladora dos dados pessoais tratados por meio da plataforma NextSales CRM, conforme a Lei nº 13.709/2018 (LGPD).`,
  },
  {
    title: '2. Dados Coletados',
    body: `Coletamos os seguintes dados para a operação da plataforma:\n\n• Dados de identificação: nome completo, endereço de e-mail;\n• Dados de acesso: logs de autenticação, endereço IP, user agent do navegador;\n• Dados de uso: histórico de interações com leads, conversas registradas, anotações comerciais;\n• Dados de configuração: preferências da conta e ajustes de perfil.`,
  },
  {
    title: '3. Finalidade do Tratamento',
    body: `Os dados são tratados exclusivamente para:\n\n• Autenticação e controle de acesso ao CRM;\n• Gestão do relacionamento com clientes (leads, deals e conversas);\n• Geração de relatórios e analytics de desempenho;\n• Comunicação transacional sobre a conta (notificações, alertas de segurança);\n• Cumprimento de obrigações legais e regulatórias.`,
  },
  {
    title: '4. Base Legal',
    body: `O tratamento se fundamenta nas seguintes bases legais (LGPD, art. 7º):\n\n• Execução de contrato: necessário para prestar o serviço contratado;\n• Legítimo interesse: analytics e melhoria contínua da plataforma;\n• Cumprimento de obrigação legal: registros exigidos por legislação fiscal e trabalhista;\n• Consentimento: para comunicações de marketing, quando aplicável.`,
  },
  {
    title: '5. Compartilhamento de Dados',
    body: `Não vendemos dados pessoais a terceiros. Compartilhamos informações apenas com:\n\n• Provedores de infraestrutura (Supabase/AWS) sob acordos de confidencialidade;\n• Ferramentas de comunicação integradas (WhatsApp Business API, e-mail) exclusivamente para entrega de mensagens;\n• Autoridades públicas, quando exigido por lei ou ordem judicial.`,
  },
  {
    title: '6. Prazo de Retenção',
    body: `Os dados são retidos pelo tempo necessário à prestação do serviço e ao cumprimento das obrigações legais:\n\n• Dados de conta: durante a vigência do contrato + 5 anos após o encerramento;\n• Logs de acesso: 6 meses (Marco Civil da Internet, art. 15);\n• Conversas e dados de leads: conforme configuração da conta do cliente.`,
  },
  {
    title: '7. Direitos do Titular (LGPD, art. 18)',
    body: <>{'Você tem direito a, a qualquer momento:\n\n• Confirmar a existência de tratamento dos seus dados;\n• Acessar, corrigir ou atualizar seus dados;\n• Solicitar anonimização, bloqueio ou eliminação de dados desnecessários;\n• Solicitar a portabilidade dos seus dados;\n• Revogar o consentimento, quando aplicável;\n• Apresentar reclamação à ANPD.\n\nPara exercer esses direitos, entre em contato: '}{EMAIL}</>,
  },
  {
    title: '8. Segurança',
    body: `Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados, incluindo criptografia em trânsito (TLS 1.3), controle de acesso por autenticação multifator e monitoramento contínuo de segurança.`,
  },
  {
    title: '9. Contato do Encarregado (DPO)',
    body: <>{'Nosso Encarregado de Proteção de Dados pode ser contatado pelo e-mail: '}{EMAIL}</>,
  },
  {
    title: '10. Vigência e Alterações',
    body: `Esta política é válida a partir de 25 de março de 2026 (versão ${POLICY_VERSION}). Alterações relevantes serão comunicadas com antecedência mínima de 15 dias. O uso continuado da plataforma após a comunicação implica aceite da nova versão.`,
  },
];

/* ─── Sub-component: Policy Modal ───────────────────────────────────────── */

function PolicyModal({ onClose, onAccept }: { onClose: () => void; onAccept: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full rounded-2xl border border-white/10 flex flex-col"
        style={{
          maxWidth: 680,
          maxHeight: '88vh',
          background: 'rgba(15,23,42,0.95)',
          backdropFilter: 'blur(24px)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <Shield size={18} className="text-blue-400" />
            <span className="text-white font-semibold text-base">Política de Privacidade</span>
            <span className="text-xs text-slate-500 ml-1">{POLICY_VERSION}</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-8 py-6 flex-1 space-y-6 text-sm leading-relaxed">
          <p className="text-slate-400">
            Leia atentamente nossa Política de Privacidade antes de utilizar a plataforma NextSales CRM.
            Ao aceitar, você confirma que leu e concorda com os termos abaixo, nos termos da LGPD (Lei nº 13.709/2018).
          </p>

          {POLICY_SECTIONS.map(section => (
            <div key={section.title}>
              <h3 className="text-white font-semibold mb-2">{section.title}</h3>
              <div className="text-slate-400 whitespace-pre-line">{section.body}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-white/10 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white border border-white/10 hover:border-white/20 transition-all duration-200"
          >
            Fechar
          </button>
          <button
            onClick={onAccept}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-all duration-200"
          >
            Aceitar e continuar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main component: ConsentBanner ─────────────────────────────────────── */

export function ConsentBanner() {
  const [visible, setVisible]       = useState(false);
  const [modalOpen, setModalOpen]   = useState(false);
  const [accepting, setAccepting]   = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(CONSENT_KEY)) {
      setVisible(true);
    }
  }, []);

  const saveConsent = async () => {
    if (accepting) return;
    setAccepting(true);

    // Salva localmente — o insert no banco acontece após o login (com user_id)
    localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({ accepted_at: new Date().toISOString(), policy_version: POLICY_VERSION, user_agent: navigator.userAgent }),
    );

    setVisible(false);
    setModalOpen(false);
  };

  if (!visible) return null;

  return (
    <>
      {modalOpen && (
        <PolicyModal
          onClose={() => setModalOpen(false)}
          onAccept={saveConsent}
        />
      )}

      {/* Fixed banner */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10"
        style={{
          background: 'rgba(8,16,36,0.92)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div className="max-w-screen-xl mx-auto px-6 py-3.5 flex items-center gap-4 flex-wrap">
          <Shield size={16} className="text-blue-400 shrink-0" />
          <p className="text-slate-400 text-sm flex-1 min-w-0">
            Usamos seus dados conforme nossa{' '}
            <strong className="text-slate-300 font-medium">Política de Privacidade</strong>.
            Ao continuar, você concorda com os termos.
          </p>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setModalOpen(true)}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap"
            >
              Ver política
            </button>
            <button
              onClick={saveConsent}
              disabled={accepting}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all duration-200 whitespace-nowrap"
            >
              {accepting ? 'Salvando…' : 'Aceitar'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
