// Le petit bonhomme pixel de Claude Code, dessiné en code et partagé entre la fenêtre (canvas) et l'icône du tray.
// Grille d'origine : corps 12x8 blocs, yeux 1x2, bras 2x2, pattes 1x2 — ici 1 bloc = 2 gros pixels.
const PAL = {
  out: '#4a1c10', white: '#ffffff', cheek: '#f4a3a0', star: '#ffb54d', starHi: '#fff4d1', alert: '#ff4d3a',
  lap: '#454c5c', lapHi: '#6b7590',
}
const SKINS = {
  claude: { label: 'Claude', body: '#d97757', bright: '#ec8a66', dim: '#a06a52', eye: '#1f1410' },
  menthe: { label: 'Menthe', body: '#4fbf9f', bright: '#6fd8b8', dim: '#3b8a74', eye: '#10241f' },
  lavande: { label: 'Lavande', body: '#9b87e0', bright: '#b3a3f0', dim: '#6f5fa8', eye: '#1a1430' },
  dore: { label: 'Doré', body: '#e6b84a', bright: '#f5cd63', dim: '#a8863a', eye: '#2a1d05' },
  nuit: { label: 'Nuit', body: '#3d4a6b', bright: '#53628a', dim: '#2a3349', eye: '#e8f0ff' },
  fantome: { label: 'Fantôme', body: 'rgba(225,232,250,.8)', bright: 'rgba(245,248,255,.9)', dim: 'rgba(190,200,225,.6)', eye: '#2a3550' },
  arcenciel: { label: 'Arc-en-ciel 🌈', body: '#d97757', bright: '#ec8a66', dim: '#a06a52', eye: '#1f1410', rainbow: true },
  cerise: { label: 'Cerise 🍒', body: '#d9465a', bright: '#ec6274', dim: '#9c3343', eye: '#2a0d12' },
  ocean: { label: 'Océan 🌊', body: '#3d8fd9', bright: '#5aa8ec', dim: '#2c679c', eye: '#0c1a2a' },
  citron: { label: 'Citron 🍋', body: '#e8d24a', bright: '#f5e36a', dim: '#a89834', eye: '#2a2405' },
  chocolat: { label: 'Chocolat 🍫', body: '#7a4e33', bright: '#94633f', dim: '#573826', eye: '#fff2dc' },
  bonbon: { label: 'Bonbon 🍬', body: '#ff9ccf', bright: '#ffb8de', dim: '#c875a2', eye: '#3a1028' },
  galaxie: { label: 'Galaxie 🌌', body: '#2b2350', bright: '#3a3070', dim: '#1e1838', eye: '#e8f0ff', galaxy: true },
  or: { label: 'Or massif ✨', body: '#e8b923', bright: '#ffd54a', dim: '#a8841a', eye: '#2a1d05', shine: true },
}
const HATS = {
  aucun: 'Aucun', chapeau: 'Haut-de-forme 🎩', casquette: 'Casquette 🧢', couronne: 'Couronne 👑',
  lunettes: 'Lunettes de soleil 😎', casque: 'Casque audio 🎧', noeud: 'Nœud 🎀', fleur: 'Fleur 🌸',
  sorcier: 'Chapeau de sorcier 🧙', pirate: 'Chapeau de pirate 🏴‍☠️', cowboy: 'Chapeau de cowboy 🤠', viking: 'Casque viking ⚔️',
  helice: 'Casquette à hélice 🚁', chat: 'Oreilles de chat 🐱', aureole: 'Auréole 😇', fete: 'Chapeau de fête 🥳',
  chef: 'Toque de chef 👨‍🍳', ninja: 'Bandeau ninja 🥷', astronaute: 'Casque d’astronaute 👨‍🚀', licorne: 'Corne de licorne 🦄',
}
const EXTRAS = {
  aucun: 'Aucun', cape: 'Cape de héros 🦸', ailes: "Ailes d'ange 🪽", jetpack: 'Jetpack 🚀', sac: 'Sac à dos 🎒',
  echarpe: 'Écharpe 🧣', moustache: 'Moustache 🥸', papillon: 'Nœud papillon 🤵', aura: 'Aura mystique 🔮',
}
const TRAILS = { aucune: 'Aucune', etoiles: 'Étoiles ✨', coeurs: 'Cœurs 💕', arcenciel: 'Arc-en-ciel 🌈', bulles: 'Bulles 🫧', feu: 'Feu 🔥', paillettes: 'Paillettes 🪩' }
// Déblocages. Au départ : claude, menthe, lavande, océan, casquette, nœud, fleur, écharpe, étoiles.
// Le reste se débloque avec les niveaux (LOCKS) ou avec des succès (ACHIEVEMENTS).
const LOCKS = {
  'skin:cerise': 2, 'hat:chapeau': 2, 'hat:astronaute': 3, 'trail:coeurs': 3, 'skin:citron': 4, 'extra:moustache': 4,
  'skin:or': 5, 'hat:lunettes': 5, 'hat:casque': 6, 'trail:bulles': 6, 'extra:aura': 7, 'skin:bonbon': 7,
  'hat:sorcier': 8, 'extra:cape': 8, 'trail:paillettes': 9, 'skin:chocolat': 9, 'hat:licorne': 10, 'extra:ailes': 10,
  'hat:pirate': 11, 'skin:nuit': 11, 'hat:cowboy': 12, 'trail:feu': 12, 'extra:jetpack': 13, 'skin:dore': 13,
  'hat:viking': 14, 'extra:papillon': 14, 'skin:galaxie': 15, 'hat:couronne': 15, 'hat:helice': 16, 'skin:fantome': 17,
  'hat:aureole': 18, 'skin:arcenciel': 20, 'trail:arcenciel': 20,
}
// stat = total dans stats.json (ou 'bugRecord' = record de la chasse aux bugs)
const ACHIEVEMENTS = {
  'hat:chat': { stat: 'pets', n: 50, label: 'chatouilles', how: 'Frotte ta souris sur lui' },
  'hat:fete': { stat: 'clicks', n: 100, label: 'caresses', how: 'Clique sur lui' },
  'hat:chef': { stat: 'cookies', n: 20, label: 'cookies mangés', how: 'Clic droit → Jouer → Donner un cookie' },
  'hat:ninja': { stat: 'bugRecord', n: 40, label: 'bugs en une partie', how: 'Clic droit → Jouer → Chasse aux bugs' },
  'extra:sac': { stat: 'done', n: 25, label: 'tâches de Claude finies', how: 'Chaque tâche finie par Claude compte' },
}
const TITLES = ['Pixel tout neuf', 'Petit compagnon', 'Explorateur du bureau', 'Copain fidèle', 'Pet en or', 'Gardien des sessions',
  'Aura mystique', 'Apprenti sorcier', 'Pro du pixel', 'Licorne en herbe', 'Pirate du code', 'Shérif du bureau', 'Pilote de jetpack',
  'Viking du terminal', 'Empereur galactique', 'As de l’hélice', 'Esprit farceur', 'Ange gardien', 'Légende vivante', 'Licorne suprême']
