// Claude Pet — le petit bonhomme de Claude Code se balade en bas de l'écran et réagit aux hooks.
const { app, BrowserWindow, Tray, Menu, screen, ipcMain, nativeImage, shell, powerMonitor, clipboard, globalShortcut, dialog } = require('electron')
const https = require('https'), crypto = require('crypto')
const http = require('http'), fs = require('fs'), path = require('path'), { execFile, spawn } = require('child_process')
const Sprites = require('./sprites')

const CFG_PATH = path.join(__dirname, 'config.json')
const cfg = { speed: 1, scale: 3, sound: true, doneSeconds: 8, port: 47321, skin: 'claude', hat: 'aucun', chatty: true,
  approveSeconds: 30, nightStart: 1, nightEnd: 6, gameMode: 'auto', gameSpot: 'left', phoneTopic: '', phoneAfterMin: 5,
  friendInbox: '', friendTopic: '', name: '', extra: 'aucun', trail: 'aucune', activities: true, bugRecord: 0,
  birthday: '', soundPack: 'retro', shortcuts: true, welcomed: false, visitors: true }
const saveCfg = () => fs.writeFileSync(CFG_PATH, JSON.stringify(cfg, null, 2) + '\n')
if (!fs.existsSync(CFG_PATH)) saveCfg() // 1er lancement (ex. chez un pote) : config par défaut
try { Object.assign(cfg, JSON.parse(fs.readFileSync(CFG_PATH, 'utf8'))) } catch (e) { console.error('config.json illisible :', e.message) }

// Petites fenêtres transparentes qui suivent le pet et l'objet de jeu. Tailles multiples de S pour un pixel art net.
let S, PAD, W, H, PS
function dims() {
  S = Math.max(1, Math.round(cfg.scale))
  PAD = 8 * S; W = S * Math.ceil(300 / S); H = PAD + 36 * S + S * Math.ceil(260 / S); PS = 12 * S
}
dims()
const G = 2400, WALK = 55, RUN = 1100 // px/s², px/s
const login = { path: process.execPath, args: [app.getAppPath()] }

let win, propWin, tray, paused = false, hidden = null, follow = false
const pet = { x: 0, y: 0, vx: 0, vy: 0, face: 1, act: 'stand', timer: 2, air: false, tx: 0, thrown: false }
let drag = null, prop = null
let happyT = 0, danceT = 0, dizzyT = 0, eatT = 0, kickCd = 0, petDist = 0, petCd = 0, sayT = 60, nightT = 0, phoneT = 0, sysIdle = 0
let lastActivity = Date.now(), bubbleRects = [], hover = null, lastBounds = '', last = Date.now()
let lastCur = { x: 0, y: 0 }, cvx = 0, cvy = 0, night = false, fullscreen = false, game = false, opacity = 1
// par session_id : alertes affichées, sessions en train de bosser { t, tool }, début du tour, demandes d'autorisation en attente
const alerts = new Map(), working = new Map(), turns = new Map(), pending = new Map()
const sessions = new Map() // session_id -> { id, project, last, win: pid du processus qui a la fenêtre }

const today = () => new Date().toDateString()

// ---------- progression (sauvegardée dans stats.json) ----------
// XP → niveaux (titres + cosmétiques exclusifs), humeur (caresses, chatouilles, cookies), stats du jour, journal du jour.
const DATA_PATH = path.join(__dirname, 'stats.json')
const blankDay = () => ({ day: today(), done: 0, needs: 0, cookies: 0, kicks: 0, pets: 0, bugs: 0, clicks: 0, journal: [] })
const data = { xp: 0, love: 70, loveAt: Date.now(), greeted: '', bday: '', totals: { done: 0, needs: 0, cookies: 0, pets: 0, kicks: 0, bugs: 0, clicks: 0 }, today: blankDay() }
try { Object.assign(data, JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))) } catch {}
let dataDirty = false
const saveData = () => { if (dataDirty) { dataDirty = false; fs.writeFile(DATA_PATH, JSON.stringify(data), () => {}) } }
let stats = data.today
function stat(k, n = 1) {
  if (data.today.day !== today()) stats = data.today = blankDay()
  if (k) { stats[k] = (stats[k] || 0) + n; data.totals[k] = (data.totals[k] || 0) + n; checkAchievements(k) }
  dataDirty = true
}
const level = () => Sprites.levelOf(data.xp)
const progress = () => ({ level: level(), totals: data.totals, bugRecord: cfg.bugRecord || 0 })
const unlocked = (key, val) => !Sprites.lockInfo(key, val, progress())
function celebrate(text) {
  setTimeout(() => { say(text); dance(); send('fx', { type: 'levelup', x: pet.x, y: pet.y - 26 * S }) }, 600)
}
function gain(xp) {
  const before = level()
  data.xp += xp; dataDirty = true
  const after = level()
  if (after > before) { // niveau supérieur !
    const unlocks = Object.entries(Sprites.LOCKS).filter(([, l]) => l === after).map(([k]) => labelOf(k))
    celebrate(`Niveau ${after} ! 🎉 ${Sprites.titleOf(after)}${unlocks.length ? ` · Débloqué : ${unlocks.join(', ')}` : ''}`)
  }
}
// Succès : un cosmétique se débloque quand un total atteint son seuil (une seule annonce)
function checkAchievements(statKey) {
  for (const [k, a] of Object.entries(Sprites.ACHIEVEMENTS)) {
    if (a.stat !== statKey || data.achieved?.includes(k)) continue
    if ((statKey === 'bugRecord' ? cfg.bugRecord || 0 : data.totals[statKey] || 0) < a.n) continue
    ;(data.achieved ??= []).push(k); dataDirty = true
    celebrate(`🏅 Défi réussi : ${a.n} ${a.label} ! Débloqué : ${labelOf(k)}`)
  }
}
const TABLES = { skin: Sprites.SKINS, hat: Sprites.HATS, extra: Sprites.EXTRAS, trail: Sprites.TRAILS }
const labelOf = k => { const [t, v] = k.split(':'), x = TABLES[t][v]; return x?.label || x }
// humeur : baisse doucement avec le temps (1 point / 4 min), remonte avec les caresses, chatouilles, cookies et tâches finies
function love(n) { data.love = clamp(data.love + n, 0, 100); dataDirty = true }
function decayLove() { const m = (Date.now() - data.loveAt) / 60e3; if (m >= 4) { love(-Math.floor(m / 4)); data.loveAt = Date.now() } }

// Tokens du jour, lus dans l'historique (.jsonl) de chaque session à la fin de ses tours.
// Une même réponse de Claude apparaît sur plusieurs lignes avec le même id : on la compte une fois (la valeur la plus haute).
// ponytail: seules les sessions qui ont fini un tour depuis le lancement du pet sont comptées
const tokens = { day: today(), out: 0, read: 0, byId: new Map() }, offsets = new Map()
async function countTokens(file) {
  if (typeof file !== 'string' || !file.endsWith('.jsonl') || !path.resolve(file).startsWith(path.join(require('os').homedir(), '.claude'))) return
  const size = (await fs.promises.stat(file).catch(() => null))?.size
  let from = offsets.get(file) ?? 0
  if (!size || size === from) return
  if (size < from) from = 0
  const fh = await fs.promises.open(file, 'r'), buf = Buffer.alloc(size - from)
  await fh.read(buf, 0, buf.length, from); await fh.close()
  const end = buf.lastIndexOf(10) + 1 // seulement les lignes complètes
  offsets.set(file, from + end)
  if (tokens.day !== today()) Object.assign(tokens, { day: today(), out: 0, read: 0, byId: new Map() })
  for (const line of buf.subarray(0, end).toString('utf8').split('\n')) {
    if (!line.includes('"usage"')) continue
    let e
    try { e = JSON.parse(line) } catch { continue }
    const u = e.message?.usage, id = e.message?.id || e.requestId
    if (!u || !id || new Date(e.timestamp).toDateString() !== today()) continue
    const out = u.output_tokens || 0, read = (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0)
    const prev = tokens.byId.get(id) || { out: 0, read: 0 }
    if (out + read <= prev.out + prev.read) continue
    tokens.out += out - prev.out; tokens.read += read - prev.read; tokens.byId.set(id, { out, read })
  }
}
const fmtTok = n => n >= 1e6 ? (n / 1e6).toFixed(1).replace('.', ',') + ' M' : n >= 1e3 ? Math.round(n / 1e3) + ' k' : String(n)

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const pick = a => a[Math.random() * a.length | 0]
const displayAt = (x, y) => screen.getDisplayNearestPoint({ x: Math.round(x), y: Math.round(y) })
const groundOf = d => d.workArea.y + d.workArea.height
const send = (ch, d) => win && !win.isDestroyed() && win.webContents.send(ch, d)
const sfx = k => cfg.sound && !game && send('sfx', k)
const say = text => !game && send('say', text)

