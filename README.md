# Claude Pet

Le petit bonhomme pixel de Claude Code se balade en bas de ton écran et te prévient quand Claude a besoin de toi.

| Ce qui se passe dans Claude Code | Ce que fait le pet |
|---|---|
| Tu envoies un message / Claude utilise un outil | Il s'assoit devant son ordi et tape. Au-dessus de lui, en petit : l'icône de ce que fait Claude (💭 réfléchit, 🔍 lit, ✏️ écrit, 💻 commande, 🌐 web, 🤖 agent…) et le chrono du tour, par exemple `🔍 0:42`. `×2` s'ajoute si plusieurs sessions travaillent |
| Claude demande une autorisation | Bulle rouge avec l'outil et la commande, et les boutons **✓ Oui / ✓ Toujours / ✕ Non** pour répondre directement depuis le pet (voir plus bas) |
| Claude attend une autorisation, une réponse, ou te pose une question | Sans bouger de sa place : la même petite animation que « fini », avec un **« ! »** au-dessus de la tête. Un bip, et une bulle rouge avec le message, qui reste jusqu'à ce que tu cliques sur lui ou sur la bulle |
| Claude a fini | Sans bouger de sa place : il sourit, fait coucou et lâche quelques confettis. Une bulle verte « C'est fini ✓ » affiche la durée (« en 4 min 12 s ») et le **début de la réponse de Claude** (« J'ai corrigé le bug du panier… »), puis disparaît au bout de quelques secondes |
| Claude veut lancer une commande dangereuse (`rm -rf`, `git push --force`, `git reset --hard`, `DROP TABLE`, script internet passé à `bash`…) | La bulle d'autorisation passe en **rouge rayé « ⚠ DANGER »** et explique le risque. Le pet tremble, bras en l'air. Le bouton devient « ⚠ Oui quand même », et il n'y a **pas** de bouton « Toujours » |
| Tu n'as pas touché clavier et souris depuis 30 min | Il plante sa **tente** avec un petit feu de camp et dort dedans (on voit ses pattes dépasser) jusqu'à ton retour : « Te revoilà ! 👋 » |
| Claude s'arrête sur une erreur (limite d'utilisation atteinte, serveurs surchargés, souci de compte…) | Il s'assoit tout triste, avec une petite larme, et affiche une bulle violette **⛔ BLOQUÉ** qui explique pourquoi. Elle reste jusqu'à ce que tu cliques |
| Entre 1h et 6h du matin | Mode nuit : bonnet de nuit, yeux mi-clos, il marche au ralenti, s'endort plus vite et te rappelle d'aller dormir toutes les 20 min 😴 |

Chaque bulle affiche le nom du dossier du projet. Si plusieurs sessions tournent en parallèle, les bulles s'empilent.

### Garde-robe et profil 🎒

Clic droit → **🎒 Garde-robe et profil…** ouvre une petite fenêtre :

