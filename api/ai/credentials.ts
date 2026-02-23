import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-32-chars-!!';

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)),
    iv
  );
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string): string {
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)),
      iv
    );
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch {
    return 'DECRYPTION_ERROR';
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (req.method === 'GET') {
    const { organizationId } = req.query;
    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId is required' });
    }

    const { data, error } = await supabase
      .from('ai_credentials')
      .select('provider, model, status')
      .eq('organization_id', organizationId);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch credentials' });
    }

    const credentials: Record<string, unknown> = {};
    (data || []).forEach((row) => {
      credentials[row.provider] = {
        provider: row.provider,
        model: row.model,
        status: row.status || 'connected',
        apiKey: '********',
      };
    });

    return res.json(credentials);
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const { organizationId, provider, apiKey, model } = body;

    if (!organizationId || !provider || !apiKey || !model) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let finalKey = apiKey;
    if (apiKey === '********') {
      const { data: existing } = await supabase
        .from('ai_credentials')
        .select('encrypted_key')
        .eq('organization_id', organizationId)
        .eq('provider', provider)
        .single();

      if (existing?.encrypted_key) {
        finalKey = decrypt(existing.encrypted_key);
      }
    }

    const { error } = await supabase
      .from('ai_credentials')
      .upsert(
        {
          organization_id: organizationId,
          provider,
          model,
          encrypted_key: encrypt(finalKey),
          status: 'connected',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'organization_id,provider' }
      );

    if (error) {
      return res.status(500).json({ error: 'Failed to save credential' });
    }

    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