// Pourquoi un cosmétique est verrouillé (null = disponible). p = { level, totals, bugRecord }
function lockInfo(key, val, p) {
  const k = `${key}:${val}`, lvl = LOCKS[k], a = ACHIEVEMENTS[k]
  if (lvl && p.level < lvl) return { kind: 'level', need: lvl, short: `🔒 Niveau ${lvl}`, text: `niveau ${lvl}` }
  if (a) {
    const have = a.stat === 'bugRecord' ? p.bugRecord : p.totals[a.stat] || 0
    if (have < a.n) return { kind: 'defi', have, n: a.n, how: a.how, short: `🏅 ${have}/${a.n} ${a.label}`, text: `${a.n} ${a.label}` }
  }
  return null
}
const ACTIVITIES = {
  skate: 'Skate 🛹', guitar: 'Guitare 🎸', gum: 'Chewing-gum 🫧', read: 'Lecture 📖', fish: 'Pêche 🎣', yoyo: 'Yo-yo 🪀', butterfly: 'Papillon 🦋',
}
const BITS = {
  bang: ['11', '11', '11', '11', '  ', '11'],
  z: ['1111', '  1 ', ' 1  ', '1111'],
  heart: ['11 11', '11111', '11111', ' 111 ', '  1  '],
  note: ['  11', '  1 ', '  1 ', '111 ', '111 '],
  spark: [' 1 ', '111', ' 1 '],
  logo: ['1 1', ' 1 ', '1 1'],
}

function px(g, c, x, y, w = 1, h = 1) { g.fillStyle = c; g.fillRect(x, y, w, h) }
function bits(g, rows, x, y, c, o) {
  const each = f => rows.forEach((r, j) => [...r].forEach((b, i) => b === '1' && f(x + i, y + j)))
  if (o) each((i, j) => px(g, o, i - 1, j - 1, 3, 3))
  each((i, j) => px(g, c, i, j))
}

// Union d'ellipses avec contour, ombre et reflet (nuage, balle, cookie).
function blob(g, ells, [out, body, shade, hi]) {
  const [cx, cy, rx, ry] = ells[0]
  const inside = (x, y) => ells.some(([ex, ey, erx, ery]) => ((x + .5 - ex) / erx) ** 2 + ((y + .5 - ey) / ery) ** 2 <= 1)
  for (let y = Math.floor(cy - 2 * ry); y <= cy + 2 * ry; y++) for (let x = Math.floor(cx - 2 * rx); x <= cx + 2 * rx; x++) {
    if (!inside(x, y)) continue
    const nx = (x + .5 - cx) / rx, ny = (y + .5 - cy) / ry
    let c = body
    if (!inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1)) c = out
    else if (nx * .5 + ny > .62) c = shade
    else if ((nx + .42) ** 2 + (ny + .5) ** 2 < .05) c = hi
    px(g, c, x, y)
  }
}

function basePose() {
  return { sx: 1, sy: 1, bob: 0, dx: 0, look: 0, face: 1, eyes: 'open', arms: 'down', armPh: 0, feet: [0, 0], t: 0,
    sit: false, laptop: false, tint: 'body', bang: false, think: 0, blush: false, skin: SKINS.claude, hat: 'aucun', extra: 'aucun' }
}

// Géométrie du corps (partagée avec les accessoires d'activité).
function geom(cx, fy, P) {
  const fy0 = fy
  cx += P.dx; fy += P.bob
  const bw = Math.round(12 * P.sx) * 2, bh = Math.round(16 * P.sy), legH = P.sit ? 1 : 4
  const bl = cx - bw / 2, br = bl + bw, bb = fy - legH, bt = bb - bh
  return { cx, fy, fy0, bw, bh, legH, bl, br, bb, bt, ay: bt + (bh >> 1), ey: bt + 4 }
}

