// passenger-portal/src/services/offerService.js

import { OFFER_STATUS, STORAGE_KEYS } from '../constants';
import { storage } from '../utils/helpers';
import { generateUniqueId } from '../utils/helpers';

/**
 * Offer Service
 * Manages upgrade offers including storage, merging, and status tracking
 */
class OfferService {
    constructor() {
        this.offers = new Map();
        this.loadOffersFromStorage();
    }

    /**
     * Load offers from local storage
     */
    loadOffersFromStorage() {
        try {
            const stored = storage.get(STORAGE_KEYS.OFFERS, []);
            stored.forEach(offer => {
                this.offers.set(offer.id, offer);
            });
        } catch (error) {
            console.error('Failed to load offers from storage', error);
        }
    }

    /**
     * Save offers to local storage
     */
    saveOffersToStorage() {
        try {
            const offersArray = Array.from(this.offers.values());
            storage.set(STORAGE_KEYS.OFFERS, offersArray);
        } catch (error) {
            console.error('Failed to save offers to storage', error);
        }
    }

    /**
     * Add new offer
     * @param {object} offerData - Offer data
     * @returns {object} Added offer
     */
    addOffer(offerData) {
        const offer = {
            id: offerData.id || generateUniqueId(),
            notificationId: offerData.notificationId,
            pnr: offerData.pnr,
            fromBerth: offerData.fromBerth,
            toBerth: offerData.toBerth,
            coach: offerData.coach,
            berthType: offerData.berthType,
            status: offerData.status || OFFER_STATUS.PENDING,
            createdAt: offerData.createdAt || new Date().toISOString(),
            expiresAt: offerData.expiresAt,
            acceptedAt: offerData.acceptedAt || null,
            deniedAt: offerData.deniedAt || null,
            confirmedAt: offerData.confirmedAt || null,
            rejectedAt: offerData.rejectedAt || null,
            metadata: offerData.metadata || {}
        };

        this.offers.set(offer.id, offer);
        this.saveOffersToStorage();

        return offer;
    }

    /**
     * Update existing offer
     * @param {string} offerId - Offer ID
     * @param {object} updates - Updates to apply
     * @returns {object|null} Updated offer or null
     */
    updateOffer(offerId, updates) {
        const offer = this.offers.get(offerId);
        if (!offer) {
            console.warn(`Offer not found: ${offerId}`);
            return null;
        }

        const updatedOffer = {
            ...offer,
            ...updates,
            updatedAt: new Date().toISOString()
        };

        this.offers.set(offerId, updatedOffer);
        this.saveOffersToStorage();

        return updatedOffer;
    }

    /**
     * Get offer by ID
     * @param {string} offerId - Offer ID
     * @returns {object|null} Offer or null
     */
    getOffer(offerId) {
        return this.offers.get(offerId) || null;
    }

    /**
     * Get offer by notification ID
     * @param {string} notificationId - Notification ID
     * @returns {object|null} Offer or null
     */
    getOfferByNotificationId(notificationId) {
        return Array.from(this.offers.values()).find(
            offer => offer.notificationId === notificationId
        ) || null;
    }

    /**
     * Get all offers for a PNR
     * @param {string} pnr - PNR number
     * @param {object} filters - Optional filters
     * @returns {Array} Array of offers
     */
    getOffersByPNR(pnr, filters = {}) {
        let offers = Array.from(this.offers.values()).filter(
            offer => offer.pnr === pnr
        );

        // Apply status filter
        if (filters.status) {
            offers = offers.filter(offer => offer.status === filters.status);
        }

        // Apply active filter (not expired and pending)
        if (filters.active) {
            const now = new Date().getTime();
            offers = offers.filter(offer => {
                if (offer.status !== OFFER_STATUS.PENDING) return false;
                if (!offer.expiresAt) return true;
                return new Date(offer.expiresAt).getTime() > now;
            });
        }

        // Sort by creation date (newest first)
        offers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return offers;
    }

    /**
     * Get all active offers for a PNR
     * @param {string} pnr - PNR number
     * @returns {Array} Active offers
     */
    getActiveOffers(pnr) {
        return this.getOffersByPNR(pnr, { active: true });
    }

