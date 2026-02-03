# 🧪 QA Test Cases Generator

Interface web et extension Chrome pour déclencher des workflows n8n de génération automatique de test cases end-to-end à partir d'User Stories Jira pour projets hôteliers.

## 📋 Description

Cette application permet aux QA engineers de générer des test cases automatiquement en soumettant simplement un ID de User Story Jira. L'application communique avec un workflow n8n via webhook pour orchestrer la génération des test cases au format Gherkin ou Step-by-step.

**Disponible en deux versions :**
- 🌐 **Web App** : Application web responsive déployable sur Netlify
- 🧩 **Extension Chrome** : Popup intégrée avec auto-détection de l'ID Jira depuis l'onglet actif

**Contexte métier :** Projet hôtelier de réservation de chambres nécessitant des tests end-to-end automatisés.

## 🚀 Fonctionnalités

### Communes (Web + Extension)
- ✅ Formulaire simple avec validation côté client
- ✅ Champ obligatoire : Jira User Story ID (format: PROJ-123)
- ✅ Sélection du format de sortie (Gherkin par défaut, ou Step-by-step)
- ✅ États visuels clairs : loading, success, error
- ✅ Revue et édition des test cases avant injection
- ✅ Injection dans Xray avec suivi de progression temps réel (Pusher)

### Extension Chrome uniquement
- ✅ Auto-détection de l'ID Jira depuis l'onglet actif
- ✅ Notifications système à la fin de l'injection
- ✅ Sauvegarde des préférences utilisateur
- ✅ Bouton contextuel sur les pages Jira

## 🛠️ Stack Technique

- **Framework JS** : Alpine.js 3.x (CDN pour web, bundlé pour extension)
- **Real-time** : Pusher pour les notifications temps réel
- **Build** : Vite 5.x avec configurations séparées web/extension
- **HTML/CSS** : Vanilla, sémantique HTML5
- **Déploiement Web** : Netlify (static site)
- **Déploiement Extension** : Chrome Web Store
- **Backend** : Webhooks n8n

## 📁 Structure du Projet

```
qa-agent-front/
├── index.html                    # Point d'entrée web
├── package.json                  # Scripts npm (dev, build:web, build:extension)
├── vite.config.js                # Config Vite pour web
├── vite.config.extension.js      # Config Vite pour extension Chrome
│
├── src/
│   ├── core/                     # 🔧 Code partagé (web + extension)
│   │   ├── index.js              # Ré-exports de tous les modules
│   │   ├── constants.js          # URLs webhooks, clés Pusher, config
│   │   ├── api.js                # Appels HTTP (generate, inject)
│   │   ├── pusher.js             # Gestion Pusher
│   │   └── testcase-utils.js     # Utilitaires test cases (parse, transform)
│   │
│   ├── web/                      # 🌐 Spécifique webapp
│   │   └── app.js                # Composant Alpine.js + debug UI
│   │
│   ├── extension/                # 🧩 Spécifique extension Chrome
│   │   ├── manifest.json         # Manifest V3
│   │   ├── popup/
│   │   │   ├── popup.html        # Interface popup
│   │   │   ├── popup.js          # Logique popup
│   │   │   └── popup.css         # Styles popup (compacts)
│   │   ├── background/
│   │   │   └── service-worker.js # Service worker (notifications)
│   │   ├── content/
│   │   │   └── content.js        # Content script (pages Jira)
│   │   └── assets/
│   │       └── icons/            # Icônes 16/48/128px
│   │
│   ├── css/
│   │   └── main.css              # Styles web app
│   └── js/
│       └── app.js                # (Legacy) Redirigé vers src/web/app.js
│
├── assets/                       # Assets statiques (images, logos)
├── dist/                         # 📦 Builds générés
│   ├── web/                      # Build webapp (Netlify)
│   └── extension/                # Build extension (Chrome)
│
├── CLAUDE.md                     # Conventions et architecture
└── README.md                     # Ce fichier
```

## ⚙️ Installation & Développement

### Prérequis

```bash
# Node.js 18+ requis
node --version

# Installer les dépendances
npm install
```

### Développement Web App

```bash
# Démarrer le serveur de développement (port 3000)
npm run dev

# Build pour production
npm run build:web

# Les fichiers sont générés dans dist/web/
```

### Développement Extension Chrome

