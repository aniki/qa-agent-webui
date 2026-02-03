// ============================================
// QA Test Cases Generator - Web App Entry Point
// Alpine.js component using core modules
// ============================================

import {
    DEBUG_MODE,
    getChannelId,
    initializePusher,
    getPusherChannel,
    getPusherInstance,
    pusherDebug,
    generateTestCases,
    injectTestCases,
    formatApiError,
    parseTestCasesFromPusher,
    transformTestCasesForUI,
    cleanTestCasesForXray,
    generateMockTestCases
} from '../core/index.js';

// ============================================
// Initialize Pusher
// ============================================

const CHANNEL_ID = getChannelId();
console.log('📡 Channel ID generated:', CHANNEL_ID);

// Initialize Pusher immediately (before Alpine.js)
initializePusher(CHANNEL_ID);

// Expose Pusher debug utilities globally
if (DEBUG_MODE) {
    console.log('🔧 Debug mode is ON');
    window.debugPusher = pusherDebug;
}

// ============================================
// DEBUG UI - Mode debug pour développement CSS
// Activé via ?debug=true dans l'URL
// ============================================

const urlParams = new URLSearchParams(window.location.search);
const UI_DEBUG_MODE = urlParams.get('debug') === 'true' || urlParams.has('debug');
const UI_DEBUG_SCREEN = urlParams.get('screen') || urlParams.get('debug');
const UI_DEBUG_COUNT = parseInt(urlParams.get('n')) || 3;
const UI_DEBUG_STEP = parseInt(urlParams.get('step')) || 0;

// Reference to Alpine component (set after init)
let alpineComponent = null;

/**
 * Debug UI interface exposed globally
 */
window.debugUI = {
    isActive: () => UI_DEBUG_MODE,

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

        alpineComponent.injectionSteps.testsInserted = step >= 1;
        alpineComponent.injectionSteps.testsLinked = step >= 2;

        if (step >= 2) {
            alpineComponent.success = true;
            alpineComponent.message = 'Test cases injectés avec succès dans Xray !';
        }
    },

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

    getMockTestCases: (count = 3) => generateMockTestCases(count),

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
 * Creates the debug banner at the bottom of the screen
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

// Create banner after DOM load
if (UI_DEBUG_MODE) {
    console.log('🔧 [DEBUG UI] Mode activated via URL parameter');
    document.addEventListener('DOMContentLoaded', createDebugBanner);
}

// ============================================
// Alpine.js Component Registration
// ============================================

