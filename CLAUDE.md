# QA Test Cases Generator - Webapp N8N Interface

## Vue d'ensemble du projet
Interface web pour déclencher des workflows n8n de génération de test cases QA.
Génère automatiquement des test cases end-to-end à partir d'User Stories Jira pour un projet hôtelier de réservation de chambres.

## Stack technique
- AlpineJS 3.x (via CDN) - framework JS léger et réactif
- HTML/CSS/JS vanilla (pas de framework CSS externe)
- Déploiement: Netlify (static site, client-side uniquement)
- Backend: Webhook n8n pour orchestration

## Architecture
```
qa-testcase-generator/
├── index.html              # Point d'entrée + template Alpine
├── src/
│   ├── js/
│   │   └── app.js         # Logique Alpine.js + appels API
│   └── css/
│       └── main.css       # Styles responsive
├── CLAUDE.md              # Ce fichier - configuration projet
└── README.md              # Documentation utilisateur
```

## Conventions de code

### JavaScript (app.js)
- Utiliser Alpine.js avec syntaxe: `x-data`, `x-model`, `x-on`, `@submit.prevent`
- **JAMAIS** utiliser localStorage/sessionStorage (non supporté dans environnement Claude.ai)
- Variables d'état minimales: `loading`, `error`, `success`, `message`, `formData`
- Console.log pour debugging en développement
- Validation côté client obligatoire avant soumission
- Gestion d'erreur complète sur tous les appels `fetch()`
- URL webhook n8n via constante `N8N_WEBHOOK_URL` en haut du fichier

### CSS (main.css)
- Mobile-first responsive design (breakpoint: 768px)
- Pas de framework CSS (Bootstrap, Tailwind, etc.) - vanilla CSS uniquement
- Naming: classes descriptives en kebab-case (ex: `form-container`, `input-error`)
- Palette sobre type dashboard développeur (fond clair/sombre, accents bleus)
- États visuels obligatoires: `:hover`, `:focus`, `:disabled`, `.error`
- Reset CSS minimal inclus

### HTML (index.html)
- Sémantique HTML5 stricte (`<form>`, `<label>`, `<input>`, `<select>`)
- Accessibilité: labels avec `for`, ARIA où nécessaire
- Alpine.js chargé via CDN **avant** app.js
- Meta viewport pour responsive
- Structure propre et commentée

## Règles critiques

### ❌ Interdictions strictes
- JAMAIS utiliser localStorage, sessionStorage ou IndexedDB
- JAMAIS importer de frameworks CSS (Bootstrap, Tailwind, Bulma, etc.)
- JAMAIS utiliser de processus de build (Webpack, Vite, etc.)
- JAMAIS utiliser Node.js modules côté client

### ✅ Obligations
- Validation du champ `us-jira-id` avant soumission (non vide)
- Gestion complète des états: loading, success, error avec UI feedback
- URL webhook configurable (constante en haut de app.js)
- Tous les fichiers standalone - prêts pour déploiement Netlify
- Code commenté aux endroits critiques

## Format des données

### Entrées du formulaire
- `us-jira-id` (string, requis): ID Jira au format "PROJ-123"
- `format` (string, optionnel): "gherkin" (défaut) ou "step-by-step"

### Payload POST vers n8n webhook
```json
{
  "usJiraId": "PROJ-123",
  "format": "gherkin"
}
```

### Réponse attendue du webhook
```json
{
  "success": true,
  "message": "Test cases générés avec succès",
  "jobId": "uuid-v4"
}
```

## Workflow de développement

### Phase 1: Structure HTML
1. Créer `index.html` avec structure sémantique
2. Intégrer Alpine.js via CDN
3. Créer formulaire avec champs requis

### Phase 2: Logique JS
1. Créer `src/js/app.js` avec composant Alpine
2. Implémenter gestion d'état
3. Implémenter validation
4. Implémenter appel API avec fetch()

### Phase 3: Styles CSS
1. Créer `src/css/main.css` avec reset
2. Styliser formulaire (mobile-first)
3. Ajouter états visuels
4. Ajouter responsive desktop

### Phase 4: Tests manuels
1. Tester validation formulaire
2. Tester états (loading, success, error)
3. Tester responsive mobile/desktop
4. Tester accessibilité clavier

## Commandes
Aucune commande de build - fichiers statiques prêts pour déploiement.

## Configuration n8n
URL webhook à configurer dans `src/js/app.js`:
```javascript
const N8N_WEBHOOK_URL = 'https://your-n8n-instance.com/webhook/generate-testcases';
```

## Design Guidelines
- Fond: blanc ou gris très clair (#f8f9fa)
- Texte principal: gris foncé (#212529)
- Accent primaire: bleu (#007bff)
- Accent succès: vert (#28a745)
- Accent erreur: rouge (#dc3545)
- Police: system font stack (sans-serif)
- Espacement: multiples de 8px (8, 16, 24, 32)
- Border-radius: 4px pour inputs, 6px pour boutons
- Transitions: 0.2s ease pour hover/focus

## Notes importantes
- L'interface doit être intuitive pour des QA engineers
- Privilégier la clarté et la lisibilité au design sophistiqué
- Messages d'erreur explicites et actionnables
- Feedback visuel immédiat sur toutes les actions
- Tester avec vraie URL n8n avant déploiement final