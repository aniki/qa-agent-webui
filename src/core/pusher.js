// ============================================
// QA Test Cases Generator - Pusher Module
// Handles real-time communication with n8n
// ============================================

import { PUSHER_APP_KEY, PUSHER_CLUSTER, DEBUG_MODE } from './constants.js';

let pusherInstance = null;
let pusherChannel = null;
let currentChannelId = null;

/**
 * Initializes Pusher and subscribes to a channel
 * @param {string} channelId - The channel ID to subscribe to
 * @returns {Object|null} The Pusher channel or null if initialization fails
 */
export function initializePusher(channelId) {
    try {
        if (DEBUG_MODE) {
            console.log('🚀 Initializing Pusher...');
            console.log('📋 App Key:', PUSHER_APP_KEY);
            console.log('🌍 Cluster:', PUSHER_CLUSTER);
            console.log('🆔 Channel ID:', channelId);
        }

        // Check if Pusher is available (loaded via CDN or bundled)
        if (typeof Pusher === 'undefined') {
            console.error('❌ Pusher library not loaded');
            return null;
        }

        currentChannelId = channelId;

        // Initialize Pusher with debug mode if enabled
        pusherInstance = new Pusher(PUSHER_APP_KEY, {
            cluster: PUSHER_CLUSTER,
            encrypted: true,
            enabledTransports: ['ws', 'wss'],
            logToConsole: DEBUG_MODE
        });

        // Subscribe to unique channel
        pusherChannel = pusherInstance.subscribe(channelId);

        if (DEBUG_MODE) {
            console.log('✅ Pusher initialized and subscribed to channel:', channelId);
        }

        // Connection success event
        pusherInstance.connection.bind('connected', () => {
            if (DEBUG_MODE) {
                console.log('🔗 Pusher connected successfully');
                console.log('📡 Connection state:', pusherInstance.connection.state);
            }
        });

        // Subscription success event
        pusherChannel.bind('pusher:subscription_succeeded', () => {
            if (DEBUG_MODE) {
                console.log('✅ Successfully subscribed to channel:', channelId);
            }
        });

        // DEBUG: Capture ALL events for diagnostics
        if (DEBUG_MODE) {
            pusherChannel.bind_global((eventName, data) => {
                console.log('🌐 [GLOBAL EVENT] Received:', eventName);
                console.log('🌐 [GLOBAL EVENT] Data:', data);
            });
        }

        // Subscription error event
        pusherChannel.bind('pusher:subscription_error', (status) => {
            console.error('❌ Subscription error:', status);
        });

        // Connection error event
        pusherInstance.connection.bind('error', (err) => {
            console.error('❌ Pusher connection error:', err);
        });

        // State change event
        if (DEBUG_MODE) {
            pusherInstance.connection.bind('state_change', (states) => {
                console.log('🔄 Pusher state changed:', states.previous, '→', states.current);
            });
        }

        return pusherChannel;
    } catch (error) {
        console.error('❌ Failed to initialize Pusher:', error);
        return null;
    }
}

/**
 * Gets the current Pusher channel
 * @returns {Object|null} The current Pusher channel
 */
export function getPusherChannel() {
    return pusherChannel;
}

/**
 * Gets the current Pusher instance
 * @returns {Object|null} The current Pusher instance
 */
export function getPusherInstance() {
    return pusherInstance;
}

/**
 * Gets the current channel ID
 * @returns {string|null} The current channel ID
 */
export function getCurrentChannelId() {
    return currentChannelId;
}

/**
 * Binds an event handler to the Pusher channel
 * @param {string} eventName - The event name to listen for
 * @param {Function} handler - The event handler function
 */
export function bindPusherEvent(eventName, handler) {
    if (pusherChannel) {
        pusherChannel.bind(eventName, handler);
        if (DEBUG_MODE) {
            console.log(`🔗 Bound event: ${eventName}`);
        }
    } else {
        console.error(`❌ Cannot bind event ${eventName}: Pusher channel is null`);
    }
}

/**
 * Unbinds an event handler from the Pusher channel
 * @param {string} eventName - The event name to unbind
 * @param {Function} [handler] - Optional specific handler to unbind
 */
export function unbindPusherEvent(eventName, handler) {
    if (pusherChannel) {
        if (handler) {
            pusherChannel.unbind(eventName, handler);
        } else {
            pusherChannel.unbind(eventName);
        }
    }
}

/**
 * Disconnects Pusher and cleans up
 */
export function disconnectPusher() {
    if (pusherInstance) {
        pusherInstance.disconnect();
        pusherInstance = null;
        pusherChannel = null;
        currentChannelId = null;
        if (DEBUG_MODE) {
            console.log('🔌 Pusher disconnected');
        }
    }
}

/**
 * Debug utilities for Pusher (exposed globally in debug mode)
 */
export const pusherDebug = {
    getChannel: () => pusherChannel,
    getInstance: () => pusherInstance,
    getChannelId: () => currentChannelId,
    checkSubscription: () => {
        console.log('📡 Channel:', pusherChannel);
        console.log('📡 Channel subscribed:', pusherChannel?.subscribed);
        console.log('📡 Connection state:', pusherInstance?.connection?.state);
    },
    simulateEvent: (eventName, data) => {
        console.log(`🧪 Simulating event: ${eventName}`);
        pusherChannel?.emit(eventName, data);
    }
};
