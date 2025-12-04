/**
 * CurrentStationReallocationService.js
 * NEW APPROACH: Only process data from CURRENT station
 * - RAC passengers boarded at current station
 * - Berths vacant from current station
 * INTEGRATED: Creates pending reallocations for TTE approval
 */

const StationWiseApprovalService = require('./StationWiseApprovalService');

class CurrentStationReallocationService {
    /**
     * Get current station reallocation data
     * Returns two HashMaps (as arrays) for visual matching
     */
    getCurrentStationData(trainState) {
        const currentIdx = trainState.currentStationIdx;
        const currentStation = trainState.stations[currentIdx];

        console.log(`\n🎯 Getting CURRENT STATION reallocation data: ${currentStation.name} (idx: ${currentIdx})`);

        // HashMap 1: RAC Passengers boarded at current station
        const racHashMap = this._getRACPassengersAtCurrentStation(trainState, currentIdx);

        // HashMap 2: Vacant berths from current station
        const vacantBerthsHashMap = this._getVacantBerthsFromCurrentStation(trainState, currentIdx);

        // Find matches
        const matches = this._findMatches(racHashMap, vacantBerthsHashMap, currentIdx);

        // Convert Maps to arrays for JSON serialization
        const racPassengersArray = Array.from(racHashMap.values());
        const vacantBerthsArray = Array.from(vacantBerthsHashMap.values());

        // Group RAC passengers by destination station
        const racByDestination = this._groupByDestination(racPassengersArray, trainState);

        // Group vacant berths by vacancy end station
        const berthsByVacancyEnd = this._groupByVacancyEnd(vacantBerthsArray, trainState);

        return {
            currentStation: {
                name: currentStation.name,
                code: currentStation.code,
                index: currentIdx
            },
            // Array format for display
            racPassengers: racPassengersArray,
            vacantBerths: vacantBerthsArray,
            // Grouped format for station-wise view
            racByDestination: racByDestination,
            berthsByVacancyEnd: berthsByVacancyEnd,
            // Matches
            matches: matches,
            stats: {
                racPassengersCount: racHashMap.size,
                vacantBerthsCount: vacantBerthsHashMap.size,
                matchesCount: matches.length,
                upgradesAvailable: Math.min(matches.length, racHashMap.size)
            }
        };
    }

    /**
     * Group RAC passengers by their destination station
     */
    _groupByDestination(passengers, trainState) {
        const grouped = {};
        passengers.forEach(p => {
            const destName = p.destination || `Station ${p.destinationIdx}`;
            if (!grouped[destName]) {
                grouped[destName] = {
                    stationName: destName,
                    stationIdx: p.destinationIdx,
                    passengers: []
                };
            }
            grouped[destName].passengers.push(p);
        });
        // Sort by station index
        return Object.values(grouped).sort((a, b) => a.stationIdx - b.stationIdx);
    }

    /**
     * Group vacant berths by when they become occupied
     */
    _groupByVacancyEnd(berths, trainState) {
        const grouped = {};
        berths.forEach(b => {
            const endName = b.lastVacantStation || `Station ${b.lastVacantIdx}`;
            if (!grouped[endName]) {
                grouped[endName] = {
                    stationName: endName,
                    stationIdx: b.lastVacantIdx,
                    berths: []
                };
            }
            grouped[endName].berths.push(b);
        });
        // Sort by station index
        return Object.values(grouped).sort((a, b) => a.stationIdx - b.stationIdx);
    }

    /**
     * Get RAC passengers who boarded at current station
     * HashMap: PNR → {name, destination, destinationIdx}
     */
    _getRACPassengersAtCurrentStation(trainState, currentIdx) {
        const racHashMap = new Map();
        const boardedRAC = trainState.getBoardedRACPassengers();

        console.log(`\n📊 RAC Passengers boarded at current station (${currentIdx}):`);

        boardedRAC.forEach(passenger => {
            // FILTER: Only passengers whose remaining journey is from current station
            // (They boarded at or before current station and haven't deboarded yet)
            if (passenger.fromIdx <= currentIdx && passenger.toIdx > currentIdx) {
                const destinationStation = trainState.stations[passenger.toIdx];

                racHashMap.set(passenger.pnr, {
                    pnr: passenger.pnr,
                    name: passenger.name,
                    racStatus: passenger.racStatus,
                    currentBerth: `${passenger.coach}-${passenger.seat}`,
                    from: passenger.from,
                    fromIdx: passenger.fromIdx,
                    destination: destinationStation?.name || passenger.to,
                    destinationIdx: passenger.toIdx,
                    passengerStatus: passenger.passengerStatus
                });

                console.log(`   ✅ ${passenger.pnr} → ${destinationStation?.name} (idx: ${passenger.toIdx})`);
            }
        });

        console.log(`   Total: ${racHashMap.size} RAC passengers`);
        return racHashMap;
    }

