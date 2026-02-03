// ============================================
// QA Test Cases Generator - Alpine.js Logic
// ============================================

// Debug mode
const DEBUG_MODE = false;
if (DEBUG_MODE) {
    console.log('🔧 Debug mode is ON');
}

// Configuration: URLs des webhooks n8n
// Phase 1: Génération des test cases (retourne les test cases pour revue)
const N8N_WEBHOOK_GENERATE_URL = `https://n8n.accor-ecom.fr/webhook${DEBUG_MODE?'-test':''}/case-writer`;
// Phase 2: Injection des test cases validés dans Xray
const N8N_WEBHOOK_INJECT_URL = `https://n8n.accor-ecom.fr/webhook${DEBUG_MODE?'-test':''}/inject-testcases`;

// Configuration Pusher
const PUSHER_APP_KEY = 'f07b39b2b4b01021840d';
const PUSHER_CLUSTER = 'eu';

/**
 * Génère un identifiant unique pour le channel Pusher
 * Format: qa-channel-{timestamp}-{random}
 */
function generateChannelId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `qa-channel-${timestamp}-${random}`;
}

// Génération du channel ID unique au chargement de la page
// const CHANNEL_ID = generateChannelId();
const CHANNEL_ID = (DEBUG_MODE) ? 'qa-agent-front' : generateChannelId();
console.log('📡 Channel ID generated:', CHANNEL_ID);

// Initialisation Pusher
let pusherInstance = null;
let pusherChannel = null;

function initializePusher() {
    try {
        console.log('🚀 Initializing Pusher...');
        console.log('📋 App Key:', PUSHER_APP_KEY);
        console.log('🌍 Cluster:', PUSHER_CLUSTER);
        console.log('🆔 Channel ID:', CHANNEL_ID);

        // Initialisation de Pusher avec debug mode si activé
        pusherInstance = new Pusher(PUSHER_APP_KEY, {
            cluster: PUSHER_CLUSTER,
            encrypted: true,
            enabledTransports: ['ws', 'wss'],
            logToConsole: DEBUG_MODE
        });

        // Abonnement au channel unique
        pusherChannel = pusherInstance.subscribe(CHANNEL_ID);

        console.log('✅ Pusher initialized and subscribed to channel:', CHANNEL_ID);

        // Événement de connexion réussie
        pusherInstance.connection.bind('connected', () => {
            console.log('🔗 Pusher connected successfully');
            console.log('📡 Connection state:', pusherInstance.connection.state);
        });

        // Événement de souscription réussie
        pusherChannel.bind('pusher:subscription_succeeded', () => {
            console.log('✅ Successfully subscribed to channel:', CHANNEL_ID);
        });

        // DEBUG: Capturer TOUS les événements pour diagnostic
        pusherChannel.bind_global((eventName, data) => {
            console.log('🌐 [GLOBAL EVENT] Received:', eventName);
            console.log('🌐 [GLOBAL EVENT] Data:', data);
        });

        // Événement de souscription échouée
        pusherChannel.bind('pusher:subscription_error', (status) => {
            console.error('❌ Subscription error:', status);
        });

        // Événement en cas d'erreur de connexion
        pusherInstance.connection.bind('error', (err) => {
            console.error('❌ Pusher connection error:', err);
        });

        // État de connexion
        pusherInstance.connection.bind('state_change', (states) => {
            console.log('🔄 Pusher state changed:', states.previous, '→', states.current);
        });

        return pusherChannel;
    } catch (error) {
        console.error('❌ Failed to initialize Pusher:', error);
        return null;
    }
}

// Initialisation Pusher immédiate (avant Alpine.js)
initializePusher();

// DEBUG: Exposer des fonctions de test dans la console
window.debugPusher = {
    getChannel: () => pusherChannel,
    getInstance: () => pusherInstance,
    getChannelId: () => CHANNEL_ID,
    checkSubscription: () => {
        console.log('📡 Channel:', pusherChannel);
        console.log('📡 Channel subscribed:', pusherChannel?.subscribed);
        console.log('📡 Connection state:', pusherInstance?.connection?.state);
    },
    simulateEvent: (eventName, data) => {
        console.log(`🧪 Simulating event: ${eventName}`);
        pusherChannel?.emit(eventName, data);
    }
};

