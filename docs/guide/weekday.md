# Weekday

The **Weekday** card shows which days of the week you climb on, inspired by [Dreeve](https://dreeve.app/)’s weekday chart for Strava. The distribution is a **donut (pie) chart** with a Mon–Sun legend. By default it sits left of **Sessions per week** (half-width), on the row under **Monthly** / **Yearly** stats; Customize dashboard can move either card.

## What counts

- **Sessions** (default) — a calendar day with at least one matching ascent (same idea as [Sessions per week](/docs/sessions-per-week))
- **Ascents** — every matching tick that weekday

Weekday is taken from the ascent’s `YYYY-MM-DD` date in UTC — logbook rows are day-stamped without a time of day.

## Filters

- **All time** / **Last 12 weeks** — inclusive 84-day window ending today for the short range
- **Sessions** / **Ascents** — what the slice size means
- **All** / **Sport** / **Trad** / **Boulder** — style chips use the same discipline colours as the rest of the app. Top-rope and other styles only appear under **All**.

Choices are stored in the browser (`cs_weekday_range`, `cs_weekday_metric`, `cs_weekday_style`).

## Most active day

The centre of the donut and the lead line name the weekday with the highest value for the current metric (ties break toward the other metric). That weekday’s slice and legend row are emphasised.
