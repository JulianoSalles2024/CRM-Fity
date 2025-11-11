import React from 'react';

const CodeBlock: React.FC<{ children: React.ReactNode, language?: string }> = ({ children, language = 'bash' }) => (
    <pre className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 my-4 overflow-x-auto">
        <code className={`language-${language} text-sm text-violet-300`}>
            {children}
        </code>
    </pre>
);

const WebhookDocumentation: React.FC = () => {
    const jsonPayloadExample = `{
  "name": "Juliana Silva",
  "email": "juliana.silva@example.com",
  "phone": "(11) 98765-4321",
  "company": "InovaTech Soluções",
  "value": 2500.50,
  "source": "Hotmart",
  "tags": ["Produto X", "Urgente"]
}`;

    const curlExample = `curl -X POST \\
  https://api.crmfity.ai/webhooks/SUA_CHAVE_UNICA \\
  -H 'Content-Type: application/json' \\
  -H 'x-api-key: crm_sk_1a2b3c4d5e6f7g8h9i0j' \\
  -d '${jsonPayloadExample.replace(/\n/g, '')}'`;

    return (
        <div className="prose prose-invert prose-sm max-w-none text-zinc-300 p-2">
            <h2 className="text-xl font-bold text-white border-b border-zinc-700 pb-2 mb-4">Visão Geral</h2>
            <p>
                Os webhooks permitem que você integre o Fity AI CRM com outras ferramentas para automatizar seus processos. Você pode tanto receber dados de outras plataformas (entrada) quanto enviar dados do CRM para outros sistemas (saída).
            </p>

            <h2 className="text-xl font-bold text-white border-b border-zinc-700 pb-2 mb-4 mt-8">Webhooks de Entrada (Recebimento de Dados)</h2>
            <p>
                Use webhooks de entrada para criar ou atualizar leads automaticamente no seu CRM a partir de eventos em outras plataformas, como vendas aprovadas, formulários preenchidos, etc.
            </p>

            <h3 className="text-lg font-semibold text-white mt-6">Autenticação (API Key)</h3>
            <p>
                Por segurança, todas as requisições de webhook devem ser autenticadas. O CRM irá rejeitar qualquer requisição que não contenha sua Chave de API (Secret) válida.
            </p>
            <p>
                Você deve incluir sua chave secreta no cabeçalho (header) da requisição HTTP, com o nome <strong className="text-violet-400">`x-api-key`</strong>.
            </p>
            <p>
                Você pode encontrar e gerenciar sua Chave de API na aba de <strong className="text-violet-400">Configuração</strong>.
            </p>

            <h3 className="text-lg font-semibold text-white mt-6">Formato dos Dados (Payload)</h3>
            <p>
                Os dados devem ser enviados para a sua URL de webhook através de uma requisição <strong className="text-violet-400">POST</strong> com o corpo (body) no formato <strong className="text-violet-400">JSON</strong> (`Content-Type: application/json`).
            </p>
            <p>O sistema espera um objeto JSON com os seguintes campos:</p>
            <CodeBlock language="json">{jsonPayloadExample}</CodeBlock>

            <h3 className="text-lg font-semibold text-white mt-6">Mapeamento de Campos</h3>
            <p>A tabela abaixo detalha como os campos do JSON são mapeados para os campos de um Lead no CRM. Apenas `name` e `email` são obrigatórios.</p>
            <div className="overflow-x-auto">
                <table className="w-full mt-4">
                    <thead className="bg-zinc-800/50">
                        <tr>
                            <th className="p-2 text-left font-semibold">Campo JSON</th>
                            <th className="p-2 text-left font-semibold">Campo no CRM</th>
                            <th className="p-2 text-left font-semibold">Tipo</th>
                            <th className="p-2 text-left font-semibold">Descrição</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b border-zinc-700"><td className="p-2">`name`</td><td className="p-2">Nome</td><td className="p-2">String</td><td className="p-2">Nome completo do lead. (Obrigatório)</td></tr>
                        <tr className="border-b border-zinc-700"><td className="p-2">`email`</td><td className="p-2">E-mail</td><td className="p-2">String</td><td className="p-2">Endereço de e-mail do lead. (Obrigatório)</td></tr>
                        <tr className="border-b border-zinc-700"><td className="p-2">`phone`</td><td className="p-2">Telefone</td><td className="p-2">String</td><td className="p-2">Telefone de contato do lead.</td></tr>
                        <tr className="border-b border-zinc-700"><td className="p-2">`company`</td><td className="p-2">Empresa</td><td className="p-2">String</td><td className="p-2">Nome da empresa do lead.</td></tr>
                        <tr className="border-b border-zinc-700"><td className="p-2">`value`</td><td className="p-2">Valor</td><td className="p-2">Number</td><td className="p-2">Valor da oportunidade (ex: `299.90`).</td></tr>
                        <tr className="border-b border-zinc-700"><td className="p-2">`source`</td><td className="p-2">Origem</td><td className="p-2">String</td><td className="p-2">De onde o lead veio (ex: "Hotmart", "Facebook Ads").</td></tr>
                        <tr className="border-b border-zinc-700"><td className="p-2">`tags`</td><td className="p-2">Tags</td><td className="p-2">Array de Strings</td><td className="p-2">Uma lista de tags para associar ao lead.</td></tr>
                    </tbody>
                </table>
            </div>

            <h3 className="text-lg font-semibold text-white mt-6">Exemplo Completo (cURL)</h3>
            <p>Use o comando abaixo em seu terminal para simular um evento de webhook e testar sua integração.</p>
            <CodeBlock>{curlExample}</CodeBlock>
            
            <h2 className="text-xl font-bold text-white border-b border-zinc-700 pb-2 mb-4 mt-8">Webhooks de Saída (Envio de Dados)</h2>
            <p className="text-yellow-400 bg-yellow-900/30 p-3 rounded-md border border-yellow-700/50">
                <strong>Em Breve:</strong> Esta funcionalidade ainda está em desenvolvimento.
            </p>
            <p>
                Webhooks de saída permitirão que o Fity AI CRM envie dados para outras plataformas quando eventos específicos ocorrerem. Por exemplo, quando um lead for movido para o estágio "Fechamento", você poderá enviar uma notificação para um canal do Slack ou adicionar o contato a uma lista de e-mail marketing.
            </p>

             <h2 className="text-xl font-bold text-white border-b border-zinc-700 pb-2 mb-4 mt-8">Teste e Depuração</h2>
            <p>
                O painel <strong className="text-violet-400">"Eventos Recebidos"</strong> na aba de Configuração exibirá as últimas 10 requisições feitas para sua URL, permitindo que você inspecione os dados recebidos e o status da resposta.
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-4">
                <li><strong className="text-green-400">Resposta `200 OK`</strong>: Indica que o evento foi recebido e processado com sucesso.</li>
                <li><strong className="text-red-400">Resposta `400 Bad Request`</strong>: O corpo da sua requisição está mal formatado ou faltam campos obrigatórios. Verifique o JSON.</li>
                <li><strong className="text-red-400">Resposta `401 Unauthorized`</strong>: A Chave de API (`x-api-key`) está ausente, inválida ou incorreta.</li>
                <li><strong className="text-red-400">Resposta `429 Too Many Requests`</strong>: Você está enviando eventos rápido demais. Aguarde um pouco antes de tentar novamente.</li>
            </ul>

        </div>
    );
};

export default WebhookDocumentation;
