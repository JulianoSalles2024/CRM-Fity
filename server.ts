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

// Middleware para logs de requisição - ajuda a debugar 404s
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use(express.json());

const CREDENTIALS_DIR = path.resolve(process.cwd(), "credentials");
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-encryption-key-32-chars-!!"; 

function encrypt(text: string) {
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

function decrypt(text: string) {
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

// Garantir diretório de credenciais
if (!fs.existsSync(CREDENTIALS_DIR)) {
  fs.mkdirSync(CREDENTIALS_DIR, { recursive: true });
}

// --- API ROUTES ---

app.get("/api/ai/credentials", (req, res) => {
  const { organizationId } = req.query;
  if (!organizationId) return res.status(400).json({ error: "organizationId is required" });

  const orgDir = path.join(CREDENTIALS_DIR, organizationId as string);
  if (!fs.existsSync(orgDir)) return res.json({});

  const credentials: any = {};
  try {
    const files = fs.readdirSync(orgDir);
    files.forEach(file => {
      if (file.endsWith(".json")) {
        const provider = file.replace(".json", "");
        const data = JSON.parse(fs.readFileSync(path.join(orgDir, file), "utf-8"));
        credentials[provider] = {
          provider,
          model: data.model,
          status: data.status || "connected",
          apiKey: "********", 
        };
      }
    });
    res.json(credentials);
  } catch (e) {
    res.status(500).json({ error: "Failed to read credentials" });
  }
});

app.post("/api/ai/credentials", (req, res) => {
  const { organizationId, provider, apiKey, model } = req.body;
  if (!organizationId || !provider || !apiKey || !model) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const orgDir = path.join(CREDENTIALS_DIR, organizationId);
  if (!fs.existsSync(orgDir)) fs.mkdirSync(orgDir, { recursive: true });

  const filePath = path.join(orgDir, `${provider}.json`);
  
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
    status: "connected"
  };

  fs.writeFileSync(filePath, JSON.stringify(credentialData, null, 2));
  console.log(`Saved credentials for ${provider}`);
  res.json({ success: true });
});

app.post("/api/ai/test-connection", async (req, res) => {
  const { provider, model, apiKey } = req.body;
  console.log(`Testing connection for ${provider} with model ${model}`);
  
  try {
    if (!apiKey) throw new Error("API Key is empty");

    if (provider === "gemini") {
      const genAI = new GoogleGenAI({ apiKey });
      await genAI.models.generateContent({
        model: model,
        contents: "hi",
      });
    } else if (provider === "openai") {
      const openai = new OpenAI({ apiKey });
      await openai.models.list();
    } else if (provider === "anthropic") {
      const anthropic = new Anthropic({ apiKey });
      await anthropic.messages.create({
        model: model,
        max_tokens: 1,
        messages: [{ role: "user", content: "hi" }],
      });
    }

    console.log(`Test success for ${provider}`);
    res.json({ success: true, message: "Conexão estabelecida com sucesso!" });
  } catch (error: any) {
    console.error(`Test connection failed for ${provider}:`, error.message);
    res.status(400).json({ success: false, message: error.message || "Falha na conexão" });
  }
});

app.post("/api/ai/generate", async (req, res) => {
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
    console.error("AI Proxy Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

// --- VITE MIDDLEWARE / STATIC SERVING ---
if (process.env.NODE_ENV === "production") {
  const distPath = path.resolve(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
