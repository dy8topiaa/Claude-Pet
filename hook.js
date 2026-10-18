// Appelé par les hooks Claude Code : lit le JSON sur stdin et le transmet au pet.
// Ne bloque jamais : si le pet n'est pas lancé, on abandonne en silence (code 0) en moins d'1 s.
// Les hooks normaux tournent en arrière-plan : on peut attendre quelques secondes que le pet retrouve la fenêtre de la session.
// Avec --wait (hook PermissionRequest), attend que tu cliques Oui / Toujours / Non sur la bulle.
const http = require('http')
const wait = process.argv.includes('--wait')
let cfg = {}
try { cfg = require('./config.json') } catch {}
setTimeout(() => process.exit(0), wait ? ((cfg.approveSeconds || 30) + 5) * 1000 : 5000)

// Commandes à risque : la bulle d'autorisation passe en rouge "⚠ DANGER" (et pas de bouton "Toujours").
const DANGER = [
  [/\brm\s+-\w*[rR]|\brm\s+--recursive\b/, 'suppression récursive de fichiers'],
  [/Remove-Item\b[^|;]*-Recurse|\b(del|erase)\s+\/[sq]|\b(rd|rmdir)\s+\/s/i, 'suppression récursive de fichiers'],
  [/\bgit\s+push\b[^|;]*(--force\b|--force-with-lease\b|\s-f\b)/, 'git push --force (écrase l’historique distant)'],
  [/\bgit\s+reset\s+--hard\b/, 'git reset --hard (perd les modifs locales)'],
  [/\bgit\s+clean\s+-\w*f/, 'git clean (supprime les fichiers non suivis)'],
  [/\bgit\s+(branch\s+-D|checkout\s+--\s+\.|restore\s+\.)/, 'perte de travail git'],
  [/\b(DROP|TRUNCATE)\s+(TABLE|DATABASE|SCHEMA)\b/i, 'suppression de base de données'],
  [/\bDELETE\s+FROM\s+\S+\s*(;|$|")/i, 'DELETE sans WHERE'],
  [/\bmkfs\b|\bdd\s+if=|\bformat\s+[a-z]:/i, 'formatage de disque'],
  [/(curl|wget|iwr|irm|Invoke-WebRequest)\b[^|]*\|\s*(sh|bash|iex|Invoke-Expression)\b/i, 'script téléchargé et exécuté'],
  [/\bchmod\s+-R\s+777\b/, 'chmod 777 récursif'],
  [/\b(shutdown|reboot|Stop-Computer|Restart-Computer)\b/i, 'arrêt du PC'],
  [/\bnpm\s+publish\b/, 'publication npm'],
]

let raw = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', c => { raw += c })
process.stdin.on('end', () => {
  let e
  try { e = JSON.parse(raw.replace(/^﻿/, '')) } catch { process.exit(0) } // BOM ajouté par PowerShell
  const ti = e.tool_input || {}
  const body = JSON.stringify({
    hook_event_name: e.hook_event_name, session_id: e.session_id, cwd: e.cwd,
    message: e.message, notification_type: e.notification_type, tool_name: e.tool_name,
    error: e.error, error_details: String(e.error_details || '').slice(0, 160),
    summary: e.hook_event_name === 'Stop' ? String(e.last_assistant_message || '').replace(/[#*`_>]+/g, '').replace(/\s+/g, ' ').trim().slice(0, 200) : undefined,
    detail: String(ti.command || ti.file_path || ti.url || ti.pattern || ti.description || '').slice(0, 160),
    wait, canAlways: !!e.permission_suggestions?.length, pid: process.ppid, transcript: e.transcript_path,
    danger: DANGER.find(([re]) => re.test(String(ti.command || '')))?.[1],
  })
  const req = http.request({ host: '127.0.0.1', port: cfg.port || 47321, path: '/event', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
  res => {
    let data = ''
    res.on('data', c => { data += c })
    res.on('end', () => {
      let d = null
      try { d = JSON.parse(data).decision } catch {}
      if (!wait || !d) process.exit(0) // pas de décision : la fenêtre habituelle de Claude prend le relais
      const decision = d === 'deny' ? { behavior: 'deny', message: "Refusé depuis le pet de bureau." }
        : { behavior: 'allow', ...(d === 'always' ? { updatedPermissions: e.permission_suggestions } : {}) }
      process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PermissionRequest', decision } }), () => process.exit(0))
    })
  })
  req.on('error', () => process.exit(0))
  req.end(body)
})
