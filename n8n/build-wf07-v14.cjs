const fs = require('fs');
const d = JSON.parse(fs.readFileSync('C:/Users/julia/CRM-Fity/n8n/WF-07-AGENT-EXECUTOR-V13.json'));

const SUPABASE_URL = 'https://fhkhamwrfwtacwydukvb.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoa2hhbXdyZnd0YWN3eWR1a3ZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTMyNjcxMywiZXhwIjoyMDgwOTAyNzEzfQ.slNbow0lzBpryTaPPNNPDOV5x_uBqRHQZR38RRk92sY';
const OPENAI_KEY = 'OPENAI_API_KEY_PLACEHOLDER';

const HEADERS = [
  { name: 'apikey',        value: SERVICE_KEY },
  { name: 'Authorization', value: `Bearer ${SERVICE_KEY}` },
  { name: 'Content-Type',  value: 'application/json' }
];

// ── Node 1: Code - Prep Stage Check ─────────────────────────────────────────
const prepStageCheck = {
  parameters: {
    jsCode: `// Só processa mensagens inbound
const body = $('Webhook').first().json.body;
if (body.content_type !== 'inbound') return [];

const leadRaw = $('HTTP - Get Lead').first().json;
const lead = Array.isArray(leadRaw) ? leadRaw[0] : leadRaw;
if (!lead || !lead.column_id) return [];

return [{ json: {
  lead_id:      lead.id,
  lead_name:    lead.name || '',
  column_id:    lead.column_id,
  company_id:   body.company_id,
  content_text: (body.input_text || '').toLowerCase()
} }];`
  },
  id: 'wf07v14-prep', name: 'Code - Prep Stage Check',
  type: 'n8n-nodes-base.code', typeVersion: 2,
  position: [2520, 500], continueOnFail: true, alwaysOutputData: false
};

// ── Node 2: HTTP - Get Stage Triggers ────────────────────────────────────────
const getStageTriggers = {
  parameters: {
    url: `${SUPABASE_URL}/rest/v1/board_stages`,
    sendQuery: true,
    queryParameters: { parameters: [
      { name: 'id',     value: '=eq.{{ $json.column_id }}' },
      { name: 'select', value: 'id,name,auto_triggers,requires_approval' },
      { name: 'limit',  value: '1' }
    ]},
    sendHeaders: true,
    headerParameters: { parameters: HEADERS },
    options: {}
  },
  id: 'wf07v14-get-stage', name: 'HTTP - Get Stage Triggers',
  type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2,
  position: [2760, 500], continueOnFail: true, alwaysOutputData: true
};

// ── Node 3: Code - Check Triggers ────────────────────────────────────────────
const checkTriggers = {
  parameters: {
    jsCode: `const prep  = $('Code - Prep Stage Check').first().json;
const stageRaw = $input.first().json;
const stage = Array.isArray(stageRaw) ? stageRaw[0] : stageRaw;

const auto_triggers     = Array.isArray(stage?.auto_triggers) ? stage.auto_triggers : [];
const requires_approval = stage?.requires_approval ?? false;
const stage_name        = stage?.name || 'estágio atual';
const content_text      = prep.content_text || '';

let matched_trigger = null;
for (const trigger of auto_triggers) {
  const keyword = (typeof trigger === 'object'
    ? (trigger.keyword || '') : (trigger || '')
  ).toLowerCase().trim();
  if (keyword && content_text.includes(keyword)) {
    matched_trigger = keyword;
    break;
  }
}

return [{ json: {
  trigger_detected:  !!matched_trigger,
  matched_trigger,
  requires_approval,
  stage_name,
  lead_id:      prep.lead_id,
  lead_name:    prep.lead_name,
  column_id:    prep.column_id,
  company_id:   prep.company_id,
  content_text: prep.content_text
} }];`
  },
  id: 'wf07v14-check-triggers', name: 'Code - Check Triggers',
  type: 'n8n-nodes-base.code', typeVersion: 2,
  position: [3000, 500], continueOnFail: true
};

// ── Node 4: IF - Trigger Detected ────────────────────────────────────────────
const ifTriggerDetected = {
  parameters: {
    conditions: {
      options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
      conditions: [{ id: 'td', leftValue: '={{ String($json.trigger_detected) }}', rightValue: 'true', operator: { type: 'string', operation: 'equals' } }],
      combinator: 'and'
    }, options: {}
  },
  id: 'wf07v14-if-trigger', name: 'IF - Trigger Detected',
  type: 'n8n-nodes-base.if', typeVersion: 2,
  position: [3240, 500]
};

