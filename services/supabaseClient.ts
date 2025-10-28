// services/supabaseClient.ts

import { createClient } from '@supabase/supabase-js'

// Substitua com as suas credenciais do Supabase
// Você pode encontrar isso nas configurações do seu projeto Supabase: Settings > API
const supabaseUrl = 'https://<seu-projeto-id>.supabase.co'
const supabaseKey = '<sua-chave-publica-anon>'

export const isSupabaseConfigured = 
  supabaseUrl && 
  !supabaseUrl.includes('<') &&
  supabaseKey && 
  !supabaseKey.includes('<');

// Apenas cria o cliente se a configuração for válida.
// Se não, o `supabase` será `null`, e a UI principal (App.tsx)
// mostrará o aviso de configuração em vez de tentar usar um cliente inválido.
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey) : null;