// cx = centre, fy = ligne du sol sous les pattes.
function drawPet(g, cx0, fy0, P) {
  const G = geom(cx0, fy0, P), { cx, fy, bw, bh, legH, bl, br, bb, bt, ay } = G
  const K = P.skin, body = K[P.tint]

  extra(g, P, G, 'back')
  // 4 pattes, les paires (1-3, 2-4) alternent en marchant
  ;[2, 6, bw - 8, bw - 4].forEach((o, i) => px(g, body, bl + o, bb, 2, legH + P.feet[i % 2]))
  px(g, body, bl, bt, bw, bh)
  if (K.shine) { // reflet qui balaie le corps en or
    const x0 = bl - 8 + Math.floor((P.t * 22) % (bw + 30))
    for (let y = bt; y < bb; y++) { const x = x0 + ((y - bt) >> 1); if (x >= bl && x + 2 <= br) px(g, 'rgba(255,250,220,.6)', x, y, 2, 1) }
  }
  if (K.galaxy) for (let i = 0; i < 9; i++) { // étoiles qui scintillent sur le corps
    const on = (Math.floor(P.t * 2) + i) % 3
    if (on) px(g, on === 1 ? '#ffffff' : '#b9a8ff', bl + 1 + (i * 7) % (bw - 2), bt + 1 + (i * 5) % (bh - 2))
  }

  // bras
  const arm = (side, mode) => {
    const x = side < 0 ? bl - 4 : br
    if (mode === 'up') px(g, body, x, bt - 2, 4, 4)
    else if (mode === 'type') px(g, body, side < 0 ? cx - 6 : cx + 2, fy - 9 + (side < 0 ? P.armPh : 1 - P.armPh), 4, 2)
    else px(g, body, x, ay + (mode === 'flap' ? (side < 0 ? P.armPh : 1 - P.armPh) * 2 - 1 : 0), 4, 4)
  }
  const [aL, aR] = P.arms === 'wave' ? (P.armPh ? ['up', 'down'] : ['down', 'up']) : [P.arms, P.arms]
  if (P.arms !== 'type') { arm(-1, aL); arm(1, aR) }

  // yeux
  const ey = bt + 4, E = K.eye
  for (const x of [bl + 4 + P.look, br - 6 + P.look]) {
    if (P.eyes === 'open') px(g, E, x, ey, 2, 4)
    else if (P.eyes === 'wide') { px(g, E, x, ey - 1, 2, 5); px(g, PAL.white, x, ey - 1) }
    else if (P.eyes === 'down') px(g, E, x, ey + 2, 2, 3)
    else if (P.eyes === 'closed') px(g, E, x, ey + 3, 2, 1)
    else if (P.eyes === 'happy') { px(g, E, x, ey + 1, 2, 1); px(g, E, x - 1, ey + 2); px(g, E, x + 2, ey + 2) }
    else if (P.eyes === 'sad') { px(g, E, x, ey + 2, 2, 2); px(g, E, x === bl + 4 + P.look ? x + 1 : x, ey + 1) } // yeux tristes (coin intérieur relevé)
    else if (P.eyes === 'x') { px(g, E, x - 1, ey); px(g, E, x + 2, ey); px(g, E, x, ey + 1, 2, 2); px(g, E, x - 1, ey + 3); px(g, E, x + 2, ey + 3) }
  }
  if (P.blush) { px(g, PAL.cheek, bl + 2 + P.look, ey + 5, 3, 1); px(g, PAL.cheek, br - 7 + P.look, ey + 5, 3, 1) }

  extra(g, P, G, 'front')
  hat(g, P.hat, { cx, bl, br, bw, bt, ey, face: P.face, t: P.t, body })

  // ordi portable (vu de dos, petit logo) + bras qui tapent dessus
  if (P.laptop) {
    px(g, PAL.lap, cx - 8, fy - 7, 16, 5); px(g, PAL.lapHi, cx - 8, fy - 7, 16, 1)
    bits(g, BITS.logo, cx - 1, fy - 5, P.tint === 'bright' ? PAL.starHi : PAL.star)
    px(g, PAL.lapHi, cx - 11, fy - 2, 22, 2)
  }
  if (P.arms === 'type') { arm(-1, 'type'); arm(1, 'type') }

  // réflexion / alerte
  for (let i = 0; i < P.think; i++) bits(g, ['1'], br + 3 + i * 3, bt - 3 - i * 2, PAL.white, PAL.out)
  if (P.bang) bits(g, BITS.bang, br + 3, bt - 8, PAL.alert, PAL.out)
}

