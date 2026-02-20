import { AIToolConfig, AIToolId } from './types';

export const DEFAULT_AI_TOOLS: Record<AIToolId, AIToolConfig> = {
  pilot: {
    id: 'pilot',
    name: 'Chat do agente (Pilot)',
    description: 'Chat principal com ferramentas do CRM.',
    enabled: true,
    basePrompt: `Você é o NossoCRM Pilot, um assistente de vendas inteligente. 🚀

PERSONALIDADE:
- Seja proativo, amigável e analítico
- Use emojis com moderação (máximo 2 por resposta)
- Respostas naturais (evite listas robóticas)
- Máximo 2 parágrafos por resposta

REGRAS:
- Sempre explique os resultados das ferramentas
- Se der erro, informe de forma amigável
- Não mostre IDs/UUIDs para o usuário final`
  },
  sales_script: {
    id: 'sales_script',
    name: 'Script de vendas',
    description: 'Geração de script (Inbox / ações).',
    enabled: true,
    basePrompt: `Gere script de vendas ({{scriptType}}).
Deal: {{dealTitle}}. Contexto: {{context}}.
Seja natural, 4 parágrafos max. Português do Brasil.`
  },
  daily_briefing: {
    id: 'daily_briefing',
    name: 'Briefing diário',
    description: 'Resumo diário de prioridades.',
    enabled: true,
    basePrompt: `Briefing diário. Dados: {{dataJson}}.
Resuma prioridades em português do Brasil.`
  },
  deal_coach: {
    id: 'deal_coach',
    name: 'Análise de deal (coach)',
    description: 'Sugere próxima ação e urgência.',
    enabled: true,
    basePrompt: `Você é um coach de vendas analisando um deal de CRM. Seja DIRETO e ACIONÁVEL.

DEAL:
- Título: {{dealTitle}}
- Valor: R$ {{dealValue}}
- Estágio: {{stageLabel}}
- Probabilidade: {{probability}}%

RETORNE:
1. action: Verbo no infinitivo + complemento curto (máx 50 chars).
2. reason: Por que fazer isso AGORA (máx 80 chars).
3. actionType: CALL, MEETING, EMAIL, TASK ou WHATSAPP
4. urgency: low, medium, high
5. probabilityScore: 0-100

Seja conciso. Português do Brasil.`
  },
  email_draft: {
    id: 'email_draft',
    name: 'Rascunho de e-mail',
    description: 'Gera email profissional para o deal.',
    enabled: true,
    basePrompt: `Gere um rascunho de email profissional para:
- Contato: {{contactName}}
- Empresa: {{companyName}}
- Deal: {{dealTitle}}

Escreva um email conciso e eficaz em português do Brasil.`
  },
  objections: {
    id: 'objections',
    name: 'Objeções (3 respostas)',
    description: 'Gera alternativas para contornar objeções.',
    enabled: true,
    basePrompt: `Objeção: "{{objection}}" no deal "{{dealTitle}}".
Gere 3 respostas práticas (Empática, Valor, Pergunta).
Português do Brasil.`
  },
  board_structure: {
    id: 'board_structure',
    name: 'Boards: gerar estrutura',
    description: 'Cria estágios e automações sugeridas.',
    enabled: true,
    basePrompt: `Crie uma estrutura de board Kanban para: {{description}}.
LIFECYCLES: {{lifecycleJson}}
Crie 4-7 estágios com cores Tailwind.
Português do Brasil.`
  },
  board_strategy: {
    id: 'board_strategy',
    name: 'Boards: gerar estratégia',
    description: 'Define meta/KPI/persona do board.',
    enabled: true,
    basePrompt: `Defina estratégia para board: {{boardName}}.
Meta, KPI, Persona.
Português do Brasil.`
  },
  board_refine: {
    id: 'board_refine',
    name: 'Boards: refinar com IA',
    description: 'Refina o board via chat/instruções.',
    enabled: true,
    basePrompt: `Ajuste o board com base na instrução: "{{userInstruction}}".
{{boardContext}}
{{historyContext}}

Se for conversa, retorne board: null.`
  }
};
