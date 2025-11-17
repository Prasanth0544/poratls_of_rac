## Goal
Reduce the space between the "Train Statistics" heading and the seven count boxes on the Home page.

## Approach
1. Adjust the grid spacing so only the vertical gap between the header and the first row of cards is reduced.
2. Keep horizontal spacing between cards unchanged.
3. Slightly reduce the bottom margin on the heading itself.

## Changes
- In `frontend/src/pages/HomePage.css` for `.stats-container-left`:
  - Replace `gap: 12px;` with `column-gap: 12px; row-gap: 6px;` to reduce the vertical gap but keep horizontal spacing intact.
- In `.stats-header`:
  - Reduce `margin-bottom` from `6px` to `2px`.

## Result
The heading sits closer to the card grid without affecting card-to-card spacing, matching the desired compact look.

Confirm and I’ll apply the CSS updates immediately.