    /**
     * Get berths that became vacant from current station
     * HashMap: BerthID → {lastVacantStation, lastVacantIdx}
     */
    _getVacantBerthsFromCurrentStation(trainState, currentIdx) {
        const vacantHashMap = new Map();

        console.log(`\n🛏️ Berths vacant from current station (${currentIdx}):`);

        trainState.coaches.forEach(coach => {
            coach.berths.forEach(berth => {
                // Find vacant ranges for this berth
                const vacantRanges = this._findVacantRanges(berth, trainState);

                // FILTER: Only ranges that start at or before current station
                vacantRanges.forEach(range => {
                    if (range.fromIdx <= currentIdx && range.toIdx > currentIdx) {
                        const lastVacantStation = trainState.stations[range.toIdx];
                        const berthId = `${coach.coachNo}-${berth.berthNo}`;

                        vacantHashMap.set(berthId, {
                            berthId: berthId,
                            coachNo: coach.coachNo,
                            berthNo: berth.berthNo,
                            type: berth.type,
                            class: coach.class,
                            vacantFromStation: trainState.stations[range.fromIdx]?.name,
                            vacantFromIdx: range.fromIdx,
                            lastVacantStation: lastVacantStation?.name || 'Journey End',
                            lastVacantIdx: range.toIdx
                        });

                        console.log(`   ✅ ${berthId} (${berth.type}) → Vacant till ${lastVacantStation?.name} (idx: ${range.toIdx})`);
                    }
                });
            });
        });

        console.log(`   Total: ${vacantHashMap.size} vacant berths`);
        return vacantHashMap;
    }

    /**
     * Find vacant ranges for a berth (reuse logic from VacancyService)
     */
    _findVacantRanges(berth, trainState) {
        const ranges = [];
        let rangeStart = null;

        for (let segmentIdx = 0; segmentIdx < berth.segmentOccupancy.length; segmentIdx++) {
            let isOccupied = false;

            for (const passenger of berth.passengers) {
                if (passenger.noShow) continue;
                if (passenger.fromIdx <= segmentIdx && segmentIdx < passenger.toIdx) {
                    isOccupied = true;
                    break;
                }
            }

            if (!isOccupied) {
                if (rangeStart === null) rangeStart = segmentIdx;
            } else {
                if (rangeStart !== null) {
                    ranges.push({ fromIdx: rangeStart, toIdx: segmentIdx });
                    rangeStart = null;
                }
            }
        }

        if (rangeStart !== null) {
            ranges.push({ fromIdx: rangeStart, toIdx: berth.segmentOccupancy.length });
        }

        return ranges;
    }