const PHRASES = [
  'Bip boop 🤖', "J'ai faim de tokens 🍪", "C'est quand qu'on ship ? 🚀", 'Je surveille Claude pour toi 👀',
  '404 : motivation not found', 'Ça marche chez moi 🤷', 'Tu as pensé aux tests ? 🧪', 'Vas-y, je te regarde coder 😌',
  'Il est quelle heure ? Heure de coder.', 'On lâche rien 💪', 'Encore un commit ? 😏', 'Mode turbo activé 🚀',
  'Tu veux un café ? ☕', "Pense à boire de l'eau 💧",
  // trucs qu'on n'attend pas de lui
  "J'ai vu un pigeon tout à l'heure. Il m'a jugé. 🐦", 'Tu savais que les poulpes ont trois cœurs ? 🐙',
  "Je suis pas petit. Je suis en basse résolution.", 'Fun fact : je n’ai jamais vu mes pieds.',
  'Si je tombe de l’écran, dis à ma mère que je l’aime.', 'Qui a mangé mon cookie ?! 🍪', 'Un jour, je serai un grand sprite.',
  'Je compte les pixels. J’en suis à 3.', 'Pourquoi les pizzas sont rondes mais les boîtes carrées ? 🍕',
  'Ne me demande pas pourquoi j’ai 4 pattes.', 'Je crois que je suis allergique aux lundis.', 'Tu as des chips ? Je demande pour un ami.',
  'Je suis le meilleur pet de cet écran. Et le seul.', 'J’ai perdu une chaussette. J’ai pas de chaussettes.',
  'Les canards, c’est des pigeons qui savent nager 🦆', 'Ta barre des tâches est super confortable.', '*fredonne* 🎶 la la la…',
  'Plot twist : c’est moi le patron. 😎', 'Je viens de voir un bug passer. Je dis rien. 🤐', 'J’ai l’impression qu’on m’observe… 👀',
  'Bonjour. Juste bonjour.', 'Les nuages, c’est de la vapeur qui fait la sieste ☁️', 'J’ai encore faim. C’est normal ?',
  'Petit pas pour moi, grand pas pour l’écran.', 'Si tu me cherches, je suis en bas. Comme d’hab.',
  // questions existentielles
  'Si l’eau mouille… est-ce que l’eau est mouillée ? 💧',
  'Pourquoi on appuie plus fort sur la télécommande quand les piles sont vides ? 📺',
  'Est-ce qu’un poisson peut avoir soif ? 🐟',
  'Pourquoi « abréviation » c’est un mot aussi long ?',
  'Pourquoi le mot « court » est plus long que le mot « long » ?',
  'Est-ce que les moutons comptent des humains pour s’endormir ? 🐑',
  'Pourquoi on dit « dormir comme un bébé » alors qu’ils se réveillent toutes les 2 h ? 👶',
  'Si personne n’ouvre le frigo… la lumière reste allumée ? 🧊',
  'Pourquoi la colle ne colle pas à l’intérieur du tube ? 🧴',
  'Si on rêve qu’on dort, on se repose deux fois ? 😴',
  'Le bouton « Démarrer » sert aussi à éteindre l’ordi. C’est normal ?',
  'Pourquoi on dit « il pleut des cordes » ? J’ai jamais vu de corde tomber. 🌧️',
  'Les boîtes à chaussures ont la forme d’une boîte. Pas d’une chaussure. Pourquoi ?',
  'Si un zombie se fait mordre par un zombie… il devient quoi ? 🧟',
  'Un pigeon, il sait qu’il est un pigeon ? 🐦',
  'Un chauve, il se lave la tête avec du shampoing ou du savon ?',
  'Si tu coupes un sandwich en deux, c’est deux demi-sandwichs ou un sandwich cassé ? 🥪',
  '« Biscuit » veut dire « cuit deux fois ». Et le pain grillé, il est cuit combien de fois ? 🍞',
  'Pourquoi on dit « tomber » amoureux et pas « monter » amoureux ? 💘',
  'Les grains de sable savent qu’ils font partie d’une plage ? 🏖️',
  'Si tu mets un réveil pour faire la sieste, c’est encore une sieste ? ⏰',
  'Pourquoi on se lave avec une serviette propre ? Elle est propre, non ?',
  'Si une fourmi tombe d’un immeuble, elle a mal ? 🐜',
  'Pourquoi « séparer » s’écrit tout attaché ?',
  'Combien de temps un pixel peut retenir son souffle ? 🫧',
  // anecdotes (vraies !)
  // — animaux (une petite dizaine)
  'Fun fact : les loutres se tiennent la main pour dormir, pour ne pas dériver. 🦦',
  'Fun fact : les flamants roses sont roses à cause de ce qu’ils mangent. 🦩',
  'Fun fact : les papillons goûtent avec leurs pieds. 🦋',
  'Fun fact : les hippopotames ne savent pas nager, ils marchent au fond de l’eau. 🦛',
  'Fun fact : le cœur d’une baleine bleue est grand comme une petite voiture. 🐋',
  'Fun fact : les manchots offrent un joli caillou pour séduire. 🐧',
  'Fun fact : les requins existent depuis plus longtemps que les arbres. 🦈',
  'Fun fact : les dauphins ont chacun un sifflement qui leur sert de prénom. 🐬',
  'Fun fact : les rats rigolent quand on les chatouille. 🐀',
  'Fun fact : les hiboux ne peuvent pas bouger les yeux, alors ils tournent la tête. 🦉',
  // — espace
  'Fun fact : sur Vénus, une journée dure plus longtemps qu’une année. 🪐',
  'Fun fact : sur Mars, les couchers de soleil sont bleus. 🔴',
  'Fun fact : dans l’espace, les larmes ne coulent pas, elles restent collées à l’œil. 🚀',
  'Fun fact : dans l’espace, il n’y a pas de son. Les explosions y sont silencieuses. 💥',
  'Fun fact : les traces de pas sur la Lune peuvent y rester des millions d’années. 👣',
  'Fun fact : la Lune s’éloigne de la Terre d’environ 4 cm par an. 🌙',
  'Fun fact : le Soleil est 109 fois plus large que la Terre. ☀️',
  'Fun fact : la Russie est plus grande que Pluton. 🌍',
  'Fun fact : l’Australie est plus large que la Lune. 🌏',
  // — corps humain
  'Fun fact : tu es environ 1 cm plus grand le matin que le soir. 📏',
  'Fun fact : on ne peut pas se chatouiller soi-même. Essaie. 🤭',
  'Fun fact : ton cœur bat environ 100 000 fois par jour. ❤️',
  'Fun fact : les bébés naissent sans rotules, elles poussent plus tard. 👶',
  'Fun fact : ton cerveau utilise environ 20 % de ton énergie. 🧠',
  // — bouffe
  'Fun fact : les bananes sont des baies… mais pas les fraises. 🍌',
  'Fun fact : les tomates sont des fruits. 🍅',
  'Fun fact : les cacahuètes ne sont pas des noix, c’est de la famille des petits pois. 🥜',
  'Fun fact : les carottes étaient violettes avant d’être orange. 🥕',
  'Fun fact : le ketchup a d’abord été vendu comme médicament. 🍅',
  'Fun fact : les pommes flottent parce qu’elles sont remplies d’air. 🍎',
  'Fun fact : le miel ne se périme jamais. 🍯',
  'Fun fact : le pop-corn saute parce que l’eau à l’intérieur se transforme en vapeur. 🍿',
  // — histoire et objets
  'Fun fact : Cléopâtre a vécu plus près de l’invention de l’iPhone que de la construction des pyramides. 🏺',
  'Fun fact : la guerre la plus courte de l’histoire a duré moins de 45 minutes. ⏱️',
  'Fun fact : le papier bulle a été inventé pour faire du papier peint. 🫧',
  'Fun fact : l’un des tout premiers ordinateurs pesait près de 30 tonnes. 🖥️',
  'Fun fact : le premier SMS de l’histoire disait « Merry Christmas ». 📱',
  'Fun fact : « OK » vient d’une blague d’orthographe des années 1830. 👌',
  'Fun fact : le mot « robot » vient d’un mot tchèque qui veut dire « corvée ». 🤖',
  'Fun fact : la Grande Muraille de Chine ne se voit pas à l’œil nu depuis l’espace. 🧱',
  'Fun fact : la tour Eiffel grandit d’environ 15 cm en été, à cause de la chaleur. 🗼',
  // — nature et maths
  'Fun fact : il y a plus d’arbres sur Terre que d’étoiles dans la Voie lactée. 🌳',
  'Fun fact : un nuage peut peser plus de 500 tonnes. ☁️',
  'Fun fact : un éclair est environ 5 fois plus chaud que la surface du Soleil. ⚡',
  'Fun fact : un Rubik’s Cube a plus de 43 milliards de milliards de combinaisons. 🧊',
  'Fun fact : si tu mélanges bien un jeu de cartes, cet ordre n’a sans doute jamais existé avant. 🃏',
]

// ---------- événements Claude Code ----------
const ASK = { AskUserQuestion: 'Claude te pose une question', ExitPlanMode: 'Un plan attend ta validation' }
const ERRORS = {
  rate_limit: "Limite d'utilisation atteinte ⏳", overloaded: 'Serveurs surchargés, réessaie dans un moment',
  authentication_failed: 'Problème de connexion à ton compte', oauth_org_not_allowed: 'Organisation non autorisée',
  account_on_hold: 'Compte suspendu', billing_error: 'Souci de facturation', invalid_request: 'Requête refusée par l’API',
  model_not_found: 'Modèle introuvable', server_error: 'Erreur côté serveur Anthropic', max_output_tokens: 'Réponse trop longue, coupée',
  cloud_credential_error: 'Problème d’identifiants cloud',
}
const NEEDS = ['permission_prompt', 'idle_prompt', 'elicitation_dialog', 'elicitation_url_dialog', 'agent_needs_input']

function onEvent(e) {
  const sid = String(e.session_id || 'test'), project = path.basename(String(e.cwd || '')) || 'Claude'
  lastActivity = lastEventAt = Date.now()
  const s = sessions.get(sid) || { id: sid, win: null }
  sessions.set(sid, Object.assign(s, { project, last: Date.now() }))
  switch (e.hook_event_name) {
    case 'UserPromptSubmit': return busy(sid, null, true)
    case 'PreToolUse': return ASK[e.tool_name] ? addAlert(sid, 'needs', project, ASK[e.tool_name]) : busy(sid, e.tool_name)
    case 'PostToolUse': return busy(sid, null)
    case 'PermissionRequest':
      return addAlert(sid, 'needs', project, `Autoriser ${e.tool_name || 'un outil'} ?`,
        { detail: e.detail, ask: !!e.wait, canAlways: !!e.canAlways && !e.danger, danger: e.danger ? String(e.danger).slice(0, 80) : '' })
    case 'Notification':
      if (pending.has(sid)) return // la bulle avec les boutons est déjà là
      if (!e.notification_type || NEEDS.includes(e.notification_type)) addAlert(sid, 'needs', project, e.message || 'Claude a besoin de toi')
      return
    case 'Stop': {
      countTokens(e.transcript).catch(() => {})
      const start = turns.get(sid); turns.delete(sid)
      const detail = start ? `en ${duration(Date.now() - start)}` : '', summary = String(e.summary || '').slice(0, 200)
      stat(); stats.journal.push({ t: Date.now(), sid, project, detail, summary }); stats.journal = stats.journal.slice(-40) // journal du jour
      return addAlert(sid, 'done', project, "C'est fini ✓", { detail, summary, ttl: cfg.doneSeconds + (summary ? 5 : 0) }) // + le temps de lire le résumé
    }
    case 'StopFailure': // Claude s'est arrêté sur une erreur (limite atteinte, API…)
      countTokens(e.transcript).catch(() => {})
      turns.delete(sid)
      return addAlert(sid, 'error', project, ERRORS[e.error] || `Erreur : ${e.error || 'inconnue'}`, { detail: e.error_details })
  }
}
function busy(sid, tool, newTurn) {
  if (newTurn || !turns.has(sid)) turns.set(sid, Date.now())
  working.set(sid, { t: Date.now(), tool })
  decide(sid, null)
  if (alerts.delete(sid)) pushAlerts()
}
function addAlert(sid, kind, project, text, extra) {
  working.delete(sid)
  const prev = alerts.get(sid)
  alerts.set(sid, { id: sid, kind, project, text: String(text).slice(0, 300), t: Date.now(), ...extra })
  if (prev?.kind !== kind) {
    if (kind === 'done' || kind === 'needs') stat(kind)
    if (kind === 'done') { gain(10); love(3) }
    sfx(kind)
  }
  pushAlerts()
}
function pushAlerts() {
  const now = Date.now()
  send('alerts', [...alerts.values()].sort((a, b) => a.t - b.t).map(a => ({ ...a,
    left: a.kind === 'done' ? a.t + (a.ttl || cfg.doneSeconds) * 1000 - now : a.ask ? a.t + cfg.approveSeconds * 1000 - now : 0 })))
}
function duration(ms) {
  const s = Math.round(ms / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60)
  return h ? `${h} h ${m % 60} min` : m ? `${m} min ${s % 60} s` : `${s} s`
}

// ---------- aller à la fenêtre d'une session ----------
// Script PowerShell encodé en base64 : aucun souci de guillemets
const psArgs = script => ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from("$ProgressPreference = 'SilentlyContinue'\n" + script, 'utf16le').toString('base64')]
const ps = script => new Promise(ok => execFile('powershell', psArgs(script), { windowsHide: true, timeout: 8000 }, (err, out) => ok(err ? '' : out.trim())))

// Remonte les processus parents depuis le hook jusqu'au premier qui a une fenêtre (terminal, VS Code, app Claude…).
// Fait au premier événement de la session, tant que la chaîne de processus existe encore.
async function locate(s, pid) {
  if (s.win || s.locating || !Number.isInteger(pid)) return
  s.locating = true
  const out = await ps(`$p = ${pid}; for ($i = 0; $i -lt 15 -and $p; $i++) {
    $g = Get-Process -Id $p -ErrorAction SilentlyContinue
    if ($g -and $g.MainWindowHandle -ne 0) { $p; break }
    $p = (Get-CimInstance Win32_Process -Filter "ProcessId=$p").ParentProcessId }`)
  s.win = parseInt(out) || null; s.locating = false
}

function focusSession(sid) {
  const s = sessions.get(sid)
  if (!s?.win) return say('Je ne retrouve pas sa fenêtre 🤷')
  ps(`Add-Type -Name W -Namespace P -MemberDefinition '[DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h); [DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr h, int n);'
    $g = Get-Process -Id ${s.win} -ErrorAction Stop
    if ([P.W]::IsIconic($g.MainWindowHandle)) { [P.W]::ShowWindowAsync($g.MainWindowHandle, 9) | Out-Null }
    (New-Object -ComObject WScript.Shell).AppActivate(${s.win}) | Out-Null; 'ok'`).then(r => { if (r !== 'ok') { s.win = null; say('Sa fenêtre est fermée 🤷') } })
}