document.addEventListener('alpine:init', () => {
    Alpine.data('formHandler', () => ({
        // Initial state
        formData: {
            jira_key: '',
            format: 'gherkin',
            prompt: '',
            user_agent: 'web_ui',
            channel_id: CHANNEL_ID
        },
        loading: false,
        error: false,
        success: false,
        message: '',
        pusherNotifications: [],

        // Review phase state
        reviewMode: false,
        testCases: [],
        editingIndex: null,
        injecting: false,

        // Progress steps (Phase 1: generation)
        progressSteps: {
            testsGenerated: false,
            testsInserted: false,
            testsLinked: false
        },

        // Injection steps (Phase 2)
        injectionSteps: {
            testsInserted: false,
            testsLinked: false
        },

        // Computed progress
        get overallProgress() {
            const steps = Object.values(this.progressSteps);
            const completed = steps.filter(step => step === true).length;
            return Math.round((completed / steps.length) * 100);
        },

        get injectionProgress() {
            const steps = Object.values(this.injectionSteps);
            const completed = steps.filter(step => step === true).length;
            return Math.round((completed / steps.length) * 100);
        },

        /**
         * Initialize Pusher event listeners
         */
        init() {
            console.log('🎬 Alpine.js component initialized');

            const pusherChannel = getPusherChannel();
            console.log('📡 Pusher channel status:', pusherChannel ? 'Connected' : 'Not connected');
            console.log('🆔 Channel ID:', CHANNEL_ID);

            // Capture reference for debugUI
            alpineComponent = this;

            // Apply debug screen if specified in URL
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

            // Retry Pusher initialization if needed
            if (!pusherChannel) {
                console.error('❌ Pusher channel not initialized! Retrying...');
                initializePusher(CHANNEL_ID);
            }

            // Bind Pusher events
            const channel = getPusherChannel();
            if (channel) {
                console.log('✅ Binding Pusher events...');

                // Phase 1: Test cases generated - triggers review
                const self = this;
                channel.bind('cases-generated', function(data) {
                    console.log('📝 [HANDLER] Test cases generated (Xray format):', data);
                    self.progressSteps.testsGenerated = true;
                    self.handlePusherNotification(data);
                    self.enterReviewMode(data);
                });

                // Phase 2: Tests inserted
                channel.bind('tests-inserted', (data) => {
                    console.log('💾 Tests inserted in Jira:', data);
                    if (this.injecting) {
                        this.injectionSteps.testsInserted = true;
                    } else {
                        this.progressSteps.testsInserted = true;
                    }
                    this.handlePusherNotification(data);
                });

                // Phase 2: Tests linked (injection complete)
                channel.bind('xray-injected', (data) => {
                    console.log('🔗 Tests injected in Xray:', data);
                    if (this.injecting) {
                        this.injectionSteps.testsLinked = true;
                        this.handleInjectionComplete(data);
                    } else {
                        this.progressSteps.testsLinked = true;
                        this.handleTestComplete(data);
                    }
                    this.handlePusherNotification(data);
                });

                // Error event
                channel.bind('test-error', (data) => {
                    console.log('❌ Test generation error:', data);
                    this.handleTestError(data);
                });

                console.log('✅ All Pusher events bound successfully');
            } else {
                console.error('❌ Cannot bind events: Pusher channel is null');
            }
        },

        handlePusherNotification(data) {
            this.pusherNotifications.push(data);
            if (data.message) {
                console.log('💬 Notification:', data.message);
            }
        },

        handleTestComplete(data) {
            this.success = true;
            this.error = false;
            this.message = data.message || 'Test cases générés avec succès !';
        },

        resetAndClose() {
            console.log('🔄 Resetting and closing overlay');
            this.loading = false;
            this.success = false;
            this.error = false;
            this.message = '';
            this.resetProgressSteps();
            this.resetForm();
        },

        handleTestError(data) {
            this.loading = false;
            this.error = true;
            this.success = false;
            this.message = data.message || 'Une erreur est survenue lors de la génération.';
            this.resetProgressSteps();
        },

        resetProgressSteps() {
            this.progressSteps.testsGenerated = false;
            this.progressSteps.testsInserted = false;
            this.progressSteps.testsLinked = false;
        },

        /**
         * Submit form to n8n webhook
         */
        async submitForm() {
            // Validation
            if (!this.formData.jira_key || this.formData.jira_key.trim() === '') {
                this.error = true;
                this.success = false;
                this.message = 'Le champ Jira ID est obligatoire';
                console.log('❌ Validation failed: Jira ID is empty');
                return;
            }

            // Reset state
            this.error = false;
            this.success = false;
            this.message = '';
            this.loading = true;
            this.resetProgressSteps();

            console.log('🚀 Submitting form with data:', this.formData);

            try {
                const data = await generateTestCases(this.formData);
                console.log('✅ Success response:', data);
                this.success = true;
                this.error = false;
                this.message = data.message || 'Test cases générés avec succès !';
            } catch (err) {
                console.error('❌ Error during submission:', err);
                this.error = true;
                this.success = false;
                this.message = formatApiError(err);
            }
        },

        resetForm() {
            console.log('🔄 Resetting form');
            this.formData.jira_key = '';
            this.formData.format = 'gherkin';
            this.formData.prompt = '';
            this.loading = false;
            this.error = false;
            this.success = false;
            this.message = '';

            setTimeout(() => {
                const firstInput = document.getElementById('us-jira-id');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 100);
        },

        // ============================================
        // Review Phase Methods
        // ============================================

        enterReviewMode(data) {
            console.log('👀 Entering review mode with data:', data);
            this.loading = false;
            this.reviewMode = true;

            const rawTestCases = parseTestCasesFromPusher(data);
            this.testCases = transformTestCasesForUI(rawTestCases);

            console.log(`✅ Loaded ${this.testCases.length} test cases for review`);
        },

        startEditing(index) {
            console.log('✏️ Start editing test case at index:', index);
            this.editingIndex = index;
        },

        cancelEditing() {
            console.log('❌ Cancel editing');
            this.editingIndex = null;
        },

        saveEditing(index) {
            console.log('💾 Save editing for test case at index:', index);
            this.editingIndex = null;
        },

        deleteTestCase(index) {
            console.log('🗑️ Delete test case at index:', index);
            this.testCases.splice(index, 1);
        },

        toggleTestCaseSelection(index) {
            this.testCases[index].selected = !this.testCases[index].selected;
        },

        selectAllTestCases(selectAll) {
            this.testCases.forEach(tc => tc.selected = selectAll);
        },

        get selectedTestCasesCount() {
            return this.testCases.filter(tc => tc.selected).length;
        },

        cancelReview() {
            console.log('❌ Cancel review, returning to form');
            this.reviewMode = false;
            this.testCases = [];
            this.editingIndex = null;
            this.resetProgressSteps();
        },

        regenerateTestCases() {
            console.log('🔄 Regenerating test cases');
            this.reviewMode = false;
            this.testCases = [];
            this.editingIndex = null;
            this.resetProgressSteps();
            this.submitForm();
        },

        async validateAndInject() {
            const selectedTestCases = this.testCases.filter(tc => tc.selected);

            if (selectedTestCases.length === 0) {
                this.error = true;
                this.message = 'Veuillez sélectionner au moins un test case à injecter.';
                return;
            }

            console.log('🚀 Validating and injecting', selectedTestCases.length, 'test cases');

            const xrayTestCases = cleanTestCasesForXray(selectedTestCases);
            console.log('📤 Sending Xray payload:', xrayTestCases);

            this.error = false;
            this.message = '';
            this.injecting = true;
            this.reviewMode = false;
            this.resetInjectionSteps();

            try {
                const data = await injectTestCases(
                    this.formData.jira_key,
                    this.formData.channel_id,
                    xrayTestCases
                );
                console.log('✅ Injection request sent successfully:', data);
            } catch (err) {
                console.error('❌ Error during injection:', err);
                this.error = true;
                this.injecting = false;
                this.reviewMode = true;
                this.message = formatApiError(err);
            }
        },

        resetInjectionSteps() {
            this.injectionSteps.testsInserted = false;
            this.injectionSteps.testsLinked = false;
        },

        handleInjectionComplete(data) {
            console.log('✅ Injection complete:', data);
            this.success = true;
            this.error = false;
            this.message = data.message || 'Test cases injectés avec succès dans Xray !';
        },

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
