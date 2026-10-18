// npm run release        → publie une nouvelle version (1.1.0 → 1.1.1) sur GitHub
// npm run release 1.2.0  → choisit le numéro
// Ton pote la reçoit ensuite via "🎁 Mettre à jour" dans le menu de son pet.
const { execSync } = require('child_process'), fs = require('fs'), path = require('path')
const run = cmd => execSync(cmd, { stdio: 'inherit', cwd: __dirname })
const file = path.join(__dirname, 'package.json'), pkg = JSON.parse(fs.readFileSync(file, 'utf8'))

run('npm test')
const [a, b, c] = pkg.version.split('.').map(Number)
pkg.version = process.argv[2] || `${a}.${b}.${c + 1}`
fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n')
run('git add -A')
run(`git commit -m "Version ${pkg.version}"`)
run('git push')
console.log(`\nVersion ${pkg.version} publiée ✓ Ton pote la verra au prochain démarrage de son pet (ou via 🔄 Vérifier les mises à jour).`)
