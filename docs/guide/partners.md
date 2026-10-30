# Partners

The **Partners** page (and the dashboard card) ranks people tagged in your logbook’s `with` / partners field. Click a name to open the logbook with an exact partner match.

## Metrics (`/partners`)

Use the top-right toggle:

- **Ascents** (default) — every logged ascent that names that partner (same as the dashboard card)
- **Sessions** — unique calendar days with at least one shared ascent (same “session = day” idea as [Sessions per week](/docs/sessions-per-week); invalid placeholders like `2018-00-00` are skipped, as on Weekday)
- **Areas** — distinct crags climbed with that partner, using cached provider area IDs when available. Renames keep one identity and equally named crags with different IDs stay separate. Without an ID, names are matched case-insensitively; blank and “Unknown” names are skipped. A name-only row joins a known ID only when that name maps to exactly one ID

Your choice is stored in the browser (`cs_partners_metric`).

## Notes

- Handles are normalised (leading `@` stripped); the same person under different casing shares one bar.
- Multi-pitch days with many ticks inflate **Ascents** more than **Sessions**.
- Someone you only climb with at one crag ranks lower under **Areas** than a travelling partner with fewer ticks.

The dashboard preview and full page use the same logged ascents, including legacy ascents whose route record is unavailable. Missing route details do not erase partner ascents or valid session days; they contribute no area without a known venue. Other route-based dashboard analytics still require a route record.
