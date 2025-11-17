## Diagnosis
- Backend eligibility uses `trainState.getVacantBerths()` (berths with no passengers at all) and then references an undefined variable (`vacantBerth` instead of `vacancy`). This yields empty results and breaks the page.
- Real-world reallocation needs segment-based vacancy (current and future), not just globally vacant berths.

## Backend Changes
1. Fix variable bug in `ReallocationService.getEligibilityMatrix` (`vacantBerth` → `vacancy`).
2. Compute eligibility by scanning all berths and using segment occupancy:
   - For each berth in every coach, for each RAC passenger, if `berth.isAvailableForSegment(rac.fromIdx, rac.toIdx)` then include.
   - Build entries: `{ berth: berth.fullBerthNo, coach: berth.coachNo, berthNo: berth.berthNo, type: berth.type, class: trainState.getCoachClassFromBerth(berth), eligibleRAC, topEligible }`.
   - Preserve RAC order (already sorted by `racNumber`).
3. Keep existing base logic for reallocation apply (upgrade to CNF, remove from RAC queue, update stats).

## Frontend
4. Keep `ReallocationPage.jsx` base logic and API usage (eligibility, RAC queue, vacant berths). No API contract changes; page will render the now-populated matrix.
5. Optional UX: If `vacantBerths.total` is zero, show eligible count from matrix; otherwise display both.

## Verification
- `GET /reallocation/eligibility` returns non-empty matrix with berth identifiers and top eligible RAC.
- Reallocation apply upgrades RAC passengers and updates stats; Passenger List reflects changes; Home “RAC→CNF” increases.

Confirm to proceed and I will implement and test these changes end-to-end.