```bash
# Build avec watch (recompile automatiquement)
npm run dev:extension

# Build pour production
npm run build:extension

# Les fichiers sont générés dans dist/extension/
```

#### Charger l'extension en développement

1. Ouvrir `chrome://extensions/`
2. Activer le "Mode développeur" (en haut à droite)
3. Cliquer "Charger l'extension non empaquetée"
4. Sélectionner le dossier `dist/extension/`
5. L'extension apparaît dans la barre d'outils

### Build complet (Web + Extension)

```bash
npm run build:all

# Génère :
# - dist/web/      → Déployer sur Netlify
# - dist/extension/ → Publier sur Chrome Web Store
```

## 🔧 Configuration

### URLs des Webhooks n8n

Modifier dans `src/core/constants.js` :

```javascript
export const N8N_WEBHOOK_GENERATE_URL = 'https://your-n8n.com/webhook/case-writer';
export const N8N_WEBHOOK_INJECT_URL = 'https://your-n8n.com/webhook/inject-testcases';
```

### Configuration Pusher

```javascript
export const PUSHER_APP_KEY = 'your-pusher-key';
export const PUSHER_CLUSTER = 'eu';
```

### Icônes Extension

Ajouter les fichiers PNG dans `src/extension/assets/icons/` :
- `icon-16.png` (16x16)
- `icon-48.png` (48x48)
- `icon-128.png` (128x128)

## 🎨 Personnalisation

### Variables CSS (Web App)

Modifier dans `src/css/main.css` :

```css
:root {
    --color-primary: #2d2d5f;
    --color-success: #28a745;
    --color-error: #dc3545;
    --color-bg: #f8f9fa;
}
```

### Variables CSS (Extension)

Modifier dans `src/extension/popup/popup.css` - mêmes variables disponibles.

## 🔧 Mode Debug UI (Web uniquement)

Un mode debug est disponible pour faciliter le développement CSS.

### Activation

```
http://localhost:3000?debug=true
```

### Accès direct à un écran

| URL | Description |
|-----|-------------|
| `?debug=loading` | Écran de chargement |
| `?debug=review` | Revue avec 3 test cases |
| `?debug=review&n=10` | Revue avec 10 test cases |
| `?debug=injection` | Injection - en cours |
| `?debug=injection&step=2` | Injection - terminée |

### Commandes Console

```javascript
debugUI.showForm()           // Formulaire
debugUI.showLoading()        // Chargement
debugUI.showReview(5)        // Revue avec 5 test cases
debugUI.showInjection(2)     // Injection terminée
debugUI.setEditing(0)        // Mode édition test case #1
debugUI.getState()           // État actuel
```

## 📦 Déploiement

### Web App sur Netlify

1. Build : `npm run build:web`
2. Déployer le contenu de `dist/web/` sur Netlify

Ou via GitHub :
- Build command : `npm run build:web`
- Publish directory : `dist/web`

### Extension Chrome

1. Build : `npm run build:extension`
2. Zipper le contenu de `dist/extension/`
3. Publier sur [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)

## 🐛 Troubleshooting

### Erreur CORS

```
Access to fetch at '...' has been blocked by CORS policy
```

**Solution :** Configurer les headers CORS sur votre workflow n8n.

### Extension : icônes manquantes

```
Could not load icon
```

**Solution :** Ajouter les fichiers PNG requis dans `src/extension/assets/icons/`.

### Pusher ne reçoit pas les événements

1. Vérifier la console pour les logs `📡`
2. Vérifier que `PUSHER_APP_KEY` est correct dans `src/core/constants.js`
3. Vérifier que n8n envoie bien sur le bon channel

## 📱 Compatibilité

### Web App
- ✅ Chrome/Edge (dernières versions)
- ✅ Firefox (dernières versions)
- ✅ Safari (dernières versions)
- ✅ Mobile iOS/Android

### Extension Chrome
- ✅ Chrome 90+
- ✅ Edge (Chromium) 90+

## 🤝 Contribution

1. Respectez les conventions définies dans `CLAUDE.md`
2. Le code partagé va dans `src/core/`
3. Le code spécifique web dans `src/web/`
4. Le code spécifique extension dans `src/extension/`
5. Testez les deux builds avant de commit

## 📄 Licence

Propriété interne - Tous droits réservés

---

**Powered by n8n • Built with Alpine.js & Vite • Web + Chrome Extension**