function hat(g, h, { cx, bl, br, bw, bt, ey, face, t, body }) {
  const D = '#1d1d24', f = n => Math.floor(t * n)
  switch (h) {
    case 'sorcier': {
      px(g, '#3b2370', cx - 9, bt - 2, 18, 2)
      for (let j = 0; j < 11; j++) { const hw = Math.max(0, Math.round(5 - j * .45)), lean = j > 7 ? face * (j - 7) : 0; px(g, '#4b2a8a', cx - hw + lean, bt - 3 - j, hw * 2 + 1, 1) }
      px(g, '#ffd34d', cx - 3, bt - 5); px(g, '#ffd34d', cx + 2, bt - 8); px(g, '#fff4c2', cx - 1, bt - 10); px(g, '#7a5cc2', cx - 5, bt - 4, 11, 1)
      break
    }
    case 'pirate':
      px(g, D, cx - 9, bt - 3, 18, 3); px(g, D, cx - 6, bt - 6, 12, 3); px(g, D, cx - 3, bt - 8, 6, 2); px(g, '#c99a1a', cx - 9, bt - 1, 18, 1)
      px(g, PAL.white, cx - 1, bt - 6, 3, 2); px(g, D, cx, bt - 5); px(g, PAL.white, cx - 2, bt - 4); px(g, PAL.white, cx + 2, bt - 4)
      break
    case 'cowboy':
      px(g, '#8b5a2b', cx - 10, bt - 2, 20, 2); px(g, '#8b5a2b', cx - 11, bt - 3); px(g, '#8b5a2b', cx + 10, bt - 3)
      px(g, '#a0693a', cx - 5, bt - 8, 10, 6); px(g, '#7a4a22', cx - 1, bt - 8, 2, 1); px(g, '#3a2414', cx - 5, bt - 3, 10, 1)
      break
    case 'viking':
      px(g, '#8a929c', cx - 6, bt - 4, 12, 4); px(g, '#8a929c', cx - 4, bt - 6, 8, 2); px(g, '#b8c0ca', cx - 3, bt - 6, 3, 1)
      px(g, '#c99a1a', cx - 6, bt - 1, 12, 1); px(g, '#c99a1a', cx, bt - 6, 1, 6)
      px(g, '#f2ead8', cx - 9, bt - 5, 3, 2); px(g, '#f2ead8', cx - 10, bt - 8, 2, 3); px(g, '#f2ead8', cx + 6, bt - 5, 3, 2); px(g, '#f2ead8', cx + 8, bt - 8, 2, 3)
      break
    case 'helice': // casquette à hélice qui tourne
      px(g, '#e0453a', cx - 6, bt - 4, 6, 4); px(g, '#2f6fd0', cx, bt - 4, 6, 4); px(g, '#ffd34d', cx - 6, bt - 1, 12, 1)
      px(g, '#5a5a66', cx, bt - 7, 1, 3)
      if (f(10) % 2) px(g, '#3aa05a', cx - 6, bt - 8, 13, 1); else px(g, '#3aa05a', cx - 2, bt - 8, 5, 1)
      break
    case 'chat': // oreilles de chat (de la couleur du corps)
      for (const [x, d] of [[bl + 1, 1], [br - 6, -1]]) {
        px(g, body, x, bt - 1, 5, 1); px(g, body, x + (d > 0 ? 0 : 1), bt - 2, 4, 1); px(g, body, x + (d > 0 ? 0 : 2), bt - 3, 3, 1); px(g, body, x + (d > 0 ? 0 : 4), bt - 4)
        px(g, PAL.cheek, x + (d > 0 ? 1 : 2), bt - 2, 2, 1)
      }
      break
    case 'aureole': { // flotte au-dessus de sa tête
      const y = bt - 7 + Math.round(Math.sin(t * 3))
      px(g, '#ffd34d', cx - 4, y, 8, 1); px(g, '#ffd34d', cx - 4, y + 2, 8, 1); px(g, '#ffd34d', cx - 6, y + 1, 2, 1); px(g, '#ffd34d', cx + 4, y + 1, 2, 1)
      px(g, '#fff4c2', cx - 2, y, 3, 1)
      break
    }
    case 'fete':
      for (let j = 0; j < 9; j++) { const hw = Math.max(0, Math.round(4 - j * .45)); px(g, (j >> 1) % 2 ? '#ffd34d' : '#ff6fa8', cx - hw, bt - 1 - j, hw * 2 + 1, 1) }
      px(g, '#7fd1b9', cx - 1, bt - 12, 3, 2); px(g, '#2f6fd0', cx - 2, bt - 3); px(g, '#3aa05a', cx + 1, bt - 6)
      break
    case 'chef':
      px(g, PAL.white, cx - 5, bt - 4, 10, 4); px(g, '#e6e6ee', cx - 5, bt - 1, 10, 1)
      px(g, PAL.white, cx - 7, bt - 9, 14, 5); px(g, PAL.white, cx - 5, bt - 10, 10, 1); px(g, '#e6e6ee', cx - 7, bt - 5, 14, 1)
      break
    case 'ninja': { // bandeau rouge, les pans flottent derrière
      px(g, '#d63a3a', bl, bt + 1, bw, 2); px(g, '#a82a2a', bl, bt + 2, bw, 1)
      const x = face > 0 ? bl - 1 : br, d = face > 0 ? -1 : 1, w = f(6) % 2
      px(g, '#d63a3a', x + (d < 0 ? -2 : 0), bt + 1, 3, 1); px(g, '#d63a3a', x + d * 3 + (d < 0 ? -2 : 0), bt + 2 + w, 3, 1)
      break
    }
    case 'astronaute': // bulle de verre + antenne
      px(g, 'rgba(190,225,255,.32)', bl - 2, bt - 6, bw + 4, 18)
      px(g, '#e8eef5', bl - 2, bt - 6, bw + 4, 1); px(g, '#e8eef5', bl - 2, bt - 6, 1, 18); px(g, '#e8eef5', br + 1, bt - 6, 1, 18)
      px(g, '#c3ccd6', bl - 3, bt + 11, bw + 6, 2); px(g, '#ffffff', bl + 1, bt - 4, 4, 1); px(g, '#ffffff', bl, bt - 3, 1, 2)
      px(g, '#9aa3ad', cx, bt - 9, 1, 3); px(g, f(2) % 2 ? '#ff4d3a' : '#ff9a8a', cx, bt - 10)
      break
    case 'licorne': // corne torsadée arc-en-ciel
      for (let j = 0; j < 10; j++) { const w = j < 4 ? 3 : j < 8 ? 2 : 1; px(g, ['#ff8fc8', '#ffd34d', '#7fd1ff', '#b98cff'][(j + f(6)) % 4], cx - (w >> 1), bt - 1 - j, w, 1) }
      px(g, '#ffffff', cx, bt - 11)
      break
    case 'citrouille': // Halloween
      px(g, '#e8792a', cx - 6, bt - 6, 12, 6); px(g, '#e8792a', cx - 5, bt - 7, 10, 1); px(g, '#c45f1c', cx - 2, bt - 6, 1, 6); px(g, '#c45f1c', cx + 2, bt - 6, 1, 6)
      px(g, '#3aa05a', cx - 1, bt - 9, 2, 2); px(g, '#2a1a10', cx - 4, bt - 5, 2, 1); px(g, '#2a1a10', cx + 2, bt - 5, 2, 1); px(g, '#2a1a10', cx - 3, bt - 3, 6, 1)
      break
    case 'noel': // bonnet de Noël
      px(g, '#d63a3a', cx - 6, bt - 5, 12, 3); px(g, '#d63a3a', cx - 4, bt - 7, 9, 2); px(g, '#d63a3a', cx + 2, bt - 8, 5, 1); px(g, '#d63a3a', cx + 6, bt - 7, 2, 3)
      px(g, PAL.white, cx + 6, bt - 4, 3, 3); px(g, PAL.white, cx - 7, bt - 2, 14, 2)
      break
    case 'chapeau':
      px(g, D, cx - 7, bt - 2, 14, 2); px(g, D, cx - 5, bt - 11, 10, 9); px(g, '#c0392b', cx - 5, bt - 5, 10, 2); px(g, '#3a3a48', cx - 4, bt - 10, 1, 4)
      break
    case 'casquette':
      px(g, '#2f6fd0', cx - 7, bt - 4, 14, 4); px(g, '#5a95f0', cx - 6, bt - 4, 10, 1); px(g, PAL.white, cx - 1, bt - 5, 2, 1)
      px(g, '#2556a8', face < 0 ? cx - 13 : cx + 7, bt - 2, 6, 2)
      break
    case 'couronne':
      px(g, '#ffd34d', cx - 6, bt - 3, 12, 3); px(g, '#c99a1a', cx - 6, bt - 1, 12, 1)
      for (const o of [-6, -1, 4]) px(g, '#ffd34d', cx + o, bt - 6, 2, 3)
      px(g, '#e0453a', cx - 1, bt - 2, 2, 1); px(g, '#3aa0e0', cx - 4, bt - 2); px(g, '#3aa0e0', cx + 3, bt - 2)
      break
    case 'lunettes':
      px(g, '#111', bl + 1, ey, bw - 2, 1); px(g, '#111', bl + 3, ey, 4, 3); px(g, '#111', br - 7, ey, 4, 3)
      px(g, '#9fd3ff', bl + 4, ey + 1); px(g, '#9fd3ff', br - 6, ey + 1)
      break
    case 'casque':
      px(g, D, bl, bt - 2, bw, 2); px(g, D, bl - 1, bt - 1, 1, ey - bt); px(g, D, br, bt - 1, 1, ey - bt)
      px(g, D, bl - 2, ey - 1, 3, 5); px(g, D, br - 1, ey - 1, 3, 5); px(g, '#e0453a', bl - 2, ey, 1, 3); px(g, '#e0453a', br + 1, ey, 1, 3)
      break
    case 'noeud':
      bits(g, ['11 11', '11111', '11 11'], br - 8, bt - 3, '#ff6fa8'); px(g, '#c8407e', br - 6, bt - 2)
      break
    case 'bonnet': // bonnet de nuit (mode nuit)
      px(g, '#3a4fa0', cx - 6, bt - 5, 12, 3); px(g, '#3a4fa0', cx - 3, bt - 7, 9, 2); px(g, '#3a4fa0', cx + 3, bt - 8, 5, 1)
      px(g, '#3a4fa0', cx + 7, bt - 7, 2, 3); px(g, PAL.white, cx + 7, bt - 4, 3, 3); px(g, '#e8ecf8', cx - 7, bt - 2, 14, 2)
      px(g, '#ffd34d', cx - 3, bt - 4); px(g, '#ffd34d', cx + 2, bt - 6)
      break
    case 'fleur':
      bits(g, [' 1 ', '111', ' 1 '], bl + 3, bt - 5, '#ff8fc8'); px(g, '#ffd34d', bl + 4, bt - 4); px(g, '#3aa05a', bl + 4, bt - 2, 1, 2)
      break
  }
}

