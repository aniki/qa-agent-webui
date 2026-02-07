// ============================================
// QA Test Cases Generator - Service Worker
// Background script for Chrome extension
// Handles side panel, notifications, and context menu
// ============================================

// ============================================
// Extension Installation
// ============================================

chrome.runtime.onInstalled.addListener((details) => {
    console.log('🚀 QA Test Cases Generator installed', details.reason);

    // Set default storage values
    chrome.storage.local.set({
        format: 'gherkin',
        lastUsed: null
    });

    // Create context menu for Jira pages
    chrome.contextMenus.create({
        id: 'generate-test-cases',
        title: 'Générer des test cases',
        contexts: ['page'],
        documentUrlPatterns: ['https://*.atlassian.net/browse/*']
    });
});

// Configure side panel to open on action click
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .then(() => console.log('✅ Side panel configured to open on action click'))
    .catch((error) => console.error('❌ Error configuring side panel:', error));

// Note: Side panel opens automatically on action click via setPanelBehavior
// The side panel detects Jira key from active tab in its init() method

// ============================================
// Context Menu Click
// ============================================

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'generate-test-cases') {
        console.log('📋 Context menu clicked, opening side panel');

        try {
            // Open side panel for this specific tab
            await chrome.sidePanel.open({ tabId: tab.id });
        } catch (error) {
            console.error('❌ Error opening side panel from context menu:', error);
        }
    }
});

// ============================================
// Tab Change Detection
// ============================================

chrome.tabs.onActivated.addListener(async (activeInfo) => {
    try {
        const tab = await chrome.tabs.get(activeInfo.tabId);

        // Notify side panel about tab change
        chrome.runtime.sendMessage({
            type: 'TAB_CHANGED',
            url: tab.url
        }).catch(() => {
            // Side panel might not be open, ignore
        });
    } catch (error) {
        // Tab might not exist, ignore
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.active) {
        // Notify side panel about URL change
        chrome.runtime.sendMessage({
            type: 'TAB_CHANGED',
            url: tab.url
        }).catch(() => {
            // Side panel might not be open, ignore
        });
    }
});

// ============================================
// Message Handling
// ============================================

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

        case 'OPEN_SIDE_PANEL':
            chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
                if (tabs[0]) {
                    try {
                        await chrome.sidePanel.open({ tabId: tabs[0].id });
                        sendResponse({ success: true });
                    } catch (error) {
                        console.error('❌ Error opening side panel:', error);
                        sendResponse({ success: false, error: error.message });
                    }
                }
            });
            return true;

        default:
            sendResponse({ error: 'Unknown message type' });
    }
});

// ============================================
// Notifications
// ============================================

function showNotification(title, message) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: '../assets/icons/icon-128.png',
        title: title,
        message: message,
        priority: 2
    });
}
