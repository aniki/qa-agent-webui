// ============================================
// QA Test Cases Generator - API Module
// Handles HTTP calls to n8n webhooks
// ============================================

import { N8N_WEBHOOK_GENERATE_URL, N8N_WEBHOOK_INJECT_URL, DEBUG_MODE } from './constants.js';

/**
 * Generates test cases by calling the n8n webhook
 * @param {Object} formData - Form data containing jira_key, format, prompt, channel_id
 * @returns {Promise<Object>} Response from the webhook
 * @throws {Error} If the request fails
 */
export async function generateTestCases(formData) {
    if (DEBUG_MODE) {
        console.log('🚀 Calling generate webhook with data:', formData);
    }

    const response = await fetch(N8N_WEBHOOK_GENERATE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            jira_key: formData.jira_key.trim(),
            format: formData.format,
            prompt: formData.prompt || '',
            user_agent: formData.user_agent || 'web_ui',
            channel_id: formData.channel_id,
            text: `${formData.jira_key.trim()} ${formData.format} ${formData.prompt || ''}`
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || `Erreur HTTP ${response.status}`);
    }

    if (DEBUG_MODE) {
        console.log('✅ Generate response:', data);
    }

    return data;
}

/**
 * Injects test cases into Xray by calling the n8n webhook
 * @param {string} jiraKey - The Jira key
 * @param {string} channelId - The Pusher channel ID
 * @param {Array} testCases - Array of test cases in Xray format
 * @returns {Promise<Object>} Response from the webhook
 * @throws {Error} If the request fails
 */
export async function injectTestCases(jiraKey, channelId, testCases) {
    if (DEBUG_MODE) {
        console.log('🚀 Calling inject webhook');
        console.log('📤 Jira Key:', jiraKey);
        console.log('📤 Test cases count:', testCases.length);
    }

    const response = await fetch(N8N_WEBHOOK_INJECT_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            jira_key: jiraKey.trim(),
            channel_id: channelId,
            testCases: testCases
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || `Erreur HTTP ${response.status}`);
    }

    if (DEBUG_MODE) {
        console.log('✅ Inject response:', data);
    }

    return data;
}

/**
 * Formats API errors into user-friendly messages
 * @param {Error} error - The error object
 * @returns {string} User-friendly error message
 */
export function formatApiError(error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return 'Erreur de connexion au serveur. Vérifiez votre connexion internet.';
    } else if (error.message.includes('JSON')) {
        return 'Erreur de traitement de la réponse du serveur.';
    } else {
        return error.message || 'Une erreur est survenue.';
    }
}
