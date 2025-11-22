// passenger-portal/src/hooks/useOffers.js

import { useState, useEffect, useCallback, useRef } from 'react';
import { OFFER_STATUS, WS_EVENTS } from '../constants';
import offerService from '../services/offerService';
import { passengerAPI } from '../api';
import { executeIdempotentRequest } from '../utils/idempotency';
import { showNotification, playNotificationSound } from '../utils/helpers';

/**
 * Custom hook for managing upgrade offers
 * Handles fetching, accepting, denying, and real-time updates
 *
 * @param {string} pnr - Passenger PNR number
 * @param {object} socket - WebSocket connection from useSocket
 * @returns {object} Offers state and methods
 */
const useOffers = (pnr, socket) => {
    const [offers, setOffers] = useState([]);
    const [activeOffers, setActiveOffers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [processingOffer, setProcessingOffer] = useState(null);

    const lastFetchTime = useRef(null);
    const fetchInterval = useRef(null);

    /**
     * Fetch offers from server
     */
    const fetchOffers = useCallback(async () => {
        if (!pnr) return;

        try {
            setLoading(true);
            setError(null);

            const response = await passengerAPI.getUpgradeNotifications(pnr);

            if (response.success) {
                // Merge with local offers
                offerService.mergeServerOffers(response.data || [], pnr);

                // Update state with all offers
                const allOffers = offerService.getOffersByPNR(pnr);
                setOffers(allOffers);

                // Filter active offers
                const active = offerService.getActiveOffers(pnr);
                setActiveOffers(active);

                lastFetchTime.current = Date.now();
            }
        } catch (err) {
            console.error('Failed to fetch offers:', err);
            setError(err.response?.data?.message || 'Failed to fetch upgrade offers');

            // Try to load from local storage on error
            const localOffers = offerService.getOffersByPNR(pnr);
            if (localOffers.length > 0) {
                setOffers(localOffers);
                setActiveOffers(offerService.getActiveOffers(pnr));
            }
        } finally {
            setLoading(false);
        }
    }, [pnr]);

    /**
     * Accept an upgrade offer
     */
    const acceptOffer = useCallback(async (offerId, notificationId) => {
        if (!pnr || !offerId) return;

        try {
            setProcessingOffer(offerId);
            setError(null);

            // Execute with idempotency protection
            const response = await executeIdempotentRequest(
                'accept_offer',
                { pnr, offerId, notificationId },
                async () => {
                    return await passengerAPI.acceptUpgrade(pnr, notificationId);
                }
            );

            if (response.success) {
                // Update local offer status
                offerService.acceptOffer(offerId);

                // Refresh offers from state
                const allOffers = offerService.getOffersByPNR(pnr);
                setOffers(allOffers);
                setActiveOffers(offerService.getActiveOffers(pnr));

                // Show success notification
                showNotification('Offer Accepted', {
                    body: 'Waiting for TTE confirmation...',
                    icon: '/icon-success.png'
                });

                playNotificationSound('success');

                return { success: true, data: response.data };
            }
        } catch (err) {
            console.error('Failed to accept offer:', err);
            const errorMessage = err.response?.data?.message || 'Failed to accept offer';
            setError(errorMessage);

            // Show error notification
            showNotification('Failed to Accept Offer', {
                body: errorMessage,
                icon: '/icon-error.png'
            });

            return { success: false, error: errorMessage };
        } finally {
            setProcessingOffer(null);
        }
    }, [pnr]);

    /**
     * Deny an upgrade offer
     */
    const denyOffer = useCallback(async (offerId, notificationId, reason = 'Not interested') => {
        if (!pnr || !offerId) return;

        try {
            setProcessingOffer(offerId);
            setError(null);

            // Execute with idempotency protection
            const response = await executeIdempotentRequest(
                'deny_offer',
                { pnr, offerId, notificationId },
                async () => {
                    return await passengerAPI.denyUpgrade(pnr, notificationId, reason);
                }
            );

            if (response.success) {
                // Update local offer status
                offerService.denyOffer(offerId, reason);

                // Refresh offers from state
                const allOffers = offerService.getOffersByPNR(pnr);
                setOffers(allOffers);
                setActiveOffers(offerService.getActiveOffers(pnr));

                // Show success notification
                showNotification('Offer Declined', {
                    body: 'You have declined this upgrade offer.',
                    icon: '/icon-info.png'
                });

                return { success: true, data: response.data };
            }
        } catch (err) {
            console.error('Failed to deny offer:', err);
            const errorMessage = err.response?.data?.message || 'Failed to decline offer';
            setError(errorMessage);

            return { success: false, error: errorMessage };
        } finally {
            setProcessingOffer(null);
        }
    }, [pnr]);

    /**
     * Get a single offer by ID
     */
    const getOffer = useCallback((offerId) => {
        return offers.find(offer => offer.id === offerId) || null;
    }, [offers]);

    /**
     * Check if an offer is active
     */
    const isOfferActive = useCallback((offerId) => {
        const offer = getOffer(offerId);
        if (!offer) return false;

        if (offer.status !== OFFER_STATUS.PENDING) return false;

        if (offer.expiresAt) {
            const now = Date.now();
            const expiryTime = new Date(offer.expiresAt).getTime();
            return now < expiryTime;
        }

        return true;
    }, [getOffer]);

    /**
     * Get offer statistics
     */
    const getStatistics = useCallback(() => {
        return offerService.getStatistics(pnr);
    }, [pnr, offers]);

    /**
     * Clear all offers
     */
    const clearOffers = useCallback(() => {
        offerService.clearOffersByPNR(pnr);
        setOffers([]);
        setActiveOffers([]);
    }, [pnr]);

    /**
     * Manually refresh offers
     */
    const refreshOffers = useCallback(async () => {
        await fetchOffers();
    }, [fetchOffers]);

    /**
     * Handle WebSocket events for offers
     */
    useEffect(() => {
        if (!socket || !pnr) return;

        // Handle new offer
        const handleNewOffer = (payload) => {
            console.log('New offer received:', payload);

            // Add to local storage
            const newOffer = offerService.addOffer({
                ...payload,
                pnr,
                status: OFFER_STATUS.PENDING,
                createdAt: new Date().toISOString()
            });

            // Update state
            const allOffers = offerService.getOffersByPNR(pnr);
            setOffers(allOffers);
            setActiveOffers(offerService.getActiveOffers(pnr));

            // Show browser notification
            showNotification('New Upgrade Offer!', {
                body: `Upgrade to ${payload.toBerth} in coach ${payload.coach}`,
                icon: '/icon-offer.png',
                requireInteraction: true
            });

            playNotificationSound('success');
        };

        // Handle offer expired
        const handleOfferExpired = (payload) => {
            console.log('Offer expired:', payload);

            const offer = offerService.getOfferByNotificationId(payload.notificationId);
            if (offer) {
                offerService.expireOffer(offer.id);

                // Update state
                const allOffers = offerService.getOffersByPNR(pnr);
                setOffers(allOffers);
                setActiveOffers(offerService.getActiveOffers(pnr));

                // Show notification
                showNotification('Offer Expired', {
                    body: 'An upgrade offer has expired.',
                    icon: '/icon-warning.png'
                });
            }
        };

        // Handle upgrade confirmed
        const handleUpgradeConfirmed = (payload) => {
            console.log('Upgrade confirmed:', payload);

            const offer = offerService.getOfferByNotificationId(payload.notificationId);
            if (offer) {
                offerService.confirmOffer(offer.id);

                // Update state
                const allOffers = offerService.getOffersByPNR(pnr);
                setOffers(allOffers);
                setActiveOffers(offerService.getActiveOffers(pnr));

                // Show success notification
                showNotification('Upgrade Confirmed! 🎉', {
                    body: `Your upgrade to ${payload.toBerth} has been confirmed by TTE!`,
                    icon: '/icon-success.png',
                    requireInteraction: true
                });

                playNotificationSound('success');
            }
        };

        // Handle upgrade rejected
        const handleUpgradeRejected = (payload) => {
            console.log('Upgrade rejected:', payload);

            const offer = offerService.getOfferByNotificationId(payload.notificationId);
            if (offer) {
                offerService.rejectOffer(offer.id, payload.reason);

                // Update state
                const allOffers = offerService.getOffersByPNR(pnr);
                setOffers(allOffers);
                setActiveOffers(offerService.getActiveOffers(pnr));

                // Show notification
                showNotification('Upgrade Not Approved', {
                    body: payload.reason || 'TTE did not approve the upgrade.',
                    icon: '/icon-error.png'
                });
            }
        };

        // Subscribe to WebSocket events
        const unsubscribeNewOffer = socket.on(WS_EVENTS.NEW_OFFER, handleNewOffer);
        const unsubscribeExpired = socket.on(WS_EVENTS.OFFER_EXPIRED, handleOfferExpired);
        const unsubscribeConfirmed = socket.on(WS_EVENTS.ALLOCATION_CONFIRMED, handleUpgradeConfirmed);
        const unsubscribeRejected = socket.on(WS_EVENTS.ALLOCATION_REJECTED, handleUpgradeRejected);

        // Cleanup
        return () => {
            unsubscribeNewOffer();
            unsubscribeExpired();
            unsubscribeConfirmed();
            unsubscribeRejected();
        };
    }, [socket, pnr]);

    /**
     * Initial fetch and periodic refresh
     */
    useEffect(() => {
        if (!pnr) return;

        // Initial fetch
        fetchOffers();

        // Set up periodic refresh (every 30 seconds)
        fetchInterval.current = setInterval(() => {
            fetchOffers();
        }, 30000);

        // Cleanup
        return () => {
            if (fetchInterval.current) {
                clearInterval(fetchInterval.current);
            }
        };
    }, [pnr, fetchOffers]);

    /**
     * Auto-expire old offers
     */
    useEffect(() => {
        const expireInterval = setInterval(() => {
            offerService.expireOldOffers(pnr);

            // Update state
            const allOffers = offerService.getOffersByPNR(pnr);
            setOffers(allOffers);
            setActiveOffers(offerService.getActiveOffers(pnr));
        }, 5000); // Check every 5 seconds

        return () => clearInterval(expireInterval);
    }, [pnr]);

    return {
        // State
        offers,
        activeOffers,
        loading,
        error,
        processingOffer,
        hasActiveOffers: activeOffers.length > 0,

        // Methods
        acceptOffer,
        denyOffer,
        getOffer,
        isOfferActive,
        getStatistics,
        clearOffers,
        refreshOffers,

        // Meta
        lastFetchTime: lastFetchTime.current
    };
};

export default useOffers;
