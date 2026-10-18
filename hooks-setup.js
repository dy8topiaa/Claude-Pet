// node hooks-setup.js install   → ajoute les hooks de Pixou dans ~/.claude/settings.json
// node hooks-setup.js uninstall → les retire (le reste du fichier n'est jamais touché)
const fs = require('fs'), path = require('path'), os = require('os')

const mode = process.argv[2]
if (!['install', 'uninstall'].includes(mode)) { console.log('Usage : node hooks-setup.js install|uninstall'); process.exit(1) }

const file = path.join(os.homedir(), '.claude', 'settings.json')
const hook = path.join(__dirname, 'hook.js').replace(/\\/g, '/')
const command = `node "${hook}"`
const EVENTS = ['UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'PermissionRequest', 'Notification', 'Stop', 'StopFailure']
let cfg = {}
try { cfg = require('./config.json') } catch {}
// PermissionRequest attend ton clic sur la bulle (synchrone) ; tout le reste tourne en arrière-plan.
const hookFor = ev => ev === 'PermissionRequest'
  ? { type: 'command', command: `${command} --wait`, timeout: (cfg.approveSeconds || 30) + 10 }
  : { type: 'command', command, async: true, timeout: 5 }
const ours = h => /claude-pet\/hook\.js/.test(String(h.command || ''))

const exists = fs.existsSync(file)
const settings = exists ? JSON.parse(fs.readFileSync(file, 'utf8')) : {} // JSON invalide → on s'arrête sans rien écrire
if (exists) {
  const backup = `${file}.backup-${new Date().toISOString().replace(/[:.]/g, '-')}`
  fs.copyFileSync(file, backup)
  console.log('Sauvegarde :', backup)
}

// On retire toujours nos anciennes entrées d'abord (relancer install ne crée pas de doublons).
const hooks = settings.hooks || {}
for (const ev of Object.keys(hooks)) {
  hooks[ev] = hooks[ev].map(grp => grp.hooks?.some(ours) ? { ...grp, hooks: grp.hooks.filter(h => !ours(h)) } : grp)
    .filter(grp => !Array.isArray(grp.hooks) || grp.hooks.length)
  if (!hooks[ev].length) delete hooks[ev]
}
if (mode === 'install') for (const ev of EVENTS) (hooks[ev] ??= []).push({ hooks: [hookFor(ev)] })

if (Object.keys(hooks).length) settings.hooks = hooks
else delete settings.hooks
fs.mkdirSync(path.dirname(file), { recursive: true })
fs.writeFileSync(file, JSON.stringify(settings, null, 2) + '\n')
console.log(mode === 'install' ? `Hooks installés (${EVENTS.join(', ')}).` : 'Hooks de Pixou retirés.')