- **Couleurs, Chapeaux, Extras, Traînées** : survole une carte pour l'essayer sur le grand aperçu, clique pour la mettre.
- **Moi** :
  - ton prénom (il te dit « Bonjour Lucas ! ☀️ » la 1re fois qu'il te voit dans la journée) ;
  - ton anniversaire (ce jour-là : chapeau de fête, confettis et « Joyeux anniversaire ! 🎂 ») ;
  - la taille ;
  - le pack de sons : 🕹️ Rétro 8-bit, 🎐 Doux ou 🤪 Rigolo ;
  - tes records.
- À gauche : ton niveau, ton XP, son humeur et les stats du jour.

### Niveaux, XP et humeur ⭐❤️

Il gagne de l'XP :

| Action | XP |
|---|---|
| Une tâche de Claude terminée | +10 |
| Un cookie | +5 |
| Un coucou reçu de ton pote | +5 |
| Une demande répondue depuis la bulle | +3 |
| Des chatouilles (frotter la souris sur lui) | +2 |
| Un bug écrasé | +1 |
| Un tir dans la balle | +1 |
| Une partie de chifoumi | +1 (+3 si tu gagnes) |

Il y a **20 niveaux**. Chacun donne un titre (Petit compagnon, Apprenti sorcier, Viking du terminal… jusqu'à Licorne suprême), un feu d'artifice et des cosmétiques.

**Au départ**, il a seulement : les couleurs Claude, Menthe, Lavande et Océan ; la casquette, le nœud et la fleur ; l'écharpe ; la traînée d'étoiles. Tout le reste se débloque :

| Niveau | Débloque |
|---|---|
| 2 | Cerise, haut-de-forme |
| 3 | 👨‍🚀 casque d'astronaute, traînée de cœurs |
| 4 | Citron, moustache |
| 5 | ✨ or massif, lunettes de soleil |
| 6 | Casque audio, traînée de bulles |
| 7 | 🔮 aura mystique, Bonbon |
| 8 | Chapeau de sorcier, cape |
| 9 | 🪩 traînée de paillettes, Chocolat |
| 10 | 🦄 corne de licorne, ailes |
| 11 | Chapeau de pirate, Nuit |
| 12 | Chapeau de cowboy, traînée de feu |
| 13 | Jetpack, Doré |
| 14 | Casque viking, nœud papillon |
| 15 | Galaxie, couronne |
| 16 | Casquette à hélice |
| 17 | Fantôme |
| 18 | Auréole |
| 20 | Arc-en-ciel (couleur et traînée) |

Et des **succès 🏅** débloquent le reste :

| Succès | Débloque |
|---|---|
| 50 chatouilles | 🐱 oreilles de chat |
| 100 caresses | 🥳 chapeau de fête |
| 20 cookies mangés | 👨‍🍳 toque de chef |
| 40 bugs en une partie (chasse aux bugs) | 🥷 bandeau ninja |
| 25 tâches de Claude finies | 🎒 sac à dos |

Dans la garde-robe :
- ce que tu as est rangé en premier, puis les défis, puis les objets à débloquer par niveau, du plus proche au plus lointain ;
- chaque carte verrouillée affiche sa condition en clair : « 🔒 Niveau 8 », ou « 🏅 7/50 chatouilles » avec une barre de progression ;
- **survole un objet** : la barre d'aide en haut explique quoi faire (« atteins le niveau 11, encore 2 623 XP », « frotte ta souris sur lui pour le chatouiller : 7/50 ») ;
- le prochain déblocage par niveau est indiqué sous la barre d'XP, et l'onglet **Moi** liste tous les défis.

Ce qu'il porte déjà reste sur lui, même si c'est verrouillé.

Son **humeur** baisse doucement avec le temps et remonte avec les caresses, les chatouilles, les cookies et le travail fini :
- aux anges (80 % et plus) : il sautille en marchant et rayonne ;
- en dessous de 20 % : il boude (« Une petite caresse ? 🥺 »).

Tout est sauvegardé dans `stats.json`.

### Raccourcis clavier ⌨

| Raccourci | Effet |
|---|---|
| `Ctrl+Alt+O` | Accepter la demande d'autorisation en attente (sauf commande ⚠ dangereuse : il faut confirmer sur la bulle) |
| `Ctrl+Alt+N` | Refuser la demande en attente |
| `Ctrl+Alt+G` | Aller à la session qui t'attend (ou à la plus récente) |
| `Ctrl+Alt+P` | Appeler le pet à côté de ta souris |

On peut les désactiver dans **⚙ Réglages**. Si une autre appli utilise déjà un raccourci, le **🩺 Diagnostic** te le signale.

### Répondre aux autorisations depuis le pet

Quand Claude demande la permission d'utiliser un outil, la bulle affiche trois boutons :

- **✓ Oui** : autorise cette fois.
- **✓ Toujours** : autorise et ajoute la règle proposée par Claude, pour qu'il ne redemande plus.
- **✕ Non** : refuse.

La barre rouge sous les boutons montre le temps qu'il te reste (30 s par défaut, `approveSeconds`). Si tu ne réponds pas à temps, la fenêtre de permission habituelle de Claude prend le relais. Pour lui laisser la main tout de suite, clique sur la bulle en dehors des boutons.

> Dans le terminal, la fenêtre de permission habituelle peut n'apparaître qu'une fois ce délai écoulé. Si tu réponds surtout depuis le terminal, baisse `approveSeconds` (par exemple 10).

Si le pet n'est pas lancé ou est caché complètement, rien ne change : la demande passe directement par Claude.

### Notifs sur le téléphone 📱

Quand tu es loin du PC (clavier et souris pas touchés depuis 5 min, réglable), chaque alerte part aussi sur ton téléphone : besoin de toi, fini, ou bloqué. Rien n'est envoyé quand tu es devant le PC ou en jeu.

1. Installe l'appli gratuite **ntfy** sur ton téléphone (Play Store / App Store), sans compte.
2. Clic droit sur le pet → **📱 Notifs téléphone → Activer**. Le pet crée un sujet secret (`claude-pet-…`), le copie dans le presse-papiers et ouvre sa page.
3. Dans l'appli ntfy, appuie sur **+** et colle ce sujet. Tu reçois aussitôt une notif de bienvenue 🎉.

Dans ce même menu, tu peux aussi envoyer un test, changer le délai d'absence (2, 5, 10 ou 20 min) ou désactiver.

> Les notifs passent par le serveur public ntfy.sh. Seul quelqu'un qui connaît ton sujet peut les lire, alors ne le partage pas. Elles contiennent le nom du projet et le message de Claude (par exemple « Autoriser Bash ? npm install »).

### Mode copain 👋

Relie ton pet à celui d'un pote (il doit avoir Claude Pet lui aussi) :

1. Clic droit → **👋 Copain → Activer le mode copain**. Ton code (`claude-pet-ami-…`) est copié : envoie-le à ton pote, par Discord par exemple.
2. Ton pote fait pareil et t'envoie son code.
3. Copie son code, puis fais clic droit → **👋 Copain → Coller le code de mon pote**. Son pet reçoit aussitôt « … est relié à toi ! 🤝 ».
4. Ensuite, tu peux lui envoyer un **coucou 👋**, un **cœur 💖**, un **cookie 🍪** (qui tombe du ciel sur son écran et que son pet mange) ou une **balle 🎾**.

Quand un message arrive, son pet court jusqu'à sa souris pour lui apporter, avec une bulle « Ton pote te fait coucou ! 👋 ». Pour que ça marche dans les deux sens, il faut que chacun ait collé le code de l'autre. Rien n'arrive pendant le mode jeu. Le nom affiché est ton nom d'utilisateur Windows, ou `name` dans la config.

> Les messages passent par ntfy.sh, comme les notifs téléphone. Quelqu'un qui connaît ton code peut seulement t'envoyer coucous, cœurs, cookies et balles.

### Visiteurs 🚪

De temps en temps (toutes les 20 à 45 min, quand il est tranquille), un petit personnage arrive par le côté, discute avec lui, puis repart. Les répliques s'affichent dans sa bulle, avec l'icône de qui parle.

- 🐱 **le chat** : il se fait caresser ;
- 👻 **le fantôme** : il lui fait peur, et ton pet sursaute ;
- 🤖 **le robot** : ils dansent ;
- 🐥 **le poussin** : il fait « piou piou » ;
- 🐌 **l'escargot** : il est très, très lent ;
- 👾 **le cousin** : un autre petit Claude, d'une autre couleur et avec un chapeau, avec qui il se check.

Pour les faire venir toi-même : **🎲 Jouer → 🚪 Inviter un visiteur**. Pour les couper : **⚙ Réglages → Visiteurs surprise**. Ils ne viennent jamais pendant un jeu ou une alerte de Claude, et repartent dès que Claude a besoin de toi.

### Tokens du jour 🔤

La 2e ligne du menu affiche les tokens utilisés aujourd'hui :
- **écrits** : ce que Claude a généré ;
- **lus** : ce qu'il a lu, cache compris (c'est ce qui fait les gros chiffres).

Le compteur lit l'historique de chaque session à la fin de ses tours. Il ne compte donc que les sessions qui ont terminé au moins un tour depuis le lancement du pet.

### Mode jeu 🎮

Par défaut, il s'active tout seul dès qu'une fenêtre est en plein écran (jeu, vidéo…), et se coupe quand tu en sors. Pendant le jeu :

- il file dans un coin de l'écran et reste assis, **à moitié transparent** ;
- **il ne capte plus aucun clic** : impossible de cliquer dessus par erreur, les clics vont au jeu ;
- **silence total** : pas de son, pas de phrases, pas de balade, pas de jeux ;
- son animation tourne au ralenti (~15 images/s) pour ne rien prendre à tes FPS, et il ne se remet plus au premier plan de lui-même ;
- quand Claude a besoin de toi, il redevient opaque, avec le « ! » et une **mini-bulle d'une ligne** (sans boutons). Rien ne vole le focus de ton jeu ;
- pour les demandes d'autorisation, la fenêtre habituelle de Claude s'affiche tout de suite, sans attendre les 30 s.

> Un jeu en plein écran « exclusif » peut passer par-dessus le pet. En mode « plein écran fenêtré » ou « sans bordure », le pet reste visible.

## Lancer

- **Le plus simple :** double-clique sur le raccourci **Claude Pet** sur le Bureau.
- **Automatiquement au démarrage de Windows :** clic droit sur le pet → **🚀 Lancer au démarrage**.
- **Depuis un terminal**, dans le dossier du projet :

  ```bash
  npm start
  ```

Le pet apparaît en bas de l'écran, et une icône s'ajoute dans la zone de notification (près de l'horloge, parfois cachée derrière la flèche `^`). Survole l'icône pour voir son état (« ❗ 1 attend ta réponse », « ⌨ 2 sessions au travail »…). Si le pet tourne déjà, le relancer l'appelle à côté de ta souris.

Il s'adapte tout seul à tes écrans :
- tu branches ou débranches un écran, tu changes la résolution ou l'échelle : il reste visible, et revient sur un écran s'il était perdu ;
- à la sortie de veille ou au déverrouillage, il reprend sa place au premier plan ;
- si son affichage plante, il se relance tout seul.

Si quelque chose ne marche pas : clic droit → **🩺 Diagnostic**. Il vérifie les hooks, Node.js, le serveur, le dernier signal de Claude, le mode jeu, ntfy et les raccourcis, et répare les hooks en un clic.

Si le raccourci a disparu, recrée-le avec :

```bash
npm run shortcut
```

## Le donner à un pote

1. Fabrique le zip (il sera créé à côté du dossier, dans `C:\dev\claude-pet.zip`) :

   ```bash
   npm run zip
   ```

2. Envoie-lui `claude-pet.zip`. Il ne contient pas ta config, donc pas ton sujet de notifs : ton pote part avec les réglages par défaut.
3. De son côté, il lui faut **Windows**, **Claude Code** et **Node.js** (version LTS, sur https://nodejs.org).
4. Il dézippe le dossier où il veut, par exemple `C:\claude-pet`, et double-clique sur **`install.bat`**. Le script :
   - télécharge Electron ;
   - branche les hooks dans son `~/.claude/settings.json` (avec une sauvegarde) ;
   - lance le pet ;
   - crée le raccourci sur son Bureau.
5. Il relance ses sessions Claude Code, et c'est parti.

> S'il déplace le dossier plus tard, il doit relancer `install.bat` pour mettre à jour le chemin des hooks.

### Les mises à jour 🎁

Une fois le projet publié sur GitHub (champ `updateRepo` de `package.json`, par exemple `"pseudo/claude-pet"`) :

- **Côté pote** : son pet vérifie au démarrage, puis toutes les 6 h. Quand une nouvelle version existe, il le dit (« 🎁 Mise à jour 1.1.1 dispo ! ») et **🎁 Mettre à jour** apparaît en haut du menu. Un clic suffit : il télécharge les nouveautés, garde la config et la progression, rebranche les hooks et redémarre. Il peut aussi vérifier à la main : **⚙ Réglages → 🔄 Vérifier les mises à jour**.
- **Côté toi** : après une modification, une seule commande publie la nouvelle version (elle lance les tests, augmente le numéro de version, puis commit et push) :

  ```bash
  npm run release
  ```

Ton dossier à toi (celui qui a le `.git`) ne se met jamais à jour tout seul : c'est de là que tu publies.

## Jouer avec lui

| Geste | Réaction |
|---|---|
| **Clic** | Ferme les bulles, sinon arrête le jeu en cours, sinon petit saut et cœurs. Chaque caresse est comptée (« +1 👆 42 »), et il fête les paliers : 10, 50, 100, 250, 500, 1000… |
| **Double-clic** | Gros saut |
| **Frotter** la souris sur lui | Chatouilles ! Il rigole, cœurs 💕 (compté dans les stats) |
| **Glisser** puis lâcher | Tu le déplaces |
| Glisser et **lancer** d'un coup sec | Il vole, rebondit sur les bords de l'écran… et a la tête qui tourne 😵 |
| Passer la souris près de lui | Il la regarde |
| **Clic droit** | Ouvre le menu |

Si tu le laisses tranquille 3 minutes, il s'endort (« Zzz »). En mode **Bavard**, il lâche une petite phrase de temps en temps.

Quand il n'a rien à faire, il s'occupe tout seul :
- 🛹 il traverse l'écran en skate ;
- 🎸 il joue de la guitare (avec des notes) ;
- 🫧 il gonfle un chewing-gum qui éclate ;
- 📖 il lit un livre en tournant les pages ;
- 🎣 il pêche, et finit par attraper un poisson ;
- 🪀 il joue au yo-yo ;
- 🦋 il suit un papillon.

Et il fête les fêtes : citrouille sur la tête autour d'Halloween, bonnet et neige en décembre (si tu ne lui as pas mis de chapeau).

## Tester chaque état sans attendre Claude

**Le plus simple :** menu → **Tester**, puis :

- **Travaille** ;
- **Besoin de toi** ;
- **Fini** ;
- **Deux sessions**.

**Pour tester comme un vrai hook :** ça passe par le même chemin que Claude Code. Lance la commande, puis place vite ta souris au milieu de l'écran, tu as 3 secondes :

```bash
Start-Sleep 3; '{"hook_event_name":"Notification","session_id":"t","cwd":"C:\\dev\\mon-projet","message":"Test !"}' | node hook.js
```

Remplace `Notification` par `Stop` (fini) ou `UserPromptSubmit` (travaille) pour les autres états.

## Le menu

Clic droit sur le pet, ou clic sur son icône dans la zone de notification. Double-clic sur l'icône = « Appeler ici ».

- **⭐ Niveau · titre · humeur**, puis **📊 stats du jour** et **🔤 tokens**.
- **📜 Journal du jour** : tout ce que Claude a terminé aujourd'hui, avec l'heure, le projet, la durée et le début de sa réponse. Un clic ramène la session.
- **🎒 Garde-robe et profil** : voir plus haut.
- **⚙ Réglages** : bavard, son, raccourcis clavier, lancement au démarrage, fichier de config.
- **🩺 Diagnostic**.
- **🧭 Aller à la session** : liste tes sessions Claude Code des 3 dernières heures avec leur état (❗ attend ta réponse, ⌨ travaille, ✓ a fini, 💤 au repos). Un clic ramène sa fenêtre au premier plan : terminal, VS Code ou app Claude. Le badge du projet sur les bulles (`scopizza ↗`) fait pareil.
  > Dans Windows Terminal, ça ramène la fenêtre mais pas forcément le bon onglet. Dans l'app Claude, ça ouvre l'app mais pas forcément la bonne session.
- **🎮 Mode jeu** : choisis **Automatique** (activé dès qu'un jeu ou une vidéo est en plein écran), **Toujours** ou **Désactivé**, et le coin où il se met : gauche, droite, ou là où il est. Voir plus bas.
- **📍 Appeler ici** : il apparaît à côté de ta souris (pratique si tu l'as perdu).
- **👻 Cacher** :
  - **jusqu'à ce que Claude ait besoin de moi** : il réapparaît seulement pour les alertes ;
  - **complètement** : il ne revient pas tout seul.

  Pour le faire revenir : menu de l'icône → **Montrer**.
- Dans la **🎒 garde-robe** :
  - **Couleurs** : Claude, Menthe, Lavande, Doré, Nuit, Cerise, Océan, Citron, Chocolat, Bonbon, plus Fantôme (translucide), Arc-en-ciel (les couleurs défilent), Galaxie (des étoiles scintillent) et Or massif (niv. 5) ;
  - **Chapeaux** : haut-de-forme, casquette, couronne, lunettes de soleil, casque audio, nœud, fleur, sorcier, pirate, cowboy, viking, casquette à hélice (qui tourne), oreilles de chat, auréole (qui flotte), chapeau de fête, toque de chef, bandeau ninja, plus casque d'astronaute (niv. 3) et corne de licorne (niv. 10) ;
  - **Extras** (en plus du chapeau) : cape qui flotte, ailes qui battent, jetpack (flamme quand il court), sac à dos, écharpe, moustache, nœud papillon, plus aura mystique (niv. 7) ;
  - **Traînées** quand il bouge : étoiles, cœurs, arc-en-ciel, bulles, feu, plus paillettes (niv. 9).
- **🎲 Jouer** :
  - **Lancer une balle** : il court après et shoote dedans, et tu peux aussi taper dedans avec la souris ;
  - **Donner un cookie** : il le mange ;
  - **Danser** ;
  - **Suivre ma souris** ;
  - **🐛 Chasse aux bugs** : 30 s pour écraser un max de bugs qui tombent sur tout l'écran (clic = écrasé, Échap pour quitter). Ton record est gardé ;
  - **✊ Chifoumi** : choisis pierre, feuille ou ciseaux. Il secoue le poing, révèle son choix, et frime ou boude selon le résultat (le score est compté) ;
  - **🎲 Lancer un dé** et **🪙 Pile ou face** ;
  - **🎨 Activités** : lance-en une toi-même (skate, guitare, chewing-gum, lecture, pêche, yo-yo, papillon). « Il en fait tout seul » est activé par défaut : il s'occupe de lui-même de temps en temps ;
  - **🛑 Arrêter de jouer** : range la balle ou le cookie et stoppe la danse, le suivi ou l'activité. Ce bouton apparaît aussi en haut du menu pendant un jeu. Sinon, la balle disparaît toute seule après 45 s.
- **⏸ Pause balade** : il ne se promène plus, mais réagit toujours à Claude.
- **🧪 Tester**.
- **❌ Quitter**.

Tous les réglages sont sauvegardés.

## Config (`config.json`)

| Clé | Effet |
|---|---|
| `speed` | vitesse de marche et de course (1 = normal, 2 = deux fois plus vite) |
| `scale` | taille du pet (2 = mini, 3 = normal, 4 = grand, 5 = géant) |
| `sound` | `true` / `false` |
| `doneSeconds` | durée de la bulle « C'est fini » |
| `port` | port du serveur local (47321 par défaut) |
| `skin` | couleur, au choix : `claude`, `menthe`, `lavande`, `dore`, `nuit`, `fantome`, `arcenciel`, `cerise`, `ocean`, `citron`, `chocolat`, `bonbon`, `galaxie` |
| `hat` | chapeau (voir le menu, `aucun` par défaut) |
| `extra` | `aucun`, `cape`, `ailes`, `jetpack`, `sac`, `echarpe`, `moustache`, `papillon` |
| `trail` | `aucune`, `etoiles`, `coeurs`, `arcenciel`, `bulles`, `feu` |
| `activities` | il fait des activités tout seul (`true` / `false`) |
| `bugRecord` | ton record à la chasse aux bugs |
| `chatty` | mode bavard `true` / `false` |
| `approveSeconds` | délai pour répondre Oui / Non depuis la bulle avant que la fenêtre habituelle de Claude prenne le relais (30 par défaut). Après une modification, relance `npm run hooks:install` |
| `nightStart` / `nightEnd` | heures du mode nuit (1 et 6 par défaut) |
| `gameMode` | `auto` (plein écran), `on` ou `off` |
| `gameSpot` | où il se met en jeu : `left`, `right` ou `stay` |
| `phoneTopic` | sujet ntfy des notifs téléphone (vide = désactivé) |
| `phoneAfterMin` | minutes d'absence avant d'envoyer sur le téléphone |
| `friendInbox` / `friendTopic` | ton code copain / celui de ton pote |
| `name` | ton prénom : bonjour du matin, et nom affiché chez ton pote (vide = nom d'utilisateur Windows) |
| `birthday` | ton anniversaire, au format `MM-JJ` (par exemple `07-14`) |
| `soundPack` | `retro`, `doux` ou `rigolo` |
| `shortcuts` | raccourcis clavier `true` / `false` |
| `welcomed` | `false` = il refait son petit mot d'accueil au prochain lancement |

Ta progression (XP, humeur, totaux, journal du jour) est dans `stats.json`. Supprime ce fichier pour repartir de zéro.

Le plus simple, c'est de passer par le menu. Si tu modifies le fichier à la main, quitte le pet et relance-le.

## Les hooks Claude Code

Ils sont installés dans `~/.claude/settings.json`, à côté de tes autres hooks, qui ne sont pas touchés. Une sauvegarde `settings.json.backup-<date>` est créée à chaque modification.

- Réinstaller : `npm run hooks:install` (sans risque de doublon).
- Retirer : `npm run hooks:remove`.

Les hooks tournent en arrière-plan (`async`), sauf `PermissionRequest`, qui attend ta réponse sur la bulle, au maximum `approveSeconds`. Si le pet n'est pas lancé, `hook.js` abandonne en silence en moins d'1 s, donc Claude Code n'est jamais bloqué.

> Les sessions Claude Code déjà ouvertes peuvent avoir besoin d'être relancées pour prendre les hooks en compte.

## Tout désinstaller

1. Quitte le pet (icône → Quitter).
2. Dans le dossier du projet :

   ```bash
   npm run remove
   ```

   Ça retire les hooks de `settings.json` et le lancement au démarrage.
3. Supprime le dossier `C:\dev\claude-pet`.
4. Si tu veux, supprime aussi les fichiers `~/.claude/settings.json.backup-*`.

## Fichiers

- `main.js` : fenêtres, comportement, jeux, menu, serveur local `127.0.0.1:47321`.
- `pet.html` : dessin, animations, bulles, sons.
- `wardrobe.html` : la fenêtre garde-robe et profil.
- `bugs.html` : le mini-jeu de la chasse aux bugs.
- `visitor.html` : les visiteurs (chat, fantôme, robot…).
- `release.js` : `npm run release` publie une nouvelle version.
- `stats.json` : ta progression (créé automatiquement, pas inclus dans le zip).
- `prop.html` : la balle et le cookie (une petite fenêtre à part, pour qu'ils puissent voler partout).
- `sprites.js` : le pixel art, généré en code.
- `hook.js` : appelé par Claude Code, transmet l'événement au pet.
- `hooks-setup.js` : installe et retire les hooks.
- `shortcut.js` : crée le raccourci Bureau.
- `install.bat` : installation en un double-clic (pour un pote).
- `test.js` : `npm test` vérifie la détection des commandes dangereuses.
- `icon.ico` : icône du raccourci, générée au premier lancement.
