// backend/controllers/reallocationController.js (WITH WEBSOCKET)

const ReallocationService = require('../services/ReallocationService');
const ValidationService = require('../services/ValidationService');
const trainController = require('./trainController');

let wsManager = null;

// Initialize wsManager after server starts
setTimeout(() => {
  wsManager = require('../config/websocket');
}, 1000);

class ReallocationController {
  /**
   * Mark passenger as no-show
   */
  async markPassengerNoShow(req, res) {
    try {
      const { pnr } = req.body;

      // Validation: PNR is required
      if (!pnr) {
        return res.status(400).json({
          success: false,
          message: "PNR is required"
        });
      }

      // Validation: PNR format (basic check)
      if (typeof pnr !== 'string' || pnr.length !== 10) {
        return res.status(400).json({
          success: false,
          message: "Invalid PNR format. PNR must be 10 characters."
        });
      }

      const pnrValidation = ValidationService.validatePNR(pnr);
      if (!pnrValidation.valid) {
        return res.status(400).json({
          success: false,
          message: pnrValidation.reason
        });
      }

      const trainState = trainController.getGlobalTrainState();

      if (!trainState) {
        return res.status(400).json({
          success: false,
          message: "Train not initialized"
        });
      }

      // CRITICAL FIX: Get passenger location BEFORE marking no-show
      // because markNoShow removes the passenger from the berth
      const location = trainState.findPassenger(pnr);
      let vacantBerthInfo = null;

      if (location) {
        vacantBerthInfo = {
          berth: location.berth,
          coachNo: location.coachNo,
          berthNo: location.berth.berthNo,
          fullBerthNo: location.berth.fullBerthNo,
          type: location.berth.type,
          class: location.coach?.class || 'SL',
          coachName: location.coach?.coach_name || location.coachNo
        };
      }

      const result = await ReallocationService.markNoShow(trainState, pnr);

      // Process vacancy for upgrade offers if berth info was captured
      if (vacantBerthInfo) {
        const currentStation = trainState.getCurrentStation();

        // Trigger offer creation for eligible RAC passengers
        try {
          const offerResult = await ReallocationService.processVacancyForUpgrade(
            trainState,
            vacantBerthInfo,
            currentStation
          );

          if (offerResult.error) {
            console.warn(`⚠️  Vacancy processing had errors: ${offerResult.error}`);
          } else if (offerResult.offersCreated > 0) {
            console.log(`✅ Created ${offerResult.offersCreated} upgrade offer(s)`);
          }
        } catch (vacancyError) {
          // Log but don't fail the no-show operation
          console.error('❌ Error processing vacancy for upgrades:', vacancyError);
        }
      } else {
        console.warn('⚠️  Could not capture berth info for vacancy processing');
      }

      // Broadcast no-show event
      if (wsManager) {
        wsManager.broadcastNoShow({
          passenger: result.passenger,
          currentStation: trainState.getCurrentStation()?.name,
          stats: trainState.stats
        });

        // Also broadcast updated stats
        wsManager.broadcastStatsUpdate(trainState.stats);
      }

      res.json({
        success: true,
        message: `Passenger ${result.passenger.name} marked as no-show`,
        data: result.passenger
      });

    } catch (error) {
      console.error("❌ Error marking no-show:", error);
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Get RAC queue
   */
  getRACQueue(req, res) {
    try {
      const trainState = trainController.getGlobalTrainState();

      if (!trainState) {
        return res.status(400).json({
          success: false,
          message: "Train not initialized"
        });
      }

      const racQueue = ReallocationService.getRACQueue(trainState);

      res.json({
        success: true,
        data: {
          total: racQueue.length,
          queue: racQueue
        }
      });

    } catch (error) {
      console.error("❌ Error getting RAC queue:", error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get vacant berths
   */
  getVacantBerths(req, res) {
    try {
      const trainState = trainController.getGlobalTrainState();

      if (!trainState) {
        return res.status(400).json({
          success: false,
          message: "Train not initialized"
        });
      }

      const vacancies = ReallocationService.getVacantBerths(trainState);

      res.json({
        success: true,
        data: {
          total: vacancies.length,
          vacancies: vacancies
        }
      });

    } catch (error) {
      console.error("❌ Error getting vacant berths:", error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Search passenger by PNR
   */
  searchPassenger(req, res) {
    try {
      const { pnr } = req.params;

      const trainState = trainController.getGlobalTrainState();

      if (!trainState) {
        return res.status(400).json({
          success: false,
          message: "Train not initialized"
        });
      }

      const passenger = ReallocationService.searchPassenger(trainState, pnr);

      res.json({
        success: true,
        data: passenger
      });

    } catch (error) {
      console.error("❌ Error searching passenger:", error);
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Get eligibility matrix
   */
  getEligibilityMatrix(req, res) {
    try {
      const trainState = trainController.getGlobalTrainState();

      if (!trainState) {
        return res.status(400).json({
          success: false,
          message: "Train not initialized"
        });
      }

      const matrix = ReallocationService.getEligibilityMatrix(trainState);

      res.json({
        success: true,
        data: {
          total: matrix.length,
          eligibility: matrix
        }
      });

    } catch (error) {
      console.error("❌ Error getting eligibility matrix:", error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Apply reallocation
   */
  applyReallocation(req, res) {
    try {
      const { allocations } = req.body;

      if (!allocations || !Array.isArray(allocations)) {
        return res.status(400).json({
          success: false,
          message: "Allocations array is required"
        });
      }

      const trainState = trainController.getGlobalTrainState();

      if (!trainState) {
        return res.status(400).json({
          success: false,
          message: "Train not initialized"
        });
      }

      const results = ReallocationService.applyReallocation(trainState, allocations);

      // Broadcast reallocation event
      if (wsManager) {
        wsManager.broadcastRACReallocation({
          success: results.success,
          failed: results.failed,
          totalAllocated: results.success.length,
          currentStation: trainState.getCurrentStation()?.name,
          stats: trainState.stats
        });

        // Broadcast updated stats
        wsManager.broadcastStatsUpdate(trainState.stats);
      }

      res.json({
        success: true,
        message: `Applied ${results.success.length} reallocations`,
        data: results
      });

    } catch (error) {
      console.error("❌ Error applying reallocation:", error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new ReallocationController();