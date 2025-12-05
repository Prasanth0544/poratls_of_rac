// backend/services/UpgradeNotificationService.js
// UPDATED: Now uses MongoDB for persistence (survives server restarts)

const db = require("../config/db");

class UpgradeNotificationService {
    constructor() {
        this.collectionName = 'upgrade_notifications';
        this.denialLogCollection = 'upgrade_denial_log';
        this.initialized = false;
        console.log('📩 UpgradeNotificationService initialized (MongoDB-backed)');
    }

    /**
     * Get MongoDB collection
     */
    async getCollection() {
        const racDb = await db.getDb();
        return racDb.collection(this.collectionName);
    }

    /**
     * Get denial log collection
     */
    async getDenialCollection() {
        const racDb = await db.getDb();
        return racDb.collection(this.denialLogCollection);
    }

    /**
     * Create upgrade notification for RAC passenger
     */
    async createUpgradeNotification(racPassenger, vacantBerth, currentStation) {
        const collection = await this.getCollection();

        const notification = {
            id: `UPGRADE_${Date.now()}_${racPassenger.pnr}`,
            pnr: racPassenger.pnr,
            name: racPassenger.name,
            currentBerth: `${racPassenger.coach}-${racPassenger.seatNo}`,
            offeredBerth: vacantBerth.fullBerthNo,
            offeredCoach: vacantBerth.coachNo,
            offeredSeatNo: vacantBerth.berthNo,
            offeredBerthType: vacantBerth.type,
            station: currentStation.name,
            stationCode: currentStation.code,
            timestamp: new Date().toISOString(),
            status: 'PENDING', // PENDING, ACCEPTED, DENIED
            vacantSegment: vacantBerth.vacantSegment,
            createdAt: new Date()
        };

        await collection.insertOne(notification);

        console.log(`📩 Upgrade notification created for ${racPassenger.name} (${racPassenger.pnr})`);
        console.log(`   Offered: ${vacantBerth.fullBerthNo} (${vacantBerth.type})`);

        return notification;
    }

    /**
     * Accept upgrade offer
     */
    async acceptUpgrade(pnr, notificationId) {
        const collection = await this.getCollection();

        const notification = await collection.findOne({ id: notificationId, pnr });

        if (!notification) {
            throw new Error(`Notification ${notificationId} not found for PNR ${pnr}`);
        }

        if (notification.status !== 'PENDING') {
            throw new Error(`Notification already ${notification.status}`);
        }

        await collection.updateOne(
            { id: notificationId },
            {
                $set: {
                    status: 'ACCEPTED',
                    acceptedAt: new Date().toISOString()
                }
            }
        );

        console.log(`✅ Upgrade accepted by ${notification.name} (${pnr})`);

        return { ...notification, status: 'ACCEPTED', acceptedAt: new Date().toISOString() };
    }

    /**
     * Deny upgrade offer
     */
    async denyUpgrade(pnr, notificationId, reason = 'Passenger declined') {
        const collection = await this.getCollection();
        const denialCollection = await this.getDenialCollection();

        const notification = await collection.findOne({ id: notificationId, pnr });

        if (!notification) {
            throw new Error(`Notification ${notificationId} not found for PNR ${pnr}`);
        }

        if (notification.status !== 'PENDING') {
            throw new Error(`Notification already ${notification.status}`);
        }

        const deniedAt = new Date().toISOString();

        await collection.updateOne(
            { id: notificationId },
            {
                $set: {
                    status: 'DENIED',
                    deniedAt,
                    denialReason: reason
                }
            }
        );

        // Log denial
        await denialCollection.insertOne({
            pnr,
            name: notification.name,
            offeredBerth: notification.offeredBerth,
            station: notification.station,
            timestamp: deniedAt,
            reason,
            createdAt: new Date()
        });

        console.log(`❌ Upgrade denied by ${notification.name} (${pnr}): ${reason}`);

        return { ...notification, status: 'DENIED', deniedAt, denialReason: reason };
    }

    /**
     * Get pending notifications for passenger
     */
    async getPendingNotifications(pnr) {
        const collection = await this.getCollection();
        return await collection.find({ pnr, status: 'PENDING' }).toArray();
    }

    /**
     * Get all notifications for passenger
     */
    async getAllNotifications(pnr) {
        const collection = await this.getCollection();
        return await collection.find({ pnr }).sort({ createdAt: -1 }).toArray();
    }

    /**
     * Clear notifications for passenger
     */
    async clearNotifications(pnr) {
        const collection = await this.getCollection();
        await collection.deleteMany({ pnr });
    }

    /**
     * Get denial log
     */
    async getDenialLog() {
        const denialCollection = await this.getDenialCollection();
        return await denialCollection.find({}).sort({ createdAt: -1 }).toArray();
    }

    /**
     * Check if passenger has denied this specific berth recently
     */
    async hasDeniedBerth(pnr, berthNo) {
        const collection = await this.getCollection();
        const denial = await collection.findOne({
            pnr,
            offeredBerth: berthNo,
            status: 'DENIED'
        });
        return !!denial;
    }

    /**
     * Get all sent notifications (for TTE portal tracking)
     */
    async getAllSentNotifications() {
        const collection = await this.getCollection();
        const notifications = await collection.find({}).sort({ createdAt: -1 }).toArray();

        return notifications.map(notification => ({
            pnr: notification.pnr,
            passengerName: notification.name,
            offeredBerth: notification.offeredBerth,
            coach: notification.offeredCoach,
            berthNo: notification.offeredSeatNo,
            berthType: notification.offeredBerthType,
            sentAt: notification.timestamp,
            expiresAt: null,
            status: notification.status.toLowerCase(),
            respondedAt: notification.acceptedAt || notification.deniedAt || null,
            offerId: notification.id
        }));
    }
}

module.exports = new UpgradeNotificationService();
