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

  getRACStats(trainState) {
    return RACQueueService.getRACStats(trainState);
  }
}

module.exports = new ReallocationService();
