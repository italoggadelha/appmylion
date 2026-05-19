// ─────────────────────────────────────────────────────────────────────────
// Edge Function: executar-agente
// Aciona um agente EXTERNO (webhook do cliente — n8n, Make, API própria…)
// conectado a uma tarefa. Envia o contexto da tarefa, recebe o resultado
// (imagem, vídeo, HTML ou texto) e grava como anexo da tarefa.
//
//   POST { tarefaId, agenteId }   → { ok, anexo }   (equipe logada)
//
// Contrato esperado da resposta do webhook (JSON):
//   { "tipo": "html|imagem|video|texto", "titulo": "...", "conteudo": "..." }
//
// Deploy: copiar para /root/supabase/docker/volumes/functions/executar-agente/
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

  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  const { data: u } = await admin.auth.getUser(jwt)
  if (!u?.user) return json({ erro: 'nao_autorizado' }, 401)

  try {
    const { tarefaId, agenteId } = await req.json()

    const { data: agente } = await admin
      .from('agentes_externos')
      .select('*')
      .eq('id', agenteId)
      .maybeSingle()
    if (!agente?.webhook_url) return json({ erro: 'agente_invalido' }, 400)

    const { data: tarefa } = await admin
      .from('tarefas')
      .select('id, titulo, descricao, fase, cliente_id, clientes(empresa, segmento)')
      .eq('id', tarefaId)
      .maybeSingle()
    if (!tarefa) return json({ erro: 'tarefa_invalida' }, 400)

    // Aciona o webhook do agente externo
    let resp: any
    try {
      const r = await fetch(agente.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tarefa_id: tarefa.id,
          titulo: tarefa.titulo,
          descricao: tarefa.descricao,
          fase: tarefa.fase,
          cliente: (tarefa as any).clientes?.empresa ?? '',
          segmento: (tarefa as any).clientes?.segmento ?? '',
        }),
      })
      resp = await r.json().catch(() => ({}))
      if (!r.ok) return json({ erro: 'webhook_falhou', detalhe: resp }, 200)
    } catch (e) {
      return json({ erro: 'webhook_inacessivel', detalhe: String(e) }, 200)
    }

    const tipo = ['html', 'imagem', 'video', 'texto'].includes(resp?.tipo)
      ? resp.tipo
      : 'texto'
    const conteudo = String(resp?.conteudo ?? resp?.url ?? resp?.html ?? '')
    const titulo = String(resp?.titulo ?? `Resultado · ${agente.nome}`)

    const { data: anexo, error } = await admin
      .from('anexos')
      .insert({
        tarefa_id: tarefa.id,
        categoria: 'aprovacao',
        tipo,
        titulo,
        conteudo,
      })
      .select()
      .single()
    if (error) return json({ erro: 'falha_anexo', detalhe: error.message }, 200)

    return json({ ok: true, anexo })
  } catch (e) {
    return json({ erro: String(e) }, 500)
  }
})
