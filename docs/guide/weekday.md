# Weekday

The **Weekday** card shows which days of the week you climb on, inspired by [Dreeve](https://dreeve.app/)’s weekday chart for Strava.

## What counts

A **session** is a calendar day with at least one logged ascent (same definition as [Sessions per week](/docs/sessions-per-week)). The bar length is session count; the muted figure is total ascents that weekday.

Weekday is taken from the ascent’s `YYYY-MM-DD` date in UTC — logbook rows are day-stamped without a time of day.

## Ranges

- **All time** — every valid ascent date in the cache
- **Last 12 weeks** — sessions on days in the inclusive 84-day window ending today

Your last choice is stored in the browser (`cs_weekday_range`).

## Most active day

The highlight names the weekday with the most sessions (ties break toward more ascents). Bars for that weekday use the accent colour.
