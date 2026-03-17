const fs = require('fs');
let raw = fs.readFileSync('C:/Users/julia/CRM-Fity/n8n/WF-01-WA-INBOUND - V8(null-safe-uuids).json', 'utf8');
if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
const data = JSON.parse(raw);

for (const node of data.nodes) {
  if (node.name === 'Code - Extract Connection') {
    const before = node.parameters.jsCode;

    // Add owner_id to the return object
    node.parameters.jsCode = before.replace(
      `return [{\n  json: {\n    found:      true,\n    id:         connection.id,\n    company_id: connection.company_id,\n    channel:    connection.channel,\n    external_id: connection.external_id\n  }\n}];`,
      `return [{\n  json: {\n    found:       true,\n    id:          connection.id,\n    company_id:  connection.company_id,\n    owner_id:    connection.owner_id || null,\n    channel:     connection.channel,\n    external_id: connection.external_id\n  }\n}];`
    );

    // Verify the fix was applied
    if (node.parameters.jsCode.includes('owner_id:    connection.owner_id')) {
      console.log('✅ owner_id added to Code - Extract Connection');
    } else {
      console.log('⚠️ Replace failed — trying fallback');
      // Fallback: inject owner_id before external_id
      node.parameters.jsCode = node.parameters.jsCode.replace(
        'external_id: connection.external_id',
        'owner_id:    connection.owner_id || null,\n    external_id: connection.external_id'
      );
      console.log('Fallback applied:', node.parameters.jsCode.includes('owner_id'));
    }
    console.log('\nFinal return block:');
    const lines = node.parameters.jsCode.split('\n');
    const retIdx = lines.findIndex(l => l.includes('return [{'));
    console.log(lines.slice(retIdx).join('\n'));
    break;
  }
}

data.name = 'WF-01-WA-INBOUND - V9(owner-extract-fix)';
fs.writeFileSync(
  'C:/Users/julia/CRM-Fity/n8n/WF-01-WA-INBOUND - V9(owner-extract-fix).json',
  JSON.stringify(data, null, 4),
  'utf8'
);
console.log('\nV9 criado');