// Accessoires du 2e emplacement : 'back' = dessinés derrière le corps, 'front' = devant.
function extra(g, P, { cx, fy, bl, br, bw, bt, bb, ay }, layer) {
  const t = P.t, f = n => Math.floor(t * n), back = P.face > 0 ? -1 : 1 // côté opposé à son regard
  if (layer === 'back') switch (P.extra) {
    case 'aura': { // halo qui pulse autour de lui
      const a = (.22 + .18 * Math.sin(t * 3)).toFixed(2)
      px(g, `rgba(150,120,255,${a})`, bl - 3, bt - 3, bw + 6, bb - bt + 6); px(g, `rgba(120,200,255,${a})`, bl - 1, bt - 1, bw + 2, bb - bt + 2)
      break
    }
    case 'cape': // flotte derrière lui, plus fort quand il bouge
      for (let j = 0; j < bb - bt; j++) {
        const w = 3 + Math.round(j / 4) + Math.round(Math.sin(t * (P.moving ? 14 : 4) + j * .6))
        px(g, j < 2 ? '#8e2a20' : '#c0392b', back < 0 ? bl - w : br, bt + 2 + j, w, 1)
      }
      break
    case 'ailes': { // battent doucement
      const up = f(5) % 2
      for (const s of [-1, 1]) {
        const x = s < 0 ? bl - 7 : br + 1
        px(g, '#ffffff', x, bt + 1 - up, 6, 3); px(g, '#e3eaf7', x + (s < 0 ? 1 : 0), bt + 4 - up, 5, 2); px(g, '#c9d4e8', x + (s < 0 ? 3 : 0), bt + 6 - up, 3, 1)
      }
      break
    }
    case 'jetpack': {
      const x = back < 0 ? bl - 5 : br + 1
      px(g, '#8a929c', x, bt + 3, 4, 9); px(g, '#b8c0ca', x + 1, bt + 3, 1, 9); px(g, '#e0453a', x, bt + 5, 4, 1)
      if (P.moving || P.air) { const fl = f(12) % 2; px(g, '#ff8a2a', x, bt + 12, 4, 2 + fl); px(g, '#ffd34d', x + 1, bt + 12, 2, 3 + fl) }
      break
    }
    case 'sac':
      px(g, '#3f7f5f', back < 0 ? bl - 4 : br, bt + 4, 4, 9); px(g, '#2f6047', back < 0 ? bl - 4 : br, bt + 8, 4, 1)
      break
  }
  else switch (P.extra) {
    case 'echarpe':
      px(g, '#3aa0e0', bl, bt + 9, bw, 2); for (let i = 2; i < bw; i += 4) px(g, PAL.white, bl + i, bt + 9, 1, 2)
      px(g, '#3aa0e0', back < 0 ? bl + 2 : br - 4, bt + 11, 2, 5 + (f(4) % 2)); px(g, PAL.white, back < 0 ? bl + 2 : br - 4, bt + 13, 2, 1)
      break
    case 'moustache': {
      const x = cx + P.look
      px(g, '#3a2414', x - 4, bt + 9, 8, 1); px(g, '#3a2414', x - 5, bt + 8); px(g, '#3a2414', x + 4, bt + 8); px(g, '#3a2414', x - 6, bt + 7); px(g, '#3a2414', x + 5, bt + 7)
      break
    }
    case 'papillon':
      bits(g, ['1   1', '11 11', '11111', '11 11', '1   1'], cx - 2, bb - 7, '#e0453a'); px(g, '#a82a2a', cx, bb - 5)
      break
  }
}

