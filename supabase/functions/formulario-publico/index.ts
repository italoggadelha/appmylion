// ─────────────────────────────────────────────────────────────────────────
// Edge Function: formulario-publico
// Formulário de raio-x/descoberta preenchido pelo cliente (acesso por token).
// Ao responder, a IA estratégica gera um plano — guardado para o RESPONSÁVEL
// confirmar (não é enviado ao cliente).
//
//   GET  ?token=XXX           → estrutura do formulário
//   POST { token, respostas } → salva + gera o plano via IA
//
// Deploy: copiar para /root/supabase/docker/volumes/functions/formulario-publico/
// ─────────────────────────────────────────────────────────────────────────
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false }, db: { schema: 'rugido' } },
)
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? ''

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

async function gerarPlano(empresa: string, campos: any[], respostas: any) {
  const linhas = campos
    .map((c) => `• ${c.label}\n  ${respostas[c.id] ?? '(não respondido)'}`)
    .join('\n')

  if (!ANTHROPIC_API_KEY) {
    return (
      `PLANO ESTRATÉGICO — ${empresa}\n\n` +
      `(A IA estratégica não está configurada — defina ANTHROPIC_API_KEY.)\n\n` +
      `Respostas recebidas:\n${linhas}`
    )
  }

  const system =
    'Você é um estrategista de marketing de classe mundial da agência MyLion Digital. ' +
    'Com base no raio-x do cliente, gere um PLANO ESTRATÉGICO INICIAL claro e acionável, ' +
    'organizado pelo Método RUGIDO (Raio-X, Ultravisão, Game Plan, Implementação, ' +
    'Demanda, Escala). Inclua: diagnóstico, ICP/posicionamento, funil sugerido, ' +
    'canais e prioridades dos próximos 90 dias. Português do Brasil, objetivo.'

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1800,
      system,
      messages: [
        {
          role: 'user',
          content: `Cliente: ${empresa}\n\nRespostas do raio-x:\n${linhas}\n\nGere o plano estratégico inicial.`,
        },
      ],
    }),
  })
  if (!r.ok) return `Não foi possível gerar o plano automaticamente.\n\n${linhas}`
  const d = await r.json()
  return (
    d?.content?.map((b: any) => b.text ?? '').join('\n').trim() ||
    'Plano não gerado.'
  )
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    if (req.method === 'GET') {
      const token = new URL(req.url).searchParams.get('token') ?? ''
      const { data: resp } = await admin
        .from('formulario_respostas')
        .select('*, formularios(nome, descricao, campos)')
        .eq('token', token)
        .maybeSingle()
      if (!resp) return json({ error: 'nao_encontrado' }, 404)
      const { data: cli } = await admin
        .from('clientes')
        .select('empresa')
        .eq('id', resp.cliente_id)
        .maybeSingle()
      return json({
        empresa: cli?.empresa ?? '',
        status: resp.status,
        formulario: resp.formularios,
      })
    }

    if (req.method === 'POST') {
      const { token, respostas } = await req.json()
      const { data: resp } = await admin
        .from('formulario_respostas')
        .select('*, formularios(campos)')
        .eq('token', token)
        .maybeSingle()
      if (!resp) return json({ error: 'nao_encontrado' }, 404)
      if (resp.status === 'respondido')
        return json({ error: 'ja_respondido' }, 409)

      const { data: cli } = await admin
        .from('clientes')
        .select('empresa')
        .eq('id', resp.cliente_id)
        .maybeSingle()

      const plano = await gerarPlano(
        cli?.empresa ?? 'Cliente',
        resp.formularios?.campos ?? [],
        respostas ?? {},
      )

      await admin
        .from('formulario_respostas')
        .update({
          status: 'respondido',
          respostas: respostas ?? {},
          plano,
          plano_confirmado: false,
          respondido_em: new Date().toISOString(),
        })
        .eq('id', resp.id)

      return json({ ok: true })
    }

    return json({ error: 'metodo' }, 405)
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
