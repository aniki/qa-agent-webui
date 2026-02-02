# 🧪 QA Test Cases Generator

Interface web pour déclencher des workflows n8n de génération automatique de test cases end-to-end à partir d'User Stories Jira pour projets hôteliers.

## 📋 Description

Cette application web permet aux QA engineers de générer des test cases automatiquement en soumettant simplement un ID de User Story Jira. L'application communique avec un workflow n8n via webhook pour orchestrer la génération des test cases au format Gherkin ou Step-by-step.

**Contexte métier :** Projet hôtelier de réservation de chambres nécessitant des tests end-to-end automatisés.

## 🚀 Fonctionnalités

- ✅ Formulaire simple avec validation côté client
- ✅ Champ obligatoire : Jira User Story ID (format: PROJ-123)
- ✅ Sélection du format de sortie (Gherkin par défaut, ou Step-by-step)
- ✅ États visuels clairs : loading, success, error
- ✅ Messages d'erreur explicites et actionnables
- ✅ Réinitialisation automatique après succès
- ✅ Design responsive mobile-first
- ✅ 100% client-side (aucune dépendance serveur)

## 🛠️ Stack Technique

- **Framework JS** : Alpine.js 3.x (via CDN)
- **HTML/CSS** : Vanilla, sémantique HTML5
- **Déploiement** : Netlify (static site)
- **Backend** : Webhook n8n
- **Build process** : Aucun (fichiers statiques prêts à déployer)

## 📁 Structure du Projet

```
qa-agent-front/
├── index.html              # Point d'entrée principal
├── src/
│   ├── js/
│   │   └── app.js         # Logique Alpine.js + appels API
│   └── css/
│       └── main.css       # Styles responsive vanilla CSS
├── CLAUDE.md              # Conventions et architecture
└── README.md              # Ce fichier
```

## ⚙️ Installation

### Option 1 : Déploiement Netlify (Recommandé)

