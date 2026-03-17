const fs = require('fs');
// V3 had wrong URL (evo instead of easypanel). WF-03 confirms easypanel works.
// V4: revert URL to easypanel, keep original apikey (same as WF-03 which works)
let raw = fs.readFileSync('C:/Users/julia/CRM-Fity/n8n/WF-02-WA-OUTBOUND-V2 (prod).json', 'utf8');
if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
const data = JSON.parse(raw);

for (const node of data.nodes) {
  if (node.name === 'HTTP - Evolution API - sendText') {
    // Keep easypanel URL (confirmed working in WF-03)
    console.log('URL kept:', node.parameters.url);
    // Keep original apikey (same as WF-03)
    const headers = node.parameters.headerParameters.parameters;
    const apikey = headers.find(h => h.name === 'apikey');
    console.log('apikey kept:', apikey?.value);
  }
}

data.name = 'WF-02-WA-OUTBOUND-V4(easypanel-correct)';
fs.writeFileSync(
  'C:/Users/julia/CRM-Fity/n8n/WF-02-WA-OUTBOUND-V4(easypanel-correct).json',
  JSON.stringify(data, null, 4),
  'utf8'
);
console.log('WF-02 V4 criado (easypanel URL, apikey original)');
