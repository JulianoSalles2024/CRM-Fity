# WF-02 — Follow-up Automático por Inatividade

**Trigger:** Cron — a cada 1 minuto
**Propósito:** Busca conversas paradas, gera mensagem via IA e despacha pelo WhatsApp.
**Fuso:** Toda a lógica de horário e dia está encapsulada na RPC do Supabase.

---

## Fluxo de Nós

```
[1] Schedule Trigger
       ↓
[2] HTTP — Supabase RPC (get_pending_followups)
       ↓
[3] IF — Há itens?
    ├── FALSE → [Stop]
    └── TRUE  ↓
[4] Split In Batches
       ↓
[5] HTTP — NextSales API (gerar mensagem via IA)
       ↓
[6] IF — IA gerou texto?
    ├── FALSE → [8] HTTP — Supabase (registrar falha)
    └── TRUE  ↓
[7a] HTTP — Evolution API (sendText)
       ↓
[7b] HTTP — Supabase (atualizar step + inserir msg)
```

---

## Configuração de cada Nó

---

### [1] Schedule Trigger

| Campo | Valor |
|---|---|
| Trigger interval | Every 1 minute |

---

### [2] HTTP Request — Supabase RPC

| Campo | Valor |
|---|---|
| Method | `POST` |
| URL | `https://<SEU_PROJECT_REF>.supabase.co/rest/v1/rpc/get_pending_followups` |
| Header: `apikey` | `{{ $env.SUPABASE_SERVICE_ROLE_KEY }}` |
| Header: `Authorization` | `Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}` |
| Header: `Content-Type` | `application/json` |
| Body (JSON) | `{}` *(a função não recebe parâmetros)* |
| Response Format | JSON |

> A resposta é um array JSON. Se não houver conversas pendentes, retorna `[]`.

---

### [3] IF — Há itens?

| Campo | Valor |
|---|---|
| Condition | `{{ $json.length }}` **maior que** `0` |

- **TRUE** → continua para o Split
- **FALSE** → termina o workflow (nó **Stop and Error** ou simples **No Operation**)

---

### [4] Split In Batches

| Campo | Valor |
|---|---|
| Batch Size | `1` *(processa um por vez para evitar race condition no Supabase)* |
| Options → Reset | ativado |

Cada item do array da RPC vira um item separado aqui. Os campos disponíveis em `$json` para os próximos nós:

```
conversation_id       string (uuid)
company_id            string (uuid)
contact_identifier    string  — número WhatsApp (ex: "5511999990000")
contact_name          string
agent_name            string
company_name          string
instance_name         string  — nome da instância no Evolution
prompt_rule           string
next_followup_step    number
conversation_history  array   — [{direction, content, created_at}, ...]
```

---

### [5] HTTP Request — NextSales API (Gerar mensagem)

| Campo | Valor |
|---|---|
| Method | `POST` |
| URL | `https://<SEU_DOMINIO_VERCEL>/api/ai/followup/generate` |
| Header: `X-Worker-Secret` | `{{ $env.FOLLOWUP_WORKER_SECRET }}` |
| Header: `Content-Type` | `application/json` |
| Body (JSON) | ver abaixo |

**Body:**
```json
{
  "company_id":           "{{ $json.company_id }}",
  "prompt_rule":          "{{ $json.prompt_rule }}",
  "contact_name":         "{{ $json.contact_name }}",
  "agent_name":           "{{ $json.agent_name }}",
  "company_name":         "{{ $json.company_name }}",
  "conversation_history": {{ $json.conversation_history }}
}
```

**Resposta esperada:**
```json
{ "generated_text": "Oi João, tudo bem? ..." }
```

---

### [6] IF — IA gerou texto?

| Campo | Valor |
|---|---|
| Condition | `{{ $json.generated_text }}` **not empty** |

- **TRUE** → [7a] enviar WhatsApp
- **FALSE** → [8] registrar falha no Supabase

---

### [7a] HTTP Request — Evolution API (sendText)

| Campo | Valor |
|---|---|
| Method | `POST` |
| URL | `https://<EVOLUTION_HOST>/message/sendText/{{ $('Split In Batches').item.json.instance_name }}` |
| Header: `apikey` | `{{ $env.EVOLUTION_API_KEY }}` |
| Header: `Content-Type` | `application/json` |
| Body (JSON) | ver abaixo |

**Body:**
```json
{
  "number":  "{{ $('Split In Batches').item.json.contact_identifier }}",
  "textMessage": {
    "text": "{{ $json.generated_text }}"
  },
  "options": {
    "delay": 1200,
    "presence": "composing"
  }
}
```