1. **Drag & Drop**
   - Allez sur [Netlify](https://app.netlify.com/)
   - Glissez-déposez le dossier `qa-agent-front/` dans la zone de drop
   - Attendez le déploiement automatique (< 1 minute)
   - Votre site est en ligne ! 🎉

2. **Via Git (méthode alternative)**
   ```bash
   # Pousser votre code sur GitHub
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main

   # Sur Netlify : New site from Git > Sélectionner votre repo
   # Build settings: laisser vide (site statique)
   # Publish directory: .
   ```

### Option 2 : Développement Local

Ouvrez simplement `index.html` dans votre navigateur :

```bash
# Avec un serveur local (recommandé pour éviter les CORS)
npx serve .

# Ou directement dans le navigateur
open index.html
```

## 🔧 Configuration n8n Webhook

### 1. Configurer l'URL du Webhook

Ouvrez `src/js/app.js` et remplacez la constante en haut du fichier :

```javascript
// Remplacer cette URL par votre instance n8n réelle
const N8N_WEBHOOK_URL = 'https://your-n8n-instance.com/webhook/generate-testcases';
```

### 2. Format du Payload Envoyé

L'application envoie un POST avec ce payload JSON :

```json
{
  "usJiraId": "HOTEL-123",
  "format": "gherkin"
}
```

### 3. Réponse Attendue du Webhook

Votre workflow n8n doit retourner :

```json
{
  "success": true,
  "message": "Test cases générés avec succès",
  "jobId": "uuid-v4"
}
```

En cas d'erreur, retournez un statut HTTP 4xx/5xx avec :

```json
{
  "success": false,
  "message": "Message d'erreur explicite"
}
```

### 4. Configuration CORS sur n8n

Assurez-vous que votre workflow n8n accepte les requêtes CORS depuis votre domaine Netlify :

1. Dans n8n, allez dans Settings > Workflow Settings
2. Ajoutez votre domaine Netlify aux origines autorisées
3. Ou configurez les headers CORS dans votre workflow (nœud HTTP Response)

## 🎨 Personnalisation du Design

### Couleurs

Modifiez les variables CSS dans `src/css/main.css` :

```css
:root {
    --color-primary: #007bff;      /* Couleur principale */
    --color-success: #28a745;      /* Vert succès */
    --color-error: #dc3545;        /* Rouge erreur */
    --color-bg: #f8f9fa;           /* Fond page */
    /* ... */
}
```

### Textes et Labels

Modifiez directement dans `index.html` :
- Titre H1 : ligne 27
- Description : ligne 28-31
- Labels de formulaire : lignes 39, 56

## 📱 Compatibilité

- ✅ Chrome/Edge (dernières versions)
- ✅ Firefox (dernières versions)
- ✅ Safari (dernières versions)
- ✅ Mobile iOS/Android

## 🧪 Tests Manuels

Checklist de validation avant déploiement :

- [ ] Le formulaire s'affiche correctement sur mobile
- [ ] Le formulaire s'affiche correctement sur desktop (>768px)
- [ ] La validation du champ Jira ID fonctionne (message d'erreur si vide)
- [ ] Le bouton se désactive pendant l'envoi
- [ ] Le spinner de chargement s'affiche
- [ ] Le message de succès s'affiche après réponse positive
- [ ] Le message d'erreur s'affiche en cas d'échec
- [ ] Le formulaire se réinitialise après succès (2 secondes)
- [ ] Le focus revient sur le premier champ après reset
- [ ] Les états hover/focus sont visibles sur tous les éléments interactifs

## 🔧 Mode Debug UI

Un mode debug est disponible pour faciliter le développement et les tests CSS. Il permet d'afficher les différents écrans de l'application avec des données mockées sans avoir à exécuter le workflow complet.

### Activation

Ajoutez `?debug=true` à l'URL :

```
http://localhost:3000?debug=true
```

Un bandeau de debug apparaît en bas de l'écran avec des boutons pour naviguer entre les écrans.

### Accès direct à un écran

Vous pouvez ouvrir directement un écran spécifique via l'URL :

| URL | Description |
|-----|-------------|
| `?debug=loading` | Écran de chargement (génération en cours) |
| `?debug=review` | Écran de revue avec 3 test cases mockés |
| `?debug=review&n=10` | Écran de revue avec 10 test cases |
| `?debug=injection` | Écran d'injection (étape initiale) |
| `?debug=injection&step=1` | Injection - étape 1 terminée |
| `?debug=injection&step=2` | Injection - terminée avec succès |

### Commandes Console

En mode debug, l'objet `debugUI` est exposé dans la console :

```javascript
// Afficher les différents écrans
debugUI.showForm()           // Formulaire initial
debugUI.showLoading()        // Écran de chargement
debugUI.showReview(5)        // Revue avec 5 test cases
debugUI.showReview(10)       // Revue avec 10 test cases (test scroll)
debugUI.showInjection(0)     // Injection - en cours
debugUI.showInjection(1)     // Injection - étape 1 OK
debugUI.showInjection(2)     // Injection - terminée

// Utilitaires
debugUI.setEditing(0)        // Active l'édition du test case #1
debugUI.getState()           // Affiche l'état actuel du composant
debugUI.getMockTestCases(5)  // Retourne 5 test cases mockés (sans changer l'UI)
```

### Données mockées

Les test cases mockés incluent :
- Des titres de longueurs variées
- Du contenu Gherkin réaliste
- Différents types (Cucumber, Manual)
- Un test case désélectionné (pour tester le style `.deselected`)

### Exemple de workflow debug

1. Ouvrir `http://localhost:3000?debug=review&n=5`
2. Inspecter les styles de `.review-card`
3. Dans la console : `debugUI.setEditing(0)` pour tester le mode édition
4. Ajuster le CSS
5. `debugUI.showInjection(2)` pour vérifier l'écran de succès

## 🐛 Troubleshooting

### Erreur CORS

**Problème :** `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Solution :** Configurez les headers CORS sur votre workflow n8n (voir section Configuration n8n).

### Webhook n'est pas appelé

**Problème :** Aucune requête n'est envoyée au webhook

**Solution :**
1. Ouvrez la console du navigateur (F12)
2. Vérifiez les logs console (démarrent par 🚀, ✅ ou ❌)
3. Vérifiez que `N8N_WEBHOOK_URL` est bien configurée dans `src/js/app.js`

### Le formulaire ne se réinitialise pas

**Problème :** Le formulaire reste rempli après succès

**Solution :** Vérifiez que le serveur n8n retourne un JSON valide avec `success: true`.

## 📸 Screenshots

_TODO: Ajouter des captures d'écran après déploiement_

- Screenshot mobile : ![Mobile view](#)
- Screenshot desktop : ![Desktop view](#)
- Screenshot états : ![States (loading/success/error)](#)

## 🤝 Contribution

Ce projet est un outil interne. Pour toute modification :

1. Respectez les conventions définies dans `CLAUDE.md`
2. Testez manuellement toutes les fonctionnalités
3. Maintenez la compatibilité mobile/desktop
4. Ne pas ajouter de dépendances npm ou frameworks externes

## 📄 Licence

Propriété interne - Tous droits réservés

## 📞 Support

Pour toute question ou problème :
- Consultez d'abord `CLAUDE.md` pour les détails techniques
- Vérifiez les logs console du navigateur (F12)
- Contactez l'équipe DevOps pour les problèmes n8n

---

**Powered by n8n • Built with Alpine.js • Deployed on Netlify**
