import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

const app = express();
const PORT = 3000;

app.use(express.json());

const CREDENTIALS_DIR = path.resolve(process.cwd(), "credentials");
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-encryption-key-32-chars-!!"; // Should be 32 chars
const IV_LENGTH = 16;

function encrypt(text: string) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decrypt(text: string) {
  const textParts = text.split(":");
  const iv = Buffer.from(textParts.shift()!, "hex");
  const encryptedText = Buffer.from(textParts.join(":"), "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// Ensure credentials directory exists
if (!fs.existsSync(CREDENTIALS_DIR)) {
  fs.mkdirSync(CREDENTIALS_DIR);
}

// API Routes
app.get("/api/ai/credentials", (req, res) => {
  const { organizationId } = req.query;
  if (!organizationId) return res.status(400).json({ error: "organizationId is required" });

  const orgDir = path.join(CREDENTIALS_DIR, organizationId as string);
  if (!fs.existsSync(orgDir)) return res.json({});

  const credentials: any = {};
  const files = fs.readdirSync(orgDir);
  files.forEach(file => {
    if (file.endsWith(".json")) {
      const provider = file.replace(".json", "");
      const data = JSON.parse(fs.readFileSync(path.join(orgDir, file), "utf-8"));
      credentials[provider] = {
        provider,
        model: data.model,
        status: data.status || "connected",
        apiKey: "********", // Never return the real key
      };
    }
  });

  res.json(credentials);
});

app.post("/api/ai/credentials", (req, res) => {
  const { organizationId, provider, apiKey, model } = req.body;
  if (!organizationId || !provider || !apiKey || !model) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const orgDir = path.join(CREDENTIALS_DIR, organizationId);
  if (!fs.existsSync(orgDir)) fs.mkdirSync(orgDir, { recursive: true });

  const filePath = path.join(orgDir, `${provider}.json`);
  
  // If apiKey is masked, don't update it if we already have it
  let finalKey = apiKey;
  if (apiKey === "********" && fs.existsSync(filePath)) {
    const existing = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    finalKey = decrypt(existing.encryptedKey);
  }

  const credentialData = {
    provider,
    model,
    encryptedKey: encrypt(finalKey),
    createdAt: new Date().toISOString(),
    status: "connected" // Assume connected if saved after test
  };

  fs.writeFileSync(filePath, JSON.stringify(credentialData, null, 2));
  res.json({ success: true });
});

app.post("/api/ai/test-connection", async (req, res) => {
  const { provider, model, apiKey } = req.body;
  console.log(`Testing connection for ${provider} with model ${model}`);
  
  try {
    if (provider === "gemini") {
      const genAI = new GoogleGenAI({ apiKey });
      // Use a simpler check for Gemini
      const modelInfo = await genAI.models.generateContent({
        model: model,
        contents: "hi",
      });
      console.log("Gemini test success");
    } else if (provider === "openai") {
      const openai = new OpenAI({ apiKey });
      await openai.models.list();
      console.log("OpenAI test success");
    } else if (provider === "anthropic") {
      const anthropic = new Anthropic({ apiKey });
      await anthropic.messages.create({
        model: model,
        max_tokens: 1,
        messages: [{ role: "user", content: "hi" }],
      });
      console.log("Anthropic test success");
    }

    res.json({ success: true, message: "Conexão estabelecida com sucesso!" });
  } catch (error: any) {
    console.error(`Test connection failed for ${provider}:`, error.message);
    res.status(400).json({ success: false, message: error.message || "Falha na conexão" });
  }
});

// AI Proxy Route to use stored credentials
app.post("/api/ai/generate", async (req, res) => {
  const { organizationId, prompt, systemInstruction } = req.body;
  
  try {
    // Priority: Gemini > OpenAI > Anthropic
    const providers: any[] = ["gemini", "openai", "anthropic"];
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
      return res.status(400).json({ error: "Nenhuma credencial de IA configurada para esta organização." });
    }

    const apiKey = decrypt(activeCred.encryptedKey);
    const model = activeCred.model;

    let result = "";

    if (providerId === "gemini") {
      const genAI = new GoogleGenAI({ apiKey });
      const response = await genAI.models.generateContent({
        model,
        contents: prompt,
        config: { systemInstruction }
      });
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
    console.error("AI Proxy Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