// ── Node 5a: HTTP - Get Next Stage (keyword branch) ───────────────────────────
const getNextStageKw = {
  parameters: {
    url: `${SUPABASE_URL}/rest/v1/rpc/get_next_stage`,
    method: 'POST',
    sendHeaders: true, headerParameters: { parameters: HEADERS },
    sendBody: true, specifyBody: 'keypair',
    bodyParameters: { parameters: [
      { name: 'p_current_stage_id', value: '={{ $json.column_id }}' }
    ]},
    options: {}
  },
  id: 'wf07v14-next-stage-kw', name: 'HTTP - Get Next Stage',
  type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2,
  position: [3480, 380], continueOnFail: true, alwaysOutputData: true
};

// ── Node 5b: Code - Prep AI Analysis (no-keyword branch) ─────────────────────
const prepAIAnalysis = {
  parameters: {
    jsCode: `const trig = $('Code - Check Triggers').first().json;
const messages = $('HTTP - Get Messages').all().map(m => m.json);
const recent = messages.slice(0, 8).reverse()
  .map(m => (m.direction === 'inbound' ? 'Lead' : 'Agente') + ': ' + (m.content || '').trim())
  .filter(Boolean).join('\\n');

const systemPrompt =
  'Você é um especialista em análise de conversas de vendas. ' +
  'Analise o histórico abaixo e determine se o lead demonstrou interesse, ' +
  'engajamento ou intenção suficiente para avançar no funil comercial. ' +
  'O lead está no estágio: "' + trig.stage_name + '". ' +
  'Responda APENAS com uma palavra: SIM (deve avançar) ou NAO (deve permanecer).';

const userMsg =
  'Histórico:\\n' + (recent || '(sem histórico)') +
  '\\n\\nÚltima mensagem do lead: "' + trig.content_text + '"' +
  '\\n\\nO lead deve avançar de estágio?';

return [{ json: {
  model: 'gpt-4o-mini',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user',   content: userMsg }
  ],
  max_tokens: 10,
  temperature: 0.1
} }];`
  },
  id: 'wf07v14-prep-ai', name: 'Code - Prep AI Analysis',
  type: 'n8n-nodes-base.code', typeVersion: 2,
  position: [3480, 620], continueOnFail: true
};

// ── Node 5c: HTTP - OpenAI Advance Decision ───────────────────────────────────
const openAIDecision = {
  parameters: {
    url: 'https://api.openai.com/v1/chat/completions',
    method: 'POST',
    authentication: 'predefinedCredentialType',
    nodeCredentialType: 'openAiApi',
    sendBody: true, specifyBody: 'json',
    jsonBody: '={{ JSON.stringify($json) }}',
    options: {}
  },
  credentials: {
    openAiApi: { id: 'openai-credentials', name: 'OpenAI API' }
  },
  id: 'wf07v14-openai-decision', name: 'HTTP - OpenAI Advance Decision',
  type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2,
  position: [3720, 620], continueOnFail: true
};

// ── Node 5d: IF - AI Says Advance ─────────────────────────────────────────────
const ifAISaysAdvance = {
  parameters: {
    conditions: {
      options: { caseSensitive: false, leftValue: '', typeValidation: 'loose' },
      conditions: [{ id: 'ai-sim', leftValue: '={{ ($json.choices?.[0]?.message?.content || "").trim().toUpperCase() }}', rightValue: 'SIM', operator: { type: 'string', operation: 'equals' } }],
      combinator: 'and'
    }, options: {}
  },
  id: 'wf07v14-if-ai', name: 'IF - AI Says Advance',
  type: 'n8n-nodes-base.if', typeVersion: 2,
  position: [3960, 620]
};

// ── Node 5e: HTTP - Get Next Stage (AI branch) ────────────────────────────────
const getNextStageAI = {
  parameters: {
    url: `${SUPABASE_URL}/rest/v1/rpc/get_next_stage`,
    method: 'POST',
    sendHeaders: true, headerParameters: { parameters: HEADERS },
    sendBody: true, specifyBody: 'keypair',
    bodyParameters: { parameters: [
      { name: 'p_current_stage_id', value: "={{ $('Code - Check Triggers').first().json.column_id }}" }
    ]},
    options: {}
  },
  id: 'wf07v14-next-stage-ai', name: 'HTTP - Get Next Stage AI',
  type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2,
  position: [4200, 620], continueOnFail: true, alwaysOutputData: true
};

// ── Node 6: Code - Extract Next Stage ────────────────────────────────────────
const extractNextStage = {
  parameters: {
    jsCode: `const raw = $input.first().json;
const next_stage_id = (raw && raw.next_stage_id) ? raw.next_stage_id : null;
const trig = $('Code - Check Triggers').first().json;
return [{ json: {
  next_stage_id,
  has_next_stage:    !!next_stage_id,
  requires_approval: trig.requires_approval,
  lead_id:   trig.lead_id,
  lead_name: trig.lead_name,
  company_id: trig.company_id
} }];`
  },
  id: 'wf07v14-extract', name: 'Code - Extract Next Stage',
  type: 'n8n-nodes-base.code', typeVersion: 2,
  position: [4440, 500], continueOnFail: true
};

