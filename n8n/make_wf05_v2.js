const fs = require('fs');

// WF-05 V2 — Stage-specific prompts + correct apikey
// Changes vs V1:
//   1. HTTP - Get Stage: select now includes ai_prompt
//   2. Code - Build OpenAI Payload: stage_prompt > board_prompt > default fallback
//   3. HTTP - Send WhatsApp: apikey updated to current valid key

let raw = fs.readFileSync('C:/Users/julia/CRM-Fity/n8n/WF-05-AI-AGENT.json', 'utf8');
if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
const data = JSON.parse(raw);

let fixedStageSelect = false;
let fixedPayload = false;
let fixedApikey = false;

for (const node of data.nodes) {

  // ── Fix 1: HTTP - Get Stage — add ai_prompt to select ──────────────────
  if (node.name === 'HTTP - Get Stage') {
    const params = node.parameters.queryParameters.parameters;
    for (const p of params) {
      if (p.name === 'select' && p.value === 'board_id') {
        p.value = 'board_id,ai_prompt';
        fixedStageSelect = true;
        console.log('✅ HTTP - Get Stage: select → board_id,ai_prompt');
      }
    }
  }

  // ── Fix 2: Code - Build OpenAI Payload — stage prompt fallback ──────────
  if (node.name === 'Code - Build OpenAI Payload') {
    node.parameters.jsCode = `const webhook = $('Webhook Trigger').first().json.body;
const content_text = webhook.content_text;

// Stage prompt (priority 1)
const stageArr = $('HTTP - Get Stage').first().json;
const stage_prompt = (Array.isArray(stageArr) && stageArr[0] && stageArr[0].ai_prompt)
  ? stageArr[0].ai_prompt.trim()
  : '';

// Board prompt (priority 2 — fallback)
const boardArr = $('HTTP - Get Board').first().json;
const board_prompt = (Array.isArray(boardArr) && boardArr[0] && boardArr[0].ai_prompt)
  ? boardArr[0].ai_prompt.trim()
  : '';

// Hierarchy: stage > board > default
const systemPrompt = stage_prompt || board_prompt
  || 'Voce e um assistente de vendas profissional e cordial. Responda sempre em portugues brasileiro.';

const histArr = $('HTTP - Get History').first().json;
const chatHistory = (Array.isArray(histArr) ? histArr : [])
  .slice(1).reverse()
  .map(function(m) { return { role: m.sender_type === 'lead' ? 'user' : 'assistant', content: (m.content || '').trim() }; })
  .filter(function(m) { return m.content; });

const messages = [{ role: 'system', content: systemPrompt }]
  .concat(chatHistory)
  .concat([{ role: 'user', content: content_text }]);

return [{ json: { model: 'gpt-4o-mini', messages: messages, max_tokens: 500, temperature: 0.7 } }];`;
    fixedPayload = true;
    console.log('✅ Code - Build OpenAI Payload: stage_prompt > board_prompt > default');
  }

  // ── Fix 3: HTTP - Send WhatsApp — update expired apikey ─────────────────
  if (node.name === 'HTTP - Send WhatsApp') {
    const headers = node.parameters.headerParameters?.parameters ?? [];
    for (const h of headers) {
      if (h.name === 'apikey') {
        const old = h.value;
        h.value = 'LZLQMWZUSZSRPEIJLMVXBDPRQYVUZBCI';
        fixedApikey = true;
        console.log(`✅ HTTP - Send WhatsApp: apikey ${old} → ${h.value}`);
      }
    }
  }
}

console.log('\nSummary:');
console.log('  Get Stage select fix:', fixedStageSelect ? '✅' : '❌ NOT FOUND');
console.log('  Payload stage logic: ', fixedPayload    ? '✅' : '❌ NOT FOUND');
console.log('  Send WhatsApp apikey:', fixedApikey     ? '✅' : '❌ NOT FOUND');

data.name = 'WF-05-AI-AGENT-V2(stage-prompts)';
fs.writeFileSync(
  'C:/Users/julia/CRM-Fity/n8n/WF-05-AI-AGENT-V2(stage-prompts).json',
  JSON.stringify(data, null, 4),
  'utf8'
);
console.log('\nWF-05 V2 criado: WF-05-AI-AGENT-V2(stage-prompts).json');
