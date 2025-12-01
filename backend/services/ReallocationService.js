/**
 * ReallocationService.js (REFACTORED)
 * Main orchestrator for RAC reallocation operations
 * Delegates to specialized services for specific tasks
 */

const db = require("../config/db");
const wsManager = require("../config/websocket");
const UpgradeNotificationService = require("./UpgradeNotificationService");

// Import specialized services
const NoShowService = require("./reallocation/NoShowService");
const VacancyService = require("./reallocation/VacancyService");
const EligibilityService = require("./reallocation/EligibilityService");
const RACQueueService = require("./reallocation/RACQueueService");
const AllocationService = require("./reallocation/AllocationService");

class ReallocationService {
  async markNoShow(trainState, pnr) {
    return NoShowService.markNoShow(trainState, pnr);
  }

  getRACQueue(trainState) {
    return RACQueueService.getRACQueue(trainState);
  }

  getVacantBerths(trainState) {
    return VacancyService.getVacantBerths(trainState);
  }

  searchPassenger(trainState, pnr) {
    return RACQueueService.searchPassenger(trainState, pnr);
  }

  isEligibleForSegment(racPassenger, vacantSegment, trainState, currentStationIdx) {
    return EligibilityService.isEligibleForSegment(racPassenger, vacantSegment, trainState, currentStationIdx);
  }

  calculateJourneyDistance(fromStation, toStation, trainState) {
    return EligibilityService.calculateJourneyDistance(fromStation, toStation, trainState);
  }

  checkConflictingCNFPassenger(vacantSegment, trainState) {
    return EligibilityService.checkConflictingCNFPassenger(vacantSegment, trainState);
  }

  findCoPassenger(racPassenger, trainState) {
    return EligibilityService.findCoPassenger(racPassenger, trainState);
  }

  getEligibleRACForVacantSegment(trainState, vacantSegment, currentStationIdx) {
    return EligibilityService.getEligibleRACForVacantSegment(trainState, vacantSegment, currentStationIdx);
  }

  async applyReallocation(trainState, allocations) {
    return AllocationService.applyReallocation(trainState, allocations);
  }

  async upgradeRACPassengerWithCoPassenger(racPNR, newBerthDetails, trainState) {
    return AllocationService.upgradeRACPassengerWithCoPassenger(racPNR, newBerthDetails, trainState);
  }

  /**
   * Get eligibility matrix - shows which RAC passengers are eligible for each vacant berth
   */
  getEligibilityMatrix(trainState) {
    try {
      const vacantSegments = VacancyService.getVacantSegments(trainState);
      const currentStationIdx = trainState.currentStationIdx || 0;
      const eligibilityMatrix = [];

      vacantSegments.forEach((vacantSegment) => {
        const eligiblePassengers = EligibilityService.getEligibleRACForVacantSegment(
          vacantSegment,
          currentStationIdx,
          trainState
        );

        if (eligiblePassengers.length > 0) {
          eligibilityMatrix.push({
            berth: `${vacantSegment.coachNo}-${vacantSegment.berthNo}`,
            coach: vacantSegment.coachNo,
            berthNo: vacantSegment.berthNo,
            type: vacantSegment.type,
            berthType: vacantSegment.type,
            class: vacantSegment.class,
            vacantFrom: trainState.stations?.[vacantSegment.fromIdx]?.code || vacantSegment.from,
            vacantTo: trainState.stations?.[vacantSegment.toIdx]?.code || vacantSegment.to,
            vacantFromIdx: vacantSegment.fromIdx,
            vacantToIdx: vacantSegment.toIdx,
            vacantSegment: `${trainState.stations?.[vacantSegment.fromIdx]?.name || vacantSegment.from} → ${trainState.stations?.[vacantSegment.toIdx]?.name || vacantSegment.to}`,
            eligibleRAC: eligiblePassengers,
            eligibleCount: eligiblePassengers.length,
            topEligible: eligiblePassengers[0], // Highest priority passenger
            topCandidate: eligiblePassengers[0], // Compatibility field
          });
        }
      });

      return eligibilityMatrix;
    } catch (error) {
      console.error('Error generating eligibility matrix:', error);
      return [];
    }
  }

  getRACStats(trainState) {
    return RACQueueService.getRACStats(trainState);
  }
}

module.exports = new ReallocationService();