// ============================================
// DEBUG UI - Mode debug pour développement CSS
// Activé via ?debug=true dans l'URL
// ============================================

const urlParams = new URLSearchParams(window.location.search);
const UI_DEBUG_MODE = urlParams.get('debug') === 'true' || urlParams.has('debug');
const UI_DEBUG_SCREEN = urlParams.get('screen') || urlParams.get('debug');
const UI_DEBUG_COUNT = parseInt(urlParams.get('n')) || 3;
const UI_DEBUG_STEP = parseInt(urlParams.get('step')) || 0;

/**
 * Génère des test cases mockés réalistes pour le debug
 * @param {number} count - Nombre de test cases à générer
 * @returns {Array} Tableau de test cases au format Xray
 */
function generateMockTestCases(count = 3) {
    const mockData = [
        {
            title: 'Vérifier la recherche de chambres disponibles',
            gherkin: `Feature: Recherche de chambres disponibles

Scenario: Recherche avec dates valides
  Given l'utilisateur est sur la page d'accueil
  When il sélectionne une date d'arrivée "2024-03-15"
  And il sélectionne une date de départ "2024-03-18"
  And il clique sur "Rechercher"
  Then une liste de chambres disponibles s'affiche
  And chaque chambre affiche son prix par nuit`,
            type: 'Cucumber'
        },
        {
            title: 'Valider le processus de réservation avec paiement par carte',
            gherkin: `Feature: Processus de réservation

Scenario: Réservation avec carte de crédit
  Given l'utilisateur a sélectionné une chambre "Suite Deluxe"
  And le prix affiché est "250€ par nuit"
  When il remplit le formulaire de réservation
  And il entre les informations de carte bancaire
  And il clique sur "Confirmer la réservation"
  Then un email de confirmation est envoyé
  And le statut de la réservation est "Confirmée"`,
            type: 'Cucumber'
        },
        {
            title: 'Test d\'annulation de réservation dans les délais',
            gherkin: `Feature: Annulation de réservation

Scenario: Annulation gratuite sous 48h
  Given l'utilisateur a une réservation active
  And la date d'arrivée est dans plus de 48 heures
  When il accède à "Mes réservations"
  And il clique sur "Annuler"
  And il confirme l'annulation
  Then la réservation est annulée
  And aucun frais n'est prélevé
  And un email de confirmation d'annulation est envoyé`,
            type: 'Cucumber'
        },
        {
            title: 'Vérifier l\'affichage des équipements de la chambre',
            gherkin: `Feature: Affichage des équipements

Scenario: Liste des équipements visibles
  Given l'utilisateur consulte une fiche chambre
  When la page est complètement chargée
  Then les équipements suivants sont affichés:
    | WiFi gratuit |
    | Climatisation |
    | Mini-bar |
    | Coffre-fort |
  And chaque équipement a une icône associée`,
            type: 'Cucumber'
        },
        {
            title: 'Validation des champs obligatoires du formulaire client',
            gherkin: `Feature: Validation formulaire client

Scenario: Soumission avec champs manquants
  Given l'utilisateur est sur le formulaire de réservation
  When il laisse le champ "Email" vide
  And il clique sur "Continuer"
  Then un message d'erreur s'affiche sous le champ Email
  And le message indique "Ce champ est obligatoire"
  And le formulaire n'est pas soumis`,
            type: 'Cucumber'
        },
        {
            title: 'Test de connexion avec identifiants invalides',
            gherkin: `Feature: Authentification utilisateur

Scenario: Connexion échouée avec mauvais mot de passe
  Given l'utilisateur est sur la page de connexion
  When il entre l'email "test@hotel.com"
  And il entre un mot de passe incorrect
  And il clique sur "Se connecter"
  Then un message d'erreur s'affiche
  And le message indique "Identifiants incorrects"
  And l'utilisateur reste sur la page de connexion`,
            type: 'Cucumber'
        },
        {
            title: 'Vérifier le calcul du prix total avec taxes',
            gherkin: `Feature: Calcul du prix

Scenario: Prix total avec TVA et taxe de séjour
  Given l'utilisateur a sélectionné une chambre à 100€/nuit
  And la durée du séjour est de 3 nuits
  When le récapitulatif de prix s'affiche
  Then le sous-total est "300€"
  And la TVA (10%) est "30€"
  And la taxe de séjour est "6€"
  And le total est "336€"`,
            type: 'Cucumber'
        },
        {
            title: 'Test responsive sur mobile - Menu navigation',
            gherkin: `Feature: Navigation mobile

Scenario: Menu hamburger sur smartphone
  Given l'utilisateur accède au site sur un écran 375px
  When la page est chargée
  Then le menu principal est masqué
  And un bouton hamburger est visible
  When l'utilisateur clique sur le bouton hamburger
  Then le menu s'ouvre en overlay
  And tous les liens de navigation sont accessibles`,
            type: 'Manual'
        },
        {
            title: 'Vérifier la persistance du panier',
            gherkin: `Feature: Persistance panier

Scenario: Panier conservé après rafraîchissement
  Given l'utilisateur a ajouté une chambre au panier
  When il rafraîchit la page
  Then le panier contient toujours la chambre sélectionnée
  And le prix affiché est identique`,
            type: 'Cucumber'
        },
        {
            title: 'Test de performance - Chargement page d\'accueil',
            gherkin: `Feature: Performance

Scenario: Temps de chargement acceptable
  Given le cache du navigateur est vidé
  When l'utilisateur accède à la page d'accueil
  Then la page est interactive en moins de 3 secondes
  And le Largest Contentful Paint est inférieur à 2.5s
  And aucune erreur console n'est présente`,
            type: 'Manual'
        }
    ];

    const testCases = [];
    for (let i = 0; i < count; i++) {
        const mock = mockData[i % mockData.length];
        testCases.push({
            xray_issue_type: 'Test',
            xray_testtype: mock.type,
            xray_gherkin_def: mock.gherkin,
            fields: {
                summary: mock.title,
                project: { key: 'HOTEL' },
                issuetype: { name: 'Test' }
            },
            // Propriétés d'affichage pour l'interface
            id: `tc-mock-${Date.now()}-${i}`,
            selected: i !== 2, // Le 3ème est désélectionné pour tester le style
            _displayTitle: mock.title,
            _displaySteps: mock.gherkin,
            _displayType: mock.type
        });
    }
    return testCases;
}

