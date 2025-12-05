// backend/services/PushSubscriptionService.js
/**
 * Push Subscription Service
 * Manages browser push notification subscriptions
 * Uses in-memory storage (subscriptions lost on restart, but simplifies setup)
 */

class PushSubscriptionService {
    constructor() {
        // Store subscriptions by IRCTC ID (passengers)
        this.subscriptions = new Map(); // irctcId -> [subscription objects]

        // Store TTE subscriptions by TTE ID
        this.tteSubscriptions = new Map(); // tteId -> [subscription objects]

        console.log('📱 PushSubscriptionService initialized (in-memory)');
    }

    /**
     * Add a new push subscription for a passenger
     */
    async addSubscription(irctcId, subscription, userAgent = '') {
        if (!irctcId) {
            throw new Error('IRCTC ID is required');
        }

        if (!subscription || !subscription.endpoint) {
            throw new Error('Invalid subscription object');
        }

        // Initialize array if doesn't exist
        if (!this.subscriptions.has(irctcId)) {
            this.subscriptions.set(irctcId, []);
        }

        // Check if subscription already exists (same endpoint)
        const existing = this.subscriptions.get(irctcId);
        const isDuplicate = existing.some(sub => sub.endpoint === subscription.endpoint);

        if (!isDuplicate) {
            this.subscriptions.get(irctcId).push(subscription);
            console.log(`✅ Added push subscription for ${irctcId}`);
        } else {
            console.log(`ℹ️  Subscription already exists for ${irctcId}`);
        }

        return true;
    }

    /**
     * Get all subscriptions for a passenger
     */
    async getSubscriptions(irctcId) {
        return this.subscriptions.get(irctcId) || [];
    }

    /**
     * Remove a specific subscription
     */
    async removeSubscription(irctcId, endpoint) {
        const subs = this.subscriptions.get(irctcId);

        if (!subs) {
            return false;
        }

        const index = subs.findIndex(sub => sub.endpoint === endpoint);

        if (index !== -1) {
            subs.splice(index, 1);
            console.log(`🗑️  Removed subscription for ${irctcId}`);

            // Clean up empty arrays
            if (subs.length === 0) {
                this.subscriptions.delete(irctcId);
            }

            return true;
        }

        return false;
    }

    /**
     * Delete a subscription by endpoint (for invalid subscriptions)
     */
    async deleteSubscription(endpoint) {
        for (const [irctcId, subs] of this.subscriptions.entries()) {
            const index = subs.findIndex(sub => sub.endpoint === endpoint);
            if (index !== -1) {
                subs.splice(index, 1);
                if (subs.length === 0) {
                    this.subscriptions.delete(irctcId);
                }
                console.log(`🗑️  Deleted invalid subscription`);
                return true;
            }
        }
        return false;
    }

    /**
     * Remove all subscriptions for a passenger
     */
    async clearSubscriptions(irctcId) {
        const deleted = this.subscriptions.delete(irctcId);
        if (deleted) {
            console.log(`🗑️  Cleared all subscriptions for ${irctcId}`);
        }
        return deleted;
    }

    /**
     * Get total subscription count
     */
    getTotalCount() {
        let total = 0;
        for (const subs of this.subscriptions.values()) {
            total += subs.length;
        }
        return total;
    }

    /**
     * Get statistics
     */
    async getStats() {
        return {
            totalUsers: this.subscriptions.size,
            totalSubscriptions: this.getTotalCount()
        };
    }

    // ============ TTE SUBSCRIPTION METHODS ============

    /**
     * Add a push subscription for a TTE
     */
    async addTTESubscription(tteId, subscription, userAgent = '') {
        if (!tteId) {
            throw new Error('TTE ID is required');
        }

        if (!subscription || !subscription.endpoint) {
            throw new Error('Invalid subscription object');
        }

        if (!this.tteSubscriptions.has(tteId)) {
            this.tteSubscriptions.set(tteId, []);
        }

        const existing = this.tteSubscriptions.get(tteId);
        const isDuplicate = existing.some(sub => sub.endpoint === subscription.endpoint);

        if (!isDuplicate) {
            this.tteSubscriptions.get(tteId).push(subscription);
            console.log(`✅ Added TTE push subscription for ${tteId}`);
        } else {
            console.log(`ℹ️  TTE subscription already exists for ${tteId}`);
        }

        return true;
    }

    /**
     * Get all subscriptions for a TTE
     */
    async getTTESubscriptions(tteId) {
        return this.tteSubscriptions.get(tteId) || [];
    }

    /**
     * Get ALL TTE subscriptions (for broadcasting to all TTEs)
     */
    async getAllTTESubscriptions() {
        const allSubs = [];
        for (const subs of this.tteSubscriptions.values()) {
            allSubs.push(...subs);
        }
        return allSubs;
    }

    /**
     * Remove a TTE subscription
     */
    async removeTTESubscription(tteId, endpoint) {
        const subs = this.tteSubscriptions.get(tteId);

        if (!subs) return false;

        const index = subs.findIndex(sub => sub.endpoint === endpoint);

        if (index !== -1) {
            subs.splice(index, 1);
            console.log(`🗑️  Removed TTE subscription for ${tteId}`);

            if (subs.length === 0) {
                this.tteSubscriptions.delete(tteId);
            }

            return true;
        }

        return false;
    }

    /**
     * Clear all TTE subscriptions
     */
    async clearTTESubscriptions(tteId) {
        const deleted = this.tteSubscriptions.delete(tteId);
        if (deleted) {
            console.log(`🗑️  Cleared all TTE subscriptions for ${tteId}`);
        }
        return deleted;
    }

    // ============ ADMIN SUBSCRIPTION METHODS ============

    /**
     * Add a push subscription for an Admin
     */
    async addAdminSubscription(adminId, subscription, userAgent = '') {
        if (!adminId) {
            throw new Error('Admin ID is required');
        }

        if (!subscription || !subscription.endpoint) {
            throw new Error('Invalid subscription object');
        }

        if (!this.adminSubscriptions) {
            this.adminSubscriptions = new Map();
        }

        if (!this.adminSubscriptions.has(adminId)) {
            this.adminSubscriptions.set(adminId, []);
        }

        const existing = this.adminSubscriptions.get(adminId);
        const isDuplicate = existing.some(sub => sub.endpoint === subscription.endpoint);

        if (!isDuplicate) {
            this.adminSubscriptions.get(adminId).push(subscription);
            console.log(`✅ Added Admin push subscription for ${adminId}`);
        } else {
            console.log(`ℹ️  Admin subscription already exists for ${adminId}`);
        }

        return true;
    }

    /**
     * Get ALL Admin subscriptions (for broadcasting to all Admins)
     */
    async getAllAdminSubscriptions() {
        if (!this.adminSubscriptions) {
            return [];
        }
        const allSubs = [];
        for (const subs of this.adminSubscriptions.values()) {
            allSubs.push(...subs);
        }
        return allSubs;
    }

    /**
     * Remove an Admin subscription
     */
    async removeAdminSubscription(adminId, endpoint) {
        if (!this.adminSubscriptions) return false;

        const subs = this.adminSubscriptions.get(adminId);
        if (!subs) return false;

        const index = subs.findIndex(sub => sub.endpoint === endpoint);
        if (index !== -1) {
            subs.splice(index, 1);
            console.log(`🗑️  Removed Admin subscription for ${adminId}`);
            if (subs.length === 0) {
                this.adminSubscriptions.delete(adminId);
            }
            return true;
        }
        return false;
    }
}

module.exports = new PushSubscriptionService();

