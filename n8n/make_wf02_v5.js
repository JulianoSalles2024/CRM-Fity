const fs = require('fs');
let raw = fs.readFileSync('C:/Users/julia/CRM-Fity/n8n/WF-02-WA-OUTBOUND-V4(easypanel-correct).json', 'utf8');
if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
const data = JSON.parse(raw);

for (const node of data.nodes) {
  if (node.name === 'HTTP - Evolution API - sendText') {
    const headers = node.parameters.headerParameters.parameters;
    for (const h of headers) {
      if (h.name === 'apikey') {
        h.value = 'LZLQMWZUSZSRPEIJLMVXBDPRQYVUZBCI';
        console.log('apikey updated:', h.value);
      }
    }
    console.log('URL:', node.parameters.url);
  }
}

data.name = 'WF-02-WA-OUTBOUND-V5(apikey-fix)';
fs.writeFileSync(
  'C:/Users/julia/CRM-Fity/n8n/WF-02-WA-OUTBOUND-V5(apikey-fix).json',
  JSON.stringify(data, null, 4),
  'utf8'
);
console.log('WF-02 V5 criado');