// Référence au composant Alpine (sera définie après init)
let alpineComponent = null;

/**
 * Interface de debug exposée globalement
 */
window.debugUI = {
    /**
     * Vérifie si le mode debug UI est actif
     */
    isActive: () => UI_DEBUG_MODE,

    /**
     * Retourne au formulaire initial
     */
    showForm: () => {
        if (!alpineComponent) {
            console.error('❌ Alpine component not ready');
            return;
        }
        console.log('🔧 [DEBUG UI] Showing form');
        alpineComponent.loading = false;
        alpineComponent.reviewMode = false;
        alpineComponent.injecting = false;
        alpineComponent.error = false;
        alpineComponent.success = false;
        alpineComponent.testCases = [];
        alpineComponent.formData.jira_key = '';
    },

    /**
     * Affiche l'écran de chargement (génération)
     */
    showLoading: () => {
        if (!alpineComponent) {
            console.error('❌ Alpine component not ready');
            return;
        }
        console.log('🔧 [DEBUG UI] Showing loading overlay');
        alpineComponent.reviewMode = false;
        alpineComponent.injecting = false;
        alpineComponent.loading = true;
        alpineComponent.formData.jira_key = 'HOTEL-123';
    },

    /**
     * Affiche l'écran de revue avec des test cases mockés
     * @param {number} count - Nombre de test cases (défaut: 3)
     */
    showReview: (count = 3) => {
        if (!alpineComponent) {
            console.error('❌ Alpine component not ready');
            return;
        }
        console.log(`🔧 [DEBUG UI] Showing review with ${count} test cases`);
        alpineComponent.loading = false;
        alpineComponent.injecting = false;
        alpineComponent.reviewMode = true;
        alpineComponent.formData.jira_key = 'HOTEL-123';
        alpineComponent.testCases = generateMockTestCases(count);
        alpineComponent.editingIndex = null;
    },

    /**
     * Affiche l'écran d'injection
     * @param {number} step - Étape (0: initial, 1: insertion terminée, 2: tout terminé)
     */
    showInjection: (step = 0) => {
        if (!alpineComponent) {
            console.error('❌ Alpine component not ready');
            return;
        }
        console.log(`🔧 [DEBUG UI] Showing injection at step ${step}`);
        alpineComponent.loading = false;
        alpineComponent.reviewMode = false;
        alpineComponent.injecting = true;
        alpineComponent.formData.jira_key = 'HOTEL-123';

        // Reset les étapes
        alpineComponent.injectionSteps.testsInserted = step >= 1;
        alpineComponent.injectionSteps.testsLinked = step >= 2;

        if (step >= 2) {
            alpineComponent.success = true;
            alpineComponent.message = 'Test cases injectés avec succès dans Xray !';
        }
    },

    /**
     * Force l'édition d'un test case spécifique
     * @param {number} index - Index du test case à éditer
     */
    setEditing: (index) => {
        if (!alpineComponent) {
            console.error('❌ Alpine component not ready');
            return;
        }
        if (!alpineComponent.reviewMode) {
            console.warn('⚠️ Not in review mode, switching to review first');
            window.debugUI.showReview(5);
        }
        console.log(`🔧 [DEBUG UI] Setting editing index to ${index}`);
        alpineComponent.editingIndex = index;
    },

    /**
     * Retourne les test cases mockés sans modifier l'état
     * @param {number} count - Nombre de test cases
     */
    getMockTestCases: (count = 3) => generateMockTestCases(count),

    /**
     * Affiche l'état actuel du composant
     */
    getState: () => {
        if (!alpineComponent) {
            console.error('❌ Alpine component not ready');
            return null;
        }
        return {
            loading: alpineComponent.loading,
            reviewMode: alpineComponent.reviewMode,
            injecting: alpineComponent.injecting,
            testCasesCount: alpineComponent.testCases.length,
            editingIndex: alpineComponent.editingIndex,
            injectionSteps: { ...alpineComponent.injectionSteps }
        };
    }
};

