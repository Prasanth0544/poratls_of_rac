## Overview
Create a simple Phase 1 page with a top‑left back arrow. Standardize back navigation across RAC Queue and Add Passenger pages by moving the close/back button to the top left and removing the right‑corner close button.

## Changes
1. New `PhaseOnePage.jsx` (empty body):
   - Header with top‑left back arrow (`onClose` → returns to Home).
   - Minimal placeholder content.
2. Wire navigation in `App.jsx`:
   - Import PhaseOnePage.
   - Add render branch `currentPage === 'phase1'`.
3. RACQueuePage:
   - Remove right‑corner close button.
   - Add top‑left back arrow invoking `onClose`.
4. AddPassengerPage:
   - Move existing back button from top right to top left; keep functionality.

## Verification
- Click Phase 1 card on Home: opens empty page; back arrow returns to Home.
- RAC Queue page shows back arrow top‑left; exits correctly.
- Add Passenger page shows back arrow top‑left; exits correctly.

Confirm and I’ll implement these UI changes.