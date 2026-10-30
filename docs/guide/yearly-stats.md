# Yearly stats

The **Yearly stats** dashboard card (and the charts on **[Activity](/activity)** when that page is enabled) show how your volume changes year by year.

## Per year

Bars (oldest → newest) for the selected metric:

- **Ascents** — every logged tick that year
- **Sends** — successful ticks only (see [Tick types](/docs/tick-types))
- **Height (m)** — summed ascent height, falling back to route height when the tick has none

The small figure under each bar is the **year-over-year delta** versus the previous calendar year (or “—” for your first year). Year bars link to `/logbook?year=`.

## Cumulative

A thick accent line is your **running career total** for the selected metric. Thin coloured overlays (when daily heatmap data is available) each restart at zero on 1 January and rise day by day across the shared Jan–Dec axis, so you can compare seasons side by side. After the last climb of a year the thin line continues **flat to December** (no invented volume). Click a day on a thin line to open `/logbook?day=` for that date (hover still shows the within-year total). Under the career dots, the parenthetical figure is **that year’s contribution**, not another YoY delta.

Your chart-mode preference is stored in the browser (`cs_yearly_chart`).

## Year-over-year table

Expand **Year-over-year table** on the card for numeric deltas across ascents, height and onsights for every year in the logbook.
