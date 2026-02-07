// ============================================
// QA Test Cases Generator - Content Script
// Runs on Jira pages to extract issue information
// ============================================

(function() {
    'use strict';

    console.log('🔧 QA Test Cases Generator content script loaded');

    // Extract Jira key from URL
    function getJiraKeyFromUrl() {
        const match = window.location.pathname.match(/\/browse\/([A-Z]+-\d+)/i);
        return match ? match[1].toUpperCase() : null;
    }

    // Extract issue title from page
    function getIssueTitle() {
        const titleElement = document.querySelector('[data-testid="issue.views.issue-base.foundation.summary.heading"]') ||
                            document.querySelector('h1[data-test-id="issue.views.issue-base.foundation.summary.heading"]') ||
                            document.querySelector('.issue-header-content h1');
        return titleElement?.textContent?.trim() || null;
    }

    // Extract issue type (Story, Bug, etc.)
    function getIssueType() {
        const typeElement = document.querySelector('[data-testid="issue.views.issue-base.foundation.issue-type.button"]') ||
                           document.querySelector('[data-test-id="issue.views.issue-base.foundation.change-issue-type.button"]');
        return typeElement?.textContent?.trim() || null;
    }

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'GET_JIRA_INFO') {
            sendResponse({
                jiraKey: getJiraKeyFromUrl(),
                title: getIssueTitle(),
                issueType: getIssueType(),
                url: window.location.href
            });
        }
        return true;
    });

    // Optional: Add a button to the Jira page for quick access
    function addQuickAccessButton() {
        // Check if we're on a Jira issue page
        const jiraKey = getJiraKeyFromUrl();
        if (!jiraKey) return;

        // Check if button already exists
        if (document.getElementById('qa-generator-btn')) return;

        // Find the actions toolbar
        const toolbar = document.querySelector('[data-testid="issue.views.issue-base.foundation.quick-add.button"]')?.parentElement ||
                       document.querySelector('.issue-header-actions') ||
                       document.querySelector('[class*="opsbar"]');

        if (!toolbar) return;

        // Create button
        const button = document.createElement('button');
        button.id = 'qa-generator-btn';
        button.innerHTML = '🧪 Test Cases';
        button.title = 'Générer des test cases pour cette User Story';
        button.style.cssText = `
            background: #2d2d5f;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 6px 12px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            margin-left: 8px;
            transition: background 0.2s;
        `;

        button.addEventListener('mouseenter', () => {
            button.style.background = '#1e1e4a';
        });

        button.addEventListener('mouseleave', () => {
            button.style.background = '#2d2d5f';
        });

        button.addEventListener('click', () => {
            // Send message to open side panel with pre-filled data
            chrome.runtime.sendMessage({
                type: 'OPEN_SIDE_PANEL',
                jiraKey: jiraKey,
                title: getIssueTitle()
            });
        });

        toolbar.appendChild(button);
        console.log('✅ QA Generator button added to Jira page');
    }

    // Wait for page to fully load then add button
    if (document.readyState === 'complete') {
        setTimeout(addQuickAccessButton, 1000);
    } else {
        window.addEventListener('load', () => {
            setTimeout(addQuickAccessButton, 1000);
        });
    }

    // Re-add button on SPA navigation (Jira uses client-side routing)
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            setTimeout(addQuickAccessButton, 1000);
        }
    }).observe(document, { subtree: true, childList: true });
})();