    /**
     * Find matches between RAC passengers and vacant berths
     * Match criteria: Berth must be vacant until at least passenger's destination
     */
    _findMatches(racHashMap, vacantHashMap, currentIdx) {
        const matches = [];
        const usedPassengers = new Set(); // Track assigned passengers to avoid duplicates

        console.log(`\n🔍 Finding matches (${racHashMap.size} RAC → ${vacantHashMap.size} berths)...`);

        // Sort berths by how long they stay vacant (shorter vacancy = higher priority to fill)
        const sortedBerths = [...vacantHashMap.entries()].sort((a, b) =>
            a[1].lastVacantIdx - b[1].lastVacantIdx
        );

        for (const [berthId, berthData] of sortedBerths) {
            const eligiblePassengers = [];

            for (const [pnr, passengerData] of racHashMap.entries()) {
                // Skip if passenger already assigned to another berth
                if (usedPassengers.has(pnr)) continue;

                // CORRECT MATCH RULE: Berth must stay vacant until AT LEAST passenger's destination
                // i.e., lastVacantIdx >= destinationIdx
                if (berthData.lastVacantIdx >= passengerData.destinationIdx) {
                    // Score: Prefer passengers whose journey matches berth vacancy exactly (lower score = better)
                    const matchScore = berthData.lastVacantIdx - passengerData.destinationIdx;

                    eligiblePassengers.push({
                        pnr: pnr,
                        name: passengerData.name,
                        racStatus: passengerData.racStatus,
                        currentBerth: passengerData.currentBerth,
                        destination: passengerData.destination,
                        destinationIdx: passengerData.destinationIdx,
                        passengerStatus: passengerData.passengerStatus,
                        matchScore: matchScore // 0 = perfect match (passenger leaves exactly when next passenger arrives)
                    });
                }
            }

            if (eligiblePassengers.length > 0) {
                // Sort by RAC status (RAC 1 first) then by match score
                eligiblePassengers.sort((a, b) => {
                    const getRACNum = (status) => {
                        const match = status?.match(/RAC\s*(\d+)/i);
                        return match ? parseInt(match[1]) : 999;
                    };
                    const racDiff = getRACNum(a.racStatus) - getRACNum(b.racStatus);
                    if (racDiff !== 0) return racDiff;
                    return a.matchScore - b.matchScore;
                });

                const topMatch = eligiblePassengers[0];
                usedPassengers.add(topMatch.pnr); // Mark as assigned

                matches.push({
                    berthId: berthId,
                    berth: berthData,
                    eligiblePassengers: eligiblePassengers,
                    topMatch: topMatch
                });

                console.log(`   ✅ ${berthId} → ${topMatch.name} (${topMatch.racStatus}) - ${eligiblePassengers.length} eligible`);
            }
        }

        console.log(`   Total matches: ${matches.length}\n`);
        return matches;
    }

    /**
     * Create pending reallocations from matches
     * Sends to TTE portal for approval
     */
    async createPendingReallocationsFromMatches(trainState) {
        const { matches, currentStation } = this.getCurrentStationData(trainState);

        if (matches.length === 0) {
            console.log('⚠️ No matches to create pending reallocations');
            return { success: true, created: 0 };
        }

        const pendingReallocations = [];

        for (const match of matches) {
            const { berthId, berth, topMatch } = match;

            // Create pending reallocation for top match
            const pending = {
                trainId: trainState.trainNo,
                trainName: trainState.trainName,
                stationName: currentStation.name,
                stationCode: currentStation.code,
                stationIdx: currentStation.index,

                // Passenger details
                passengerPNR: topMatch.pnr,
                passengerName: topMatch.name,
                currentRAC: topMatch.racStatus,
                currentBerth: `RAC-${topMatch.racStatus}`,
                passengerDestination: topMatch.destination,
                passengerDestinationIdx: topMatch.destinationIdx,

                // Proposed berth details
                proposedCoach: berth.coachNo,
                proposedBerth: berth.berthNo,
                proposedBerthFull: berthId,
                proposedBerthType: berth.type,
                proposedClass: berth.class,
                berthVacantTill: berth.lastVacantStation,
                berthVacantTillIdx: berth.lastVacantIdx,

                // Matching metadata
                matchScore: topMatch.matchScore,
                matchReason: topMatch.matchScore === 0
                    ? 'Perfect match - destination equals berth vacancy end'
                    : `Good match - travels ${topMatch.matchScore} stations beyond`,

                // Status
                status: 'pending',
                createdAt: new Date(),
                createdBy: 'CURRENT_STATION_MATCHING'
            };

            pendingReallocations.push(pending);
        }

        // Save to MongoDB using existing StationWiseApprovalService
        await StationWiseApprovalService._savePendingReallocations(pendingReallocations);

        console.log(`✅ Created ${pendingReallocations.length} pending reallocations for TTE approval`);

        return {
            success: true,
            created: pendingReallocations.length,
            pendingReallocations: pendingReallocations
        };
    }
}

module.exports = new CurrentStationReallocationService();
