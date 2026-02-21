import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { decrypt } from "../../../features/ai-credentials/aiProviders.utils";

const CREDENTIALS_DIR = path.resolve(process.cwd(), "credentials");

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { organizationId, prompt, systemInstruction } = req.body;
  
  try {
    const providers = ["gemini", "openai", "anthropic"];
    let activeCred = null;
    let providerId = "";

    for (const p of providers) {
      const filePath = path.join(CREDENTIALS_DIR, organizationId, `${p}.json`);
      if (fs.existsSync(filePath)) {
        activeCred = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        providerId = p;
        break;
      }
    }

    if (!activeCred) {
      return res.status(400).json({ error: "Nenhuma credencial configurada." });
    }

    const apiKey = decrypt(activeCred.encryptedKey);
    const model = activeCred.model;

    let result = "";
    if (providerId === "gemini") {
      const genAI = new GoogleGenAI({ apiKey });
      const response = await genAI.models.generateContent({ model, contents: prompt, config: { systemInstruction } });
      result = response.text || "";
    } else if (providerId === "openai") {
      const openai = new OpenAI({ apiKey });
      const response = await openai.chat.completions.create({
        model,
        messages: [
          ...(systemInstruction ? [{ role: "system", content: systemInstruction } as const] : []),
          { role: "user", content: prompt }
        ]
      });
      result = response.choices[0].message.content || "";
    } else if (providerId === "anthropic") {
      const anthropic = new Anthropic({ apiKey });
      const response = await anthropic.messages.create({
        model,
        max_tokens: 4096,
        system: systemInstruction,
        messages: [{ role: "user", content: prompt }]
      });
      const textPart = response.content.find(p => p.type === "text");
      result = textPart?.type === "text" ? textPart.text : "";
    }

    res.json({ text: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
