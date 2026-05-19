// ─────────────────────────────────────────────────────────────────────────
// Edge Function: relatorio-publico
// Portal/relatório do cliente — acesso PÚBLICO por token + senha.
//
//   GET  ?token=XXX        → { empresa, publicado }   (metadados)
//   POST { token, senha }  → dados completos se a senha conferir
//
// Deploy: copiar para /root/supabase/docker/volumes/functions/relatorio-publico/
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
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })

async function carregarRelatorio(token: string) {
  const { data: rel } = await admin
    .from('relatorios_trafego')
    .select('*')
    .eq('token', token)
    .maybeSingle()
  if (!rel) return null
  const { data: cli } = await admin
    .from('clientes')
    .select('empresa, nome, segmento, fase_atual, plano')
    .eq('id', rel.cliente_id)
    .maybeSingle()
  return { rel, cli }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    if (req.method === 'GET') {
      const token = new URL(req.url).searchParams.get('token') ?? ''
      const r = await carregarRelatorio(token)
      if (!r) return json({ error: 'nao_encontrado' }, 404)
      return json({
        empresa: r.cli?.empresa ?? '',
        publicado: r.rel.publicado,
      })
    }

    if (req.method === 'POST') {
      const { token, senha } = await req.json()
      const r = await carregarRelatorio(token)
      if (!r) return json({ error: 'nao_encontrado' }, 404)
      if (!r.rel.publicado) return json({ error: 'nao_publicado' }, 403)
      if (String(senha) !== String(r.rel.senha))
        return json({ error: 'senha_invalida' }, 401)

      // Progresso + tarefas por fase RUGIDO
      const { data: tarefas } = await admin
        .from('tarefas')
        .select('fase, status, titulo, prazo')
        .eq('cliente_id', r.rel.cliente_id)
        .order('ordem')
      const fases = ['raiox', 'ultra', 'gameplan', 'impl', 'demanda', 'escala']
      const progresso = fases.map((f) => {
        const t = (tarefas ?? []).filter((x: any) => x.fase === f)
        const ok = t.filter((x: any) => x.status === 'concluida').length
        return {
          fase: f,
          total: t.length,
          concluidas: ok,
          tarefas: t.map((x: any) => ({
            titulo: x.titulo,
            status: x.status,
            prazo: x.prazo,
          })),
        }
      })

      return json({
        empresa: r.cli?.empresa ?? '',
        segmento: r.cli?.segmento ?? '',
        plano: r.cli?.plano ?? '',
        faseAtual: r.cli?.fase_atual ?? 'raiox',
        periodo: r.rel.periodo,
        metricas: r.rel.metricas ?? {},
        progresso,
      })
    }

    return json({ error: 'metodo' }, 405)
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
