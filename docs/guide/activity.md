# Activity

The dashboard **Monthly stats** and **Yearly stats** cards summarise volume at a glance. **Activity** (`/activity`) is the detail page when you want more than the charts: a full per-month table (ascents, sends, height, style mix) and the yearly year-over-year breakdown.

## What counts

- **Ascents** — every logged tick that day/month/year (attempts included).
- **Sends** — ticks classified as sends (see [Tick types](/docs/tick-types)).
- **Height** — metres from ascent or route height when present.
- **Styles** — Sport / Trad / Boulder from gear style; everything else rolls into **Other** on the table.

Month links open the logbook for that calendar month. Year links (on the yearly card/table) open `/logbook?year=`.

## Why a separate page

Repeating the same two charts alone would be sidebar bloat. Activity earns its route by carrying the **monthly breakdown table** and keeping YoY deltas easy to scan — the same bar the issue set for shipping past thin cards.
