import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: "API key não enviada" });
    }

    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      return res.status(400).json({ error: "Chave inválida" });
    }

    return res.status(200).json({ status: "connected" });

  } catch (err) {
    return res.status(500).json({ error: "Erro interno", details: String(err) });
  }
}
