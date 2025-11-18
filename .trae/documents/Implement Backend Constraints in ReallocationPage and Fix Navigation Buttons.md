## Backend Constraints Identified
- Allocation payload must include `coach`, `berth`, `pnr` and be a non-empty array (`backend/middleware/validation.js:61–89`).
- Eligibility is segment-based using `berth.isAvailableForSegment(fromIdx, toIdx)`; matrix entries include `berth`, `coach`, `berthNo`, `type`, `class`, `eligibleRAC`, `topEligible` (`backend/services/ReallocationService.js:146–189`).
- Apply reallocation upgrades RAC → CNF, removes passenger from RAC queue, checks segment availability, and updates stats (`backend/services/ReallocationService.js:194–292`).

## Frontend Changes — ReallocationPage.jsx
1. Use matrix structure from backend exactly:
   - Read `eligibility[i].topEligible.pnr`, `eligibility[i].coach`, `eligibility[i].berthNo` for allocations.
   - Display `topEligible.name`, `topEligible.pnrStatus`, `topEligible.from → to`, `type`, `berth` consistently.
2. Prevent duplicate PNR allocations:
   - Build allocations by unique `pnr` (first occurrence wins), skip entries where `topEligible` is missing.
   - Derive the button label from unique allocations count.
3. Validate payload before submit:
   - Ensure each allocation has `coach`, `berth`, `pnr`.
   - If zero valid allocations, disable the apply button.
4. Improve error handling:
   - Show backend failure reasons from response `data.failed[*].reason` in a compact toast/banner.
   - Refresh stats on success using existing `loadTrainState`.

## Navigation/UI Fixes
5. PhaseOnePage:
   - Place visible back arrow inside the header card (left-aligned) so it displays clearly in your current theme.
6. AddPassengerPage:
   - Center the “Add New Passenger” heading and keep the back arrow top-left.
7. RACQueuePage:
   - Back arrow is already visible top-left; keep as-is and remove any lingering right-close icon.

## Implementation Steps
- Update ReallocationPage.jsx:
  - Add a helper to produce unique allocations, bind count to the apply button.
  - Render a small summary list of to-be-applied allocations (optional) for clarity.
  - Add robust error handling banner.
- Adjust PhaseOnePage header markup/CSS to ensure the back arrow is visible in the white card.
- Tweak AddPassengerPage header CSS to center heading and keep back arrow left.

## Verification
- Eligibility shows populated rows; apply button count equals unique PNR allocations.
- Applying reallocations returns success/failed; failed reasons shown; stats update and RAC→CNF increases.
- Back arrows are visible and return to Home from Phase 1, RAC Queue, and Add Passenger.

Confirm to proceed and I will implement these UI and logic changes end-to-end and validate in the running app.