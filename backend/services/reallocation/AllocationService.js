/**
 * AllocationService.js
 * Handles RAC to berth allocation and upgrade operations
 * Extracted from ReallocationService.js
 */

const db = require("../../config/db");
const wsManager = require("../../config/websocket");

class AllocationService {
  /**
   * Apply reallocation (upgrade RAC to CNF)
   * @param {TrainState} trainState
   * @param {Array} allocations - Array of {pnr, coach, berth} objects
   */
  async applyReallocation(trainState, allocations) {
    try {
      if (!Array.isArray(allocations) || allocations.length === 0) {
        throw new Error('Invalid allocations array');
      }

      const results = [];

      for (const allocation of allocations) {
        try {
          const result = await this._processAllocation(trainState, allocation);
          results.push(result);
        } catch (error) {
          console.error(`Error processing allocation for ${allocation.pnr}:`, error.message);
          results.push({
            success: false,
            pnr: allocation.pnr,
            error: error.message,
          });
        }
      }

      return {
        success: true,
        totalProcessed: allocations.length,
        totalSuccess: results.filter(r => r.success).length,
        totalFailed: results.filter(r => !r.success).length,
        results,
      };
    } catch (error) {
      console.error('Error applying reallocation:', error.message);
      throw error;
    }
  }

  /**
   * Process single allocation
   * @private
   */
  async _processAllocation(trainState, allocation) {
    const { pnr, coach, berth } = allocation;

    // Find passenger
    const passenger = trainState.findPassengerByPNR(pnr);
    if (!passenger) {
      throw new Error(`Passenger ${pnr} not found`);
    }

    // Find berth
    const berthObj = trainState.findBerth(coach, berth);
    if (!berthObj) {
      throw new Error(`Berth ${coach}-${berth} not found`);
    }

    // Allocate berth
    this._allocateBerth(passenger, berthObj, trainState);

    // Update database with berth type
    await this._updateDatabase(pnr, coach, berth, berthObj.type);

    // Update statistics
    this._updateStats(trainState, passenger);

    // Broadcast websocket event
    wsManager.broadcast('RAC_UPGRADED', {
      pnr,
      name: passenger.name,
      coach,
      berth,
      from: passenger.from,
      to: passenger.to,
    });

    // Log event
    trainState.logEvent('RAC_UPGRADED', 'RAC upgraded to CNF', {
      pnr,
      name: passenger.name,
      coach,
      berth,
    });

    return {
      success: true,
      pnr,
      coach,
      berth,
      passengerName: passenger.name,
    };
  }

  /**
   * Allocate berth to passenger
   * @private
   */
  _allocateBerth(passenger, berth, trainState) {
    // Update passenger allocation
    passenger.coach = berth.coachNo;
    passenger.seat = berth.berthNo;
    passenger.pnrStatus = 'CNF';
    passenger.racStatus = '-';           // Update RAC status
    passenger.berthType = berth.type;    // Update berth type
    passenger.boarded = true;

    // Update berth occupancy
    for (let i = passenger.fromIdx; i < passenger.toIdx; i++) {
      berth.segmentOccupancy[i] = passenger.pnr;
    }

    berth.updateStatus();
  }

  /**
   * Update database
   * @private
   */
  async _updateDatabase(pnr, coach, berth, berthType) {
    try {
      const passengersCollection = db.getPassengersCollection();
      await passengersCollection.updateOne(
        { PNR_Number: pnr },
        {
          $set: {
            PNR_Status: 'CNF',           // RAC → CNF
            Rac_status: '-',             // "1" → "-"
            Assigned_Coach: coach,       // Use correct field name
            Assigned_berth: berth,       // Use correct field name
            Berth_Type: berthType,       // Update from "Side Lower" to actual type
            Passenger_Status: 'Offline', // Maintain status
            Boarded: true,
            Upgraded_From: 'RAC',
          },
        }
      );
      console.log(`✅ Updated RAC upgrade in MongoDB for PNR: ${pnr}`);
      console.log(`   PNR_Status: RAC → CNF | Rac_status: → "-" | Berth: ${coach}-${berth} (${berthType})`);
    } catch (error) {
      console.error('Error updating database:', error.message);
      throw error;
    }
  }

  /**
   * Update statistics
   * @private
   */
  _updateStats(trainState, passenger) {
    if (trainState.stats) {
      trainState.stats.totalRACUpgraded = (trainState.stats.totalRACUpgraded || 0) + 1;
      trainState.stats.currentOnboard = (trainState.stats.currentOnboard || 0) + 1;
      trainState.stats.vacantBerths = (trainState.stats.vacantBerths || 0) - 1;
    }
  }

  /**
   * Allocate with co-passenger (for joint upgrades)
   */
  async upgradeRACPassengerWithCoPassenger(racPNR, newBerthDetails, trainState) {
    try {
      const racPassenger = trainState.findPassengerByPNR(racPNR);
      if (!racPassenger) {
        throw new Error(`RAC passenger ${racPNR} not found`);
      }

      // Find co-passenger
      const coPassenger = this._findCoPassenger(racPassenger, trainState);
      if (!coPassenger) {
        throw new Error('Co-passenger not found');
      }

      // Allocate both passengers to same berth
      const berth = trainState.findBerth(newBerthDetails.coachNo, newBerthDetails.berthNo);
      if (!berth) {
        throw new Error('Berth not found');
      }

      // Allocate RAC passenger
      this._allocateBerth(racPassenger, berth, trainState);

      // Update co-passenger if needed
      if (coPassenger.pnrStatus === 'RAC') {
        this._allocateBerth(coPassenger, berth, trainState);
      }

      // Update database with berth type
      await this._updateDatabase(racPNR, newBerthDetails.coachNo, newBerthDetails.berthNo, berth.type);
      if (coPassenger.pnrStatus === 'RAC') {
        await this._updateDatabase(coPassenger.pnr, newBerthDetails.coachNo, newBerthDetails.berthNo, berth.type);
      }

      return {
        success: true,
        racPNR,
        coPassengerPNR: coPassenger.pnr,
        berth: `${newBerthDetails.coachNo}-${newBerthDetails.berthNo}`,
      };
    } catch (error) {
      console.error('Error upgrading with co-passenger:', error.message);
      throw error;
    }
  }

  /**
   * Find co-passenger in same berth
   * @private
   */
  _findCoPassenger(racPassenger, trainState) {
    try {
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
}

module.exports = new AllocationService();
