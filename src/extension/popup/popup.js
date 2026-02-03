// ============================================
// QA Test Cases Generator - Chrome Extension Popup
// Main popup logic using core modules
// ============================================

import {
    DEBUG_MODE,
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

// ============================================
// State Management
// ============================================

const state = {
    channelId: getChannelId(),
    jiraKey: '',
    format: 'gherkin',
    prompt: '',
    testCases: [],
    loading: false,
    injecting: false,
    reviewMode: false,
    injectionSteps: {
        testsInserted: false,
        testsLinked: false
    }
};

// ============================================
// DOM Elements
// ============================================

const elements = {
    form: document.getElementById('generate-form'),
    jiraKeyInput: document.getElementById('jira-key'),
    formatSelect: document.getElementById('format'),
    promptTextarea: document.getElementById('prompt'),
    btnSubmit: document.getElementById('btn-submit'),
    jiraDetected: document.getElementById('jira-detected'),
    detectedJiraKey: document.getElementById('detected-jira-key'),
    jiraError: document.getElementById('jira-error'),
    messageSuccess: document.getElementById('message-success'),
    messageError: document.getElementById('message-error'),
    loadingOverlay: document.getElementById('loading-overlay'),
    injectionOverlay: document.getElementById('injection-overlay'),
    reviewContainer: document.getElementById('review-container'),
    testCasesList: document.getElementById('test-cases-list'),
    reviewCount: document.getElementById('review-count'),
    reviewJiraKey: document.getElementById('review-jira-key'),
    selectionCount: document.getElementById('selection-count'),
    btnCancelReview: document.getElementById('btn-cancel-review'),
    btnInject: document.getElementById('btn-inject'),
    btnNewTests: document.getElementById('btn-new-tests'),
    stepInsert: document.getElementById('step-insert'),
    stepLink: document.getElementById('step-link'),
    progressFill: document.getElementById('progress-fill'),
    injectionSuccess: document.getElementById('injection-success')
};

// ============================================
// Initialize
// ============================================

async function init() {
    console.log('🚀 Popup initialized');
    console.log('📡 Channel ID:', state.channelId);

    // Initialize Pusher
    initializePusher(state.channelId);
    setupPusherEvents();

    // Setup event listeners
    setupEventListeners();

    // Try to auto-detect Jira key from active tab
    await detectJiraFromTab();

    // Load saved preferences from storage
    await loadPreferences();
}

// ============================================
// Pusher Events
// ============================================

function setupPusherEvents() {
    const channel = getPusherChannel();
    if (!channel) {
        console.error('❌ Pusher channel not available');
        return;
    }

    // Test cases generated - show review
    bindPusherEvent('cases-generated', (data) => {
        console.log('📝 Test cases generated:', data);
        const rawTestCases = parseTestCasesFromPusher(data);
        state.testCases = transformTestCasesForUI(rawTestCases);
        showReview();
    });

    // Tests inserted in Xray
    bindPusherEvent('tests-inserted', (data) => {
        console.log('💾 Tests inserted:', data);
        state.injectionSteps.testsInserted = true;
        updateInjectionProgress();
    });

    // Tests linked (injection complete)
    bindPusherEvent('xray-injected', (data) => {
        console.log('🔗 Tests linked:', data);
        state.injectionSteps.testsLinked = true;
        updateInjectionProgress();
        showInjectionSuccess();
    });

    // Error event
    bindPusherEvent('test-error', (data) => {
        console.log('❌ Error:', data);
        hideLoading();
        showError(data.message || 'Une erreur est survenue');
    });
}

// ============================================
// Event Listeners
// ============================================

function setupEventListeners() {
    // Form submission
    elements.form.addEventListener('submit', handleSubmit);

    // Review actions
    elements.btnCancelReview.addEventListener('click', cancelReview);
    elements.btnInject.addEventListener('click', handleInject);
    elements.btnNewTests.addEventListener('click', resetAll);

    // Save preferences on change
    elements.formatSelect.addEventListener('change', savePreferences);
}

// ============================================
// Form Handling
// ============================================

async function handleSubmit(e) {
    e.preventDefault();

    const jiraKey = elements.jiraKeyInput.value.trim();
    if (!jiraKey) {
        elements.jiraError.classList.remove('hidden');
        return;
    }

    elements.jiraError.classList.add('hidden');
    hideMessages();

    state.jiraKey = jiraKey;
    state.format = elements.formatSelect.value;
    state.prompt = elements.promptTextarea.value;

    showLoading();

    try {
        await generateTestCases({
            jira_key: state.jiraKey,
            format: state.format,
            prompt: state.prompt,
            user_agent: 'chrome_extension',
            channel_id: state.channelId
        });
        // Response will come via Pusher
    } catch (err) {
        console.error('❌ Error:', err);
        hideLoading();
        showError(formatApiError(err));
    }
}

// ============================================
// Review Mode
// ============================================

function showReview() {
    hideLoading();
    state.reviewMode = true;

    elements.form.classList.add('hidden');
    elements.reviewContainer.classList.remove('hidden');
    elements.reviewJiraKey.textContent = state.jiraKey;
    elements.reviewCount.textContent = state.testCases.length;

    renderTestCases();
    updateSelectionCount();
}

function renderTestCases() {
    elements.testCasesList.innerHTML = state.testCases.map((tc, index) => `
        <div class="test-case-card ${tc.selected ? '' : 'deselected'}" data-index="${index}">
            <div class="test-case-header">
                <input type="checkbox" class="test-case-checkbox" ${tc.selected ? 'checked' : ''} data-index="${index}">
                <span class="test-case-number">#${index + 1}</span>
                <span class="test-case-title" title="${tc._displayTitle}">${tc._displayTitle}</span>
                <span class="test-case-type">${tc._displayType}</span>
            </div>
            <div class="test-case-preview">${tc._displaySteps.split('\n')[0]}</div>
        </div>
    `).join('');

    // Add checkbox listeners
    elements.testCasesList.querySelectorAll('.test-case-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const index = parseInt(e.target.dataset.index);
            state.testCases[index].selected = e.target.checked;
            const card = e.target.closest('.test-case-card');
            card.classList.toggle('deselected', !e.target.checked);
            updateSelectionCount();
        });
    });
}