/**
 * Crée le bandeau de debug flottant
 */
function createDebugBanner() {
    if (!UI_DEBUG_MODE) return;

    const banner = document.createElement('div');
    banner.id = 'debug-banner';
    banner.innerHTML = `
        <span class="debug-label">🔧 DEBUG</span>
        <button onclick="debugUI.showForm()">Form</button>
        <button onclick="debugUI.showLoading()">Loading</button>
        <button onclick="debugUI.showReview(3)">Review (3)</button>
        <button onclick="debugUI.showReview(10)">Review (10)</button>
        <button onclick="debugUI.showInjection(0)">Inject-0</button>
        <button onclick="debugUI.showInjection(1)">Inject-1</button>
        <button onclick="debugUI.showInjection(2)">Inject-2</button>
        <button onclick="debugUI.setEditing(0)">Edit #1</button>
    `;
    document.body.appendChild(banner);
    console.log('🔧 [DEBUG UI] Banner created');
}

// Créer le bandeau après le chargement du DOM
if (UI_DEBUG_MODE) {
    console.log('🔧 [DEBUG UI] Mode activated via URL parameter');
    document.addEventListener('DOMContentLoaded', createDebugBanner);
}

// Initialisation Alpine.js
document.addEventListener('alpine:init', () => {
    // Composant principal du formulaire
    Alpine.data('formHandler', () => ({
        // État initial du composant
        formData: {
            jira_key: '',
            format: 'gherkin', // Valeur par défaut
            prompt: '',
            user_agent: 'web_ui',
            channel_id: CHANNEL_ID // Ajout du channel ID Pusher
        },
        loading: false,
        error: false,
        success: false,
        message: '',
        pusherNotifications: [], // Stockage des notifications Pusher

        // === PHASE DE REVUE ===
        reviewMode: false, // Active l'interface de revue
        testCases: [], // Test cases générés à valider
        editingIndex: null, // Index du test case en cours d'édition
        injecting: false, // État de chargement lors de l'injection

        // États des étapes de progression (Phase 1: génération)
        progressSteps: {
            testsGenerated: false,
            testsInserted: false,
            testsLinked: false
        },

        // États des étapes de progression (Phase 2: injection)
        injectionSteps: {
            testsInserted: false,
            testsLinked: false
        },

        // Progression globale calculée (Phase 1: génération)
        get overallProgress() {
            const steps = Object.values(this.progressSteps);
            const completed = steps.filter(step => step === true).length;
            return Math.round((completed / steps.length) * 100);
        },

        // Progression de l'injection (Phase 2)
        get injectionProgress() {
            const steps = Object.values(this.injectionSteps);
            const completed = steps.filter(step => step === true).length;
            return Math.round((completed / steps.length) * 100);
        },

        /**
         * Initialise l'écoute des événements Pusher
         */
        init() {
            console.log('🎬 Alpine.js component initialized');
            console.log('📡 Pusher channel status:', pusherChannel ? 'Connected' : 'Not connected');
            console.log('🆔 Channel ID:', CHANNEL_ID);

            // Capturer la référence pour debugUI
            alpineComponent = this;

            // Appliquer l'écran de debug si spécifié dans l'URL
            if (UI_DEBUG_MODE && UI_DEBUG_SCREEN && UI_DEBUG_SCREEN !== 'true') {
                setTimeout(() => {
                    switch (UI_DEBUG_SCREEN) {
                        case 'loading':
                            window.debugUI.showLoading();
                            break;
                        case 'review':
                            window.debugUI.showReview(UI_DEBUG_COUNT);
                            break;
                        case 'injection':
                            window.debugUI.showInjection(UI_DEBUG_STEP);
                            break;
                        default:
                            console.log(`🔧 [DEBUG UI] Unknown screen: ${UI_DEBUG_SCREEN}`);
                    }
                }, 100);
            }

            // Vérifier que Pusher est bien initialisé
            if (!pusherChannel) {
                console.error('❌ Pusher channel not initialized! Retrying...');
                initializePusher();
            }

            // Binding des événements Pusher
            if (pusherChannel) {
                console.log('✅ Binding Pusher events...');

                // === PHASE 1: GÉNÉRATION ===

                // Étape 1: Tests générés - DÉCLENCHE LA REVUE
                // Événement: 'cases-generated' avec payload au format Xray
                console.log('🔗 Binding cases-generated event...');
                const self = this; // Capture Alpine context explicitly
                pusherChannel.bind('cases-generated', function(data) {
                    console.log('📝 [HANDLER] Test cases generated (Xray format):', data);
                    console.log('📝 [HANDLER] Alpine context (self):', self);
                    console.log('📝 [HANDLER] reviewMode before:', self.reviewMode);
                    self.progressSteps.testsGenerated = true;
                    self.handlePusherNotification(data);
                    // Passer en mode revue avec les test cases reçus
                    self.enterReviewMode(data);
                    console.log('📝 [HANDLER] reviewMode after:', self.reviewMode);
                });
                console.log('✅ cases-generated event bound');

                // === PHASE 2: INJECTION (après validation utilisateur) ===

                // Étape 2: Tests insérés dans Jira/Xray
                pusherChannel.bind('tests-inserted', (data) => {
                    console.log('💾 Tests inserted in Jira:', data);
                    if (this.injecting) {
                        this.injectionSteps.testsInserted = true;
                    } else {
                        this.progressSteps.testsInserted = true;
                    }
                    this.handlePusherNotification(data);
                });

                // Étape 3: Tests injectés dans Xray et liés à la User Story
                pusherChannel.bind('xray-injected', (data) => {
                    console.log('🔗 Tests injected in Xray and linked to User Story:', data);
                    if (this.injecting) {
                        this.injectionSteps.testsLinked = true;
                        this.handleInjectionComplete(data);
                    } else {
                        this.progressSteps.testsLinked = true;
                        this.handleTestComplete(data);
                    }
                    this.handlePusherNotification(data);
                });

                // Événement d'erreur
                pusherChannel.bind('test-error', (data) => {
                    console.log('❌ Test generation error:', data);
                    this.handleTestError(data);
                });

                console.log('✅ All Pusher events bound successfully');
            } else {
                console.error('❌ Cannot bind events: Pusher channel is null');
            }
        },

        /**
         * Gère les notifications Pusher génériques
         */
        handlePusherNotification(data) {
            this.pusherNotifications.push(data);
            // Afficher une notification à l'utilisateur si besoin
            if (data.message) {
                console.log('💬 Notification:', data.message);
            }
        },

        /**
         * Gère la complétion de génération de tests
         * NE ferme PAS l'overlay automatiquement
         */
        handleTestComplete(data) {
            // On garde loading à true pour afficher l'overlay avec le bouton
            // this.loading = false;  // Commenté pour garder l'overlay visible
            this.success = true;
            this.error = false;
            this.message = data.message || 'Test cases générés avec succès !';
        },

        /**
         * Réinitialise et ferme l'overlay après succès
         * Appelé par le bouton "Générer de nouveaux tests"
         */
        resetAndClose() {
            console.log('🔄 Resetting and closing overlay');
            this.loading = false; // Ferme l'overlay
            this.success = false;
            this.error = false;
            this.message = '';
            this.resetProgressSteps();
            this.resetForm();
        },

        /**
         * Gère les erreurs de génération de tests
         */
        handleTestError(data) {
            this.loading = false;
            this.error = true;
            this.success = false;
            this.message = data.message || 'Une erreur est survenue lors de la génération.';
            // Réinitialiser les étapes en cas d'erreur
            this.resetProgressSteps();
        },

        /**
         * Réinitialise les étapes de progression
         */
        resetProgressSteps() {
            this.progressSteps.testsGenerated = false;
            this.progressSteps.testsInserted = false;
            this.progressSteps.testsLinked = false;
        },

        /**
         * Soumet le formulaire au webhook n8n
         * Gère la validation, l'envoi et les retours (succès/erreur)
         */
        async submitForm() {
            // DEBUG: Vérifier l'état de Pusher avant soumission
            console.log('🔍 [PRE-SUBMIT] Checking Pusher state...');
            console.log('🔍 [PRE-SUBMIT] pusherChannel:', pusherChannel);
            console.log('🔍 [PRE-SUBMIT] pusherChannel.subscribed:', pusherChannel?.subscribed);
            console.log('🔍 [PRE-SUBMIT] pusherInstance.connection.state:', pusherInstance?.connection?.state);
            console.log('🔍 [PRE-SUBMIT] channel_id being sent:', this.formData.channel_id);

            // Validation: champ jira_key obligatoire
            if (!this.formData.jira_key || this.formData.jira_key.trim() === '') {
                this.error = true;
                this.success = false;
                this.message = 'Le champ Jira ID est obligatoire';
                console.log('❌ Validation failed: Jira ID is empty');
                return;
            }

            // Réinitialisation des messages et des étapes avant soumission
            this.error = false;
            this.success = false;
            this.message = '';
            this.loading = true;
            this.resetProgressSteps(); // Réinitialiser les étapes de progression

            console.log('🚀 Submitting form with data:', this.formData);

            try {
                // Appel POST au webhook n8n Phase 1 (génération)
                const response = await fetch(N8N_WEBHOOK_GENERATE_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        jira_key: this.formData.jira_key.trim(),
                        format: this.formData.format,
                        prompt: this.formData.prompt,
                        user_agent: this.formData.user_agent,
                        channel_id: this.formData.channel_id, // Envoi du channel ID à n8n
                        text: `${this.formData.jira_key.trim()} ${this.formData.format} ${this.formData.prompt}`
                    })
                });

                // Parsing de la réponse JSON
                const data = await response.json();

                // Vérification du statut HTTP
                if (!response.ok) {
                    throw new Error(data.message || `Erreur HTTP ${response.status}`);
                }

                // Succès
                console.log('✅ Success response:', data);
                this.success = true;
                this.error = false;
                this.message = data.message || 'Test cases générés avec succès !';

            } catch (err) {
                // Gestion des erreurs (réseau, serveur, parsing)
                console.error('❌ Error during submission:', err);
                this.error = true;
                this.success = false;

                // Message d'erreur explicite selon le type d'erreur
                if (err.name === 'TypeError' && err.message.includes('fetch')) {
                    this.message = 'Erreur de connexion au serveur. Vérifiez votre connexion internet.';
                } else if (err.message.includes('JSON')) {
                    this.message = 'Erreur de traitement de la réponse du serveur.';
                } else {
                    this.message = err.message || 'Une erreur est survenue lors de la génération.';
                }
            } finally {
                // Fin du chargement dans tous les cas
                // this.loading = false;
            }
        },

        /**
         * Réinitialise le formulaire à son état initial
         * Efface tous les messages et les données saisies
         */
        resetForm() {
            console.log('🔄 Resetting form');
            this.formData.jira_key = '';
            this.formData.format = 'gherkin';
            this.formData.prompt = '';
            this.loading = false;
            this.error = false;
            this.success = false;
            this.message = '';

            // Focus automatique sur le premier champ après reset
            setTimeout(() => {
                const firstInput = document.getElementById('us-jira-id');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 100);
        },

        // ============================================
        // PHASE DE REVUE - Nouvelles méthodes
        // ============================================

        /**
         * Entre en mode revue avec les test cases générés
         * @param {Object|Array} data - Données reçues via Pusher contenant les test cases au format Xray
         *
         * Format attendu (Xray):
         * [{ success, operation, channel, eventName, payload: [...testCases] }]
         * ou directement un tableau de test cases
         */
        enterReviewMode(data) {
            console.log('👀 Entering review mode with data:', data);
            this.loading = false;
            this.reviewMode = true;

            let rawTestCases = [];

            // Extraire les test cases selon la structure reçue
            if (Array.isArray(data)) {
                // Format: [{..., payload: [...]}] ou directement [testCase, testCase, ...]
                if (data.length > 0 && data[0].payload && Array.isArray(data[0].payload)) {
                    // Format Pusher avec wrapper: [{success, payload: [...]}]
                    rawTestCases = data[0].payload;
                } else if (data.length > 0 && data[0].xray_issue_type) {
                    // Format direct: tableau de test cases Xray
                    rawTestCases = data;
                }
            } else if (data.payload && Array.isArray(data.payload)) {
                // Format objet avec payload
                rawTestCases = data.payload;
            } else if (data.testCases && Array.isArray(data.testCases)) {
                // Format legacy
                rawTestCases = data.testCases;
            }

            // Transformer les test cases Xray pour l'affichage tout en conservant la structure originale
            this.testCases = rawTestCases.map((tc, index) => ({
                // Conserver TOUTE la structure Xray originale pour l'injection
                ...tc,
                // Ajouter des propriétés pour l'interface de revue
                id: `tc-${Date.now()}-${index}`,
                selected: true,
                // Propriétés d'affichage (mappées depuis le format Xray)
                _displayTitle: tc.fields?.summary || 'Test case sans titre',
                _displaySteps: tc.xray_gherkin_def || '',
                _displayType: tc.xray_testtype || 'Cucumber'
            }));

            console.log(`✅ Loaded ${this.testCases.length} test cases for review (Xray format)`);
        },

        /**
         * Démarre l'édition d'un test case
         * @param {number} index - Index du test case à éditer
         */
        startEditing(index) {
            console.log('✏️ Start editing test case at index:', index);
            this.editingIndex = index;
        },

        /**
         * Annule l'édition en cours
         */
        cancelEditing() {
            console.log('❌ Cancel editing');
            this.editingIndex = null;
        },

        /**
         * Sauvegarde les modifications d'un test case
         * @param {number} index - Index du test case modifié
         */
        saveEditing(index) {
            console.log('💾 Save editing for test case at index:', index);
            this.editingIndex = null;
            // Les modifications sont déjà liées via x-model
        },

        /**
         * Supprime un test case de la liste
         * @param {number} index - Index du test case à supprimer
         */
        deleteTestCase(index) {
            console.log('🗑️ Delete test case at index:', index);
            this.testCases.splice(index, 1);
        },

        /**
         * Bascule la sélection d'un test case
         * @param {number} index - Index du test case
         */
        toggleTestCaseSelection(index) {
            this.testCases[index].selected = !this.testCases[index].selected;
        },

        /**
         * Sélectionne ou désélectionne tous les test cases
         * @param {boolean} selectAll - true pour tout sélectionner, false pour tout désélectionner
         */
        selectAllTestCases(selectAll) {
            this.testCases.forEach(tc => tc.selected = selectAll);
        },

        /**
         * Retourne le nombre de test cases sélectionnés
         */
        get selectedTestCasesCount() {
            return this.testCases.filter(tc => tc.selected).length;
        },

        /**
         * Annule la revue et retourne au formulaire
         */
        cancelReview() {
            console.log('❌ Cancel review, returning to form');
            this.reviewMode = false;
            this.testCases = [];
            this.editingIndex = null;
            this.resetProgressSteps();
        },

        /**
         * Relance la génération des test cases
         */
        regenerateTestCases() {
            console.log('🔄 Regenerating test cases');
            this.reviewMode = false;
            this.testCases = [];
            this.editingIndex = null;
            this.resetProgressSteps();
            // Relancer la soumission
            this.submitForm();
        },

        /**
         * Valide et injecte les test cases sélectionnés dans Xray
         * Envoie les test cases au format Xray original (sans les propriétés frontend)
         */
        async validateAndInject() {
            const selectedTestCases = this.testCases.filter(tc => tc.selected);

            if (selectedTestCases.length === 0) {
                this.error = true;
                this.message = 'Veuillez sélectionner au moins un test case à injecter.';
                return;
            }

            console.log('🚀 Validating and injecting', selectedTestCases.length, 'test cases');

            // Nettoyer les test cases pour ne garder que le format Xray original
            const xrayTestCases = selectedTestCases.map(tc => {
                // Créer une copie sans les propriétés frontend
                const { id, selected, _displayTitle, _displaySteps, _displayType, ...xrayData } = tc;
                return xrayData;
            });

            console.log('📤 Sending Xray payload:', xrayTestCases);

            this.error = false;
            this.message = '';
            this.injecting = true;
            this.reviewMode = false;
            this.resetInjectionSteps();

            try {
                const response = await fetch(N8N_WEBHOOK_INJECT_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        jira_key: this.formData.jira_key.trim(),
                        channel_id: this.formData.channel_id,
                        testCases: xrayTestCases // Format Xray original
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || `Erreur HTTP ${response.status}`);
                }

                console.log('✅ Injection request sent successfully:', data);
                // L'injection continue via les événements Pusher

            } catch (err) {
                console.error('❌ Error during injection:', err);
                this.error = true;
                this.injecting = false;
                this.reviewMode = true; // Retourner en mode revue

                if (err.name === 'TypeError' && err.message.includes('fetch')) {
                    this.message = 'Erreur de connexion au serveur. Vérifiez votre connexion internet.';
                } else {
                    this.message = err.message || 'Une erreur est survenue lors de l\'injection.';
                }
            }
        },

        /**
         * Réinitialise les étapes d'injection
         */
        resetInjectionSteps() {
            this.injectionSteps.testsInserted = false;
            this.injectionSteps.testsLinked = false;
        },

        /**
         * Gère la fin de l'injection
         */
        handleInjectionComplete(data) {
            console.log('✅ Injection complete:', data);
            this.success = true;
            this.error = false;
            this.message = data.message || 'Test cases injectés avec succès dans Xray !';
        },

        /**
         * Réinitialise tout après l'injection et ferme l'overlay
         */
        resetAfterInjection() {
            console.log('🔄 Resetting after injection');
            this.injecting = false;
            this.success = false;
            this.error = false;
            this.message = '';
            this.testCases = [];
            this.editingIndex = null;
            this.resetProgressSteps();
            this.resetInjectionSteps();
            this.resetForm();
        }
    }));
});
