/**
 * EligibilityService.js
 * Handles all 11 eligibility rule checking for RAC upgrade
 * Extracted from ReallocationService.js
 */

const CONSTANTS = require("../../constants/reallocationConstants");

class EligibilityService {
  /**
   * Check if RAC passenger is eligible for a vacant segment
   * Applies all 11 eligibility rules
   * @returns {Object} - {eligible: boolean, reason: string}
   */
  isEligibleForSegment(racPassenger, vacantSegment, currentStationIdx, trainState, vacancyId = null) {
    try {
      // Rule 0: Must be RAC status
      if (racPassenger.pnrStatus !== 'RAC') {
        return { eligible: false, reason: 'Not RAC status' };
      }

      // Rule 1: Must be ONLINE
      if (racPassenger.passengerStatus !== 'online') {
        return { eligible: false, reason: 'Not online' };
      }

      // Rule 2: Must be boarded
      if (!racPassenger.boarded) {
        return { eligible: false, reason: 'Not boarded' };
      }

      // Rule 3: Full journey coverage
      const remainingFromIdx = Math.max(racPassenger.fromIdx, currentStationIdx);
      if (vacantSegment.fromIdx > remainingFromIdx || vacantSegment.toIdx < racPassenger.toIdx) {
        return { eligible: false, reason: 'Insufficient journey coverage' };
      }

      // Rule 4: Class match
      if (racPassenger.class !== vacantSegment.class) {
        return { eligible: false, reason: 'Class mismatch' };
      }

      // Rule 5: Solo RAC constraint
      const sharingStatus = this.checkSharingStatus(racPassenger, trainState, currentStationIdx);
      if (!sharingStatus) {
        return { eligible: false, reason: 'Not sharing or will share berth' };
      }

      // Rule 6: No conflicting CNF passenger
      if (this.checkConflictingCNFPassenger(vacantSegment, currentStationIdx, trainState)) {
        return { eligible: false, reason: 'Conflicting CNF passenger' };
      }

      // Rule 7: Not already offered this vacancy
      if (racPassenger.vacancyIdLastOffered === vacancyId) {
        return { eligible: false, reason: 'Already offered this vacancy' };
      }

      // Rule 8: Not already accepted another offer
      if (racPassenger.offerStatus === 'accepted') {
        return { eligible: false, reason: 'Already accepted another offer' };
      }

      // Rule 10: Sufficient time remaining
      const segmentsRemaining = vacantSegment.toIdx - currentStationIdx;
      if (segmentsRemaining < 1) {
        return { eligible: false, reason: 'Insufficient time remaining' };
      }

      // Rule 11: Minimum 70km journey
      const distance = this.calculateJourneyDistance(
        racPassenger.from,
        racPassenger.to,
        trainState
      );
      if (distance < CONSTANTS.ELIGIBILITY_RULES.MIN_JOURNEY_DISTANCE) {
        return { eligible: false, reason: 'Journey too short (<70km)' };
      }

      // All rules passed
      return { eligible: true, reason: 'All criteria met' };
    } catch (error) {
      console.error('❌ Error checking eligibility:', error.message);
      return { eligible: false, reason: `Error: ${error.message}` };
    }
  }

  /**
   * Check if passenger is sharing or will share berth (Rule 5)
   */
  checkSharingStatus(racPassenger, trainState, currentStationIdx) {
    // Check if currently sharing
    if (racPassenger.coPassenger) {
      return true; // Currently sharing
    }

    // Check if co-passenger will board later
    const coPassenger = this.findCoPassenger(racPassenger, trainState);
    if (coPassenger && coPassenger.fromIdx >= currentStationIdx) {
      return true; // Will share when co-passenger boards
    }

    return false; // Solo passenger
  }

  /**
   * Find co-passenger (same berth, different person)
   */
  findCoPassenger(racPassenger, trainState) {
    try {
      const coach = trainState.findCoach(racPassenger.coach);
      if (!coach) return null;

      const berth = coach.berths.find(b => b.berthNo === racPassenger.seat);
      if (!berth) return null;

      // Find other passenger in same berth
      return trainState.getAllPassengers().find(p =>
        p.pnr !== racPassenger.pnr &&
        p.coach === racPassenger.coach &&
        p.seat === racPassenger.seat &&
        p.fromIdx < racPassenger.toIdx &&
        p.toIdx > racPassenger.fromIdx
      );
    } catch (error) {
      console.error('Error finding co-passenger:', error.message);
      return null;
    }
  }

  /**
   * Check for conflicting CNF passenger (Rule 6)
   */
  checkConflictingCNFPassenger(vacantSegment, currentStationIdx, trainState) {
    try {
      const berth = trainState.findBerth(vacantSegment.coach, vacantSegment.berthNo);
      if (!berth) return false;

      // Check segment occupancy for any CNF passenger
      for (let i = vacantSegment.fromIdx; i < vacantSegment.toIdx; i++) {
        const pnr = berth.segmentOccupancy[i];
        if (pnr) {
          const passenger = trainState.findPassengerByPNR(pnr);
          if (passenger && passenger.pnrStatus === 'CNF') {
            return true; // Conflict found
          }
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking conflicts:', error.message);
      return false;
    }
  }

  /**
   * Calculate journey distance from station codes
   */
  calculateJourneyDistance(fromStationCode, toStationCode, trainState) {
    try {
      const fromStation = trainState.stations?.find(s => s.stationCode === fromStationCode);
      const toStation = trainState.stations?.find(s => s.stationCode === toStationCode);

      if (!fromStation || !toStation) {
        return 999; // Assume valid if stations not found
      }

      const distance = toStation.distance - fromStation.distance;
      return Math.abs(distance);
    } catch (error) {
      console.error('Error calculating distance:', error.message);
      return 999; // Assume valid on error
    }
  }

  /**
   * Get eligible RAC passengers for a vacant segment
   * Sorted by RAC priority
   */
  getEligibleRACForVacantSegment(vacantSegment, currentStationIdx, trainState, vacancyId = null) {
    try {
      const racQueue = trainState.getBoardedRACPassengers();
      const eligible = [];

      racQueue.forEach(rac => {
        const result = this.isEligibleForSegment(
          rac,
          vacantSegment,
          currentStationIdx,
          trainState,
          vacancyId
        );

        if (result.eligible) {
          eligible.push({
            ...rac,
            eligibilityReason: result.reason,
          });
        }
      });

      // Sort by RAC priority (RAC 1 > RAC 2 > RAC 3)
      eligible.sort((a, b) => {
        const getRACNum = (status) => {
          const match = status?.match(/RAC\s*(\d+)/i);
          return match ? parseInt(match[1]) : 999;
        };
        return getRACNum(a.racStatus) - getRACNum(b.racStatus);
      });

      return eligible;
    } catch (error) {
      console.error('Error getting eligible RAC:', error.message);
      return [];
    }
  }
}

module.exports = new EligibilityService();
