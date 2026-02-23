import { testProviderConnection } from "../_utils";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { provider, model, apiKey } = req.body;
  
  try {
    await testProviderConnection(provider, model, apiKey);
    res.json({ success: true, message: "Conexão estabelecida com sucesso!" });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || "Falha na conexão" });
  }
}
