import { supabase, SUPABASE_PRONTO } from './supabase'
import type { Conversa, Mensagem, WppConexao, NotifConfig } from './types'

// ═══════════════════════════════════════════════════════════════════
// Camada de dados do módulo de Comunicação (chat + WhatsApp).
// ═══════════════════════════════════════════════════════════════════

const mapConversa = (r: any): Conversa => ({
  id: r.id,
  clienteId: r.cliente_id ?? undefined,
  titulo: r.titulo ?? undefined,
  tipo: r.tipo,
  canal: r.canal,
  status: r.status,
  ultimaMsg: r.ultima_msg ?? undefined,
  ultimaEm: r.ultima_em,
})

const mapMensagem = (r: any): Mensagem => ({
  id: r.id,
  conversaId: r.conversa_id,
  autorId: r.autor_id ?? undefined,
  autorNome: r.autor_nome,
  autorFuncao: r.autor_funcao ?? undefined,
  doCliente: r.do_cliente,
  tipo: r.tipo,
  conteudo: r.conteudo ?? undefined,
  url: r.url ?? undefined,
  criadoEm: r.criado_em,
})

export async function listarConversas(): Promise<Conversa[]> {
  if (!SUPABASE_PRONTO) return []
  const { data, error } = await supabase
    .from('conversas')
    .select('*')
    .order('ultima_em', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapConversa)
}

export async function listarMensagens(conversaId: string): Promise<Mensagem[]> {
  if (!SUPABASE_PRONTO) return []
  const { data, error } = await supabase
    .from('mensagens')
    .select('*')
    .eq('conversa_id', conversaId)
    .order('criado_em')
  if (error) throw error
  return (data ?? []).map(mapMensagem)
}

export async function enviarMensagem(m: {
  conversaId: string
  autorId?: string
  autorNome: string
  autorFuncao?: string
  doCliente?: boolean
  tipo?: string
  conteudo?: string
  url?: string
}) {
  if (!SUPABASE_PRONTO) throw new Error('Supabase não configurado')
  const { error } = await supabase.from('mensagens').insert({
    conversa_id: m.conversaId,
    autor_id: m.autorId ?? null,
    autor_nome: m.autorNome,
    autor_funcao: m.autorFuncao ?? null,
    do_cliente: m.doCliente ?? false,
    tipo: m.tipo ?? 'texto',
    conteudo: m.conteudo ?? null,
    url: m.url ?? null,
  })
  if (error) throw error
  await supabase
    .from('conversas')
    .update({
      ultima_msg: m.conteudo ?? `[${m.tipo}]`,
      ultima_em: new Date().toISOString(),
    })
    .eq('id', m.conversaId)
}

export async function atualizarStatusConversa(id: string, status: string) {
  if (!SUPABASE_PRONTO) return
  const { error } = await supabase
    .from('conversas')
    .update({ status })
    .eq('id', id)
  if (error) throw error
}

export async function criarConversa(c: {
  clienteId?: string
  titulo?: string
  tipo: string
  canal: string
}) {
  if (!SUPABASE_PRONTO) throw new Error('Supabase não configurado')
  const { data, error } = await supabase
    .from('conversas')
    .insert({
      cliente_id: c.clienteId ?? null,
      titulo: c.titulo ?? null,
      tipo: c.tipo,
      canal: c.canal,
    })
    .select()
    .single()
  if (error) throw error
  return mapConversa(data)
}

/** Assina novas mensagens de uma conversa via Realtime. */
export function assinarMensagens(
  conversaId: string,
  onNova: (m: Mensagem) => void,
) {
  if (!SUPABASE_PRONTO) return () => {}
  const canal = supabase
    .channel(`msg-${conversaId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'rugido',
        table: 'mensagens',
        filter: `conversa_id=eq.${conversaId}`,
      },
      (payload) => onNova(mapMensagem(payload.new)),
    )
    .subscribe()
  return () => {
    supabase.removeChannel(canal)
  }
}

// ── WhatsApp ────────────────────────────────────────────────────────
export async function getWppConexao(): Promise<WppConexao> {
  if (!SUPABASE_PRONTO) return { status: 'desconectado' }
  const { data } = await supabase
    .from('wpp_conexao')
    .select('*')
    .eq('id', 1)
    .maybeSingle()
  return {
    status: data?.status ?? 'desconectado',
    numero: data?.numero ?? undefined,
    nomeConta: data?.nome_conta ?? undefined,
    ultimaSync: data?.ultima_sync ?? undefined,
  }
}

export async function atualizarWppConexao(c: Partial<WppConexao>) {
  if (!SUPABASE_PRONTO) return
  const { error } = await supabase
    .from('wpp_conexao')
    .update({
      status: c.status,
      numero: c.numero ?? null,
      nome_conta: c.nomeConta ?? null,
      ultima_sync: c.ultimaSync ?? null,
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', 1)
  if (error) throw error
}

// ── Notificações ────────────────────────────────────────────────────
const mapNotif = (r: any): NotifConfig => ({
  id: r.id,
  chave: r.chave,
  nome: r.nome,
  gatilho: r.gatilho,
  canalWhatsapp: r.canal_whatsapp,
  canalEmail: r.canal_email,
  canalInterno: r.canal_interno,
  mensagem: r.mensagem ?? undefined,
  ativa: r.ativa,
  custom: r.custom,
})

export async function listarNotifConfig(): Promise<NotifConfig[]> {
  if (!SUPABASE_PRONTO) return []
  const { data, error } = await supabase
    .from('notif_config')
    .select('*')
    .order('criado_em')
  if (error) throw error
  return (data ?? []).map(mapNotif)
}

export async function salvarNotifConfig(n: Partial<NotifConfig> & { id: string }) {
  if (!SUPABASE_PRONTO) return
  const { error } = await supabase
    .from('notif_config')
    .update({
      nome: n.nome,
      mensagem: n.mensagem,
      canal_whatsapp: n.canalWhatsapp,
      canal_email: n.canalEmail,
      canal_interno: n.canalInterno,
      ativa: n.ativa,
    })
    .eq('id', n.id)
  if (error) throw error
}

export async function criarNotifConfig(n: {
  nome: string
  gatilho: string
  mensagem: string
}) {
  if (!SUPABASE_PRONTO) throw new Error('Supabase não configurado')
  const chave =
    'notif_' +
    n.nome.toLowerCase().normalize('NFD').replace(/[^\w]/g, '_').slice(0, 24) +
    '_' +
    Date.now().toString(36)
  const { error } = await supabase.from('notif_config').insert({
    chave,
    nome: n.nome,
    gatilho: n.gatilho,
    mensagem: n.mensagem,
    custom: true,
  })
  if (error) throw error
}

export async function excluirNotifConfig(id: string) {
  if (!SUPABASE_PRONTO) return
  const { error } = await supabase.from('notif_config').delete().eq('id', id)
  if (error) throw error
}
