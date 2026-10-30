# Ascent calendar

The **Ascent calendar** is a year-long heatmap of days you logged climbs. Cells link to `/logbook?day=` for that date.

## Intensity

Colours scale with how many ascents you logged that day (empty → few → many), using the same green heat ramp as Dreeve. Attempts count toward intensity; the tooltip still separates send count.

## Grade

Each day is coloured by the **hardest successful send** that day, using the same Beginner → Elite band palette as grade chips elsewhere. Days with only attempts (no send) use a muted “attempt” fill. When one day mixes boulder and route grades, the calendar picks the higher band id — bands are not perfectly comparable across systems.

Your Intensity / Grade preference is stored in the browser (`cs_heatmap_mode`).

## Weather

When the opt-in [weather cache](/docs/weather) has any of your climbing days, a third **Weather** mode appears. Each climbed day is coloured by the conditions at its first outdoor ascent with cached weather: snow, rain, hot (35°C+), freezing, fair (15–25°C and dry) or mild, using the same rules as the badges. Days with no cached weather (gym, no coordinates, not fetched yet) stay a muted grey. Tooltips list the high, low and rain, and a **View weather values** table under the calendar gives the same numbers as text for the selected year.
