// ============================================
// QA Test Cases Generator - Service Worker
// Background script for Chrome extension
// ============================================

// Listen for extension install
chrome.runtime.onInstalled.addListener((details) => {
    console.log('🚀 QA Test Cases Generator installed', details.reason);

    // Set default storage values
    chrome.storage.local.set({
        format: 'gherkin',
        lastUsed: null
    });
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('📩 Message received:', message);

    switch (message.type) {
        case 'SHOW_NOTIFICATION':
            showNotification(message.title, message.message);
            sendResponse({ success: true });
            break;

        case 'GET_ACTIVE_TAB_URL':
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                sendResponse({ url: tabs[0]?.url || null });
            });
            return true; // Keep channel open for async response

        case 'INJECT_TEST_CASES_COMPLETE':
            showNotification(
                'Test Cases Injectés',
                `${message.count} test cases créés pour ${message.jiraKey}`
            );
            sendResponse({ success: true });
            break;

        default:
            sendResponse({ error: 'Unknown message type' });
    }
});

// Show Chrome notification
function showNotification(title, message) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: '../assets/icons/icon-128.png',
        title: title,
        message: message,
        priority: 2
    });
}

// Context menu for quick access on Jira pages
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'generate-test-cases',
        title: 'Générer des test cases',
        contexts: ['page'],
        documentUrlPatterns: ['https://*.atlassian.net/browse/*']
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'generate-test-cases') {
        // Open popup programmatically
        chrome.action.openPopup();
    }
});
