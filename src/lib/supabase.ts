import { createClient } from '@supabase/supabase-js'

// ═══════════════════════════════════════════════════════════════════
// Conexão com o Supabase self-hosted (mesma infra de api.mylion.com.br)
// Os dados do RUGIDO OS vivem no schema "rugido" — isolados do CRM.
// ═══════════════════════════════════════════════════════════════════

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? 'https://api.mylion.com.br'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
  db: { schema: 'rugido' },
})

/** Indica se o backend está configurado. Enquanto false, a app roda com dados mock. */
export const SUPABASE_PRONTO = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
)
