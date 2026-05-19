// ─────────────────────────────────────────────────────────────────────────
// Edge Function: aprovacao
// Endpoint PÚBLICO da página de aprovação do cliente (/aprovar/:token).
// Não exige login — o próprio token é o segredo. Usa SERVICE_ROLE para
// ler/gravar no schema "rugido" (a RLS bloqueia acesso anônimo direto).
//
//   GET  /functions/v1/aprovacao?token=XXX  → dados da aprovação
//   POST /functions/v1/aprovacao            → { token, decisao, feedback }
//
// Deploy: copiar para /root/supabase/docker/volumes/functions/aprovacao/
// ─────────────────────────────────────────────────────────────────────────
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  db: { schema: 'rugido' },
})

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    if (req.method === 'GET') {
      const token = new URL(req.url).searchParams.get('token')
      if (!token) return json({ error: 'token ausente' }, 400)

      const { data: ap } = await admin
        .from('aprovacoes')
        .select('*')
        .eq('token', token)
        .maybeSingle()
      if (!ap) return json({ error: 'nao_encontrado' }, 404)

      const { data: cli } = await admin
        .from('clientes')
        .select('empresa')
        .eq('id', ap.cliente_id)
        .maybeSingle()

      return json({ aprovacao: ap, cliente: cli ?? null })
    }

    if (req.method === 'POST') {
      const { token, decisao, feedback } = await req.json()
      const validas = ['aprovado', 'reprovado', 'ajustes']
      if (!token || !validas.includes(decisao)) {
        return json({ error: 'dados_invalidos' }, 400)
      }

      const { data, error } = await admin
        .from('aprovacoes')
        .update({
          status: decisao,
          feedback: feedback ?? null,
          respondida_em: new Date().toISOString(),
        })
        .eq('token', token)
        .select()
        .maybeSingle()

      if (error || !data) return json({ error: 'falha_ao_salvar' }, 400)
      return json({ ok: true })
    }

    return json({ error: 'metodo_nao_suportado' }, 405)
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
