// ============================================
// QA Test Cases Generator - Chrome Extension Side Panel
// Persistent side panel using Alpine.js and core modules
// ============================================

import Pusher from 'pusher-js';
window.Pusher = Pusher;

import Alpine from '@alpinejs/csp';
import {
    getChannelId,
    initializePusher,
    getPusherChannel,
    getPusherInstance,
    bindPusherEvent,
    generateTestCases,
    injectTestCases,
    formatApiError,
    parseTestCasesFromPusher,
    transformTestCasesForUI,
    cleanTestCasesForXray
} from '../../core/index.js';

window.Alpine = Alpine;

document.addEventListener('alpine:init', () => {
    Alpine.data('sidePanelApp', () => ({
        // State
        initialized: false,
        channelId: getChannelId(),
        jiraKey: '',
        format: 'gherkin',
        prompt: '',
        testCases: [],
        loading: false,
        injecting: false,
        reviewMode: false,
        jiraDetected: false,
        detectedJiraKey: '',
        showJiraError: false,
        successMessage: '',
        errorMessage: '',
        editingIndex: null,
        editTitle: '',
        editSteps: '',
        pusherConnected: false,
        injectionSteps: {
            testsInserted: false,
            testsLinked: false
        },

        // Computed properties (required for CSP-compatible Alpine.js)
        get selectedCount() {
            return this.testCases.filter(tc => tc.selected).length;
        },

        get injectionProgress() {
            const { testsInserted, testsLinked } = this.injectionSteps;
            return testsLinked ? 100 : testsInserted ? 50 : 0;
        },

        get connectionStatusText() {
            return this.pusherConnected ? 'Connecté' : 'Déconnecté';
        },

        get step1StatusText() {
            return this.injectionSteps.testsInserted ? 'Terminé' : 'En cours...';
        },

        get step2StatusText() {
            if (this.injectionSteps.testsLinked) return 'Terminé';
            if (this.injectionSteps.testsInserted) return 'En cours...';
            return 'En attente';
        },

        get selectionCountText() {
            return `${this.selectedCount} / ${this.testCases.length} sélectionné(s)`;
        },

        get channelIdShort() {
            return this.channelId.substring(0, 20) + '...';
        },

        get injectionProgressStyle() {
            return `width: ${this.injectionProgress}%`;
        },

        // View state helpers for CSP compatibility
        get showLoadingOverlay() {
            return this.initialized && this.loading && !this.reviewMode && !this.injecting;
        },

        get showInjectionOverlay() {
            return this.initialized && this.injecting;
        },

        get showReviewMode() {
            return this.initialized && this.reviewMode;
        },

        get showFormSection() {
            return this.initialized && !this.reviewMode && !this.injecting && !this.loading;
        },

        get showErrorInForm() {
            return this.errorMessage && this.jiraKey;
        },

        get noTestCasesSelected() {
            return this.selectedCount === 0;
        },

        get hasNoTestCases() {
            return this.testCases.length === 0;
        },

        // Injection step class states
        get step1Classes() {
            return {
                'active': !this.injectionSteps.testsInserted,
                'completed': this.injectionSteps.testsInserted
            };
        },

        get step2Classes() {
            return {
                'active': this.injectionSteps.testsInserted && !this.injectionSteps.testsLinked,
                'completed': this.injectionSteps.testsLinked
            };
        },

        get connectorClasses() {
            return {
                'completed': this.injectionSteps.testsLinked
            };
        },

        // Helper methods for x-for items
        getCardNumber(index) {
            return `#${index + 1}`;
        },

        isEditing(index) {
            return this.editingIndex === index;
        },

        isNotEditing(index) {
            return this.editingIndex !== index;
        },

        // Init
        async init() {
            console.log('🚀 Side Panel initialized with Alpine.js');
            console.log('📡 Channel ID:', this.channelId);

            // Force reset all state to initial values
            this.loading = false;
            this.injecting = false;
            this.reviewMode = false;
            this.testCases = [];
            this.editingIndex = null;
            this.successMessage = '';
            this.errorMessage = '';
            this.injectionSteps = { testsInserted: false, testsLinked: false };

            // Clear any stale task state from storage
            await this.clearTaskState();

            // Initialize Pusher
            initializePusher(this.channelId);
            this.setupPusherEvents();
            this.monitorPusherConnection();

            // Listen for messages from content script or background
            this.setupMessageListener();

            // Try to auto-detect Jira key from active tab
            await this.detectJiraFromTab();

            // Load saved preferences
            await this.loadPreferences();

            // Mark as initialized - now safe to show content
            this.initialized = true;
            console.log('✅ Side Panel ready - showing form');
        },

        setupPusherEvents() {
            const channel = getPusherChannel();
            if (!channel) {
                console.error('❌ Pusher channel not available');
                return;
            }

            // Test cases generated - show review
            bindPusherEvent('cases-generated', (data) => {
                console.log('📝 Test cases generated:', data);
                const rawTestCases = parseTestCasesFromPusher(data);
                const transformedCases = transformTestCasesForUI(rawTestCases);
                // Add CSP-compatible display properties
                this.testCases = transformedCases.map((tc, idx) => ({
                    ...tc,
                    _cardNumber: `#${idx + 1}`,
                    _isEditing: false,
                    _isDeselected: !tc.selected
                }));
                this.loading = false;
                this.reviewMode = true;
                this.clearTaskState();
                this.showNativeNotification('Test cases générés', `${this.testCases.length} test cases prêts à valider`);
            });

            // Tests inserted in Xray
            bindPusherEvent('tests-inserted', (data) => {
                console.log('💾 Tests inserted:', data);
                this.injectionSteps.testsInserted = true;
                this.saveTaskState();
            });

            // Tests linked (injection complete)
            bindPusherEvent('xray-injected', (data) => {
                console.log('🔗 Tests linked:', data);
                this.injectionSteps.testsLinked = true;
                this.clearTaskState();
                this.showNativeNotification('Injection terminée', `${this.selectedCount} test cases injectés dans Xray`);
            });

            // Error event
            bindPusherEvent('test-error', (data) => {
                console.log('❌ Error:', data);
                this.loading = false;
                this.injecting = false;
                this.errorMessage = data.message || 'Une erreur est survenue';
                this.clearTaskState();
            });

            console.log('✅ Pusher events bound');
        },

        monitorPusherConnection() {
            const pusher = getPusherInstance();
            if (!pusher) return;

            pusher.connection.bind('connected', () => {
                this.pusherConnected = true;
                console.log('🔗 Pusher connected');
            });

            pusher.connection.bind('disconnected', () => {
                this.pusherConnected = false;
                console.log('🔌 Pusher disconnected');
            });

            pusher.connection.bind('error', () => {
                this.pusherConnected = false;
            });

            // Set initial state
            this.pusherConnected = pusher.connection.state === 'connected';
        },

        setupMessageListener() {
            if (typeof chrome === 'undefined' || !chrome.runtime) return;

            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                console.log('📩 Side panel received message:', message);

                switch (message.type) {
                    case 'SET_JIRA_KEY':
                        this.jiraKey = message.jiraKey;
                        this.detectedJiraKey = message.jiraKey;
                        this.jiraDetected = true;
                        sendResponse({ success: true });
                        break;

                    case 'TAB_CHANGED':
                        // Re-detect Jira from new tab
                        this.detectJiraFromTab();
                        sendResponse({ success: true });
                        break;
                }

                return true;
            });
        },

        // Actions
        async handleSubmit() {
            if (!this.jiraKey.trim()) {
                this.showJiraError = true;
                return;
            }

            this.showJiraError = false;
            this.successMessage = '';
            this.errorMessage = '';
            this.loading = true;

            // Save task state for recovery
            await this.saveTaskState();

            try {
                await generateTestCases({
                    jira_key: this.jiraKey,
                    format: this.format,
                    prompt: this.prompt,
                    user_agent: 'chrome_extension_sidepanel',
                    channel_id: this.channelId
                });
                // Response will come via Pusher
            } catch (err) {
                console.error('❌ Error:', err);
                this.loading = false;
                this.errorMessage = formatApiError(err);
                this.clearTaskState();
            }
        },

        async handleInject() {
            const selectedTestCases = this.testCases.filter(tc => tc.selected);
            if (selectedTestCases.length === 0) return;

            this.injecting = true;
            this.reviewMode = false;
            this.errorMessage = '';
            this.injectionSteps = { testsInserted: false, testsLinked: false };

            await this.saveTaskState();

            try {
                const xrayTestCases = cleanTestCasesForXray(selectedTestCases);
                await injectTestCases(this.jiraKey, this.channelId, xrayTestCases);
                // Progress will update via Pusher events
            } catch (err) {
                console.error('❌ Injection error:', err);
                this.injecting = false;
                this.reviewMode = true;
                this.errorMessage = formatApiError(err);
                this.clearTaskState();
            }
        },

        // Review mode methods
        startEditing(index) {
            this.editTitle = this.testCases[index].fields.summary;
            this.editSteps = this.testCases[index].xray_gherkin_def;
            this.editingIndex = index;
            this.testCases = this.testCases.map((t, idx) => ({
                ...t,
                _isEditing: idx === index
            }));
        },

        cancelEditing() {
            this.editTitle = '';
            this.editSteps = '';
            this.editingIndex = null;
            this.testCases = this.testCases.map(t => ({ ...t, _isEditing: false }));
        },

        saveEditing(index) {
            this.editingIndex = null;
            this.testCases = this.testCases.map((t, idx) => {
                if (idx === index) {
                    return {
                        ...t,
                        fields: { ...t.fields, summary: this.editTitle },
                        xray_gherkin_def: this.editSteps,
                        _isEditing: false
                    };
                }
                return { ...t, _isEditing: false };
            });
            this.editTitle = '';
            this.editSteps = '';
        },

        deleteTestCase(index) {
            this.testCases.splice(index, 1);
            // Renumber cards after deletion
            this.testCases.forEach((tc, idx) => {
                tc._cardNumber = `#${idx + 1}`;
            });
        },

        toggleTestCaseSelection(index) {
            const tc = this.testCases[index];
            tc.selected = !tc.selected;
            tc._isDeselected = !tc.selected;
        },

        selectAllTestCases(selectAll) {
            this.testCases.forEach(tc => {
                tc.selected = selectAll;
                tc._isDeselected = !selectAll;
            });
        },

        cancelReview() {
            this.reviewMode = false;
            this.testCases = [];
            this.editingIndex = null;
        },

        regenerateTestCases() {
            this.reviewMode = false;
            this.testCases = [];
            this.editingIndex = null;
            this.handleSubmit();
        },

        resetAll() {
            this.testCases = [];
            this.reviewMode = false;
            this.injecting = false;
            this.loading = false;
            this.injectionSteps = { testsInserted: false, testsLinked: false };
            this.jiraKey = '';
            this.prompt = '';
            this.successMessage = '';
            this.errorMessage = '';
            this.editingIndex = null;
            this.clearTaskState();
        },

        // Tab detection
        async detectJiraFromTab() {
            try {
                if (typeof chrome === 'undefined' || !chrome.tabs) return;

                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (!tab?.url) return;

                const match = tab.url.match(/atlassian\.net\/browse\/([A-Z]+-\d+)/i);
                if (match) {
                    const key = match[1].toUpperCase();
                    this.detectedJiraKey = key;
                    this.jiraDetected = true;
                    if (!this.jiraKey) {
                        this.jiraKey = key;
                    }
                    console.log('🎯 Auto-detected Jira key:', key);
                } else {
                    this.jiraDetected = false;
                }
            } catch (err) {
                console.log('Could not detect Jira key from tab:', err);
            }
        },

        // Preferences
        async loadPreferences() {
            try {
                if (typeof chrome === 'undefined' || !chrome.storage) return;

                const result = await chrome.storage.local.get(['format']);
                if (result.format) {
                    this.format = result.format;
                }
            } catch (err) {
                console.log('Could not load preferences:', err);
            }
        },

        async savePreferences() {
            try {
                if (typeof chrome === 'undefined' || !chrome.storage) return;

                await chrome.storage.local.set({
                    format: this.format
                });
            } catch (err) {
                console.log('Could not save preferences:', err);
            }
        },

        // Task state persistence (for recovery after panel close/reopen)
        async saveTaskState() {
            try {
                if (typeof chrome === 'undefined' || !chrome.storage) return;

                await chrome.storage.local.set({
                    taskState: {
                        channelId: this.channelId,
                        jiraKey: this.jiraKey,
                        loading: this.loading,
                        injecting: this.injecting,
                        injectionSteps: this.injectionSteps,
                        timestamp: Date.now()
                    }
                });
                console.log('💾 Task state saved');
            } catch (err) {
                console.log('Could not save task state:', err);
            }
        },

        async restoreTaskState() {
            try {
                if (typeof chrome === 'undefined' || !chrome.storage) return;

                const result = await chrome.storage.local.get(['taskState']);
                if (!result.taskState) return;

                const state = result.taskState;
                const age = Date.now() - state.timestamp;

                // Only restore if task state is less than 5 minutes old
                if (age > 5 * 60 * 1000) {
                    console.log('⏰ Task state too old, discarding');
                    this.clearTaskState();
                    return;
                }

                // Don't restore if injection is already complete
                if (state.injectionSteps?.testsLinked) {
                    console.log('✅ Previous injection was complete, starting fresh');
                    this.clearTaskState();
                    return;
                }

                // Restore state if there was an ongoing (incomplete) task
                if (state.loading || state.injecting) {
                    console.log('🔄 Restoring task state:', state);
                    this.jiraKey = state.jiraKey;

                    if (state.injecting && !state.injectionSteps?.testsLinked) {
                        this.injecting = true;
                        this.injectionSteps = state.injectionSteps;
                    } else if (state.loading) {
                        this.loading = true;
                    }
                }
            } catch (err) {
                console.log('Could not restore task state:', err);
            }
        },

        async clearTaskState() {
            try {
                if (typeof chrome === 'undefined' || !chrome.storage) return;
                await chrome.storage.local.remove(['taskState']);
            } catch (err) {
                console.log('Could not clear task state:', err);
            }
        },

        // Notifications
        showNativeNotification(title, message) {
            if (typeof chrome !== 'undefined' && chrome.notifications) {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: '../assets/icons/icon-128.png',
                    title: title,
                    message: message
                });
            }
        }
    }));
});

Alpine.start();
