# Vacant Berths Logic Extraction

This document extracts and explains the logic for calculating vacant berths from the passengers list in the RAC Reallocation System.

## Overview

The system tracks vacant berths using **segment-based occupancy**, where the train journey is divided into segments between stations. A berth can be vacant for some segments and occupied for others, depending on passenger boarding/deboarding.

---

## Core Data Models

### 1. Berth Model

**File**: `backend/models/Berth.js`

#### Key Properties
```javascript
{
  coachNo: string,           // e.g., "S1", "B1"
  berthNo: number,           // e.g., 15, 23
  fullBerthNo: string,       // e.g., "S1-15"
  type: string,              // "Lower Berth", "Side Lower", etc.
  status: string,            // "VACANT", "OCCUPIED", "SHARED"
  totalSegments: number,     // Total journey segments (stations.length - 1)
  segmentOccupancy: array,   // Array of PNR arrays for each segment (supports RAC sharing)
  passengers: array          // List of passengers assigned to this berth
}
```

#### Key Methods

**`getVacantSegments()`** - Returns array of vacant segment indices

**`isAvailableForSegment(fromIdx, toIdx)`** - Check if berth available for journey segment

**`updateStatus()`** - Updates berth status based on active passengers

---

## Backend Logic

### TrainState Model

**File**: `backend/models/TrainState.js`

#### `getVacantBerths()` Method

Returns ALL vacant berth segments across the ENTIRE journey (not just current station).

Each vacant segment includes:
- `fullBerthNo`: Berth identifier (e.g., "S1-15")
- `vacantFromStation`: Station where vacancy starts
- `vacantToStation`: Station where vacancy ends
- `willOccupyAt`: Next station where berth will be occupied
- `isCurrentlyVacant`: Boolean flag - is berth vacant at current station?

#### `_findAllVacantRanges(berth)` Helper Method

Finds all vacant segment ranges for a berth by:
1. Iterating through all segments
2. Checking if segment is covered by ANY passenger's journey
3. Grouping consecutive vacant segments into ranges

---

## VacancyService

**File**: `backend/services/reallocation/VacancyService.js`

### Fixed Issue (2025-11-28)

**Problem**: Method used `berth.segmentOccupancy[i] === null` but after RAC sharing implementation, segmentOccupancy is now an array of arrays.

**Solution**: Updated to check `berth.segmentOccupancy[i].length === 0` for vacant segments.

---

## Frontend Logic

### Admin Portal - PassengersPage

**File**: `frontend/src/pages/PassengersPage.jsx`

**Features**:
- Shows ALL vacant segments across entire journey
- Displays "Will Occupy At" for each segment
- Filters by station (from/to)
- `isCurrentlyVacant` badge to highlight berths vacant NOW

### TTE Portal - PassengersPage

**File**: `tte-portal/src/pages/PassengersPage.jsx`

**Features**:
- Filters to show ONLY berths vacant at current station
- Simplified view for TTE operations

---

## API Endpoints

### GET `/api/train/vacant-berths`

**Returns**: All vacant berth segments across journey

**Response Format**:
```javascript
{
  success: true,
  data: {
    vacancies: [
      {
        coachNo: "S1",
        berthNo: 15,
        fullBerthNo: "S1-15",
        type: "Lower Berth",
        class: "SL",
        vacantFromStation: "New Delhi",
        vacantToStation: "Agra Cantt",
        vacantFromIdx: 2,
        vacantToIdx: 5,
        willOccupyAt: "Agra Cantt",
        isCurrentlyVacant: true
      }
    ]
  }
}
```

---

## Segment Occupancy Examples

### Array-Based Occupancy (Current Implementation)

Supports RAC sharing where 2 passengers can occupy the same berth:

```javascript
{
  berthNo: "S1-10",
  segmentOccupancy: [
    ["PNR123"],           // Segment 0: 1 passenger
    ["PNR123", "PNR456"], // Segment 1: 2 passengers (RAC sharing)
    ["PNR456"],           // Segment 2: 1 passenger
    [],                   // Segment 3: VACANT
    []                    // Segment 4: VACANT
  ]
}
```

**Vacant segments**: 3, 4

---

## Key Differences: TrainState vs VacancyService

| Aspect | TrainState.getVacantBerths() | VacancyService.getVacantBerths() |
|--------|------------------------------|-----------------------------------|
| **Scope** | Full journey vacant segments | Delegates to TrainState |
| **Data** | Rich - includes willOccupyAt | Basic - from/to stations |
| **Purpose** | API endpoint response | Service layer wrapper |
| **Status** | ✅ Correct | ✅ Fixed (2025-11-28) |

---

## Recent Fixes

### 2025-11-28: Array Compatibility Fix

**Issue**: VacancyService showing 0 vacant berths

**Root Cause**: `_getVacantSegmentRanges()` checked `=== null` instead of array length

**Fix**: Updated to:
```javascript
const isVacant = Array.isArray(berth.segmentOccupancy[i]) 
  ? berth.segmentOccupancy[i].length === 0
  : berth.segmentOccupancy[i] === null; // Fallback
```

---

## Summary

The vacant berths logic uses **segment-based occupancy tracking with array support** to:
1. Track multiple passengers per berth (RAC sharing)
2. Identify vacant segments across entire journey
3. Support filtering by current station
4. Provide rich metadata (willOccupyAt, isCurrentlyVacant)

**Status**: ✅ Fully functional after 2025-11-28 fix
