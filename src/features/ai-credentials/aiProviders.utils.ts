import crypto from "crypto";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-encryption-key-32-chars-!!";

export function encrypt(text: string) {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
  } catch (e) {
    console.error("Encryption error:", e);
    throw e;
  }
}

export function decrypt(text: string) {
  try {
    const textParts = text.split(":");
    const iv = Buffer.from(textParts.shift()!, "hex");
    const encryptedText = Buffer.from(textParts.join(":"), "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (e) {
    console.error("Decryption error:", e);
    return "DECRYPTION_ERROR";
  }
}

export async function testProviderConnection(provider: string, model: string, apiKey: string) {
  if (!apiKey) throw new Error("API Key is empty");

  // normalize: frontend sends "google", filesystem stores "gemini"
  const normalized = provider === "google" ? "gemini" : provider;

  if (normalized === "gemini") {
    // Direct REST call — avoids @google/genai SDK which breaks Vercel serverless bundling
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "hi" }] }],
        generationConfig: { maxOutputTokens: 1 },
      }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as any)?.error?.message || `HTTP ${response.status}`);
    }
  } else if (normalized === "openai") {
    const openai = new OpenAI({ apiKey });
    await openai.models.list();
  } else if (normalized === "anthropic") {
    const anthropic = new Anthropic({ apiKey });
    await anthropic.messages.create({
      model: model,
      max_tokens: 1,
      messages: [{ role: "user", content: "hi" }],
    });
  }
}
