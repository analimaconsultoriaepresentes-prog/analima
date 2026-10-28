# Architecture rules
- Keep sale-specific unit prices on cart items, resolved by shared pricing helpers; never mutate catalog products for a sale override.
- Persist resolved unit prices and item subtotals as sale snapshots; historical revenue must read these snapshots and the saved sale total.
- Give each maintenance-mode hook subscription its own realtime channel to avoid reusing an already-subscribed channel during mounting.
- Resolve label compatibility from raw stored payment prices, separately from legacy sale fallbacks, to prevent missing prices from becoming printable.
- Render label previews from the same PDF document factory used for downloads and printing to keep text, values and layout identical.
- Store the independent optional product label price separately from payment and sale prices to preserve existing sales behavior.