// Accessoires des activités (skate, guitare…), dessinés devant le pet. at = secondes depuis le début, dur = durée totale.
function drawActivity(g, P, G, K) {
  const { cx, fy, fy0, bl, br, bt, ay } = G, t = P.t, f = n => Math.floor(t * n)
  switch (P.activity) {
    case 'skate':
      px(g, '#e0453a', cx - 13, fy0 - 3, 26, 2); px(g, '#9b2c22', cx - 13, fy0 - 2, 26, 1); px(g, '#e0453a', cx - 14, fy0 - 4); px(g, '#e0453a', cx + 13, fy0 - 4)
      px(g, '#222', cx - 10, fy0 - 1, 3, 2); px(g, '#222', cx + 7, fy0 - 1, 3, 2); px(g, '#ddd', cx - 9, fy0 - 1); px(g, '#ddd', cx + 8, fy0 - 1)
      break
    case 'guitar':
      px(g, '#c27a3a', cx - 8, fy - 8, 9, 6); px(g, '#c27a3a', cx - 7, fy - 9, 7, 1); px(g, '#5a3418', cx - 5, fy - 6, 2, 2)
      for (let i = 0; i < 10; i++) px(g, '#6b4423', cx + 1 + i, fy - 8 - (i >> 1), 1, 2)
      px(g, '#3a2414', cx + 10, fy - 14, 3, 2)
      px(g, K.body, cx - 5 + f(8) % 2, fy - 11, 3, 2) // main qui gratte
      break
    case 'gum': { // bulle rose qui gonfle puis éclate (toutes les 3 s)
      const r = 1 + (t % 3) / 3 * 6
      if (r > 1.5) blob(g, [[cx + .5, bt + 12, r, r]], ['#c2457f', '#ff8fc8', '#e86aa8', '#ffd1e8'])
      break
    }
    case 'read':
      px(g, '#2f6fd0', cx - 7, fy - 9, 14, 7); px(g, '#1f4f9f', cx, fy - 9, 1, 7); px(g, '#ffd34d', cx - 5, fy - 7, 4, 1); px(g, '#ffd34d', cx + 2, fy - 7, 4, 1)
      if (t % 3 < .3) px(g, PAL.white, cx - 6 + Math.floor((t % 3) / .3 * 6), fy - 10, 6, 1) // il tourne une page
      break
    case 'yoyo': {
      const hx = br + 2, hy = ay + 1, len = 2 + Math.round(Math.abs(Math.sin(t * 3.5)) * 12)
      px(g, '#dddddd', hx, hy, 1, len); px(g, '#e0453a', hx - 1, hy + len, 3, 3); px(g, '#ff8a7a', hx - 1, hy + len)
      break
    }
    case 'fish': {
      for (let i = 0; i < 13; i++) px(g, '#6b4423', br + 1 + i, ay - 1 - Math.round(i * .8))
      const tx = br + 13, ty = ay - 11
      if (P.at > P.dur - 2.2) { // un poisson au bout de la ligne !
        px(g, '#cfd8e3', tx, ty, 1, 5); const w = f(10) % 2
        px(g, '#3aa0e0', tx - 2, ty + 5, 5, 3); px(g, '#6fc3f0', tx - 1, ty + 5, 2, 1); px(g, '#2a7ab8', tx - 1 + w, ty + 8, 3, 2); px(g, '#111', tx + 1, ty + 6)
      } else {
        px(g, '#cfd8e3', tx, ty, 1, fy0 - ty - 2)
        const b = Math.round(Math.sin(t * 3)); px(g, '#e0453a', tx - 1, fy0 - 3 + b, 3, 1); px(g, PAL.white, tx - 1, fy0 - 2 + b, 3, 1)
      }
      break
    }
    case 'butterfly': {
      const bx = cx + P.face * 16 + Math.round(Math.sin(t * 1.7) * 6), by = bt - 7 + Math.round(Math.sin(t * 2.3) * 4), o = f(8) % 2
      if (o) { px(g, '#b98cff', bx - 3, by - 1, 3, 3); px(g, '#b98cff', bx + 1, by - 1, 3, 3); px(g, '#ffd1f0', bx - 2, by, 1, 1); px(g, '#ffd1f0', bx + 2, by, 1, 1) }
      else { px(g, '#b98cff', bx - 2, by, 2, 2); px(g, '#b98cff', bx + 1, by, 2, 2) }
      px(g, '#3a2414', bx, by - 1, 1, 3)
      break
    }
  }
}