    /**
     * Get all offers (with optional filters)
     * @param {object} filters - Optional filters
     * @returns {Array} Array of offers
     */
    getAllOffers(filters = {}) {
        let offers = Array.from(this.offers.values());

        if (filters.status) {
            offers = offers.filter(offer => offer.status === filters.status);
        }

        if (filters.pnr) {
            offers = offers.filter(offer => offer.pnr === filters.pnr);
        }

        return offers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    /**
     * Mark offer as accepted
     * @param {string} offerId - Offer ID
     * @returns {object|null} Updated offer
     */
    acceptOffer(offerId) {
        return this.updateOffer(offerId, {
            status: OFFER_STATUS.ACCEPTED,
            acceptedAt: new Date().toISOString()
        });
    }

    /**
     * Mark offer as denied
     * @param {string} offerId - Offer ID
     * @param {string} reason - Denial reason
     * @returns {object|null} Updated offer
     */
    denyOffer(offerId, reason = null) {
        return this.updateOffer(offerId, {
            status: OFFER_STATUS.DENIED,
            deniedAt: new Date().toISOString(),
            denialReason: reason
        });
    }

    /**
     * Mark offer as confirmed (by TTE)
     * @param {string} offerId - Offer ID
     * @returns {object|null} Updated offer
     */
    confirmOffer(offerId) {
        return this.updateOffer(offerId, {
            status: OFFER_STATUS.CONFIRMED,
            confirmedAt: new Date().toISOString()
        });
    }

    /**
     * Mark offer as rejected (by TTE)
     * @param {string} offerId - Offer ID
     * @param {string} reason - Rejection reason
     * @returns {object|null} Updated offer
     */
    rejectOffer(offerId, reason = null) {
        return this.updateOffer(offerId, {
            status: OFFER_STATUS.REJECTED,
            rejectedAt: new Date().toISOString(),
            rejectionReason: reason
        });
    }

    /**
     * Mark offer as expired
     * @param {string} offerId - Offer ID
     * @returns {object|null} Updated offer
     */
    expireOffer(offerId) {
        return this.updateOffer(offerId, {
            status: OFFER_STATUS.EXPIRED,
            expiredAt: new Date().toISOString()
        });
    }

    /**
     * Check and expire old offers
     * @param {string} pnr - Optional PNR to check specific offers
     */
    expireOldOffers(pnr = null) {
        const now = new Date().getTime();
        let offersToCheck = pnr
            ? this.getOffersByPNR(pnr)
            : Array.from(this.offers.values());

        offersToCheck.forEach(offer => {
            if (offer.status === OFFER_STATUS.PENDING && offer.expiresAt) {
                const expiryTime = new Date(offer.expiresAt).getTime();
                if (now >= expiryTime) {
                    this.expireOffer(offer.id);
                }
            }
        });
    }

    /**
     * Delete offer
     * @param {string} offerId - Offer ID
     * @returns {boolean} True if deleted
     */
    deleteOffer(offerId) {
        const deleted = this.offers.delete(offerId);
        if (deleted) {
            this.saveOffersToStorage();
        }
        return deleted;
    }

    /**
     * Clear all offers for a PNR
     * @param {string} pnr - PNR number
     */
    clearOffersByPNR(pnr) {
        const offers = this.getOffersByPNR(pnr);
        offers.forEach(offer => this.offers.delete(offer.id));
        this.saveOffersToStorage();
    }

    /**
     * Clear all offers
     */
    clearAllOffers() {
        this.offers.clear();
        this.saveOffersToStorage();
    }

    /**
     * Merge offers from server
     * @param {Array} serverOffers - Offers from server
     * @param {string} pnr - PNR number
     */
    mergeServerOffers(serverOffers, pnr) {
        if (!Array.isArray(serverOffers)) {
            return;
        }

        // Get existing offers for this PNR
        const existingOffers = this.getOffersByPNR(pnr);
        const existingNotificationIds = new Set(
            existingOffers.map(offer => offer.notificationId)
        );

        // Add new offers from server
        serverOffers.forEach(serverOffer => {
            if (!existingNotificationIds.has(serverOffer.notificationId)) {
                this.addOffer(serverOffer);
            } else {
                // Update existing offer if server has newer data
                const existing = this.getOfferByNotificationId(serverOffer.notificationId);
                if (existing && this.shouldUpdateFromServer(existing, serverOffer)) {
                    this.updateOffer(existing.id, serverOffer);
                }
            }
        });

        // Expire old offers
        this.expireOldOffers(pnr);
    }

    /**
     * Check if offer should be updated from server
     * @param {object} localOffer - Local offer
     * @param {object} serverOffer - Server offer
     * @returns {boolean} True if should update
     */
    shouldUpdateFromServer(localOffer, serverOffer) {
        // Always update if server status is different
        if (localOffer.status !== serverOffer.status) {
            return true;
        }

        // Update if server has confirmation/rejection timestamp
        if (serverOffer.confirmedAt || serverOffer.rejectedAt) {
            return true;
        }

        return false;
    }

    /**
     * Get offer statistics
     * @param {string} pnr - Optional PNR filter
     * @returns {object} Statistics
     */
    getStatistics(pnr = null) {
        const offers = pnr
            ? this.getOffersByPNR(pnr)
            : Array.from(this.offers.values());

        return {
            total: offers.length,
            pending: offers.filter(o => o.status === OFFER_STATUS.PENDING).length,
            accepted: offers.filter(o => o.status === OFFER_STATUS.ACCEPTED).length,
            denied: offers.filter(o => o.status === OFFER_STATUS.DENIED).length,
            confirmed: offers.filter(o => o.status === OFFER_STATUS.CONFIRMED).length,
            rejected: offers.filter(o => o.status === OFFER_STATUS.REJECTED).length,
            expired: offers.filter(o => o.status === OFFER_STATUS.EXPIRED).length
        };
    }

    /**
     * Export offers as JSON
     * @param {string} pnr - Optional PNR filter
     * @returns {string} JSON string
     */
    exportOffers(pnr = null) {
        const offers = pnr
            ? this.getOffersByPNR(pnr)
            : Array.from(this.offers.values());

        return JSON.stringify(offers, null, 2);
    }

    /**
     * Import offers from JSON
     * @param {string} jsonString - JSON string
     */
    importOffers(jsonString) {
        try {
            const offers = JSON.parse(jsonString);
            if (Array.isArray(offers)) {
                offers.forEach(offer => this.addOffer(offer));
            }
        } catch (error) {
            console.error('Failed to import offers', error);
        }
    }
}

// Create singleton instance
const offerService = new OfferService();

export default offerService;
export { OfferService };
