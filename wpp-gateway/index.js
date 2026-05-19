// ═══════════════════════════════════════════════════════════════════
// RUGIDO OS — Gateway WhatsApp (QR-Code via Baileys)
// Sessão WhatsApp Web: QR, mensagens (texto + mídia), grupos.
// ═══════════════════════════════════════════════════════════════════
import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  jidNormalizedUser,
  downloadMediaMessage,
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

function destino(telefone) {
  if (!telefone) return null
  if (telefone.includes('@')) return telefone
  const num = telefone.replace(/\D/g, '')
  return num ? num + '@s.whatsapp.net' : null
}

// Identifica mídia numa mensagem do WhatsApp
function extrairMidia(msg) {
  if (msg?.imageMessage)
    return { tipo: 'imagem', node: msg.imageMessage, ext: 'jpg', mime: 'image/jpeg' }
  if (msg?.videoMessage)
    return { tipo: 'video', node: msg.videoMessage, ext: 'mp4', mime: 'video/mp4' }
  if (msg?.audioMessage)
    return { tipo: 'audio', node: msg.audioMessage, ext: 'ogg', mime: 'audio/ogg' }
  if (msg?.documentMessage)
    return {
      tipo: 'documento',
      node: msg.documentMessage,
      ext: (msg.documentMessage.fileName || 'arquivo').split('.').pop() || 'bin',
      mime: msg.documentMessage.mimetype || 'application/octet-stream',
      nome: msg.documentMessage.fileName,
    }
  if (msg?.stickerMessage)
    return { tipo: 'imagem', node: msg.stickerMessage, ext: 'webp', mime: 'image/webp' }
  return null
}

let sock = null
let conectado = false
const nomesGrupo = {}

async function nomeDoGrupo(jid) {
  if (nomesGrupo[jid]) return nomesGrupo[jid]
  try {
    const meta = await sock.groupMetadata(jid)
    nomesGrupo[jid] = meta?.subject || 'Grupo'
  } catch {
    nomesGrupo[jid] = 'Grupo'
  }
  return nomesGrupo[jid]
}

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
        if (jid.endsWith('@newsletter') || jid === 'status@broadcast') continue
        if (!m.message) {
          log('Mensagem não decifrada de', jid)
          continue
        }
        const ehGrupo = jid.endsWith('@g.us')

        // conteúdo da mensagem (texto + mídia)
        const corpo =
          m.message.ephemeralMessage?.message ||
          m.message.viewOnceMessage?.message ||
          m.message
        const midia = extrairMidia(corpo)
        let tipo = 'texto'
        let url = null
        let texto =
          corpo.conversation ||
          corpo.extendedTextMessage?.text ||
          corpo.imageMessage?.caption ||
          corpo.videoMessage?.caption ||
          ''

        if (midia) {
          tipo = midia.tipo
          try {
            const buffer = await downloadMediaMessage(
              { key: m.key, message: corpo },
              'buffer',
              {},
              { reuploadRequest: sock.updateMediaMessage },
            )
            const nomeArq = `wpp/${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 8)}.${midia.ext}`
            const { error: errUp } = await sb.storage
              .from('anexos')
              .upload(nomeArq, buffer, { contentType: midia.mime })
            if (!errUp) {
              url = sb.storage.from('anexos').getPublicUrl(nomeArq).data.publicUrl
            }
          } catch (e) {
            log('Falha ao baixar mídia:', e.message)
          }
          if (!texto)
            texto = midia.nome || `[${tipo}]`
        }
        if (!texto && !url) texto = '[mensagem]'

        const jidNorm = jidNormalizedUser(jid)
        const numero = jidNorm.split('@')[0]
        const remetente =
          m.pushName || (ehGrupo ? 'Participante' : numero)

        let { data: conv } = await sb
          .from('conversas')
          .select('id')
          .eq('canal', 'whatsapp')
          .eq('telefone', ehGrupo ? jid : jidNorm)
          .maybeSingle()
        if (!conv) {
          const titulo = ehGrupo ? await nomeDoGrupo(jid) : remetente
          const { data: nova } = await sb
            .from('conversas')
            .insert({
              titulo,
              tipo: ehGrupo ? 'grupo' : 'cliente',
              canal: 'whatsapp',
              telefone: ehGrupo ? jid : jidNorm,
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
          autor_nome: remetente,
          tipo,
          conteudo: texto,
          url,
          enviada: true,
        })
        await sb
          .from('conversas')
          .update({
            ultima_msg: tipo === 'texto' ? texto : `[${tipo}]`,
            ultima_em: new Date().toISOString(),
            status: 'aguardando_cliente',
          })
          .eq('id', conv.id)
        log('RECEBIDA', tipo, 'de', jidNorm)
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
      .select('id, conteudo, tipo, url, autor_nome, autor_funcao, conversas(telefone, canal)')
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
        let payload
        if (msg.url && msg.tipo === 'imagem') {
          payload = { image: { url: msg.url }, caption: assinatura.trim() }
        } else if (msg.url && msg.tipo === 'video') {
          payload = { video: { url: msg.url }, caption: assinatura.trim() }
        } else if (msg.url && msg.tipo === 'audio') {
          payload = { audio: { url: msg.url }, mimetype: 'audio/mp4' }
        } else if (msg.url && (msg.tipo === 'documento' || msg.tipo === 'arquivo')) {
          payload = {
            document: { url: msg.url },
            fileName: msg.conteudo || 'arquivo',
            mimetype: 'application/octet-stream',
          }
        } else {
          payload = { text: assinatura + (msg.conteudo || '') }
        }
        await sock.sendMessage(dest, payload)
        await sb.from('mensagens').update({ enviada: true }).eq('id', msg.id)
        log('ENVIADA', msg.tipo, 'para', dest)
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
