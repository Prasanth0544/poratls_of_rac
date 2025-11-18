## Backend Constraints (from models/controllers/services)
- Berth-level segments: `Berth.isAvailableForSegment(fromIdx, toIdx)` decides eligibility (segment-based, not only globally vacant).
- Eligibility entry fields: `{ berth, coach, berthNo, type, class, eligibleRAC[], topEligible }`.
- Apply payload: array of `{ coach, berth, pnr }` (non-empty, all fields required) — validated by middleware.
- Apply logic: upgrades RAC → CNF, removes from `racQueue`, checks segment availability again, updates `trainState.stats.totalRACUpgraded`, then `trainState.updateStats()`.

## Frontend ReallocationPage — Required Behaviors
1. Read and render matrix exactly from backend shape.
2. Build allocations from `topEligible` only (lowest RAC number priority) and prevent duplicate PNRs.
3. Validate payload client-side (coach/berth/pnr present) before calling apply.
4. Show a compact list of failures returned by backend with berth/pnr/reason.
5. Keep counts in the header: RAC Queue, Vacant, Eligible; button shows count of unique allocations.

## Abstract Model Rendering (Vacant Segment + Priority)
- Display columns:
  - Berth (`coach-berthNo`)
  - Top Priority name (from `topEligible`)
  - RAC status (e.g., `RAC 4`)
  - Journey (`from → to`)
  - Expand to list all eligible RACs (ordered by RAC number).
- Vacant Segment column: derive and show the segment covering `topEligible` if backend returns it; otherwise omit until backend adds `vacantSegment`.

## Backend Enhancement (optional for UI completeness)
- Add `vacantSegment` to each eligibility entry: compute the contiguous null range in `segmentOccupancy` that covers `topEligible.fromIdx..toIdx`, then map to station codes (start → end).
- Include `eligibleCount = eligibleRAC.length` for lightweight display.

## Frontend Changes to Implement
- Update ReallocationPage.jsx to:
  - Build unique allocation list and show count on apply button.
  - Render matrix with expandable eligible RAC list (already implemented).
  - Show failure reasons in a banner when apply returns `failed` items.
  - Keep navigation back arrow visible.

## Verification
- Matrix shows eligible rows; expanding shows ordered eligible RACs.
- Apply sends unique allocations; backend upgrades and stats update; failed items show reasons.
- Home and Passenger List reflect RAC→CNF increments.

If you approve, I will proceed to add the optional backend `vacantSegment` enhancement and finish the UI column for the segment label to match the abstract template precisely.