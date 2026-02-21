import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";

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

// Garantir diretório de credenciais
if (!fs.existsSync(CREDENTIALS_DIR)) {
  fs.mkdirSync(CREDENTIALS_DIR, { recursive: true });
}

// --- API ROUTES ---

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
