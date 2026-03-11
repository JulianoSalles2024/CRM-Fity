import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Inline auth helper ────────────────────────────────────────
// Temporário — será substituído por api/_lib/auth.ts na Fase 2.
// Valida JWT do header Authorization e retorna companyId do perfil.
// companyId NUNCA vem do request body.
async function getAuthContext(req: any) {
  const raw = (req.headers['authorization'] ?? req.headers['Authorization']) as string | undefined;
  const token = raw?.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile?.company_id) return null;

  return { userId: user.id, companyId: profile.company_id };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── 1. Autenticação obrigatória ───────────────────────────
  const ctx = await getAuthContext(req);
  if (!ctx) {
    return res.status(401).json({ error: 'Autenticação obrigatória.' });
  }

  const { prompt, systemInstruction } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'prompt é obrigatório.' });
  }

  try {
    // ── 2. Buscar credencial pelo companyId do JWT ────────────
    // organizationId NÃO vem do body — deriva exclusivamente do JWT.
    const providers = ["gemini", "openai", "anthropic"];
    let activeCred: { ai_provider: string; ai_api_key: string; model: string } | null = null;

    for (const p of providers) {
      const { data, error } = await supabase
        .from('organization_ai_credentials')
        .select('ai_provider, ai_api_key, model')
        .eq('organization_id', ctx.companyId)
        .eq('ai_provider', p)
        .single();

      if (!error && data) {
        activeCred = data;
        break;
      }
    }

    if (!activeCred) {
      return res.status(400).json({ error: 'Nenhuma credencial de IA configurada.' });
    }

    const { ai_api_key: apiKey, model, ai_provider: providerId } = activeCred;
    let result = "";

    // ── 3. Chamar provedor de IA no servidor ─────────────────
    // API key nunca trafega para o browser.
    if (providerId === "gemini") {
      const genAI = new GoogleGenAI({ apiKey });
      const response = await genAI.models.generateContent({
        model,
        contents: prompt,
        config: { systemInstruction },
      });
      result = response.text || "";
    } else if (providerId === "openai") {
      const openai = new OpenAI({ apiKey });
      const response = await openai.chat.completions.create({
        model,
        messages: [
          ...(systemInstruction ? [{ role: "system", content: systemInstruction } as const] : []),
          { role: "user", content: prompt },
        ],
      });
      result = response.choices[0].message.content || "";
    } else if (providerId === "anthropic") {
      const anthropic = new Anthropic({ apiKey });
      const response = await anthropic.messages.create({
        model,
        max_tokens: 4096,
        system: systemInstruction,
        messages: [{ role: "user", content: prompt }],
      });
      const textPart = response.content.find(p => p.type === "text");
      result = textPart?.type === "text" ? textPart.text : "";
    }

    res.json({ text: result });
  } catch (error: any) {
    // Mensagem genérica ao cliente — detalhe fica nos logs do servidor.
    console.error('[api/ai/generate]', error);
    res.status(500).json({ error: 'Erro ao gerar resposta.' });
  }
}
