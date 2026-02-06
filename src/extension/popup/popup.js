// ============================================
// QA Test Cases Generator - Chrome Extension Popup
// Main popup logic using Alpine.js and core modules
// ============================================

import Alpine from 'alpinejs';
import {
    getChannelId,
    initializePusher,
    getPusherChannel,
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
    Alpine.data('popupApp', () => ({
        // State
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
        injectionSteps: {
            testsInserted: false,
            testsLinked: false
        },

        // Computed
        get selectedCount() {
            return this.testCases.filter(tc => tc.selected).length;
        },

        get injectionProgress() {
            const { testsInserted, testsLinked } = this.injectionSteps;
            return testsLinked ? 100 : testsInserted ? 50 : 0;
        },

        get detectedJiraKeyDisplay() {
            return this.detectedJiraKey;
        },

        // Init
        async init() {
            console.log('🚀 Popup initialized with Alpine.js');
            console.log('📡 Channel ID:', this.channelId);

            // Initialize Pusher
            initializePusher(this.channelId);
            this.setupPusherEvents();

            // Try to auto-detect Jira key from active tab
            await this.detectJiraFromTab();

            // Load saved preferences from storage
            await this.loadPreferences();
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
                this.testCases = transformTestCasesForUI(rawTestCases);
                this.loading = false;
                this.reviewMode = true;
            });

            // Tests inserted in Xray
            bindPusherEvent('tests-inserted', (data) => {
                console.log('💾 Tests inserted:', data);
                this.injectionSteps.testsInserted = true;
            });

            // Tests linked (injection complete)
            bindPusherEvent('xray-injected', (data) => {
                console.log('🔗 Tests linked:', data);
                this.injectionSteps.testsLinked = true;
                this.showNativeNotification();
            });

            // Error event
            bindPusherEvent('test-error', (data) => {
                console.log('❌ Error:', data);
                this.loading = false;
                this.errorMessage = data.message || 'Une erreur est survenue';
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

            try {
                await generateTestCases({
                    jira_key: this.jiraKey,
                    format: this.format,
                    prompt: this.prompt,
                    user_agent: 'chrome_extension',
                    channel_id: this.channelId
                });
                // Response will come via Pusher
            } catch (err) {
                console.error('❌ Error:', err);
                this.loading = false;
                this.errorMessage = formatApiError(err);
            }
        },

        async handleInject() {
            const selectedTestCases = this.testCases.filter(tc => tc.selected);
            if (selectedTestCases.length === 0) return;

            this.injecting = true;
            this.reviewMode = false;
            this.injectionSteps = { testsInserted: false, testsLinked: false };

            try {
                const xrayTestCases = cleanTestCasesForXray(selectedTestCases);
                await injectTestCases(this.jiraKey, this.channelId, xrayTestCases);
                // Progress will update via Pusher events
            } catch (err) {
                console.error('❌ Injection error:', err);
                this.injecting = false;
                this.reviewMode = true;
                this.errorMessage = formatApiError(err);
            }
        },

        cancelReview() {
            this.reviewMode = false;
            this.testCases = [];
        },

        resetAll() {
            this.testCases = [];
            this.reviewMode = false;
            this.injecting = false;
            this.injectionSteps = { testsInserted: false, testsLinked: false };
            this.jiraKey = '';
            this.prompt = '';
            this.successMessage = '';
            this.errorMessage = '';
        },

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
                    this.jiraKey = key;
                    console.log('🎯 Auto-detected Jira key:', key);
                }
            } catch (err) {
                console.log('Could not detect Jira key from tab:', err);
            }
        },

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

        showNativeNotification() {
            if (typeof chrome !== 'undefined' && chrome.notifications) {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: '../assets/icons/icon-128.png',
                    title: 'Test Cases Injectés',
                    message: `${this.selectedCount} test cases ont été créés dans Xray`
                });
            }
        }
    }));
});

Alpine.start();