// ---------- notifs sur le téléphone (ntfy.sh) ----------
// Si tu n'as pas touché clavier/souris depuis phoneAfterMin minutes, chaque alerte part aussi sur ton tel, une seule fois.
// ponytail: le "sujet" aléatoire est le seul secret, n'importe qui qui le connaît peut lire les notifs
function publish(msg) {
  const body = JSON.stringify(msg)
  const req = https.request({ host: 'ntfy.sh', path: '/', method: 'POST', timeout: 8000,
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, res => res.resume())
  req.on('error', e => console.error('ntfy :', e.message)).on('timeout', () => req.destroy())
  req.end(body)
}
function phone(title, message, tags) {
  if (cfg.phoneTopic) publish({ topic: cfg.phoneTopic, title, message: message || ' ', tags: [tags], priority: 4 })
}
const PHONE = { needs: ['❗', 'Claude a besoin de toi', 'warning'], done: ['✓', "c'est fini", 'white_check_mark'], error: ['⛔', 'Claude est bloqué', 'no_entry'] }
function phoneAlerts() {
  if (!cfg.phoneTopic || sysIdle < cfg.phoneAfterMin * 60) return
  for (const a of alerts.values()) if (!a.phoned) {
    a.phoned = true
    const [icon, what, tag] = PHONE[a.kind]
    phone(`${icon} ${a.project} : ${what}`, [a.kind === 'done' ? '' : a.text, a.detail, a.summary, a.danger && `⚠ DANGER : ${a.danger}`].filter(Boolean).join('\n'), tag)
  }
}
function enablePhone() {
  cfg.phoneTopic = 'claude-pet-' + crypto.randomBytes(8).toString('hex'); saveCfg()
  clipboard.writeText(cfg.phoneTopic)
  shell.openExternal('https://ntfy.sh/' + cfg.phoneTopic)
  say('Sujet copié 📋 Colle-le dans l’appli ntfy !')
  setTimeout(() => phone('🎉 Claude Pet', 'Les notifs marchent ! Tu seras prévenu ici quand tu es loin du PC.', 'tada'), 1500)
}

// ---------- mode copain ----------
// Chaque pet écoute sa "boîte aux lettres" ntfy (cfg.friendInbox). Tu donnes ton code à ton pote, il te donne le sien :
// vous pouvez vous envoyer coucou, cœur, cookie ou balle. Son pet traverse l'écran pour lui apporter le message.
const FRIEND_CODE = /^claude-pet-ami-[0-9a-f]{16}$/
const myName = () => String(cfg.name || require('os').userInfo().username || 'Ton pote').slice(0, 20)
let inboxReq = null, courier = null
function listenInbox() {
  inboxReq?.destroy(); inboxReq = null
  if (!cfg.friendInbox) return
  const topic = cfg.friendInbox
  inboxReq = https.get(`https://ntfy.sh/${topic}/json`, res => {
    let buf = ''
    res.setEncoding('utf8')
    res.on('data', c => {
      buf += c
      const lines = buf.split('\n'); buf = lines.pop()
      for (const l of lines) try { const m = JSON.parse(l); if (m.event === 'message') receive(JSON.parse(m.message)) } catch {}
    })
    res.on('end', () => { if (cfg.friendInbox === topic) setTimeout(listenInbox, 10000) })
  })
  inboxReq.on('error', () => { if (cfg.friendInbox === topic) setTimeout(listenInbox, 30000) })
}
const GIFTS = {
  hello: ['🤝', 'est relié à toi !'], wave: ['👋', 'te fait coucou !'], heart: ['💖', "t'envoie un cœur"],
  cookie: ['🍪', "t'envoie un cookie"], ball: ['🎾', "t'envoie une balle"],
}
function receive(m) {
  if (!GIFTS[m?.kind] || game || hidden === 'hard') return
  const from = String(m.from || 'Ton pote').slice(0, 20), [icon, what] = GIFTS[m.kind]
  courier = { text: `${from} ${what} ${icon}`, kind: m.kind }
  lastActivity = Date.now(); gain(5); love(8)
}
function sendGift(kind) {
  if (!cfg.friendTopic) return
  publish({ topic: cfg.friendTopic, message: JSON.stringify({ v: 1, kind, from: myName() }) })
  say(`${GIFTS[kind][0]} Envoyé !`)
}
function enableFriend() {
  cfg.friendInbox = 'claude-pet-ami-' + crypto.randomBytes(8).toString('hex'); saveCfg(); listenInbox()
  clipboard.writeText(cfg.friendInbox)
  say('Ton code copain est copié 📋 Envoie-le à ton pote !')
}
function pasteFriend() {
  const code = clipboard.readText().trim()
  if (!FRIEND_CODE.test(code)) return say('Copie d’abord le code de ton pote 📋')
  if (code === cfg.friendInbox) return say('Ça, c’est ton code à toi 😄')
  cfg.friendTopic = code; saveCfg(); sendGift('hello')
}

// ---------- mode jeu ----------
// Un petit PowerShell tourne en fond et dit toutes les 2 s si la fenêtre au premier plan couvre tout son écran (jeu, vidéo…).
// ponytail: une fenêtre maximisée avec la barre des tâches masquée compte aussi comme plein écran
function watchFullscreen() {
  const p = spawn('powershell', psArgs(`Add-Type -Name F -Namespace G -MemberDefinition '
[DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
[DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
[DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetClassName(IntPtr h, System.Text.StringBuilder s, int n);
[DllImport("user32.dll")] public static extern IntPtr MonitorFromWindow(IntPtr h, uint f);
[DllImport("user32.dll")] public static extern bool GetMonitorInfo(IntPtr m, ref MI i);
public struct RECT { public int L, T, R, B; }
public struct MI { public int cb; public RECT m; public RECT w; public uint f; }'
$last = ''
while (Get-Process -Id ${process.pid} -ErrorAction SilentlyContinue) {
  $h = [G.F]::GetForegroundWindow(); $r = New-Object G.F+RECT; $mi = New-Object G.F+MI; $mi.cb = 40
  $sb = New-Object Text.StringBuilder 64; [void][G.F]::GetClassName($h, $sb, 64)
  $fs = '0'
  if ($h -ne [IntPtr]::Zero -and $sb.ToString() -notmatch '^(Progman|WorkerW|Shell_TrayWnd|Shell_SecondaryTrayWnd)$' -and
      [G.F]::GetWindowRect($h, [ref]$r) -and [G.F]::GetMonitorInfo([G.F]::MonitorFromWindow($h, 2), [ref]$mi) -and
      $r.L -le $mi.m.L -and $r.T -le $mi.m.T -and $r.R -ge $mi.m.R -and $r.B -ge $mi.m.B) { $fs = '1' }
  if ($fs -ne $last) { $last = $fs; [Console]::WriteLine($fs) }
  Start-Sleep -Seconds 2
}`), { windowsHide: true })
  watcherAlive = true
  p.stdout.on('data', d => { fullscreen = String(d).trim().endsWith('1') })
  p.on('exit', () => { watcherAlive = false; fullscreen = false })
  app.on('will-quit', () => p.kill())
}

// En jeu : il se pose dans un coin, à moitié transparent, ne capte plus les clics, ne fait plus de bruit.
function setGame(on) {
  game = on
  if (!on) return
  prop = null; danceT = happyT = dizzyT = eatT = 0; follow = false; drag = null
  if (cfg.gameSpot === 'stay') return
  const wa = displayAt(pet.x, pet.y - 10).workArea
  Object.assign(pet, { x: cfg.gameSpot === 'right' ? wa.x + wa.width - 16 * S : wa.x + 16 * S, y: wa.y + wa.height, vx: 0, vy: 0, air: false })
}

// ---------- Oui / Toujours / Non depuis la bulle ----------
// Le hook PermissionRequest (hook.js --wait) attend ici la réponse. Sans réponse, la fenêtre habituelle de Claude prend le relais.
function hold(e, res) {
  const sid = String(e.session_id || 'test')
  decide(sid, null)
  const timer = setTimeout(() => {
    decide(sid, null)
    const a = alerts.get(sid)
    if (a) { a.ask = false; pushAlerts() }
  }, cfg.approveSeconds * 1000)
  pending.set(sid, { res, timer })
  res.on('close', () => { // hook annulé (tu as répondu dans Claude) : on retire les boutons
    if (pending.get(sid)?.res !== res) return
    clearTimeout(timer); pending.delete(sid)
    const a = alerts.get(sid)
    if (a) { a.ask = false; pushAlerts() }
  })
}
function decide(sid, decision) {
  const p = pending.get(sid)
  if (!p) return
  pending.delete(sid); clearTimeout(p.timer)
  p.res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ decision }))
  if (!decision) return
  alerts.delete(sid); pushAlerts(); sfx('pop'); gain(3)
  say(decision === 'deny' ? 'Refusé ✋' : decision === 'always' ? 'Ok, plus besoin de demander 👍' : "C'est parti ✓")
}
function topKind() {
  const k = [...alerts.values()].map(a => a.kind)
  return k.includes('needs') ? 'needs' : k.includes('error') ? 'error' : k.length ? 'done' : null
}

// ---------- boucle principale ----------
function tick() {
  if (win.isDestroyed() || propWin.isDestroyed()) return // fermeture en cours
  const now = Date.now(), dt = Math.min(0.05, (now - last) / 1000); last = now
  let changed = false
  for (const [id, a] of alerts) if (a.kind === 'done' && now - a.t > (a.ttl || cfg.doneSeconds) * 1000) changed = alerts.delete(id)
  for (const [id, w] of working) if (now - w.t > 10 * 60e3) working.delete(id) // ponytail: session interrompue sans Stop
  if (changed) pushAlerts()

  const g = cfg.gameMode === 'on' || (cfg.gameMode === 'auto' && fullscreen)
  if (g !== game) setGame(g)
  const cur = screen.getCursorScreenPoint(), p = pet, top = topKind()
  if (dt > 0) { cvx = cvx * .6 + (cur.x - lastCur.x) / dt * .4; cvy = cvy * .6 + (cur.y - lastCur.y) / dt * .4 }
  const ground = groundOf(displayAt(p.x, p.y - 10))
  if (drag) {
    if (!drag.moved && Math.hypot(cur.x - drag.sx, cur.y - drag.sy) > 5) drag.moved = true
    if (drag.moved) Object.assign(p, { x: cur.x - drag.dx, y: cur.y - drag.dy, vx: 0, vy: 0, air: true, act: 'dangle' })
  } else if (p.air) {
    const [lo, hi] = rowRange(p.x, p.y)
    p.vy += G * dt; p.y += p.vy * dt; p.x += p.vx * dt
    if (p.x < lo || p.x > hi) { p.x = clamp(p.x, lo, hi); p.vx *= -.6; sfx('boing') } // rebond sur les bords de l'écran
    if (p.y >= ground) land(ground)
  } else if (p.y < ground - 1) p.air = true // le sol s'est dérobé (autre écran plus bas) : on tombe
  else { p.y = ground; brain(dt, cur, top) }

  // caresses : la souris qui frotte le pet
  const inPet = Math.abs(cur.x - p.x) < 16 * S && cur.y > p.y - 30 * S && cur.y < p.y + 2 * S
  petDist = !drag && inPet && !top && !game ? petDist + Math.hypot(cur.x - lastCur.x, cur.y - lastCur.y) : Math.max(0, petDist - 300 * dt)
  if ((petCd -= dt) <= 0 && petDist > 260) {
    petDist = 0; petCd = 1.5; happyT = 1.2; lastActivity = now; stat('pets'); gain(2); love(12); sfx('purr')
    send('fx', { type: 'hearts', x: p.x, y: p.y - 26 * S })
    if (Math.random() < .4) say(pick(['Hihihi ça chatouille ! 🤭', 'Arrête hahaha !', 'Pas sous les bras !! 😂', 'Hihi… encore !', 'Je suis trop chatouilleux 🙈']))
  }
  lastCur = cur

  if (prop) propTick(dt, cur)
  visitTick(dt)
  if ((phoneT -= dt) <= 0) { phoneT = 2; sysIdle = powerMonitor.getSystemIdleTime(); phoneAlerts(); slowTick() }
  if (cfg.chatty && !alerts.size && !hidden && awake() && (sayT -= dt) <= 0) { sayT = 90 + Math.random() * 150; say(pick(PHRASES)) }

  // mode nuit : bonnet de nuit, il traîne des pattes et te rappelle d'aller dormir toutes les 20 min
  const d = new Date(), h = d.getHours()
  night = cfg.nightStart < cfg.nightEnd ? h >= cfg.nightStart && h < cfg.nightEnd : h >= cfg.nightStart || h < cfg.nightEnd
  if (night && !alerts.size && !hidden && awake() && (nightT -= dt) <= 0) {
    nightT = 20 * 60
    say(pick([`Il est ${h}h${String(d.getMinutes()).padStart(2, '0')}… au lit ? 😴`, 'On finit demain ? 🌙', '*bâille* … tu dors pas ? 🥱']))
  }
  if (!night) nightT = 0

  // ce que fait Claude en ce moment (session la plus récente) + chrono du tour
  let work = null
  for (const [sid, w] of working) if (!work || w.t > work.t) work = { ...w, start: turns.get(sid) ?? w.t }

  // fenêtre du pet (cachée sauf alerte en mode "cacher jusqu'à ce que Claude ait besoin de moi")
  const visible = !hidden || (hidden === 'soft' && alerts.size > 0)
  if (visible !== win.isVisible()) visible ? win.showInactive() : win.hide()
  const b = displayAt(p.x, p.y - 10).bounds
  const wx = Math.round(clamp(p.x - W / 2, b.x, b.x + b.width - W)), wy = Math.round(p.y - H + PAD)
  if (`${wx},${wy},${W}` !== lastBounds) { lastBounds = `${wx},${wy},${W}`; win.setBounds({ x: wx, y: wy, width: W, height: H }) }

  // click-through partout sauf sur le pet et ses bulles
  const op = game && !alerts.size ? .45 : 1
  if (op !== opacity) { opacity = op; win.setOpacity(op) }
  const over = visible && !game && (!!drag || inPet || bubbleRects.some(r => cur.x >= wx + r.x && cur.x <= wx + r.x + r.w && cur.y >= wy + r.y && cur.y <= wy + r.y + r.h))
  if (over !== hover) { hover = over; win.setIgnoreMouseEvents(!over) }

  send('tick', { wx, wy, x: p.x, y: p.y, gy: ground, act: p.act, face: p.face, vx: p.vx, vy: p.vy, air: p.air, cx: visitor && visitor.phase !== 'leave' ? visitor.x : cur.x, // il regarde son visiteur night, game, love: data.love, bday: isBirthday(), danger: [...alerts.values()].some(a => a.danger),
    work: work && { secs: Math.floor((now - work.start) / 1000), tool: work.tool, n: working.size }, at: p.at || 0, dur: p.dur || 1 })

  const showProp = !!prop && visible
  if (showProp !== propWin.isVisible()) showProp ? propWin.showInactive() : propWin.hide()
}

