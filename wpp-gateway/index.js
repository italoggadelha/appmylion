// ═══════════════════════════════════════════════════════════════════
// RUGIDO OS — Gateway WhatsApp (QR-Code via Baileys)
// Mantém a sessão do WhatsApp Web, gera o QR, recebe e envia mensagens,
// sincronizando com o schema "rugido" do Supabase.
// ═══════════════════════════════════════════════════════════════════
import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  jidNormalizedUser,
} from '@whiskeysockets/baileys'
import { createClient } from '@supabase/supabase-js'
import QRCode from 'qrcode'
import pino from 'pino'

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:8000'
const SERVICE_KEY = process.env.SERVICE_ROLE_KEY
if (!SERVICE_KEY) {
  console.error('Falta SERVICE_ROLE_KEY')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
  db: { schema: 'rugido' },
})

const log = (...a) => console.log(new Date().toISOString(), ...a)
const setConexao = (campos) =>
  sb.from('wpp_conexao').update(campos).eq('id', 1)

// Resolve o JID de destino: usa o que veio (com @) ou monta a partir do número.
function destino(telefone) {
  if (!telefone) return null
  if (telefone.includes('@')) return telefone
  const num = telefone.replace(/\D/g, '')
  return num ? num + '@s.whatsapp.net' : null
}

let sock = null
let conectado = false

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')
  const { version } = await fetchLatestBaileysVersion()
  log('Baileys versão WA', version.join('.'))
  sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['RUGIDO OS', 'Chrome', '120.0'],
    syncFullHistory: false,
    markOnlineOnConnect: true,
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (u) => {
    const { connection, lastDisconnect, qr } = u
    if (qr) {
      log('QR gerado')
      const dataUrl = await QRCode.toDataURL(qr, { margin: 1, width: 320 })
      await setConexao({ status: 'conectando', qr: dataUrl })
    }
    if (connection === 'open') {
      conectado = true
      const numero = (sock.user?.id || '').split(':')[0].split('@')[0]
      log('CONECTADO:', numero)
      await setConexao({
        status: 'conectado',
        qr: null,
        comando: null,
        numero,
        nome_conta: sock.user?.name || 'WhatsApp Business',
        ultima_sync: new Date().toISOString(),
      })
    }
    if (connection === 'close') {
      conectado = false
      const code = lastDisconnect?.error?.output?.statusCode
      log('Conexão encerrada. code=', code)
      if (code === DisconnectReason.loggedOut) {
        await setConexao({ status: 'desconectado', qr: null, numero: null })
      } else {
        await setConexao({ status: 'conectando' })
        setTimeout(start, 3000)
      }
    }
  })

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    for (const m of messages) {
      try {
        if (m.key.fromMe) continue
        const jid = m.key.remoteJid || ''
        if (jid.endsWith('@g.us') || jid.endsWith('@newsletter') || jid === 'status@broadcast')
          continue
        if (!m.message) {
          log('Mensagem sem conteúdo (não decifrada) de', jid)
          continue
        }
        const texto =
          m.message?.conversation ||
          m.message?.extendedTextMessage?.text ||
          (m.message?.imageMessage ? '[imagem]' : '') ||
          (m.message?.audioMessage ? '[áudio]' : '') ||
          (m.message?.videoMessage ? '[vídeo]' : '') ||
          (m.message?.documentMessage ? '[documento]' : '') ||
          '[mensagem]'

        const jidNorm = jidNormalizedUser(jid)
        // tenta achar conversa pelo jid completo OU pelo número puro
        const numero = jidNorm.split('@')[0]
        let { data: conv } = await sb
          .from('conversas')
          .select('id')
          .eq('canal', 'whatsapp')
          .or(`telefone.eq.${jidNorm},telefone.eq.${numero}`)
          .maybeSingle()
        if (!conv) {
          const { data: nova } = await sb
            .from('conversas')
            .insert({
              titulo: m.pushName || numero,
              tipo: 'cliente',
              canal: 'whatsapp',
              telefone: jidNorm,
              status: 'aguardando_cliente',
            })
            .select('id')
            .single()
          conv = nova
        }
        if (!conv) continue
        await sb.from('mensagens').insert({
          conversa_id: conv.id,
          do_cliente: true,
          autor_nome: m.pushName || numero,
          tipo: 'texto',
          conteudo: texto,
          enviada: true,
        })
        await sb
          .from('conversas')
          .update({
            ultima_msg: texto,
            ultima_em: new Date().toISOString(),
            status: 'aguardando_cliente',
          })
          .eq('id', conv.id)
        log('RECEBIDA de', jidNorm, '→', texto.slice(0, 40))
      } catch (e) {
        log('Erro ao processar mensagem:', e.message)
      }
    }
  })
}

// ── Envia mensagens pendentes da equipe + processa comandos ─────────
setInterval(async () => {
  try {
    const { data: cx } = await sb
      .from('wpp_conexao')
      .select('comando')
      .eq('id', 1)
      .maybeSingle()
    if (cx?.comando === 'desconectar' && sock) {
      log('Comando: desconectar')
      await setConexao({ comando: null, status: 'desconectado', qr: null, numero: null })
      try { await sock.logout() } catch {}
      return
    }
    if (cx?.comando === 'conectar' && !conectado) {
      await setConexao({ comando: null })
      start()
    }

    if (!conectado || !sock?.user) return
    const { data: pend } = await sb
      .from('mensagens')
      .select('id, conteudo, autor_nome, autor_funcao, conversas(telefone, canal)')
      .eq('enviada', false)
      .eq('do_cliente', false)
      .limit(20)
    for (const msg of pend ?? []) {
      const conv = msg.conversas
      const dest = destino(conv?.telefone)
      if (conv?.canal !== 'whatsapp' || !dest) {
        await sb.from('mensagens').update({ enviada: true }).eq('id', msg.id)
        continue
      }
      try {
        const assinatura =
          '*' +
          (msg.autor_nome || 'Equipe') +
          (msg.autor_funcao ? ' — ' + msg.autor_funcao : '') +
          '*\n'
        await sock.sendMessage(dest, {
          text: assinatura + (msg.conteudo || ''),
        })
        await sb.from('mensagens').update({ enviada: true }).eq('id', msg.id)
        log('ENVIADA para', dest)
      } catch (e) {
        log('Falha ao enviar para', dest, ':', e.message)
      }
    }
  } catch (e) {
    log('Erro no loop:', e.message)
  }
}, 4000)

log('Gateway WhatsApp iniciando…')
start().catch((e) => {
  log('Erro fatal:', e)
  process.exit(1)
})
