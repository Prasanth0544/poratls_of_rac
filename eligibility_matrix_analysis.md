# Eligibility Matrix Analysis - Complete Specification

## Overview
The **Eligibility Matrix** is the core decision-making engine that determines which RAC passengers can be upgraded to confirmed berths. This document serves as the definitive specification for the entire reallocation process.

---

## 1️⃣ TRIGGER POINTS

Eligibility evaluation runs when **ANY** of these events occur:

1. ✅ **Confirmed passenger deboards**
2. ✅ **Passenger cancels**
3. ✅ **Passenger marked as no-show** (`no_show = true`)
4. ✅ **Seat becomes free during station transition**
5. ✅ **Manual call from TTE Portal**
6. ✅ **System recomputes vacancy ranges**

---

## 2️⃣ STEP 1 — VACANCY DETECTION

### Input
```javascript
berth.segmentOccupancy = [PNR/null, PNR/null, ...]
```

### Algorithm: `_getVacantSegmentRanges(berth, stations)`
Finds all **continuous null ranges** in the segment occupancy array.

### Output
```javascript
{
  berthId: "S1-12",
  fromIdx: 2,
  toIdx: 5,
  fromStation: "BZA",
  toStation: "VSKP"
}
```

### Vacancy Merging
- Adjacent vacancy segments for the same berth are **merged into a single continuous range**.
- This prevents fragmentation and maximizes reallocation opportunities.

---

## 3️⃣ STEP 2 — CANDIDATE DISCOVERY (RAC Queue)

### ⚠️ CRITICAL CONSTRAINTS: RAC STATUS + ONLINE + BOARDED

The system **ONLY** checks passengers who meet **ALL THREE** criteria:

1. **`PNR_Status === "RAC"`** (Not CNF, Not WL)
2. **`Passenger_Status === "Online"`**
3. **`Boarded === true`**

### Why These Filters?
- **RAC Status**: Only RAC passengers can be upgraded to CNF (confirmed and waitlist passengers are excluded)
- **Online Status**: Only online passengers can receive real-time WebSocket upgrade offers
- **Boarded Status**: Only physically boarded passengers can be reallocated

### Code Implementation
```javascript
const eligibleCandidates = racQueue.filter(p => 
  p.pnrStatus && p.pnrStatus.toUpperCase() === 'RAC' &&
  p.passengerStatus && p.passengerStatus.toLowerCase() === 'online' &&
  p.boarded === true
);
```

### Process
For each vacancy, iterate through `eligibleCandidates` in deterministic order:
- **RAC 1** → **RAC 2** → **RAC 3** → ...

**Excluded Passengers**:
- ❌ CNF passengers (already confirmed)
- ❌ WL passengers (waitlisted)
- ❌ Offline RAC passengers (handled via TTE Portal)
- ❌ Not-yet-boarded RAC passengers

---

## 4️⃣ STEP 3 — ELIGIBILITY RULES (COMPLETE SET)

**ALL** of these rules must be `TRUE` for a passenger to be eligible:

### 🔹 Rule 0 — Passenger has RAC Status (PRIMARY CONSTRAINT)
```javascript
passenger.pnrStatus === "RAC"
```
- **Why**: Only RAC passengers are eligible for upgrade to CNF
- **Excluded**: CNF (already confirmed), WL (waitlisted)

---

### 🔹 Rule 1 — Passenger is ONLINE
```javascript
passenger.passengerStatus === "Online"
```
- **Why**: Only online passengers can receive real-time WebSocket offers.
- **Note**: Offline passengers are handled via TTE Portal (manual verification).

---

### 🔹 Rule 2 — Passenger is BOARDED
```javascript
passenger.noShow === false && passenger.boarded === true
```
- **Verification**: Backend verifies with actual boarding events.
- **Critical**: Passenger Portal **cannot** mark passengers as boarded (TTE authority only).

---

### 🔹 Rule 3 — Full Journey Coverage (CRITICAL)
```javascript
vacant.fromIdx <= max(passenger.fromIdx, currentStationIdx)
vacant.toIdx >= passenger.toIdx
```
- **Meaning**: The vacancy must **fully cover** the passenger's remaining journey.
- **No Partial Upgrades**: Cannot upgrade for 2 stations then force passenger back to RAC.

---

### 🔹 Rule 4 — Class Match
```javascript
passenger.class === berth.class
```
- **Strict Enforcement**: SL → SL, 3A → 3A (no cross-class upgrades).

---

### 🔹 Rule 5 — Co-passenger Consistency
If RAC passenger has a sharing partner (side-lower berths):
1. **Both** must be valid RAC holders.
2. Co-passenger must **NOT** be:
   - ❌ Cancelled
   - ❌ No-show
   - ❌ Already upgraded
   - ❌ Inconsistent berth assignment

**Action**: If inconsistent → skip this candidate until TTE resolves.

---

### 🔹 Rule 6 — No Conflicting CNF Passenger Boarding Later
Before approving:
- Backend checks if **ANY** confirmed passenger is scheduled to board this berth during the vacancy.
- **If YES** → This vacancy **cannot** be used for RAC upgrade.

---

### 🔹 Rule 7 — Not Already Offered This Vacancy
```javascript
if (passenger.vacancyIdLastOffered === currentVacancyId) {
  skip; // Prevents re-offer in same cycle
}
```

---

### 🔹 Rule 8 — Not Already Accepted Another Offer
```javascript
if (passenger.offerStatus === "accepted") {
  skip; // Already upgraded elsewhere
}
```

---

### 🔹 Rule 9 — RAC Rank Priority
**Sorting Order**:
1. **Primary Key**: RAC number (RAC 1 > RAC 2 > RAC 3)
2. **Secondary**: Earliest booking timestamp (if same RAC number)
3. **Tertiary**: Travel length (optional)

---

### 🔹 Rule 10 — Time-Gap Constraint (Optional, Recommended)
Ignore offers if the vacancy appears **too close** to upcoming station:
- Example: `<1 minute` of travel time left.
- **Why**: Prevents chaotic last-moment moves.

---

## Summary of Critical Constraints

### 🚨 **STRICT ELIGIBILITY REQUIREMENTS**
**ONLY passengers matching ALL criteria are eligible:**
1. ✅ `PNR_Status === "RAC"`
2. ✅ `Passenger_Status === "Online"`  
3. ✅ `Boarded === true`
4. ✅ No conflicting CNF passengers
5. ✅ Full journey coverage
6. ✅ Class match
7. ✅ Co-passenger valid (if applicable)
8. ✅ Not already offered/accepted
9. ✅ Sufficient time remaining

### ❌ **EXCLUDED FROM REALLOCATION:**
- CNF passengers (already confirmed)
- WL passengers (waitlist)
- Offline RAC passengers
- Not-yet-boarded RAC passengers
- RAC passengers with invalid co-passengers

---

## Implementation Status

📝 **Specification**: **COMPLETE**  
✅ **Implementation**: **COMPLETE** (Implemented in `ReallocationService.js`)

**Files Updated**:
- `backend/services/ReallocationService.js`
  - `getRACQueue()` - 3-way filter (RAC + Online + Boarded)
  - `isEligibleForSegment()` - 11 comprehensive rules (including Rule 0: RAC Status)
