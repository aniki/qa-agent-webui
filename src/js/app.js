// ============================================
// QA Test Cases Generator - Alpine.js Logic
// ============================================

// Configuration: URL du webhook n8n
// Remplacer cette URL par votre instance n8n réelle
// const N8N_WEBHOOK_URL = 'https://n8n.accor-ecom.fr/webhook-test/qa-agent';
const N8N_WEBHOOK_URL = 'https://n8n.accor-ecom.fr/webhook-test/3e387bf6-3843-4851-8f0d-d3396ff9d159';

// Configuration Pusher
const PUSHER_APP_KEY = '285f4e972d37db4d1d3f';
const PUSHER_CLUSTER = 'eu';

// Debug mode
const DEBUG_MODE = true;
if (DEBUG_MODE) {
    console.log('🔧 Debug mode is ON');
}

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
const CHANNEL_ID = (DEBUG_MODE) ? 'qa-channel-debug' : generateChannelId();
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

        // États des étapes de progression
        progressSteps: {
            testsGenerated: false,
            testsInserted: false,
            testsLinked: false
        },

        // Progression globale calculée
        get overallProgress() {
            const steps = Object.values(this.progressSteps);
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

            // Vérifier que Pusher est bien initialisé
            if (!pusherChannel) {
                console.error('❌ Pusher channel not initialized! Retrying...');
                initializePusher();
            }

            // Binding des événements Pusher pour les 3 étapes de progression
            if (pusherChannel) {
                console.log('✅ Binding Pusher events...');

                // Étape 1: Tests générés
                pusherChannel.bind('tests-generated', (data) => {
                    console.log('📝 Tests generated:', data);
                    this.progressSteps.testsGenerated = true;
                    this.handlePusherNotification(data);
                });

                // Étape 2: Tests insérés dans Jira
                pusherChannel.bind('tests-inserted', (data) => {
                    console.log('💾 Tests inserted in Jira:', data);
                    this.progressSteps.testsInserted = true;
                    this.handlePusherNotification(data);
                });

                // Étape 3: Tests liés à la User Story
                pusherChannel.bind('tests-linked', (data) => {
                    console.log('🔗 Tests linked to User Story:', data);
                    this.progressSteps.testsLinked = true;
                    this.handlePusherNotification(data);
                    // Processus complet
                    this.handleTestComplete(data);
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
                // Appel POST au webhook n8n avec le channel_id
                const response = await fetch(N8N_WEBHOOK_URL, {
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
        }
    }));
});
