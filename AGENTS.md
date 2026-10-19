# Architecture rules
- Keep sale-specific unit prices on cart items, resolved by shared pricing helpers; never mutate catalog products for a sale override.
- Persist resolved unit prices and item subtotals as sale snapshots; historical revenue must read these snapshots and the saved sale total.