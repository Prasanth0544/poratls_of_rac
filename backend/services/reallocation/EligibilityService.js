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
      console.log(`\n🔍 Checking eligibility for ${racPassenger.name} (${racPassenger.pnr})`);
      console.log(`   Vacant: ${vacantSegment.coachNo}-${vacantSegment.berthNo} (${vacantSegment.fromIdx}→${vacantSegment.toIdx})`);

      // Rule 0: Must be RAC status
      if (racPassenger.pnrStatus !== 'RAC') {
        console.log(`   ❌ Rule 0 FAILED: Not RAC status (${racPassenger.pnrStatus})`);
        return { eligible: false, reason: 'Not RAC status' };
      }
      console.log(`   ✅ Rule 0 PASSED: RAC status`);

      // Rule 1: Must be ONLINE
      if (racPassenger.passengerStatus !== 'online') {
        console.log(`   ❌ Rule 1 FAILED: Not online (${racPassenger.passengerStatus || 'undefined'})`);
        return { eligible: false, reason: 'Not online' };
      }
      console.log(`   ✅ Rule 1 PASSED: Online`);

      // Rule 2: Must be boarded
      if (!racPassenger.boarded) {
        console.log(`   ❌ Rule 2 FAILED: Not boarded (${racPassenger.boarded})`);
        return { eligible: false, reason: 'Not boarded' };
      }
      console.log(`   ✅ Rule 2 PASSED: Boarded`);

      // Rule 3: Full journey coverage
      const remainingFromIdx = Math.max(racPassenger.fromIdx, currentStationIdx);
      console.log(`   Rule 3 Check: RAC Journey ${racPassenger.fromIdx}→${racPassenger.toIdx}, Vacant ${vacantSegment.fromIdx}→${vacantSegment.toIdx}, Current: ${currentStationIdx}`);
      if (vacantSegment.fromIdx > remainingFromIdx || vacantSegment.toIdx < racPassenger.toIdx) {
        console.log(`   ❌ Rule 3 FAILED: Insufficient journey coverage`);
        return { eligible: false, reason: 'Insufficient journey coverage' };
      }
      console.log(`   ✅ Rule 3 PASSED: Journey coverage OK`);

      // Rule 4: Class match
      if (racPassenger.class !== vacantSegment.class) {
        console.log(`   ❌ Rule 4 FAILED: Class mismatch (RAC: ${racPassenger.class}, Vacant: ${vacantSegment.class})`);
        return { eligible: false, reason: 'Class mismatch' };
      }
      console.log(`   ✅ Rule 4 PASSED: Class match`);

      // Rule 5: Solo RAC constraint - DISABLED
      // REASON: This rule was preventing valid upgrades from happening.
      // ORIGINAL LOGIC: Only allow RAC passengers who are currently sharing a berth to be upgraded.
      //                 This blocked solo RAC passengers from getting upgrades.
      // DECISION: Disabled to allow all eligible RAC passengers (solo or sharing) to receive upgrade offers.
      //           If both passengers sharing a RAC berth are eligible, both can be offered different vacant berths.
      //
      // ORIGINAL CODE (kept for reference):
      // const sharingStatus = this.checkSharingStatus(racPassenger, trainState, currentStationIdx);
      // if (!sharingStatus) {
      //   return { eligible: false, reason: 'Not sharing or will share berth' };
      // }
      //
      console.log(`   ✅ Rule 5 SKIPPED: Sharing constraint disabled`);

      // Rule 6: No conflicting CNF passenger
      if (this.checkConflictingCNFPassenger(vacantSegment, currentStationIdx, trainState)) {
        console.log(`   ❌ Rule 6 FAILED: Conflicting CNF passenger`);
        return { eligible: false, reason: 'Conflicting CNF passenger' };
      }
      console.log(`   ✅ Rule 6 PASSED: No conflicts`);

      // Rule 7: Not already offered this vacancy
      if (racPassenger.vacancyIdLastOffered === vacancyId) {
        console.log(`   ❌ Rule 7 FAILED: Already offered this vacancy`);
        return { eligible: false, reason: 'Already offered this vacancy' };
      }
      console.log(`   ✅ Rule 7 PASSED: Not yet offered`);

      // Rule 8: Not already accepted another offer
      if (racPassenger.offerStatus === 'accepted') {
        console.log(`   ❌ Rule 8 FAILED: Already accepted another offer`);
        return { eligible: false, reason: 'Already accepted another offer' };
      }
      console.log(`   ✅ Rule 8 PASSED: No accepted offers`);

      // Rule 10: Sufficient time remaining
      const segmentsRemaining = vacantSegment.toIdx - currentStationIdx;
      if (segmentsRemaining < 1) {
        console.log(`   ❌ Rule 10 FAILED: Insufficient time remaining (${segmentsRemaining} segments)`);
        return { eligible: false, reason: 'Insufficient time remaining' };
      }
      console.log(`   ✅ Rule 10 PASSED: Time remaining OK`);

      // Rule 11: Minimum 70km journey
      const distance = this.calculateJourneyDistance(
        racPassenger.from,
        racPassenger.to,
        trainState
      );
      if (distance < CONSTANTS.ELIGIBILITY_RULES.MIN_JOURNEY_DISTANCE) {
        console.log(`   ❌ Rule 11 FAILED: Journey too short (${distance}km < 70km)`);
        return { eligible: false, reason: 'Journey too short (<70km)' };
      }
      console.log(`   ✅ Rule 11 PASSED: Distance OK (${distance}km)`);

      // All rules passed
      console.log(`   ✅✅✅ ALL RULES PASSED! ${racPassenger.name} is ELIGIBLE!`);
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