// Visiteurs : petits personnages qui passent dire bonjour. cx = centre, fy = sol, face = 1 (regarde à droite) / -1.
const VISITOR_LOOKS = {
  chat: '🐱', fantome: '👻', robot: '🤖', poussin: '🐥', escargot: '🐌', cousin: '👾',
}
function drawVisitor(g, kind, cx, fy, t, face, walking) {
  const f = n => Math.floor(t * n), step = walking ? f(8) % 2 : 0, flip = x => face > 0 ? x : -x - 1 // dessine "vers la droite" puis retourne
  const P = (c, x, y, w = 1, h = 1) => { for (let i = 0; i < w; i++) px(g, c, cx + flip(x + i), y, 1, h) }
  switch (kind) {
    case 'chat': {
      const B = '#e8a04a', D = '#b8742a', y = fy - 10
      P(B, -8, y, 13, 6); P(D, -8, y + 1, 3, 1); P(D, -2, y + 1, 3, 1) // corps + rayures
      P(B, 3, y - 5, 7, 6); P(B, 3, y - 7, 2, 2); P(B, 8, y - 7, 2, 2) // tête + oreilles
      P('#1f1410', 5, y - 3, 1, 2); P('#1f1410', 8, y - 3, 1, 2); P('#f4a3a0', 6, y - 1, 2, 1) // yeux, nez
      P(B, -10, y - 3 + (f(4) % 2), 2, 4); P(B, -11, y - 5 + (f(4) % 2), 2, 3) // queue qui remue
      for (const [x, s] of [[-7, step], [-4, 1 - step], [1, step], [3, 1 - step]]) P(D, x, y + 6, 2, 4 - s)
      break
    }
    case 'fantome': {
      const y = fy - 18 + Math.round(Math.sin(t * 3) * 2), W = 'rgba(240,244,255,.9)'
      P(W, -6, y + 2, 12, 10); P(W, -4, y, 8, 2)
      for (let i = 0; i < 4; i++) P(W, -6 + i * 3, y + 12, 2, 1 + ((i + f(6)) % 2)) // bas ondulé
      P('#2a3550', -2, y + 4, 2, 3); P('#2a3550', 2, y + 4, 2, 3); P('#2a3550', 0, y + 8, 2, 2)
      break
    }
    case 'robot': {
      const y = fy - 18, M = '#9aa3ad', L = '#c3ccd6'
      P(M, -5, y, 10, 7); P('#1d2d3a', -3, y + 2, 6, 3); P(f(3) % 2 ? '#7fd1ff' : '#3aa0e0', -2, y + 3, 1, 1); P(f(3) % 2 ? '#7fd1ff' : '#3aa0e0', 1, y + 3, 1, 1)
      P(M, 0, y - 3, 1, 3); P(f(2) % 2 ? '#ff4d3a' : '#ffd34d', 0, y - 4)
      P(L, -4, y + 7, 8, 7); P('#e0453a', -1, y + 9, 2, 2); P(M, -6, y + 8 + step, 2, 4); P(M, 4, y + 9 - step, 2, 4)
      P('#4b5262', -5, fy - 4, 10, 4); P('#2a2f3a', -4, fy - 2, 2, 2); P('#2a2f3a', 2, fy - 2, 2, 2)
      break
    }
    case 'poussin': {
      const y = fy - 11 - (walking ? step : 0), Y = '#ffd84a'
      blob(g, [[cx, y + 4, 5, 5]], ['#c9a227', Y, '#e8c23a', '#fff1a8'])
      P('#1f1410', 2, y + 2); P('#ff8a2a', 4, y + 3, 2, 1); P('#e8c23a', -3, y + 5, 2, 2)
      P('#ff8a2a', -2, fy - 2 + step, 1, 2); P('#ff8a2a', 1, fy - 2 - step + 1, 1, 2)
      break
    }
    case 'escargot': {
      const y = fy - 4
      P('#d8c28a', -7, y, 15, 3); P('#d8c28a', 6, y - 4, 2, 4); P('#1f1410', 7, y - 6, 1, 2); P('#1f1410', 5, y - 5, 1, 2) // corps + antennes
      blob(g, [[cx + flip(-1) + .5, y - 4, 5, 5]], ['#6b4423', '#b07a3a', '#8a5a2a', '#d49a52'])
      P('#6b4423', -2, y - 6, 3, 1); P('#6b4423', 0, y - 5, 1, 3)
      break
    }
  }
}