// ── Node 7: IF - Has Next Stage ───────────────────────────────────────────────
const ifHasNextStage = {
  parameters: {
    conditions: {
      options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
      conditions: [{ id: 'has-next', leftValue: '={{ String($json.has_next_stage) }}', rightValue: 'true', operator: { type: 'string', operation: 'equals' } }],
      combinator: 'and'
    }, options: {}
  },
  id: 'wf07v14-if-next', name: 'IF - Has Next Stage',
  type: 'n8n-nodes-base.if', typeVersion: 2,
  position: [4680, 500]
};

// ── Node 8: HTTP - Move Lead ──────────────────────────────────────────────────
const moveLead = {
  parameters: {
    url: `${SUPABASE_URL}/rest/v1/leads`,
    method: 'PATCH',
    sendQuery: true,
    queryParameters: { parameters: [
      { name: 'id', value: '=eq.{{ $json.lead_id }}' }
    ]},
    sendHeaders: true,
    headerParameters: { parameters: [...HEADERS, { name: 'Prefer', value: 'return=minimal' }] },
    sendBody: true, specifyBody: 'keypair',
    bodyParameters: { parameters: [
      { name: 'column_id', value: '={{ $json.next_stage_id }}' }
    ]},
    options: {}
  },
  id: 'wf07v14-move-lead', name: 'HTTP - Move Lead',
  type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2,
  position: [4920, 500], continueOnFail: true
};

// ── Add all nodes ─────────────────────────────────────────────────────────────
d.nodes.push(
  prepStageCheck, getStageTriggers, checkTriggers,
  ifTriggerDetected,
  getNextStageKw, prepAIAnalysis, openAIDecision, ifAISaysAdvance, getNextStageAI,
  extractNextStage, ifHasNextStage, moveLead
);

// ── Connections ───────────────────────────────────────────────────────────────
d.connections['HTTP - Send WhatsApp'] = {
  main: [[
    { node: 'HTTP - Insert Message',    type: 'main', index: 0 },
    { node: 'Code - Prep Stage Check', type: 'main', index: 0 }
  ]]
};
d.connections['Code - Prep Stage Check'] = {
  main: [[{ node: 'HTTP - Get Stage Triggers', type: 'main', index: 0 }]]
};
d.connections['HTTP - Get Stage Triggers'] = {
  main: [[{ node: 'Code - Check Triggers', type: 'main', index: 0 }]]
};
d.connections['Code - Check Triggers'] = {
  main: [[{ node: 'IF - Trigger Detected', type: 'main', index: 0 }]]
};
// IF - Trigger Detected: True → keyword path, False → AI analysis path
d.connections['IF - Trigger Detected'] = {
  main: [
    [{ node: 'HTTP - Get Next Stage',    type: 'main', index: 0 }], // True (keyword)
    [{ node: 'Code - Prep AI Analysis', type: 'main', index: 0 }]   // False (AI)
  ]
};
// Keyword path → Extract
d.connections['HTTP - Get Next Stage'] = {
  main: [[{ node: 'Code - Extract Next Stage', type: 'main', index: 0 }]]
};
// AI path
d.connections['Code - Prep AI Analysis'] = {
  main: [[{ node: 'HTTP - OpenAI Advance Decision', type: 'main', index: 0 }]]
};
d.connections['HTTP - OpenAI Advance Decision'] = {
  main: [[{ node: 'IF - AI Says Advance', type: 'main', index: 0 }]]
};
d.connections['IF - AI Says Advance'] = {
  main: [
    [{ node: 'HTTP - Get Next Stage AI', type: 'main', index: 0 }], // True
    []                                                                 // False: end
  ]
};
d.connections['HTTP - Get Next Stage AI'] = {
  main: [[{ node: 'Code - Extract Next Stage', type: 'main', index: 0 }]]
};
// Convergence → IF Has Next Stage → Move Lead
d.connections['Code - Extract Next Stage'] = {
  main: [[{ node: 'IF - Has Next Stage', type: 'main', index: 0 }]]
};
d.connections['IF - Has Next Stage'] = {
  main: [
    [{ node: 'HTTP - Move Lead', type: 'main', index: 0 }], // True
    []                                                        // False: end
  ]
};

// ── Save ──────────────────────────────────────────────────────────────────────
d.name = 'WF-07-AGENT-EXECUTOR-V14';
fs.writeFileSync('C:/Users/julia/CRM-Fity/n8n/WF-07-AGENT-EXECUTOR-V14.json', JSON.stringify(d, null, 2));
console.log('WF-07-AGENT-EXECUTOR-V14.json saved!');
console.log('Hybrid cadence: keyword trigger → move | no keyword → GPT decides → move');
