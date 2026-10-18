// Crée le raccourci "Claude Pet" sur le Bureau (lance le pet sans fenêtre de terminal).
const { execFileSync } = require('child_process'), path = require('path')
const q = s => s.replace(/'/g, "''") // apostrophes échappées pour PowerShell
const dir = __dirname, exe = path.join(dir, 'node_modules', 'electron', 'dist', 'electron.exe')
execFileSync('powershell', ['-NoProfile', '-NonInteractive', '-Command', `
  $s = (New-Object -ComObject WScript.Shell).CreateShortcut([Environment]::GetFolderPath('Desktop') + '\\Claude Pet.lnk')
  $s.TargetPath = '${q(exe)}'; $s.Arguments = '"${q(dir)}"'; $s.WorkingDirectory = '${q(dir)}'
  $s.IconLocation = '${q(path.join(dir, 'icon.ico'))}'; $s.Description = 'Claude Pet'; $s.Save()`])
console.log('Raccourci "Claude Pet" créé sur le Bureau.')
