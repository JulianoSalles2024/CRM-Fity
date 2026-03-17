const fs = require('fs');

let raw = fs.readFileSync('C:/Users/julia/CRM-Fity/n8n/WF-02-WA-OUTBOUND-V2 (prod).json', 'utf8');
if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
const data = JSON.parse(raw);

// Fix 1: Update Evolution API URL (easypanel → evo) and API key
for (const node of data.nodes) {
  if (node.name === 'HTTP - Evolution API - sendText') {
    // Fix URL: easypanel.julianosalles.com.br → evo.julianosalles.com.br
    node.parameters.url = node.parameters.url.replace(
      'easypanel.julianosalles.com.br',
      'evo.julianosalles.com.br'
    );
    console.log('Fixed URL:', node.parameters.url);

    // Fix API key: old → current
    const headers = node.parameters.headerParameters.parameters;
    for (const h of headers) {
      if (h.name === 'apikey') {
        h.value = 'AB3858C6-C145-4063-B66E-7315BD43115F';
        console.log('Fixed apikey:', h.value);
      }
    }
  }
}

data.name = 'WF-02-WA-OUTBOUND-V3(evo-url-fix)';

fs.writeFileSync(
  'C:/Users/julia/CRM-Fity/n8n/WF-02-WA-OUTBOUND-V3(evo-url-fix).json',
  JSON.stringify(data, null, 4),
  'utf8'
);
console.log('WF-02 V3 criado');
