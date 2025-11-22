// passenger-portal/src/utils/idempotency.js

import { generateUniqueId } from './helpers';
import { STORAGE_KEYS } from '../constants';

/**
 * Idempotency manager to prevent duplicate requests
 * Tracks requests by a unique key and prevents duplicate submissions
 */
class IdempotencyManager {
    constructor() {
        this.pendingRequests = new Map();
        this.completedRequests = new Map();
        this.maxCompletedRequests = 100; // Keep last 100 completed requests
    }

    /**
     * Generate idempotency key for a request
     * @param {string} action - Action type (e.g., 'accept_offer', 'deny_offer')
     * @param {object} params - Request parameters
     * @returns {string} Idempotency key
     */
    generateKey(action, params) {
        const paramsString = JSON.stringify(params);
        return `${action}:${paramsString}`;
    }

    /**
     * Check if request is already pending
     * @param {string} key - Idempotency key
     * @returns {boolean} True if pending
     */
    isPending(key) {
        return this.pendingRequests.has(key);
    }

    /**
     * Check if request was already completed
     * @param {string} key - Idempotency key
     * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
     * @returns {boolean} True if completed recently
     */
    isCompleted(key, ttl = 300000) {
        const completed = this.completedRequests.get(key);
        if (!completed) return false;

        const now = Date.now();
        if (now - completed.timestamp > ttl) {
            // Remove expired completed request
            this.completedRequests.delete(key);
            return false;
        }

        return true;
    }

    /**
     * Check if request can be executed
     * @param {string} key - Idempotency key
     * @returns {object} {canExecute: boolean, reason: string}
     */
    canExecute(key) {
        if (this.isPending(key)) {
            return {
                canExecute: false,
                reason: 'Request is already in progress'
            };
        }

        if (this.isCompleted(key)) {
            const completed = this.completedRequests.get(key);
            return {
                canExecute: false,
                reason: 'Request was already processed',
                result: completed.result
            };
        }

        return {
            canExecute: true,
            reason: 'Request can be executed'
        };
    }

    /**
     * Mark request as pending
     * @param {string} key - Idempotency key
     * @param {object} metadata - Additional metadata
     */
    markPending(key, metadata = {}) {
        this.pendingRequests.set(key, {
            timestamp: Date.now(),
            ...metadata
        });
    }

    /**
     * Mark request as completed
     * @param {string} key - Idempotency key
     * @param {*} result - Request result
     * @param {boolean} success - Whether request was successful
     */
    markCompleted(key, result, success = true) {
        // Remove from pending
        this.pendingRequests.delete(key);

        // Add to completed
        this.completedRequests.set(key, {
            timestamp: Date.now(),
            result,
            success
        });

        // Cleanup old completed requests
        this.cleanupCompletedRequests();
    }

    /**
     * Mark request as failed
     * @param {string} key - Idempotency key
     * @param {Error} error - Error object
     */
    markFailed(key, error) {
        this.pendingRequests.delete(key);
        // Don't add to completed for failures - allow retry
    }

    /**
     * Clear specific request
     * @param {string} key - Idempotency key
     */
    clear(key) {
        this.pendingRequests.delete(key);
        this.completedRequests.delete(key);
    }

    /**
     * Clear all requests
     */
    clearAll() {
        this.pendingRequests.clear();
        this.completedRequests.clear();
    }

    /**
     * Cleanup old completed requests
     */
    cleanupCompletedRequests() {
        if (this.completedRequests.size <= this.maxCompletedRequests) {
            return;
        }

        // Convert to array and sort by timestamp
        const entries = Array.from(this.completedRequests.entries())
            .sort((a, b) => a[1].timestamp - b[1].timestamp);

        // Remove oldest entries
        const toRemove = entries.slice(0, entries.length - this.maxCompletedRequests);
        toRemove.forEach(([key]) => this.completedRequests.delete(key));
    }

    /**
     * Get pending request info
     * @param {string} key - Idempotency key
     * @returns {object|null} Request info
     */
    getPendingInfo(key) {
        return this.pendingRequests.get(key) || null;
    }

