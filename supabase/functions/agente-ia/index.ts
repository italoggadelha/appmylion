// ─────────────────────────────────────────────────────────────────────────
// Edge Function: agente-ia
// Cérebro dos Agentes de IA do RUGIDO OS. Recebe a conversa com um agente
// especializado e responde via Claude (Anthropic), com o contexto do cliente.
//
// POST { agente, papel, clienteId?, mensagem, historico:[{role,content}] }
// → { resposta } | { erro }
//
// Requer: usuário logado (Bearer token) + ANTHROPIC_API_KEY no ambiente.
// Deploy: copiar para /root/supabase/docker/volumes/functions/agente-ia/
// ─────────────────────────────────────────────────────────────────────────
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? ''
const MODELO = 'claude-sonnet-4-6'

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  db: { schema: 'rugido' },
})

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

  // Autenticação: precisa de um usuário logado
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  const { data: userData } = await admin.auth.getUser(jwt)
  if (!userData?.user) return json({ erro: 'nao_autorizado' }, 401)

  if (!ANTHROPIC_API_KEY) return json({ erro: 'sem_chave' }, 200)

  try {
    const { agente, papel, clienteId, mensagem, historico } = await req.json()

    // Contexto do cliente
    let contexto = ''
    if (clienteId) {
      const { data: c } = await admin
        .from('clientes')
        .select('empresa, segmento, fase_atual, plano, observacoes')
        .eq('id', clienteId)
        .maybeSingle()
      const { data: ts } = await admin
        .from('tarefas')
        .select('titulo, fase, status')
        .eq('cliente_id', clienteId)
      if (c) {
        contexto =
          `\n\nCONTEXTO DO CLIENTE:\n` +
          `- Empresa: ${c.empresa} (${c.segmento ?? 's/ segmento'})\n` +
          `- Fase RUGIDO atual: ${c.fase_atual} · Plano: ${c.plano ?? '—'}\n` +
          `- Tarefas: ${(ts ?? []).length} no total\n` +
          (c.observacoes ? `- Observações: ${c.observacoes}\n` : '')
      }
    }

    const system =
      `Você é o "${agente}", um agente de IA especializado da agência de ` +
      `marketing MyLion Digital. Sua especialidade: ${papel}.\n` +
      `A agência opera pelo Método RUGIDO, com 6 fases: Raio-X & Mapeamento, ` +
      `Ultravisão Estratégica, Game Plan Estratégico, Implementação & Validação, ` +
      `Demanda & Alcance, Otimização & Escala.\n` +
      `Responda em português do Brasil, de forma prática, objetiva e acionável. ` +
      `Entregue conteúdo pronto para uso quando fizer sentido.` +
      contexto

    const messages = [
      ...(Array.isArray(historico) ? historico : []),
      { role: 'user', content: String(mensagem ?? '') },
    ]

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: MODELO, max_tokens: 1200, system, messages }),
    })

    if (!r.ok) {
      const txt = await r.text()
      return json({ erro: 'falha_ia', detalhe: txt.slice(0, 200) }, 200)
    }
    const data = await r.json()
    const resposta =
      data?.content?.map((b: any) => b.text ?? '').join('\n').trim() ||
      'Não consegui gerar uma resposta.'
    return json({ resposta })
  } catch (e) {
    return json({ erro: 'excecao', detalhe: String(e) }, 200)
  }
})