> **Dica:** Use `$('Split In Batches').item.json` para referenciar os campos originais
> depois que o nó [5] substituiu o item com a resposta da IA.

---

### [7b] HTTP Request — Supabase (Atualizar step + inserir mensagem)

Execute **dois** requests HTTP em sequência (ou use o nó **Supabase** nativo se disponível):

#### 7b-1: PATCH na conversa

| Campo | Valor |
|---|---|
| Method | `PATCH` |
| URL | `https://<SEU_PROJECT_REF>.supabase.co/rest/v1/conversations?id=eq.{{ $('Split In Batches').item.json.conversation_id }}` |
| Header: `apikey` | `{{ $env.SUPABASE_SERVICE_ROLE_KEY }}` |
| Header: `Authorization` | `Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}` |
| Header: `Content-Type` | `application/json` |
| Header: `Prefer` | `return=minimal` |
| Body (JSON) | ver abaixo |

```json
{
  "current_followup_step": {{ $('Split In Batches').item.json.next_followup_step }},
  "last_followup_sent_at": "{{ $now.toISO() }}"
}
```

#### 7b-2: INSERT na tabela messages (mensagem de saída)

| Campo | Valor |
|---|---|
| Method | `POST` |
| URL | `https://<SEU_PROJECT_REF>.supabase.co/rest/v1/messages` |
| Header: `apikey` | `{{ $env.SUPABASE_SERVICE_ROLE_KEY }}` |
| Header: `Authorization` | `Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}` |
| Header: `Content-Type` | `application/json` |
| Header: `Prefer` | `return=minimal` |
| Body (JSON) | ver abaixo |

```json
{
  "company_id":      "{{ $('Split In Batches').item.json.company_id }}",
  "conversation_id": "{{ $('Split In Batches').item.json.conversation_id }}",
  "direction":       "outbound",
  "sender_type":     "bot",
  "content":         "{{ $('Step 5 - Gerar mensagem').item.json.generated_text }}",
  "content_type":    "text",
  "status":          "sent"
}
```

---

### [8] HTTP Request — Supabase (Registrar falha — branch FALSE do nó 6)

| Campo | Valor |
|---|---|
| Method | `POST` |
| URL | `https://<SEU_PROJECT_REF>.supabase.co/rest/v1/messages` |
| Headers | igual ao 7b-2 |
| Body (JSON) | ver abaixo |

```json
{
  "company_id":      "{{ $('Split In Batches').item.json.company_id }}",
  "conversation_id": "{{ $('Split In Batches').item.json.conversation_id }}",
  "direction":       null,
  "sender_type":     "system",
  "content":         "⚠️ Follow-up automático falhou: IA não retornou texto.",
  "content_type":    "text",
  "status":          null
}
```

---

## Variáveis de Ambiente necessárias no n8n

Configure em **Settings → Variables** (ou `n8n.env`):

| Variável | Descrição |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service_role do Supabase (bypassa RLS) |
| `FOLLOWUP_WORKER_SECRET` | Mesmo valor configurado na Vercel |
| `EVOLUTION_API_KEY` | API key da instância Evolution |

---

## Lógica de Encerramento (LOST) — Passo final da sequência

Quando `next_followup_step` é o último passo cadastrado e o cliente **não responde**,
o próximo cron não encontrará regra (`sequence_order = step + 1` não existe → JOIN não retorna).

Para implementar o encerramento automático, adicione uma segunda RPC
`close_stale_conversations()` ou um segundo workflow com lógica:
- Busca conversas com `current_followup_step >= total_de_regras_da_empresa`
- E `last_message_at` mais antiga que `delay` do último passo × 2
- Atualiza `status = 'resolved'` (ou mova o lead para `LOST`)

> Isso pode ser feito em um WF-03 separado rodando a cada 10 minutos.

---

## Diagrama Resumido

```
Cron 1min
   │
   ▼
Supabase RPC ──────────── encapsula: delay, horário, dia, step
   │ (array de conversas pendentes)
   │
   ├── vazio → fim
   │
   ▼
Loop por conversa
   │
   ├──▶ POST /api/ai/followup/generate  (NextSales Vercel)
   │         X-Worker-Secret: ****
   │         → { generated_text }
   │
   ├──▶ POST Evolution /message/sendText/<instance>
   │         → despacha WhatsApp
   │
   └──▶ PATCH Supabase conversations  (current_followup_step++, last_followup_sent_at)
        POST  Supabase messages        (registra msg outbound/bot)
```
