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

## Recent activities

The dashboard lists the newest **climbing day** first. Within each day, the most
recently **logged** ascent comes first, using the provider’s log creation timestamp.
The displayed date remains the climbing date: logging an older climb today does
not move it above climbs from a later climbing day. Logging order is a proxy for
climbing order when you enter climbs in sequence, not a recorded ascent time.

Entries with missing or invalid log times follow timed entries on the same day.
Equal or unavailable log times use the stored ascent ID, newest first, to keep the
order stable. Edit/sync timestamps are not used as log creation times.
