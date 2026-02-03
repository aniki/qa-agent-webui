// ============================================
// QA Test Cases Generator - Configuration
// Shared constants for web and extension builds
// ============================================

// Debug mode (enabled in development)
export const DEBUG_MODE = false;

// Configuration: URLs des webhooks n8n
export const N8N_WEBHOOK_GENERATE_URL = `https://n8n.accor-ecom.fr/webhook${DEBUG_MODE?'-test':''}/case-writer`;
export const N8N_WEBHOOK_INJECT_URL = `https://n8n.accor-ecom.fr/webhook${DEBUG_MODE?'-test':''}/inject-testcases`;

// Configuration Pusher
export const PUSHER_APP_KEY = 'f07b39b2b4b01021840d';
export const PUSHER_CLUSTER = 'eu';

/**
 * Generates a unique channel ID for Pusher
 * Format: qa-channel-{timestamp}-{random}
 * @returns {string} Unique channel ID
 */
export function generateChannelId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `qa-channel-${timestamp}-${random}`;
}

/**
 * Gets or generates the channel ID
 * In debug mode, uses a fixed channel for easier testing
 * @returns {string} Channel ID
 */
export function getChannelId() {
    return DEBUG_MODE ? 'qa-agent-front' : generateChannelId();
}
