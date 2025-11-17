## Reason
Passenger List counts compute CNF from allocated passengers, while Home stats use Mongo totals and CNF from `trainState.stats`. This causes mismatches.

## Plan
1. Backend: unify `/passengers/counts` to use Home’s authoritative stats.
   - Set `total = trainState.stats.totalPassengers`.
   - Set `cnf = trainState.stats.cnfPassengers`.
   - Set `rac = trainState.stats.racPassengers`.
   - Keep `racCnf = trainState.stats.totalRACUpgraded`.
   - Keep `boarded`, `noShow`, `upcoming`, `missed` computed from `trainState.getAllPassengers()`.
2. Frontend: no changes needed; `PassengersPage` already reads `/passengers/counts` and shows `counts.total` in header.
3. Verify: reload Passenger List; totals and CNF should both be 1505 (matching Home), with RAC 97 and other stats correct.

Confirm and I’ll apply the backend update and validate.