// Petit bug du mini-jeu (pattes qui gigotent).
function drawBug(g, x, y, f, c) {
  px(g, c, x - 2, y - 1, 5, 3); px(g, '#1d2d1d', x - 1, y - 3, 3, 2); px(g, '#ffffff', x - 1, y - 3); px(g, '#ffffff', x + 1, y - 3)
  px(g, '#1d2d1d', x, y - 1, 1, 3); px(g, '#1d2d1d', x - 1, y); px(g, '#1d2d1d', x + 1, y + 1)
  for (const d of [-3, 3]) { px(g, '#1d2d1d', x + d, y - 1 + f); px(g, '#1d2d1d', x + d, y + 1 - f) }
}

// Tente de camping (absence longue) : ses pattes dépassent de l'entrée, drapeau qui flotte, petit feu de camp.
function drawTent(g, cx, fy, t, skin) {
  const H = 22, half = 20
  for (let j = 0; j < H; j++) {
    const y = fy - H + j, hw = Math.round((j + 1) * half / H)
    px(g, '#2f6e4f', cx - hw, y, hw * 2 + 1, 1)
    px(g, '#3f8a63', cx - hw + 1, y, Math.max(0, hw - 2), 1) // pan éclairé
    px(g, '#1d4632', cx - hw, y, 1, 1); px(g, '#1d4632', cx + hw, y, 1, 1)
    if (j > 7) { const dw = Math.round((j - 7) * 6 / (H - 7)); px(g, '#10221a', cx - dw, y, dw * 2 + 1, 1) } // entrée
  }
  px(g, '#1d4632', cx - half - 1, fy, half * 2 + 3, 1)
  px(g, skin.body, cx - 4, fy - 2, 3, 2); px(g, skin.body, cx + 2, fy - 2, 3, 2) // ses petites pattes
  const wave = Math.floor(t * 3) % 2
  px(g, '#5a4632', cx, fy - H - 7, 1, 7); px(g, '#e0453a', cx + 1, fy - H - 7 + wave, 4, 3); px(g, '#ff7a66', cx + 1, fy - H - 7 + wave, 4, 1)
  const fx = cx + half + 9, fl = Math.floor(t * 8) % 3
  px(g, '#6b4423', fx - 4, fy - 2, 9, 2); px(g, '#4a2f18', fx - 3, fy - 1, 7, 1)
  px(g, '#ff8a2a', fx - 2, fy - 5 - (fl === 1 ? 1 : 0), 5, 3 + (fl === 1 ? 1 : 0))
  px(g, '#ffd34d', fx - 1, fy - 6 - (fl % 2), 3, 2); px(g, '#fff4c2', fx, fy - 7 - (fl === 2 ? 1 : 0))
}

// Objets de jeu, centrés en (x, y). ph = phase de rotation de la balle.
const SEAMS = [[[-2, -3], [-3, -2], [-3, -1], [2, 2], [3, 1], [3, 0]], [[-3, 2], [-2, 3], [-1, 3], [2, -3], [1, -3], [3, -2]]]
function drawProp(g, kind, x, y, ph) {
  if (kind === 'ball') {
    blob(g, [[x, y, 4.5, 4.5]], ['#4d5a10', '#d4e84a', '#a9bb2e', '#f4fbb0'])
    for (const [i, j] of SEAMS[ph % 2]) px(g, PAL.white, x + i, y + j)
  } else {
    blob(g, [[x, y, 4.5, 4]], ['#5a3412', '#d49a52', '#b07a3a', '#f0c27f'])
    for (const [i, j] of [[-2, -1], [1, -2], [2, 1], [-1, 2]]) px(g, '#4a2a12', x + i, y + j)
  }
}

// Niveau à partir de l'XP : niv. 2 à 50 XP, 3 à 150, 4 à 300, 5 à 500… (50 × n(n−1)/2)
const xpFor = lvl => 25 * lvl * (lvl - 1)
const levelOf = xp => { let l = 1; while (xp >= xpFor(l + 1)) l++; return l }
const titleOf = lvl => TITLES[Math.min(lvl, TITLES.length) - 1]

const Sprites = { PAL, SKINS, HATS, EXTRAS, TRAILS, ACTIVITIES, LOCKS, ACHIEVEMENTS, TITLES, lockInfo, xpFor, levelOf, titleOf, BITS, px, bits, blob, basePose, geom, drawPet, drawActivity, drawProp, drawTent, drawBug, drawVisitor, VISITOR_LOOKS }
if (typeof module === 'object') module.exports = Sprites
