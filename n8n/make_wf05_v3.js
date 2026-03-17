const fs = require('fs');

// WF-05 V3 — Fix: .first().json already returns the object directly (not an array)
// The Array.isArray() check in V2 always returned false → always used default prompt.
// Fix: access ai_prompt directly from the object.

let raw = fs.readFileSync('C:/Users/julia/CRM-Fity/n8n/WF-05-AI-AGENT-V2(stage-prompts).json', 'utf8');
if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
const data = JSON.parse(raw);

for (const node of data.nodes) {
  if (node.name === 'Code - Build OpenAI Payload') {
    node.parameters.jsCode = `const webhook = $('Webhook Trigger').first().json.body;
const content_text = webhook.content_text;

// Stage prompt (priority 1)
// .first().json already returns the object {board_id, ai_prompt} directly
const stageData = $('HTTP - Get Stage').first().json;
const stage_prompt = (stageData && stageData.ai_prompt)
  ? stageData.ai_prompt.trim()
  : '';

// Board prompt (priority 2 — fallback)
const boardData = $('HTTP - Get Board').first().json;
const board_prompt = (boardData && boardData.ai_prompt)
  ? boardData.ai_prompt.trim()
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
    console.log('✅ Code - Build OpenAI Payload: fixed direct object access');
    break;
  }
}

data.name = 'WF-05-AI-AGENT-V3(stage-prompts-fix)';
fs.writeFileSync(
  'C:/Users/julia/CRM-Fity/n8n/WF-05-AI-AGENT-V3(stage-prompts-fix).json',
  JSON.stringify(data, null, 4),
  'utf8'
);
console.log('WF-05 V3 criado: WF-05-AI-AGENT-V3(stage-prompts-fix).json');
