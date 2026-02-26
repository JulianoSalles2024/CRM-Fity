import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, prompt, systemInstruction } = req.body;

  try {
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const { data, error } = await supabase
      .from('user_settings')
      .select('ai_provider, ai_api_key, model')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return res.status(400).json({ error: 'Nenhuma credencial configurada.' });
    }

    const { ai_provider: provider, ai_api_key: apiKey, model } = data;

    let result = '';

    if (provider === 'gemini') {
      const genAI = new GoogleGenAI({ apiKey });
      const response = await genAI.models.generateContent({
        model,
        contents: prompt,
        config: { systemInstruction },
      });
      result = response.text || '';
    } else if (provider === 'openai') {
      const openai = new OpenAI({ apiKey });
      const response = await openai.chat.completions.create({
        model,
        messages: [
          ...(systemInstruction ? [{ role: 'system', content: systemInstruction } as const] : []),
          { role: 'user', content: prompt },
        ],
      });
      result = response.choices[0].message.content || '';
    } else if (provider === 'anthropic') {
      const anthropic = new Anthropic({ apiKey });
      const response = await anthropic.messages.create({
        model,
        max_tokens: 4096,
        system: systemInstruction,
        messages: [{ role: 'user', content: prompt }],
      });
      const textPart = response.content.find(p => p.type === 'text');
      result = textPart?.type === 'text' ? textPart.text : '';
    }

    res.json({ text: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