// Toutes les 2 s : humeur, sauvegarde, infobulle de l'icône, bonjour du matin, anniversaire, pet perdu hors écran.
let saveT = 0, lastTip = ''
const mmdd = (d = new Date()) => `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const isBirthday = () => !!cfg.birthday && cfg.birthday === mmdd()
function slowTick() {
  decayLove(); stat()
  if ((saveT += 2) >= 30) { saveT = 0; saveData() }
  pushWardrobe() // stats en direct si la garde-robe est ouverte

  const n = [...alerts.values()].filter(a => a.kind === 'needs').length
  const tip = `Claude Pet · niv. ${level()} · ${n ? `❗ ${n} attend${n > 1 ? 'ent' : ''} ta réponse` : working.size ? `⌨ ${working.size} session${working.size > 1 ? 's' : ''} au travail` : 'au repos'}`
  if (tip !== lastTip && tray) { lastTip = tip; tray.setToolTip(tip) }

  // pet sorti de tous les écrans (écran débranché, glissé trop loin…) : on le ramène
  const d = displayAt(pet.x, pet.y - 10), b = d.bounds
  if (!drag && (pet.x < b.x - 20 || pet.x > b.x + b.width + 20 || pet.y > b.y + b.height + 50 || pet.y < b.y - 200)) rescue()

  if (game || hidden || sysIdle > 60) return
  const name = cfg.name ? ` ${cfg.name}` : '', h = new Date().getHours()
  const wake = () => { if (!awake()) { send('fx', { type: 'poof', x: pet.x, y: pet.y }); idle('stand', 2) } } // il se réveille pour te parler
  if (data.greeted !== today() && Date.now() - started > 5000) { // 1re fois de la journée qu'il te voit
    data.greeted = today(); dataDirty = true; wake()
    say(h < 5 ? `Encore debout${name} ? 🦉` : h < 12 ? `Bonjour${name} ! ☀️` : h < 18 ? `Salut${name} ! 👋` : `Bonsoir${name} ! 🌙`)
  }
  if (isBirthday() && data.bday !== today() && Date.now() - started > 9000) {
    data.bday = today(); dataDirty = true; wake()
    say(`Joyeux anniversaire${name} ! 🎂🎉`); dance(); send('fx', { type: 'levelup', x: pet.x, y: pet.y - 26 * S })
  }
}
const started = Date.now()
function rescue() {
  const wa = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea
  Object.assign(pet, { x: wa.x + wa.width / 2, y: wa.y + wa.height - 300, vx: 0, vy: 0, air: true, thrown: false })
  lastBounds = ''; hover = null
}

function land(y) {
  const p = pet
  p.y = y
  if (p.thrown && p.vy > 600) { // lancé : il rebondit, et si c'est violent il a la tête qui tourne
    if (p.vy > 1100 && dizzyT <= 0) { dizzyT = 2.2; say(pick(['Ouh là… 😵', 'Ça tourne !', 'Encore ! Encore !'])) }
    p.vy *= -.4; p.vx *= .6; sfx('boing')
    return
  }
  Object.assign(p, { vy: 0, vx: 0, air: false, thrown: false })
}

function brain(dt, cur, top) {
  const p = pet
  if (top) { p.act = top; return } // alerte : il reste sur place, discrètement
  if (game) { p.act = working.size ? 'type' : 'sit'; return } // en jeu : il ne bouge pas
  if (reveal) { // chifoumi / dé / pile ou face : il secoue, puis annonce le résultat
    p.act = 'shake'
    if ((reveal.t -= dt) > 0) return
    const r = reveal; reveal = null
    say(r.text); sfx('pop')
    if (r.mood === 'win') { happyT = 1.6; send('fx', { type: 'hearts', x: p.x, y: p.y - 26 * S }) } else if (r.mood === 'lose') sulkT = 2.2
    gain(r.mood === 'lose' ? 3 : 1) // gagner au chifoumi rapporte un peu plus
    return
  }
  if (sulkT > 0) { sulkT -= dt; p.act = 'sulk'; return }
  if (courier) { // message de ton pote : il court te l'apporter
    const [lo, hi] = rowRange(p.x, p.y), dx = clamp(cur.x, lo, hi) - p.x
    if (Math.abs(dx) > 60) return move(dx, RUN * .6, dt, 'run')
    const c = courier; courier = null
    if (c.kind === 'cookie' || c.kind === 'ball') drop(c.kind)
    say(c.text); sfx('pop'); happyT = 1.6
    send('fx', { type: 'hearts', x: p.x, y: p.y - 26 * S })
    return
  }
  if (visitor && visitor.phase !== 'leave' && !happyT && !danceT) { // il reste là à discuter avec son visiteur
    p.act = 'stand'; p.face = Math.sign(visitor.x - p.x) || p.face; return
  }
  if (dizzyT > 0) { dizzyT -= dt; p.act = 'dizzy'; return }
  if (eatT > 0) {
    p.act = 'eat'
    if ((eatT -= dt) <= 0) { happyT = 1.2; send('fx', { type: 'hearts', x: p.x, y: p.y - 26 * S }) }
    return
  }
  if (happyT > 0) { happyT -= dt; p.act = 'happy'; return }
  if (prop) return play(dt)
  if (danceT > 0) { danceT -= dt; p.act = 'dance'; return }
  if (working.size) { p.act = 'type'; return }
  // absent depuis 30 min (clavier et souris) : il plante sa tente et dort jusqu'à ton retour
  if (sysIdle >= 30 * 60) { if (p.act !== 'camp') { send('fx', { type: 'poof', x: p.x, y: p.y }); idle('camp') } return }
  if (p.act === 'camp') { send('fx', { type: 'poof', x: p.x, y: p.y }); say('Te revoilà ! 👋'); return idle('stand', 2) }
  if (p.act === 'sleep') { if (Date.now() - lastActivity < 2000) { idle('stand', 1.5); say('*bâille* 🥱') } return }
  if (follow) return followMouse(dt, cur)
  if (ACT_KEYS.includes(p.act)) { // activité en cours (skate, guitare, pêche…)
    p.at += dt; p.timer -= dt
    if ((p.act === 'skate' || p.act === 'butterfly') && !paused) {
      const dx = p.tx - p.x
      if (Math.abs(dx) > 3) move(dx, p.act === 'skate' ? 320 : WALK * 1.3, dt, p.act)
      else if (p.act === 'skate') p.timer = 0
    }
    if (p.act === 'fish' && !p.caught && p.timer < 2.2) { p.caught = true; say(pick(['Un poisson ! 🐟', 'Ça mord !! 🎣', 'Regarde ma prise ! 🐠'])); sfx('pop') }
    if (p.act === 'butterfly' && p.timer <= 0) say('Bye bye 🦋')
    if (p.timer <= 0) { p.caught = false; idle('stand', 2) }
    return
  }
  if (!['walk', 'stand', 'sit'].includes(p.act)) return idle('stand', 1 + Math.random() * 2)
  if (paused) { if (p.act === 'walk') idle('sit'); return }
  if (p.act === 'walk') {
    const dx = p.tx - p.x
    return Math.abs(dx) < 2 ? idle(Math.random() < .6 ? 'stand' : 'sit', 2 + Math.random() * 6) : move(dx, night ? WALK * .6 : WALK, dt, 'walk')
  }
  if ((p.timer -= dt) > 0) return
  const r = Math.random()
  if (Date.now() - lastActivity > (night ? 60e3 : 3 * 60e3) && r < .25) return idle('sleep')
  if (data.love < 20 && Math.random() < .2) { // il manque d'amour : il boude un peu
    sulkT = 3; return say(pick(['Une petite caresse ? 🥺', 'Personne ne m’aime…', 'Je boude. 😤', 'Même pas un cookie aujourd’hui…']))
  }
  if (cfg.activities && !paused && Math.random() < .25) return startActivity(pick(ACT_KEYS))
  if (r < .6) {
    const [lo, hi] = rowRange(p.x, p.y)
    p.tx = clamp(p.x + (Math.random() < .5 ? -1 : 1) * (120 + Math.random() * 900), lo, hi); p.act = 'walk'
    return
  }
  r < .8 ? idle('stand', 2 + Math.random() * 3) : idle('sit', 6 + Math.random() * 10)
}
function idle(act, t = 0) { pet.act = act; pet.timer = t }
const awake = () => pet.act !== 'sleep' && pet.act !== 'camp' // il ne parle pas en dormant

// ---------- activités et petits jeux ----------
const ACT_KEYS = Object.keys(Sprites.ACTIVITIES)
function startActivity(name) {
  if (game) return
  const p = pet, dur = name === 'skate' ? 20 : 7 + Math.random() * 7
  Object.assign(p, { act: name, timer: dur, dur, at: 0, caught: false })
  if (name === 'skate' || name === 'butterfly') {
    const [lo, hi] = rowRange(p.x, p.y), dist = name === 'skate' ? 600 + Math.random() * 900 : 150 + Math.random() * 300
    p.tx = clamp(p.x + (Math.random() < .5 ? -1 : 1) * dist, lo, hi)
  }
}

let reveal = null, sulkT = 0
const rpsScore = { you: 0, pet: 0 }
const RPS = { pierre: '✊', feuille: '✋', ciseaux: '✌️' }, BEATS = { pierre: 'ciseaux', feuille: 'pierre', ciseaux: 'feuille' }
function rps(you) {
  const me = pick(Object.keys(RPS)), res = me === you ? 'draw' : BEATS[me] === you ? 'win' : 'lose' // win = c'est lui qui gagne
  if (res !== 'draw') rpsScore[res === 'win' ? 'pet' : 'you']++
  const verdict = { draw: 'Égalité !', win: "J'ai gagné ! 😎", lose: 'Tu as gagné… 😤' }[res]
  reveal = { t: 1.3, mood: res, text: `${RPS[me]} contre ${RPS[you]} : ${verdict}  (toi ${rpsScore.you} – moi ${rpsScore.pet})` }
}
const dice = () => { reveal = { t: 1, mood: 'win', text: `🎲 ${1 + Math.floor(Math.random() * 6)} !` } }
const coin = () => { reveal = { t: 1, mood: 'draw', text: `🪙 ${Math.random() < .5 ? 'Pile' : 'Face'} !` } }

// ---------- mises à jour (depuis le dépôt GitHub indiqué dans package.json → "updateRepo") ----------
// Vérifie au démarrage puis toutes les 6 h. "Mettre à jour" télécharge le code, garde config/stats, rebranche les hooks et redémarre.
// Désactivé dans le dossier de développement (celui qui a un .git) : c'est de là qu'on publie.
const PKG = require('./package.json'), DEV_COPY = fs.existsSync(path.join(__dirname, '.git'))
const canUpdate = () => !!PKG.updateRepo && !DEV_COPY
let update = null // { version } quand une version plus récente est dispo
const newer = (a, b) => { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); return false }
function getText(url, redirects = 3) {
  return new Promise((ok, ko) => https.get(url, { headers: { 'User-Agent': 'claude-pet' }, timeout: 15000 }, res => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects) { res.resume(); return ok(getText(res.headers.location, redirects - 1)) }
    if (res.statusCode !== 200) { res.resume(); return ko(new Error('HTTP ' + res.statusCode)) }
    const chunks = []; res.on('data', c => chunks.push(c)); res.on('end', () => ok(Buffer.concat(chunks)))
  }).on('error', ko).on('timeout', function () { this.destroy(new Error('délai dépassé')) }))
}
async function checkUpdate(manual) {
  if (!canUpdate()) return manual && say(DEV_COPY ? 'C’est ta version de dev : publie avec npm run release 😉' : 'Pas de dépôt de mise à jour configuré')
  try {
    const remote = JSON.parse(String(await getText(`https://raw.githubusercontent.com/${PKG.updateRepo}/main/package.json?t=${Date.now()}`)))
    if (newer(remote.version, PKG.version)) { if (!update || manual) say(`🎁 Mise à jour ${remote.version} dispo ! Clic droit → Mettre à jour`); update = { version: remote.version } }
    else if (manual) say(`✓ Tu as la dernière version (${PKG.version})`)
  } catch (e) { if (manual) say('Impossible de vérifier les mises à jour 🤷') }
}
async function installUpdate() {
  try {
    say('⬇ Je télécharge la mise à jour…')
    const tmp = path.join(app.getPath('temp'), 'claude-pet-update'), zip = tmp + '.zip', q = s => s.replace(/'/g, "''")
    fs.writeFileSync(zip, await getText(`https://codeload.github.com/${PKG.updateRepo}/zip/refs/heads/main`))
    const src = await ps(`Remove-Item -Recurse -Force '${q(tmp)}' -ErrorAction SilentlyContinue; Expand-Archive -Force '${q(zip)}' '${q(tmp)}'
      (Get-ChildItem '${q(tmp)}' -Directory | Select-Object -First 1).FullName`)
    if (!src || !fs.existsSync(path.join(src, 'main.js'))) throw new Error('archive inattendue')
    const KEEP = new Set(['config.json', 'stats.json', 'node_modules', 'icon.ico', '.git']) // ce qui est à toi ne bouge pas
    const deps = p => JSON.stringify([p.dependencies, p.devDependencies]), oldDeps = deps(PKG)
    for (const f of fs.readdirSync(src)) if (!KEEP.has(f)) fs.cpSync(path.join(src, f), path.join(__dirname, f), { recursive: true, force: true })
    const depsChanged = deps(JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'))) !== oldDeps
    // la suite se fait une fois le pet fermé (fichiers libérés) : npm install si besoin, hooks, puis relance
    const cmd = `timeout /t 2 /nobreak >nul & ${depsChanged ? 'call npm install --no-fund --no-audit >nul 2>&1 & ' : ''}node hooks-setup.js install >nul 2>&1 & start "" "${process.execPath}" "${__dirname}"`
    spawn('cmd.exe', ['/d', '/s', '/c', `"${cmd}"`], { cwd: __dirname, detached: true, stdio: 'ignore', windowsHide: true, windowsVerbatimArguments: true }).unref()
    say('✓ Mis à jour ! Je redémarre…')
    setTimeout(() => app.exit(0), 1500)
  } catch (e) { say(`Mise à jour impossible : ${e.message} 😕`) }
}

// ---------- visiteurs ----------
// De temps en temps (toutes les 20 à 45 min, quand il est tranquille), un petit personnage arrive du côté où il y a de la place,
// discute avec lui (les répliques s'affichent dans sa bulle, avec l'icône de qui parle), puis repart.
const VISITS = {
  chat: { speed: 90, end: 'hearts', scripts: [
    [['v', 'Miaou ?'], ['p', 'Oh, un chat ! Salut toi 😺'], ['v', 'Mrrr… 💕']],
    [['v', 'Mrrraou.'], ['p', 'Tu veux une caresse ?'], ['v', '*ronronne* 😻']]] },
  fantome: { speed: 60, end: 'scare', scripts: [
    [['v', 'Bouuuh !'], ['p', 'AAAAH ! 😱'], ['v', 'Hihi, je rigole 👻']],
    [['v', 'Tu… as… vu… mon… drap ?'], ['p', 'Euh… non ? 😰'], ['v', 'Tant pis. Bouh !']]] },
  robot: { speed: 70, end: 'dance', scripts: [
    [['v', 'BIP BOUP. SALUTATIONS.'], ['p', 'Bip boop à toi aussi 🤖'], ['v', 'MODE DANSE. ACTIVÉ.']],
    [['v', 'ANALYSE… PET DÉTECTÉ.'], ['p', 'Coucou le robot !'], ['v', 'NIVEAU DE MIGNONNERIE : 100 %.']]] },
  poussin: { speed: 110, end: 'hearts', scripts: [
    [['v', 'Piou piou !'], ['p', 'Qu’il est mignon 🐥'], ['v', 'Piou !! 💛']],
    [['v', 'Piou ? Piou piou ?'], ['p', 'Je parle pas poussin… 😅'], ['v', 'Piou.']]] },
  escargot: { speed: 16, end: null, scripts: [
    [['v', 'Salut… je… passais…'], ['p', 'Prends ton temps 🐌'], ['v', '…merci… à… dans… 3 jours…']]] },
  cousin: { speed: 80, end: 'jump', scripts: [
    [['v', 'Yo cousin !'], ['p', 'Cousiiin ! 🤜🤛'], ['v', 'Allez, je file, à plus !']],
    [['v', 'Hé ! T’as vu mon chapeau ?'], ['p', 'Trop stylé !! 😎'], ['v', 'Hehe. Bisous !']]] },
}
let visitor = null, visitT = 600 + Math.random() * 1200, visWin = null
const VW = () => 40 * S, VH = () => 36 * S
function inviteVisitor(kind) {
  if (visitor || game || hidden === 'hard') return
  kind = VISITS[kind] ? kind : pick(Object.keys(VISITS))
  const wa = displayAt(pet.x, pet.y - 10).workArea, m = 20 * S
  const side = pet.x - wa.x > wa.x + wa.width - pet.x ? -1 : 1 // il arrive du côté où il y a le plus de place
  const x = clamp(pet.x + side * (kind === 'escargot' ? 130 : 420), wa.x + m, wa.x + wa.width - m)
  const skins = ['menthe', 'lavande', 'ocean', 'cerise', 'citron', 'bonbon'].filter(k => k !== cfg.skin)
  visitor = { kind, x, y: groundOf(displayAt(x, pet.y - 10)), face: -side, side, phase: 'arrive', t: 0, line: -1, alpha: 0,
    script: pick(VISITS[kind].scripts), skin: pick(skins), hat: pick(['casquette', 'noeud', 'fleur', 'chapeau', 'aucun']) }
  lastActivity = Date.now()
}
function visitTick(dt) {
  const v = visitor
  if (!v) {
    if (cfg.visitors && !game && !hidden && awake() && !alerts.size && !working.size && !prop && !drag && (visitT -= dt) <= 0) {
      visitT = 1200 + Math.random() * 1500; inviteVisitor()
    }
    if (visWin.isVisible()) visWin.hide()
    return
  }
  const def = VISITS[v.kind], icon = Sprites.VISITOR_LOOKS[v.kind]
  v.t += dt
  if ((alerts.size || game || hidden) && v.phase !== 'leave') Object.assign(v, { phase: 'leave', face: v.side }) // Claude passe avant
  if (v.phase === 'arrive') {
    const dx = pet.x + v.side * 32 * S - v.x // il s'arrête juste à côté, sans le chevaucher
    v.alpha = Math.min(1, v.alpha + dt * 2); v.walking = Math.abs(dx) > 3
    if (v.walking) v.x += Math.sign(dx) * Math.min(Math.abs(dx), def.speed * dt)
    else Object.assign(v, { phase: 'talk', t: 0 })
  } else if (v.phase === 'talk') {
    v.face = Math.sign(pet.x - v.x) || v.face
    const i = Math.floor(v.t / 2.6)
    if (i !== v.line && i < v.script.length) { v.line = i; const [who, text] = v.script[i]; say(who === 'v' ? `${icon} ${text}` : text) }
    if (v.t > v.script.length * 2.6) {
      Object.assign(v, { phase: 'end', t: 0, happy: true }); stat('visits'); gain(3); love(5)
      if (def.end === 'hearts') { happyT = 1.4; sfx('purr'); send('fx', { type: 'hearts', x: pet.x, y: pet.y - 26 * S }) }
      if (def.end === 'scare' || def.end === 'jump') { if (!pet.air) Object.assign(pet, { air: true, vy: def.end === 'scare' ? -850 : -550 }); sfx('boing') }
      if (def.end === 'dance') dance()
    }
  } else if (v.phase === 'end') {
    if (v.t > 1.6) Object.assign(v, { phase: 'leave', t: 0, face: v.side, happy: false })
  } else { // leave : il repart d'où il vient en s'effaçant
    v.walking = true; v.x += v.face * def.speed * 1.3 * dt; v.alpha -= dt * .6
    if (v.alpha <= 0) { visitor = null; return }
  }
  visWin.setBounds({ x: Math.round(v.x - VW() / 2), y: Math.round(v.y - VH() + 2 * S), width: VW(), height: VH() })
  if (!visWin.isVisible() && !hidden) visWin.showInactive()
  visWin.webContents.send('visitor', { kind: v.kind, face: v.face, walking: v.walking, alpha: v.alpha, skin: v.skin, hat: v.hat, happy: v.happy })
}

// Chasse aux bugs : 30 s pour écraser un max de bugs qui tombent sur l'écran (fenêtre de jeu par-dessus le bureau).
let bugWin = null
function bugHunt() {
  if (bugWin || game) return
  const wa = displayAt(pet.x, pet.y - 10).workArea
  bugWin = new BrowserWindow({ ...wa, transparent: true, frame: false, resizable: false, skipTaskbar: true, hasShadow: false, alwaysOnTop: true,
    webPreferences: { nodeIntegration: true, contextIsolation: false } })
  bugWin.setAlwaysOnTop(true, 'screen-saver'); win.moveTop()
  bugWin.loadFile('bugs.html', { query: { S, record: cfg.bugRecord || 0 } })
  bugWin.on('closed', () => { bugWin = null })
  stopPlaying(true); say('Écrase-les tous ! 🐛')
}
function move(dx, speed, dt, act) {
  pet.face = Math.sign(dx); pet.x += pet.face * Math.min(Math.abs(dx), speed * cfg.speed * dt); pet.act = act
}

// Zone de balade : l'écran du point + ceux posés à côté de lui (ultrawide, double écran).
function rowRange(x, y) {
  const wa = displayAt(x, y - 10).workArea, m = 16 * S
  let lo = wa.x, hi = wa.x + wa.width
  for (const { workArea: o } of screen.getAllDisplays())
    if (o.y < wa.y + wa.height && o.y + o.height > wa.y) { lo = Math.min(lo, o.x); hi = Math.max(hi, o.x + o.width) }
  return [lo + m, hi - m]
}

// ---------- jeux ----------
function followMouse(dt, cur) {
  const [lo, hi] = rowRange(pet.x, pet.y), dx = clamp(cur.x, lo, hi) - pet.x, far = Math.abs(dx) > 500
  if (Math.abs(dx) > 70) return move(dx, far ? RUN * .6 : WALK * 2.5, dt, far ? 'run' : 'walk')
  idle('stand', 1)
}

// Balle ou cookie qui tombe du ciel près du pet.
function drop(kind) {
  const wa = displayAt(pet.x, pet.y - 10).workArea, side = Math.random() < .5 ? -1 : 1
  const x = clamp(pet.x + side * (150 + Math.random() * 250), wa.x + 20 * S, wa.x + wa.width - 20 * S)
  prop = { kind, x, y: wa.y + 40, vx: kind === 'ball' ? -side * 200 : 0, vy: 0, ttl: kind === 'ball' ? 45 : 90, cd: 0 }
  lastActivity = Date.now()
  say(kind === 'ball' ? 'Une balle !! 🎾' : 'Oh… un cookie ? 👀')
}

function propTick(dt, cur) {
  const b = prop, gnd = groundOf(displayAt(b.x, b.y - 5)), [lo, hi] = rowRange(b.x, b.y)
  b.vy += G * dt; b.x += b.vx * dt; b.y += b.vy * dt
  if (b.x < lo || b.x > hi) { b.x = clamp(b.x, lo, hi); b.vx *= -.7 }
  if (b.y >= gnd) {
    b.y = gnd
    if (b.kind === 'ball' && b.vy > 200) b.vy *= -.55; else b.vy = 0
    b.vx *= b.kind === 'ball' ? Math.pow(.35, dt) : 0
  }
  // la souris peut taper dans la balle
  if (b.kind === 'ball' && (b.cd -= dt) <= 0 && Math.hypot(cur.x - b.x, cur.y - (b.y - 5 * S)) < 9 * S && Math.hypot(cvx, cvy) > 250) {
    b.vx = clamp(cvx, -2000, 2000); b.vy = Math.min(clamp(cvy, -2000, 2000), -300); b.cd = .25; sfx('kick')
  }
  if ((b.ttl -= dt) <= 0) { prop = null; return }
  propWin.setBounds({ x: Math.round(b.x - PS / 2), y: Math.round(b.y - PS), width: PS, height: PS })
  propWin.webContents.send('prop', { kind: b.kind, ph: Math.floor(b.x / (3 * S)) & 1 })
}

function play(dt) {
  const p = pet, b = prop, dx = b.x - p.x, onGround = b.y >= groundOf(displayAt(b.x, b.y - 5)) - 2
  kickCd -= dt
  if (b.kind === 'cookie') {
    if (!onGround) { p.face = Math.sign(dx) || p.face; return idle('stand', 1) } // attend qu'il tombe
    if (Math.abs(dx) > 4 * S) return move(dx, RUN * .6, dt, 'run')
    prop = null; eatT = 2; stat('cookies'); gain(5); love(15); sfx('eat')
    say(pick(['Miam ! 😋', 'Crunch crunch 🍪', 'Dé-li-cieux.', 'Encore un ?']))
    send('fx', { type: 'crumbs', x: p.x, y: p.y - 10 * S })
    return
  }
  if (Math.abs(dx) > 10 * S) return move(dx, RUN * .45, dt, 'run')
  idle('stand', 1)
  if (kickCd <= 0 && b.y > groundOf(displayAt(b.x, b.y - 5)) - 14 * S) { // shoot !
    kickCd = .5; p.face = Math.sign(dx) || p.face
    b.vx = p.face * (350 + Math.random() * 600); b.vy = -(350 + Math.random() * 650)
    stat('kicks'); gain(1); sfx('kick')
    if (Math.random() < .3) Object.assign(p, { air: true, vy: -450 })
  }
}

function dance() { danceT = 6; lastActivity = Date.now(); sfx('dance'); say('♪ Ta-da-da ♪') }

function stopPlaying(quiet) {
  if (prop) send('fx', { type: 'poof', x: prop.x, y: prop.y })
  prop = null; danceT = 0; follow = false
  if (ACT_KEYS.includes(pet.act)) idle('stand', 2)
  if (!quiet) say(pick(['Ok, on range 🧺', 'Ooooh… déjà ?', "C'était trop bien !"]))
}

// ---------- clics ----------
const CLICK_MILESTONES = {
  10: '10 caresses ! On devient potes 😊', 50: '50 caresses ! Je ronronne 💕', 100: '100 caresses !! Je t’adore 💖',
  250: '250 caresses… t’as pas un travail ? 😏', 500: '500 caresses ! Record du bureau 🏆', 1000: '1000 CARESSES. Je suis le pet le plus aimé du monde 👑',
  2500: '2500 caresses. Ta souris va demander une augmentation 🖱️', 5000: '5000 caresses ! Légende vivante ✨', 10000: '10 000 caresses. Je ne sais plus quoi dire. Merci ❤️',
}
function click() {
  lastActivity = Date.now()
  if (alerts.size) { for (const sid of pending.keys()) decide(sid, null); alerts.clear(); pushAlerts(); return }
  if (prop || danceT > 0 || follow || ACT_KEYS.includes(pet.act)) return stopPlaying()
  if (happyT <= 0) { gain(1); love(4) } // pas de spam de clics
  happyT = 1.4; sfx('pop')
  send('fx', { type: 'hearts', x: pet.x, y: pet.y - 26 * S })
  // compteur de caresses : "+1" qui s'envole, et une petite fête aux paliers
  stat('clicks')
  send('fx', { type: 'count', n: stats.clicks, x: pet.x, y: pet.y })
  const total = data.totals.clicks, milestone = CLICK_MILESTONES[total]
  if (milestone) setTimeout(() => { say(milestone); send('fx', { type: 'levelup', x: pet.x, y: pet.y - 26 * S }); sfx('dance') }, 400)
  if (!pet.air) Object.assign(pet, { air: true, vy: -520 })
}

// Fait réapparaître le pet à côté de la souris (s'il est perdu ou caché).
function summon() {
  const cur = screen.getCursorScreenPoint(), wa = screen.getDisplayNearestPoint(cur).workArea
  Object.assign(pet, { x: clamp(cur.x, wa.x + 16 * S, wa.x + wa.width - 16 * S), y: wa.y + wa.height - 200, vx: 0, vy: 0, air: true, thrown: false })
  drag = null; hidden = null
  win.showInactive(); win.setAlwaysOnTop(true, 'screen-saver'); win.moveTop()
  send('fx', { type: 'poof', x: pet.x, y: pet.y })
  say('Coucou ! 👋')
  click()
}

// ---------- raccourcis clavier (Ctrl+Alt+…) ----------
const SHORTCUTS = [
  ['Control+Alt+O', 'Accepter la demande en attente', () => answerOldest('allow')],
  ['Control+Alt+N', 'Refuser la demande en attente', () => answerOldest('deny')],
  ['Control+Alt+G', 'Aller à la session qui t’attend', () => goToWaiting()],
  ['Control+Alt+P', 'Appeler le pet', () => summon()],
]
function answerOldest(decision) {
  const sid = [...pending.keys()][0]
  if (!sid) return say('Rien à répondre pour l’instant 🤷')
  if (decision === 'allow' && alerts.get(sid)?.danger) return say('⚠ Commande dangereuse : confirme sur la bulle !')
  decide(sid, decision)
}
function goToWaiting() {
  const a = [...alerts.values()].sort((x, y) => (x.kind === 'needs' ? -1 : 1) - (y.kind === 'needs' ? -1 : 1) || y.t - x.t)[0]
  const sid = a?.id || [...sessions.values()].sort((x, y) => y.last - x.last)[0]?.id
  sid ? focusSession(sid) : say('Aucune session récente 🤷')
}
function registerShortcuts() {
  globalShortcut.unregisterAll()
  if (!cfg.shortcuts) return
  const failed = SHORTCUTS.filter(([acc, , fn]) => !globalShortcut.register(acc, fn)).map(([acc]) => acc)
  if (failed.length) console.error('Raccourcis déjà pris par une autre appli :', failed.join(', '))
}

// ---------- diagnostic ----------
let serverOk = false, watcherAlive = false, lastEventAt = 0
async function diagnose() {
  const lines = [], hook = path.join(__dirname, 'hook.js').replace(/\\/g, '/')
  let hooksOk = false
  try {
    const s = JSON.parse(fs.readFileSync(path.join(require('os').homedir(), '.claude', 'settings.json'), 'utf8'))
    const n = Object.values(s.hooks || {}).flat().flatMap(g => g.hooks || []).filter(h => String(h.command || '').includes(hook)).length
    hooksOk = n >= 7
    lines.push(`${hooksOk ? '✅' : '❌'} Hooks Claude Code : ${n}/7 branchés sur ce dossier`)
  } catch { lines.push('❌ ~/.claude/settings.json introuvable ou illisible') }
  const node = await new Promise(ok => execFile('node', ['-v'], { windowsHide: true }, (e, out) => ok(e ? '' : out.trim())))
  lines.push(node ? `✅ Node.js ${node}` : '❌ Node.js introuvable : les hooks en ont besoin (nodejs.org)')
  lines.push(serverOk ? `✅ Serveur local sur le port ${cfg.port}` : `❌ Port ${cfg.port} occupé : un autre pet tourne déjà ?`)
  lines.push(lastEventAt ? `✅ Dernier signal de Claude : il y a ${duration(Date.now() - lastEventAt)}`
    : 'ℹ️ Aucun signal de Claude depuis le lancement : relance tes sessions Claude Code')
  lines.push(watcherAlive ? '✅ Détection du mode jeu' : '⚠️ Détection du mode jeu arrêtée (relance le pet)')
  if (cfg.phoneTopic || cfg.friendInbox) {
    const ok = await new Promise(r => https.get('https://ntfy.sh/v1/health', res => { res.resume(); r(res.statusCode === 200) }).on('error', () => r(false)))
    lines.push(ok ? '✅ ntfy.sh joignable (notifs téléphone / copain)' : '❌ ntfy.sh injoignable : pas d’internet ?')
  }
  if (cfg.friendInbox) lines.push(cfg.friendTopic ? '✅ Copain relié' : 'ℹ️ Copain : colle le code de ton pote pour le relier')
  const failed = cfg.shortcuts ? SHORTCUTS.filter(([acc]) => !globalShortcut.isRegistered(acc)).map(([a]) => a.replace('Control', 'Ctrl')) : []
  lines.push(!cfg.shortcuts ? 'ℹ️ Raccourcis clavier désactivés' : failed.length ? `⚠️ Raccourcis pris par une autre appli : ${failed.join(', ')}` : '✅ Raccourcis clavier')
  const r = await dialog.showMessageBox({ type: hooksOk && node && serverOk ? 'info' : 'warning', title: 'Claude Pet', message: '🩺 Diagnostic',
    detail: lines.join('\n'), buttons: hooksOk ? ['OK'] : ['Réparer les hooks', 'Fermer'] })
  if (!hooksOk && r.response === 0) execFile('node', [path.join(__dirname, 'hooks-setup.js'), 'install'], { windowsHide: true },
    e => dialog.showMessageBox({ type: e ? 'error' : 'info', title: 'Claude Pet', message: e ? 'Échec de la réparation' : 'Hooks réinstallés ✓',
      detail: e ? String(e.message) : 'Relance tes sessions Claude Code pour qu’elles parlent au pet.' }))
}

// ---------- garde-robe et profil (fenêtre wardrobe.html) ----------
let wardWin = null
function openWardrobe() {
  if (wardWin) return wardWin.focus()
  wardWin = new BrowserWindow({ width: 760, height: 620, frame: false, resizable: false, show: false, backgroundColor: '#fff7ef', title: 'Garde-robe',
    icon: petImage(2), webPreferences: { nodeIntegration: true, contextIsolation: false } })
  wardWin.loadFile('wardrobe.html')
  wardWin.once('ready-to-show', () => { wardWin.show(); pushWardrobe() })
  wardWin.on('closed', () => { wardWin = null })
}
function pushWardrobe() {
  if (!wardWin || wardWin.isDestroyed()) return
  const lvl = level()
  wardWin.webContents.send('state', {
    cfg: { skin: cfg.skin, hat: cfg.hat, extra: cfg.extra, trail: cfg.trail, scale: cfg.scale, soundPack: cfg.soundPack, name: cfg.name, birthday: cfg.birthday },
    xp: data.xp, level: lvl, title: Sprites.titleOf(lvl), cur: Sprites.xpFor(lvl), next: Sprites.xpFor(lvl + 1), love: Math.round(data.love),
    totals: data.totals, today: stats, bugRecord: cfg.bugRecord || 0, user: myName(),
  })
}
const CHOICES = { ...TABLES, scale: { 2: 1, 3: 1, 4: 1, 5: 1 }, soundPack: { retro: 1, doux: 1, rigolo: 1 } }
function wardSet({ key, value }) {
  if (!CHOICES[key] || !(value in CHOICES[key]) || (TABLES[key] && !unlocked(key, value))) return
  cfg[key] = key === 'scale' ? Number(value) : value; saveCfg()
  if (key === 'scale') applyScale(); else applyLook()
  if (key === 'soundPack') setTimeout(() => sfx('done'), 150) // pour entendre le pack
  pushWardrobe()
}
function wardMe({ name, birthday }) {
  cfg.name = String(name || '').replace(/[^\p{L}\p{N} '’-]/gu, '').trim().slice(0, 20)
  cfg.birthday = /^\d{2}-\d{2}$/.test(birthday) ? birthday : ''
  saveCfg(); pushWardrobe()
  say(cfg.name ? `Enchanté ${cfg.name} ! 😊` : 'C’est noté ✓')
}

// ---------- apparence ----------
function applyLook() {
  send('look', { skin: cfg.skin, hat: cfg.hat, extra: cfg.extra, trail: cfg.trail, soundPack: cfg.soundPack })
  tray?.setImage(trayIcon())
}
function applyScale() {
  dims(); lastBounds = ''
  win.loadFile('pet.html', { query: { S, W, H, PAD } })
  propWin.loadFile('prop.html', { query: { S } })
  visWin.loadFile('visitor.html', { query: { S } })
}

// ---------- serveur local ----------
function startServer() {
  http.createServer((req, res) => {
    if (req.method !== 'POST' || req.url !== '/event') return res.end('claude-pet ok')
    // JSON obligatoire : empêche une page web de poster ici sans pré-vol CORS
    if (!String(req.headers['content-type']).startsWith('application/json')) return res.writeHead(415).end()
    let body = ''
    req.on('data', c => { body += c; if (body.length > 1e5) req.destroy() })
    req.on('end', async () => {
      let e
      try { e = JSON.parse(body) } catch { return res.writeHead(400).end() }
      const waiting = e.wait && hidden !== 'hard' && !game // en jeu, pas de boutons : la fenêtre de Claude s'affiche tout de suite
      if (waiting) hold(e, res) // demande d'autorisation : on attend ton clic
      else e.wait = false
      onEvent(e)
      // 1er événement d'une session : on retrouve sa fenêtre pendant que le hook (et ses parents) tournent encore
      const s = sessions.get(String(e.session_id || 'test'))
      if (s && !s.win) await Promise.race([locate(s, e.pid), new Promise(r => setTimeout(r, 4000))])
      if (!waiting) res.writeHead(204).end()
    })
  }).on('error', e => { serverOk = false; console.error(`Serveur indisponible sur le port ${cfg.port} :`, e.message) })
    .on('listening', () => { serverOk = true })
    .listen(cfg.port, '127.0.0.1')
}

// ---------- menu (clic droit sur le pet ou sur l'icône) ----------
// Le pet en image 32x32 (agrandie k fois, en gros pixels) : icône du tray et du raccourci.
function petImage(k, skin, hat) {
  const n = 32 * k, buf = Buffer.alloc(n * n * 4)
  const g = {
    fillStyle: '#000',
    fillRect(x, y, w, h) {
      const v = parseInt(this.fillStyle.slice(1), 16)
      for (let j = Math.max(0, y * k); j < Math.min(n, (y + h) * k); j++) for (let i = Math.max(0, x * k); i < Math.min(n, (x + w) * k); i++)
        buf.set([v & 255, (v >> 8) & 255, v >> 16, 255], (j * n + i) * 4) // BGRA
    },
  }
  Sprites.drawPet(g, 16, hat && hat !== 'aucun' ? 30 : 26, { ...Sprites.basePose(), skin: skin?.body.startsWith('#') ? skin : Sprites.SKINS.claude, hat })
  return nativeImage.createFromBitmap(buf, { width: n, height: n, scaleFactor: k === 1 ? 2 : 1 })
}
const trayIcon = () => petImage(1, Sprites.SKINS[cfg.skin], cfg.hat)

// icon.ico (PNG 256x256 dans un conteneur ICO) pour le raccourci Bureau.
function writeIcon() {
  const file = path.join(__dirname, 'icon.ico')
  if (fs.existsSync(file)) return
  const png = petImage(8).toPNG(), head = Buffer.alloc(22)
  head.writeUInt16LE(1, 2); head.writeUInt16LE(1, 4) // type icône, 1 image
  head.writeUInt16LE(1, 10); head.writeUInt16LE(32, 12); head.writeUInt32LE(png.length, 14); head.writeUInt32LE(22, 18) // 256x256 (codé 0), 32 bits
  fs.writeFileSync(file, Buffer.concat([head, png]))
}

// Sessions vues ces 3 dernières heures, la plus récente en haut.
function sessionItems() {
  const live = [...sessions.values()].filter(s => Date.now() - s.last < 3 * 3600e3).sort((a, b) => b.last - a.last)
  if (!live.length) return [{ label: 'Aucune session récente', enabled: false }]
  return live.map(s => {
    const a = alerts.get(s.id)?.kind
    const [icon, state] = a === 'needs' ? ['❗', 'attend ta réponse'] : working.has(s.id) ? ['⌨', 'travaille'] : a === 'done' ? ['✓', 'a fini'] : ['💤', 'au repos']
    const twin = live.some(o => o !== s && o.project === s.project) ? ` · ${s.id.slice(0, 4)}` : ''
    return { label: `${icon}  ${s.project}${twin} — ${state}`, enabled: !!s.win, click: () => focusSession(s.id) }
  })
}

// Ce que Claude a terminé aujourd'hui (le plus récent en haut) ; un clic ramène la session.
function journalItems() {
  stat()
  const list = stats.journal.slice(-15).reverse()
  if (!list.length) return [{ label: 'Rien de terminé pour l’instant', enabled: false }]
  return list.map(e => {
    const sum = e.summary ? `  — ${e.summary.slice(0, 50)}${e.summary.length > 50 ? '…' : ''}` : ''
    return { label: `✓  ${new Date(e.t).toTimeString().slice(0, 5)}  ${e.project}${e.detail ? ` (${e.detail.replace('en ', '')})` : ''}${sum}`, click: () => focusSession(e.sid) }
  })
}

function menu() {
  const radio = (label, key, val, after) => ({ label, type: 'radio', checked: cfg[key] === val, click: () => { cfg[key] = val; saveCfg(); after?.() } })
  const demo = { session_id: 'demo', cwd: 'C:/dev/demo-projet' }
  const needs = { hook_event_name: 'Notification', notification_type: 'permission_prompt', message: 'Claude needs your permission to use Bash' }
  stat() // remet les compteurs à zéro si on a changé de jour
  const lvl = level(), playing = prop || danceT > 0 || follow || ACT_KEYS.includes(pet.act)
  const acc = a => ({ accelerator: a, registerAccelerator: false }) // affiche le raccourci à droite
  return Menu.buildFromTemplate([
    { label: `⭐  Niveau ${lvl} · ${Sprites.titleOf(lvl)} · ❤️ ${Math.round(data.love)} %`, enabled: false },
    { label: `📊  Aujourd'hui : ${stats.done} finies · ${stats.needs} appels · ${stats.cookies} 🍪 · ${stats.clicks || 0} caresses · ${stats.pets} chatouilles`, enabled: false },
    ...(tokens.day === today() && tokens.byId.size
      ? [{ label: `🔤  Tokens : ${fmtTok(tokens.out)} écrits · ${fmtTok(tokens.read)} lus (cache compris)`, enabled: false }] : []),
    ...(update ? [{ label: `🎁  Mettre à jour (version ${update.version})`, click: () => installUpdate() }] : []),
    { type: 'separator' },
    { label: '🧭  Aller à la session', submenu: sessionItems() },
    { label: '📜  Journal du jour', submenu: journalItems() },
    ...(playing ? [{ label: '🛑  Arrêter de jouer', click: () => stopPlaying() }] : []),
    { label: '📍  Appeler ici', ...acc('Ctrl+Alt+P'), click: () => summon() },
    { label: paused ? '▶  Reprendre la balade' : '⏸  Pause balade', click: () => { paused = !paused } },
    hidden
      ? { label: '👀  Montrer', click: () => { hidden = null } }
      : { label: '👻  Cacher', submenu: [
        { label: "Jusqu'à ce que Claude ait besoin de moi", click: () => { hidden = 'soft' } },
        { label: 'Complètement', click: () => { hidden = 'hard' } },
      ] },
    { type: 'separator' },
    { label: '🎒  Garde-robe et profil…', click: openWardrobe },
    { label: '🎲  Jouer', submenu: [
      { label: '🎾  Lancer une balle', click: () => drop('ball') },
      { label: '🍪  Donner un cookie', click: () => drop('cookie') },
      { label: '💃  Danser', click: () => dance() },
      { label: '🐭  Suivre ma souris', type: 'checkbox', checked: follow, click: m => { follow = m.checked } },
      { type: 'separator' },
      { label: '🐛  Chasse aux bugs (30 s)', click: bugHunt },
      { label: '✊  Chifoumi', submenu: Object.entries(RPS).map(([k, e]) => ({ label: `${e}  ${k[0].toUpperCase() + k.slice(1)}`, click: () => rps(k) })) },
      { label: '🎲  Lancer un dé', click: dice },
      { label: '🪙  Pile ou face', click: coin },
      { label: '🚪  Inviter un visiteur', submenu: Object.keys(VISITS).map(k => ({
        label: `${Sprites.VISITOR_LOOKS[k]}  ${{ chat: 'Le chat', fantome: 'Le fantôme', robot: 'Le robot', poussin: 'Le poussin', escargot: 'L’escargot', cousin: 'Le cousin' }[k]}`,
        enabled: !visitor, click: () => inviteVisitor(k) })) },
      { type: 'separator' },
      { label: '🎨  Activités', submenu: [
        ...Object.entries(Sprites.ACTIVITIES).map(([k, l]) => ({ label: l, click: () => startActivity(k) })),
        { type: 'separator' },
        { label: 'Il en fait tout seul', type: 'checkbox', checked: cfg.activities, click: m => { cfg.activities = m.checked; saveCfg() } },
      ] },
      { type: 'separator' },
      { label: '🛑  Arrêter de jouer', enabled: !!playing, click: () => stopPlaying() },
    ] },
    { label: `📱  Notifs téléphone${cfg.phoneTopic ? '  (actif)' : ''}`, submenu: cfg.phoneTopic ? [
      { label: `Sujet : ${cfg.phoneTopic}`, enabled: false },
      { label: '📋  Copier le sujet', click: () => { clipboard.writeText(cfg.phoneTopic); say('Sujet copié 📋') } },
      { label: '🔔  Envoyer un test', click: () => phone('🔔 Claude Pet', 'Test : ça marche !', 'bell') },
      { label: 'Prévenir si je suis absent depuis…', submenu: [2, 5, 10, 20].map(n => radio(`${n} min`, 'phoneAfterMin', n)) },
      { type: 'separator' },
      { label: 'Désactiver', click: () => { cfg.phoneTopic = ''; saveCfg() } },
    ] : [{ label: 'Activer… (appli gratuite ntfy)', click: enablePhone }] },
    { label: `👋  Copain${cfg.friendTopic ? '  (relié)' : ''}`, submenu: !cfg.friendInbox
      ? [{ label: 'Activer le mode copain', click: enableFriend }]
      : [
        ...(cfg.friendTopic ? [
          { label: '👋  Envoyer un coucou', click: () => sendGift('wave') },
          { label: '💖  Envoyer un cœur', click: () => sendGift('heart') },
          { label: '🍪  Envoyer un cookie', click: () => sendGift('cookie') },
          { label: '🎾  Envoyer une balle', click: () => sendGift('ball') },
          { type: 'separator' },
        ] : [{ label: '📥  Coller le code de mon pote', click: pasteFriend }, { type: 'separator' }]),
        { label: `Mon code : ${cfg.friendInbox}`, enabled: false },
        { label: '📋  Copier mon code', click: () => { clipboard.writeText(cfg.friendInbox); say('Code copié 📋') } },
        ...(cfg.friendTopic ? [{ label: '📥  Changer de pote (coller son code)', click: pasteFriend },
          { label: '✂  Délier mon pote', click: () => { cfg.friendTopic = ''; saveCfg() } }] : []),
        { label: 'Désactiver le mode copain', click: () => { cfg.friendInbox = cfg.friendTopic = ''; saveCfg(); listenInbox() } },
      ] },
    { label: `🎮  Mode jeu${game ? '  (actif)' : ''}`, submenu: [
      radio('Automatique (jeu ou vidéo en plein écran)', 'gameMode', 'auto'),
      radio('Toujours activé', 'gameMode', 'on'),
      radio('Désactivé', 'gameMode', 'off'),
      { type: 'separator' },
      { label: 'Pendant le jeu, il se met…', enabled: false },
      radio('dans le coin gauche', 'gameSpot', 'left', () => game && setGame(true)),
      radio('dans le coin droit', 'gameSpot', 'right', () => game && setGame(true)),
      radio('où il est', 'gameSpot', 'stay'),
    ] },
    { type: 'separator' },
    { label: '⚙  Réglages', submenu: [
      { label: '💬  Bavard', type: 'checkbox', checked: cfg.chatty, click: m => { cfg.chatty = m.checked; saveCfg() } },
      { label: '🔊  Son', type: 'checkbox', checked: cfg.sound, click: m => { cfg.sound = m.checked; saveCfg() } },
      { label: '🚪  Visiteurs surprise', type: 'checkbox', checked: cfg.visitors, click: m => { cfg.visitors = m.checked; saveCfg() } },
      { label: '⌨  Raccourcis clavier', type: 'checkbox', checked: cfg.shortcuts, click: m => { cfg.shortcuts = m.checked; saveCfg(); registerShortcuts() } },
      ...SHORTCUTS.map(([a, l]) => ({ label: `      ${l}`, ...acc(a.replace('Control', 'Ctrl')), enabled: false })),
      { type: 'separator' },
      { label: '🚀  Lancer au démarrage', type: 'checkbox', checked: app.getLoginItemSettings(login).openAtLogin,
        click: m => app.setLoginItemSettings({ ...login, openAtLogin: m.checked }) },
      { label: '📝  Ouvrir le fichier de config', click: () => shell.openPath(CFG_PATH) },
      { label: `🔄  Vérifier les mises à jour (v${PKG.version})`, click: () => checkUpdate(true) },
    ] },
    { label: '🩺  Diagnostic…', click: () => diagnose() },
    { label: '🧪  Tester', submenu: [
      { label: '⌨  Travaille', click: () => onEvent({ ...demo, hook_event_name: 'UserPromptSubmit' }) },
      { label: '❗  Besoin de toi', click: () => onEvent({ ...demo, ...needs }) },
      { label: '🔐  Autorisation (boutons)', click: () => {
        const e = { ...demo, hook_event_name: 'PermissionRequest', tool_name: 'Bash', detail: 'npm install', wait: true, canAlways: true }
        hold(e, { writeHead() { return this }, end() {}, on() {} }); onEvent(e)
      } },
      { label: '✓  Fini', click: () => onEvent({ ...demo, hook_event_name: 'Stop' }) },
      { label: '⛔  Bloqué (limite atteinte)', click: () => onEvent({ ...demo, hook_event_name: 'StopFailure', error: 'rate_limit', error_details: '429 Too Many Requests' }) },
      { label: '⧉  Deux sessions', click: () => {
        onEvent({ ...needs, session_id: 'a', cwd: 'C:/dev/mon-site' })
        onEvent({ hook_event_name: 'Stop', session_id: 'b', cwd: 'C:/dev/api-backend' })
      } },
    ] },
    { type: 'separator' },
    { label: '❌  Quitter', click: () => app.quit() },
  ])
}

// ---------- démarrage ----------
function start() {
  const wa = screen.getPrimaryDisplay().workArea
  Object.assign(pet, { x: wa.x + wa.width / 2, y: wa.y + wa.height })
  const opts = {
    transparent: true, frame: false, resizable: false, skipTaskbar: true, hasShadow: false, alwaysOnTop: true, focusable: false,
    // ponytail: nodeIntegration ok, les pages sont locales et le texte des hooks passe par textContent
    webPreferences: { nodeIntegration: true, contextIsolation: false, backgroundThrottling: false, autoplayPolicy: 'no-user-gesture-required' },
  }
  win = new BrowserWindow({ ...opts, width: W, height: H })
  propWin = new BrowserWindow({ ...opts, width: PS, height: PS, show: false })
  visWin = new BrowserWindow({ ...opts, width: VW(), height: VH(), show: false })
  for (const w of [win, propWin, visWin]) w.setAlwaysOnTop(true, 'screen-saver')
  propWin.setIgnoreMouseEvents(true); visWin.setIgnoreMouseEvents(true)
  win.webContents.on('did-finish-load', () => { pushAlerts(); applyLook() })
  win.loadFile('pet.html', { query: { S, W, H, PAD } })
  propWin.loadFile('prop.html', { query: { S } })
  visWin.loadFile('visitor.html', { query: { S } })

  ipcMain.on('down', () => {
    const c = screen.getCursorScreenPoint()
    drag = { dx: c.x - pet.x, dy: c.y - pet.y, sx: c.x, sy: c.y, moved: false }
  })
  ipcMain.on('up', () => {
    if (!drag) return
    const { moved } = drag; drag = null
    if (!moved) return click()
    // on le lâche avec l'élan de la souris
    Object.assign(pet, { air: true, vx: clamp(cvx, -2500, 2500), vy: clamp(cvy, -2500, 2500), thrown: true })
  })
  ipcMain.on('bug-hit', () => { stat('bugs'); gain(1); if (!pet.air) Object.assign(pet, { air: true, vy: -350 }) })
  ipcMain.on('bugs-done', (_, n) => {
    const score = Math.max(0, Number(n) | 0), record = score > (cfg.bugRecord || 0)
    if (record) { cfg.bugRecord = score; saveCfg(); checkAchievements('bugRecord') }
    bugWin?.close(); happyT = 1.6; sfx(record ? 'dance' : 'pop')
    say(record ? `Nouveau record : ${score} bugs ! 🏆` : `${score} bugs écrasés ! (record : ${cfg.bugRecord})`)
  })
  ipcMain.on('dbl',() => { happyT = 1; sfx('boing'); if (!pet.air) Object.assign(pet, { air: true, vy: -950 }) })
  ipcMain.on('menu', () => tray.popUpContextMenu(menu(), screen.getCursorScreenPoint()))
  ipcMain.on('dismiss', (_, id) => { decide(id, null); alerts.delete(id); pushAlerts() })
  ipcMain.on('focus', (_, id) => focusSession(id))
  ipcMain.on('ward-set', (_, m) => wardSet(m || {}))
  ipcMain.on('ward-me', (_, m) => wardMe(m || {}))
  ipcMain.on('ward-close', () => wardWin?.close())
  ipcMain.on('ward-ready', () => pushWardrobe())
  ipcMain.on('decide',(_, { id, decision }) => { if (['allow', 'always', 'deny'].includes(decision)) decide(id, decision) })
  ipcMain.on('rects', (_, r) => { bubbleRects = r })

  writeIcon()
  tray = new Tray(trayIcon())
  tray.setToolTip('Claude Pet')
  for (const ev of ['click', 'right-click']) tray.on(ev, () => tray.popUpContextMenu(menu()))
  tray.on('double-click', summon)
  startServer()
  setInterval(tick, 16)
  // Windows fait parfois passer d'autres fenêtres "toujours devant" au-dessus : on reprend la place.
  // (sauf en jeu, pour ne jamais perturber la fenêtre du jeu)
  setInterval(() => {
    if (!game) for (const w of [win, propWin, visWin]) if (!w.isDestroyed()) { w.setAlwaysOnTop(true, 'screen-saver'); if (w.isVisible()) w.moveTop() }
  }, 3000)
  watchFullscreen()
  listenInbox()
  registerShortcuts()

  // robustesse : écrans branchés/débranchés, veille, plantage de l'affichage, double lancement
  const refresh = () => { lastBounds = ''; hover = null; slowTick() }
  for (const ev of ['display-added', 'display-removed', 'display-metrics-changed']) screen.on(ev, refresh)
  for (const ev of ['resume', 'unlock-screen']) powerMonitor.on(ev, () => { refresh(); for (const w of [win, propWin, visWin]) w.setAlwaysOnTop(true, 'screen-saver'); win.moveTop() })
  for (const w of [win, propWin, visWin]) w.webContents.on('render-process-gone', () => setTimeout(() => !w.isDestroyed() && w.reload(), 1000))
  app.on('second-instance', () => summon()) // relancer le raccourci = l'appeler à côté de la souris
  app.on('before-quit', () => { dataDirty = true; try { fs.writeFileSync(DATA_PATH, JSON.stringify(data)) } catch {} })
  app.on('will-quit', () => globalShortcut.unregisterAll())

  setTimeout(() => checkUpdate(), 15000); setInterval(() => checkUpdate(), 6 * 3600e3)
  // défis déjà réussis mais jamais fêtés (ex. atteints avant que le défi existe) : on les fête maintenant
  setTimeout(() => new Set(Object.values(Sprites.ACHIEVEMENTS).map(a => a.stat)).forEach(checkAchievements), 7000)
  if (!cfg.welcomed) setTimeout(() => { // 1er lancement : petit mot d'accueil
    say('Salut ! Je suis ton pet Claude 👋 Fais un clic droit sur moi pour tout régler.')
    cfg.welcomed = true; saveCfg()
  }, 2500)
}

if (process.argv.includes('--uninstall')) {
  app.whenReady().then(() => { app.setLoginItemSettings({ ...login, openAtLogin: false }); console.log('Lancement au démarrage retiré.'); app.quit() })
} else if (!app.requestSingleInstanceLock()) app.quit()
else app.whenReady().then(start)
