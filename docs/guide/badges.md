# Badges

Most badges celebrate climbing milestones: your first session or send, ascent totals, grades and more. These use the dates of the relevant climbs in your logbook. Importing an older climb can therefore move a climbing milestone earlier.

**First Moves** celebrates bringing your logbook into Crag Stats. Its date is the first successful import or sync containing at least one ascent, and its count is saved with that import. Later syncs and imported older climbs do not move it. It has no link to an individual climb. Import timestamps use the site's display time zone.

If an older database has no saved import date, the next successful non-empty import supplies it. Existing saved dates are preserved.

Wiping local data resets this milestone along with the logbook; the next successful non-empty import starts a new one.

## Weather

**Heat Wave**, **Freeze Frame**, **Rain Check** and **Climbing in the Snow** need the optional outdoor weather cache (`WEATHER_IMPORT`). See [Weather](/docs/weather). Until those days are fetched, the badges stay locked.

## Almost there

On the full **[Badges](/badges)** page, **Almost there** lists up to three locked badges that are closest to completion. Only **countable** thresholds qualify (ascent totals, height, grade-band sends, FA/FFA counts, routes set, and similar). One-shot badges such as holiday days, weather days or First Moves are excluded. Progress is ranked by percent of the target (capped below 100% until earned), then by smaller targets when percentages tie. The dashboard badges card still shows recent earned badges only.
