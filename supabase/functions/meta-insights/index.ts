// ─────────────────────────────────────────────────────────────────────────
// Edge Function: meta-insights
// Busca métricas de tráfego direto da Meta Ads (Graph API), usando o token
// e a conta de anúncios configurados PARA CADA CLIENTE no sistema.
//
//   POST { clienteId }  → { metricas, criativos }  (equipe logada)
//
// Deploy: copiar para /root/supabase/docker/volumes/functions/meta-insights/
// ─────────────────────────────────────────────────────────────────────────
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false }, db: { schema: 'rugido' } },
)
const GRAPH = 'https://graph.facebook.com/v21.0'

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

const leads = (actions: any[]) =>
  Number(
    actions?.find((a) =>
      ['lead', 'onsite_conversion.lead_grouped', 'offsite_conversion.fb_pixel_lead'].includes(
        a.action_type,
      ),
    )?.value ?? 0,
  )

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ erro: 'metodo' }, 405)

  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  const { data: u } = await admin.auth.getUser(jwt)
  if (!u?.user) return json({ erro: 'nao_autorizado' }, 401)

  try {
    const { clienteId } = await req.json()
    const { data: rel } = await admin
      .from('relatorios_trafego')
      .select('meta_token, meta_ad_account')
      .eq('cliente_id', clienteId)
      .maybeSingle()

    const token = rel?.meta_token
    let conta = rel?.meta_ad_account ?? ''
    if (!token || !conta) return json({ erro: 'nao_configurado' }, 200)
    if (!conta.startsWith('act_')) conta = 'act_' + conta

    // Insights da conta (últimos 30 dias)
    const insUrl =
      `${GRAPH}/${conta}/insights?date_preset=last_30d` +
      `&fields=spend,impressions,clicks,ctr,cpc,actions,action_values` +
      `&access_token=${encodeURIComponent(token)}`
    const insRes = await fetch(insUrl)
    const insJson = await insRes.json()
    if (insJson.error)
      return json({ erro: 'meta_erro', detalhe: insJson.error.message }, 200)

    const row = insJson.data?.[0] ?? {}
    const ld = leads(row.actions)
    const faturamento = Number(
      row.action_values?.find((a: any) => a.action_type?.includes('purchase'))
        ?.value ?? 0,
    )
    const spend = Number(row.spend ?? 0)
    const metricas = {
      investimento: Math.round(spend),
      faturamento: Math.round(faturamento),
      impressoes: Number(row.impressions ?? 0),
      cliques: Number(row.clicks ?? 0),
      ctr: Number(row.ctr ?? 0).toFixed(2),
      cpl: ld ? Math.round(spend / ld) : 0,
      leads: ld,
      conversoes: ld,
      roas: spend ? Number((faturamento / spend).toFixed(2)) : 0,
    }

    // Top criativos (anúncios por leads)
    let criativos: { nome: string; resultado: string }[] = []
    const adsUrl =
      `${GRAPH}/${conta}/ads?limit=25` +
      `&fields=name,insights.date_preset(last_30d){actions,spend}` +
      `&access_token=${encodeURIComponent(token)}`
    const adsRes = await fetch(adsUrl)
    const adsJson = await adsRes.json()
    if (Array.isArray(adsJson.data)) {
      criativos = adsJson.data
        .map((ad: any) => {
          const ins = ad.insights?.data?.[0]
          return { nome: ad.name, leads: leads(ins?.actions) }
        })
        .filter((c: any) => c.leads > 0)
        .sort((a: any, b: any) => b.leads - a.leads)
        .slice(0, 5)
        .map((c: any) => ({ nome: c.nome, resultado: `${c.leads} leads` }))
    }

    return json({ metricas, criativos })
  } catch (e) {
    return json({ erro: String(e) }, 500)
  }
})
