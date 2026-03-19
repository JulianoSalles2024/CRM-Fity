const fs = require('fs');
const d = JSON.parse(fs.readFileSync('C:/Users/julia/CRM-Fity/n8n/WF-01-WA-INBOUND - V12(media-fix).json'));

const SUPABASE_URL = 'https://fhkhamwrfwtacwydukvb.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoa2hhbXdyZnd0YWN3eWR1a3ZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTMyNjcxMywiZXhwIjoyMDgwOTAyNzEzfQ.slNbow0lzBpryTaPPNNPDOV5x_uBqRHQZR38RRk92sY';
const WF07_WEBHOOK = 'https://n8n.julianosalles.com.br/webhook/agent-executor';

// ── New node 1: HTTP - Check AI Agent ────────────────────────────────────────
const checkAIAgentNode = {
  parameters: {
    url: `${SUPABASE_URL}/rest/v1/conversations`,
    sendQuery: true,
    queryParameters: {
      parameters: [
        { name: 'id', value: "=eq.{{ $('HTTP - RPC resolve_or_create_conversation').first().json.conversation_id }}" },
        { name: 'select', value: 'id,lead_id,ai_agent_id,contact_identifier' },
        { name: 'limit', value: '1' }
      ]
    },
    sendHeaders: true,
    headerParameters: {
      parameters: [
        { name: 'apikey', value: SERVICE_KEY },
        { name: 'Authorization', value: `Bearer ${SERVICE_KEY}` }
      ]
    },
    options: {}
  },
  id: 'wf01v13-node-check-ai',
  name: 'HTTP - Check AI Agent',
  type: 'n8n-nodes-base.httpRequest',
  typeVersion: 4.2,
  position: [3200, 600],
  continueOnFail: true,
  alwaysOutputData: true
};

// ── New node 2: IF - Has AI Agent ────────────────────────────────────────────
const ifHasAIAgentNode = {
  parameters: {
    conditions: {
      options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
      conditions: [
        {
          id: 'has-ai-agent',
          leftValue: '={{ $json.ai_agent_id || "" }}',
          rightValue: '',
          operator: { type: 'string', operation: 'notEquals' }
        }
      ],
      combinator: 'and'
    },
    options: {}
  },
  id: 'wf01v13-node-if-ai',
  name: 'IF - Has AI Agent',
  type: 'n8n-nodes-base.if',
  typeVersion: 2,
  position: [3440, 600]
};

// ── New node 3: HTTP - Trigger WF07 ─────────────────────────────────────────
const triggerWF07Node = {
  parameters: {
    url: WF07_WEBHOOK,
    method: 'POST',
    sendBody: true,
    specifyBody: 'keypair',
    bodyParameters: {
      parameters: [
        { name: 'conversation_id', value: "={{ $json.id }}" },
        { name: 'lead_id',         value: "={{ $json.lead_id }}" },
        { name: 'agent_id',        value: "={{ $json.ai_agent_id }}" },
        { name: 'company_id',      value: "={{ $('Code - Normalize to Canonical Event').first().json.company_id }}" },
        { name: 'contact_identifier', value: "={{ $json.contact_identifier }}" },
        { name: 'input_text',      value: "={{ $('Code - Normalize to Canonical Event').first().json.content_text }}" },
        { name: 'content_type',    value: 'inbound' }
      ]
    },
    sendHeaders: true,
    headerParameters: {
      parameters: [
        { name: 'Content-Type', value: 'application/json' }
      ]
    },
    options: { timeout: 5000, response: { response: { neverError: true } } }
  },
  id: 'wf01v13-node-trigger-wf07',
  name: 'HTTP - Trigger WF07',
  type: 'n8n-nodes-base.httpRequest',
  typeVersion: 4.2,
  position: [3680, 500],
  continueOnFail: true
};

// ── Add new nodes ─────────────────────────────────────────────────────────────
d.nodes.push(checkAIAgentNode, ifHasAIAgentNode, triggerWF07Node);

// ── Update connections ────────────────────────────────────────────────────────
// Remove "HTTP - Trigger AI Agent" from the insert_message parallel branch
const insertMsgConn = d.connections['HTTP - RPC insert_message'].main[0];
d.connections['HTTP - RPC insert_message'].main[0] = insertMsgConn.filter(
  c => c.node !== 'HTTP - Trigger AI Agent'
);
// Add "HTTP - Check AI Agent" to the parallel branch instead
d.connections['HTTP - RPC insert_message'].main[0].push({
  node: 'HTTP - Check AI Agent', type: 'main', index: 0
});

// Check AI Agent → IF - Has AI Agent
d.connections['HTTP - Check AI Agent'] = {
  main: [[{ node: 'IF - Has AI Agent', type: 'main', index: 0 }]]
};

// IF - Has AI Agent: True → Trigger WF07, False → Trigger AI Agent (WF-05)
d.connections['IF - Has AI Agent'] = {
  main: [
    [{ node: 'HTTP - Trigger WF07',    type: 'main', index: 0 }], // True
    [{ node: 'HTTP - Trigger AI Agent', type: 'main', index: 0 }]  // False
  ]
};

// ── Save ──────────────────────────────────────────────────────────────────────
d.name = 'WF-01-WA-INBOUND - V13(agent-fork)';
const outPath = 'C:/Users/julia/CRM-Fity/n8n/WF-01-WA-INBOUND - V13(agent-fork).json';
fs.writeFileSync(outPath, JSON.stringify(d, null, 2));
console.log('WF-01-WA-INBOUND - V13(agent-fork).json saved!');
console.log('New nodes added: HTTP - Check AI Agent → IF - Has AI Agent → [HTTP - Trigger WF07 / HTTP - Trigger AI Agent]');