    /**
     * Get completed request info
     * @param {string} key - Idempotency key
     * @returns {object|null} Request info
     */
    getCompletedInfo(key) {
        return this.completedRequests.get(key) || null;
    }
}

// Create singleton instance
const idempotencyManager = new IdempotencyManager();

/**
 * Execute request with idempotency protection
 * @param {string} action - Action type
 * @param {object} params - Request parameters
 * @param {Function} requestFn - Function to execute the request
 * @returns {Promise<*>} Request result
 */
export const executeIdempotentRequest = async (action, params, requestFn) => {
    const key = idempotencyManager.generateKey(action, params);

    // Check if request can be executed
    const check = idempotencyManager.canExecute(key);
    if (!check.canExecute) {
        if (check.result) {
            // Return cached result
            return check.result;
        }
        throw new Error(check.reason);
    }

    // Mark as pending
    idempotencyManager.markPending(key, { action, params });

    try {
        // Execute request
        const result = await requestFn();

        // Mark as completed
        idempotencyManager.markCompleted(key, result, true);

        return result;
    } catch (error) {
        // Mark as failed (allows retry)
        idempotencyManager.markFailed(key, error);
        throw error;
    }
};

/**
 * Create idempotency token for request
 * @returns {string} Unique token
 */
export const createIdempotencyToken = () => {
    return generateUniqueId();
};

/**
 * Store idempotency token in storage
 * @param {string} action - Action type
 * @param {string} token - Idempotency token
 */
export const storeIdempotencyToken = (action, token) => {
    try {
        const key = `${STORAGE_KEYS.RETRY_QUEUE}:tokens`;
        const stored = JSON.parse(localStorage.getItem(key) || '{}');
        stored[action] = {
            token,
            timestamp: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(stored));
    } catch (error) {
        console.error('Failed to store idempotency token', error);
    }
};

/**
 * Get idempotency token from storage
 * @param {string} action - Action type
 * @returns {string|null} Token or null
 */
export const getIdempotencyToken = (action) => {
    try {
        const key = `${STORAGE_KEYS.RETRY_QUEUE}:tokens`;
        const stored = JSON.parse(localStorage.getItem(key) || '{}');
        const entry = stored[action];

        if (!entry) return null;

        // Check if token is still valid (within 5 minutes)
        const now = Date.now();
        if (now - entry.timestamp > 300000) {
            // Token expired, remove it
            delete stored[action];
            localStorage.setItem(key, JSON.stringify(stored));
            return null;
        }

        return entry.token;
    } catch (error) {
        console.error('Failed to get idempotency token', error);
        return null;
    }
};

/**
 * Clear idempotency token from storage
 * @param {string} action - Action type
 */
export const clearIdempotencyToken = (action) => {
    try {
        const key = `${STORAGE_KEYS.RETRY_QUEUE}:tokens`;
        const stored = JSON.parse(localStorage.getItem(key) || '{}');
        delete stored[action];
        localStorage.setItem(key, JSON.stringify(stored));
    } catch (error) {
        console.error('Failed to clear idempotency token', error);
    }
};

/**
 * Cleanup expired idempotency tokens
 */
export const cleanupExpiredTokens = () => {
    try {
        const key = `${STORAGE_KEYS.RETRY_QUEUE}:tokens`;
        const stored = JSON.parse(localStorage.getItem(key) || '{}');
        const now = Date.now();

        const cleaned = Object.entries(stored)
            .filter(([, entry]) => now - entry.timestamp <= 300000)
            .reduce((acc, [action, entry]) => {
                acc[action] = entry;
                return acc;
            }, {});

        localStorage.setItem(key, JSON.stringify(cleaned));
    } catch (error) {
        console.error('Failed to cleanup expired tokens', error);
    }
};

export {
    idempotencyManager,
    IdempotencyManager
};

export default {
    executeIdempotentRequest,
    createIdempotencyToken,
    storeIdempotencyToken,
    getIdempotencyToken,
    clearIdempotencyToken,
    cleanupExpiredTokens,
    idempotencyManager
};
