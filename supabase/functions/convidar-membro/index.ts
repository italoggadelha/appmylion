// ─────────────────────────────────────────────────────────────────────────
// Edge Function: convidar-membro
// Cria um login (auth) + registro de membro na equipe. Só para a equipe.
//
//   POST { nome, email, perfil, cargo, senha }
//
// Deploy: copiar para /root/supabase/docker/volumes/functions/convidar-membro/
// ─────────────────────────────────────────────────────────────────────────
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false }, db: { schema: 'rugido' } },
)

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ erro: 'metodo' }, 405)

  // Só a equipe logada pode convidar
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  const { data: u } = await admin.auth.getUser(jwt)
  if (!u?.user) return json({ erro: 'nao_autorizado' }, 401)

  try {
    const { nome, email, perfil, cargo, senha } = await req.json()
    if (!nome || !email || !senha)
      return json({ erro: 'dados_incompletos' }, 400)

    const { data: novo, error: errAuth } = await admin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
    })
    if (errAuth || !novo?.user)
      return json({ erro: errAuth?.message ?? 'falha_auth' }, 400)

    const { error: errMembro } = await admin.from('membros').insert({
      auth_id: novo.user.id,
      nome,
      email,
      perfil: perfil ?? 'operacional',
      cargo: cargo ?? null,
    })
    if (errMembro) return json({ erro: errMembro.message }, 400)

    return json({ ok: true })
  } catch (e) {
    return json({ erro: String(e) }, 500)
  }
})