function updateSelectionCount() {
    const selected = state.testCases.filter(tc => tc.selected).length;
    elements.selectionCount.textContent = `${selected}/${state.testCases.length}`;
    elements.btnInject.disabled = selected === 0;
}

function cancelReview() {
    state.reviewMode = false;
    state.testCases = [];
    elements.reviewContainer.classList.add('hidden');
    elements.form.classList.remove('hidden');
}

// ============================================
// Injection
// ============================================

async function handleInject() {
    const selectedTestCases = state.testCases.filter(tc => tc.selected);
    if (selectedTestCases.length === 0) return;

    state.injecting = true;
    state.injectionSteps = { testsInserted: false, testsLinked: false };

    elements.reviewContainer.classList.add('hidden');
    showInjectionOverlay();

    try {
        const xrayTestCases = cleanTestCasesForXray(selectedTestCases);
        await injectTestCases(state.jiraKey, state.channelId, xrayTestCases);
        // Progress will update via Pusher events
    } catch (err) {
        console.error('❌ Injection error:', err);
        hideInjectionOverlay();
        elements.reviewContainer.classList.remove('hidden');
        showError(formatApiError(err));
    }
}

function showInjectionOverlay() {
    elements.injectionOverlay.classList.remove('hidden');
    elements.injectionSuccess.classList.add('hidden');
    updateInjectionProgress();
}

function hideInjectionOverlay() {
    elements.injectionOverlay.classList.add('hidden');
}

function updateInjectionProgress() {
    const { testsInserted, testsLinked } = state.injectionSteps;

    elements.stepInsert.classList.toggle('active', !testsInserted);
    elements.stepInsert.classList.toggle('completed', testsInserted);
    elements.stepLink.classList.toggle('active', testsInserted && !testsLinked);
    elements.stepLink.classList.toggle('completed', testsLinked);

    const progress = testsLinked ? 100 : testsInserted ? 50 : 0;
    elements.progressFill.style.width = `${progress}%`;
}

function showInjectionSuccess() {
    elements.injectionSuccess.classList.remove('hidden');

    // Send notification
    if (chrome?.notifications) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: '../assets/icons/icon-128.png',
            title: 'Test Cases Injectés',
            message: `${state.testCases.filter(tc => tc.selected).length} test cases ont été créés dans Xray`
        });
    }
}

// ============================================
// UI Helpers
// ============================================

function showLoading() {
    state.loading = true;
    elements.loadingOverlay.classList.remove('hidden');
    elements.btnSubmit.disabled = true;
}

function hideLoading() {
    state.loading = false;
    elements.loadingOverlay.classList.add('hidden');
    elements.btnSubmit.disabled = false;
}

function showError(message) {
    elements.messageError.querySelector('p').textContent = message;
    elements.messageError.classList.remove('hidden');
}

function showSuccess(message) {
    elements.messageSuccess.querySelector('p').textContent = message;
    elements.messageSuccess.classList.remove('hidden');
}

function hideMessages() {
    elements.messageError.classList.add('hidden');
    elements.messageSuccess.classList.add('hidden');
}

function resetAll() {
    state.testCases = [];
    state.reviewMode = false;
    state.injecting = false;
    state.injectionSteps = { testsInserted: false, testsLinked: false };

    hideInjectionOverlay();
    elements.reviewContainer.classList.add('hidden');
    elements.form.classList.remove('hidden');
    elements.jiraKeyInput.value = '';
    elements.promptTextarea.value = '';
    hideMessages();
}

// ============================================
// Jira Auto-Detection
// ============================================

async function detectJiraFromTab() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.url) return;

        // Match Jira URLs: https://xxx.atlassian.net/browse/PROJ-123
        const match = tab.url.match(/atlassian\.net\/browse\/([A-Z]+-\d+)/i);
        if (match) {
            const jiraKey = match[1].toUpperCase();
            elements.detectedJiraKey.textContent = jiraKey;
            elements.jiraDetected.classList.remove('hidden');
            elements.jiraKeyInput.value = jiraKey;
            state.jiraKey = jiraKey;
            console.log('🎯 Auto-detected Jira key:', jiraKey);
        }
    } catch (err) {
        console.log('Could not detect Jira key from tab:', err);
    }
}

// ============================================
// Storage
// ============================================

async function loadPreferences() {
    try {
        const result = await chrome.storage.local.get(['format']);
        if (result.format) {
            elements.formatSelect.value = result.format;
            state.format = result.format;
        }
    } catch (err) {
        console.log('Could not load preferences:', err);
    }
}

async function savePreferences() {
    try {
        await chrome.storage.local.set({
            format: elements.formatSelect.value
        });
    } catch (err) {
        console.log('Could not save preferences:', err);
    }
}

// ============================================
// Start
// ============================================

document.addEventListener('DOMContentLoaded', init);
