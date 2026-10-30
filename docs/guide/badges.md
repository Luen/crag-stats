# Badges

Most badges celebrate climbing milestones: your first session or send, ascent totals, grades and more. These use the dates of the relevant climbs in your logbook. Importing an older climb can therefore move a climbing milestone earlier.

**First Moves** celebrates bringing your logbook into Crag Stats. Its date is the first successful import or sync containing at least one ascent, and its count is saved with that import. Later syncs and imported older climbs do not move it. It has no link to an individual climb. Import timestamps use the site's display time zone.

If an older database has no saved import date, the next successful non-empty import supplies it. Existing saved dates are preserved.

Wiping local data resets this milestone along with the logbook; the next successful non-empty import starts a new one.

## Weather

**Heat Wave**, **Freeze Frame**, **Rain Check**, **Climbing in the Snow**, **Blown Away**, **Bluebird**, **Sticky**, **Storm Send**, and **Four Seasons** need the optional outdoor weather cache (`WEATHER_IMPORT`). See [Weather](/docs/weather). Until those days are fetched, the badges stay locked. **Storm Send** requires a successful send on a heavy-rain day; attempts alone do not count.

## Almost there

On the full **[Badges](/badges)** page, **Almost there** lists up to three locked badges that are closest to completion. Only **countable** thresholds qualify (ascent totals, height, grade-band sends, FA/FFA counts, routes set, and similar). One-shot badges such as holiday days, weather days or First Moves are excluded. Progress is ranked by percent of the target (capped below 100% until earned), then by smaller targets when percentages tie. The dashboard badges card still shows recent earned badges only.

## Partners, multipitch and travel

These four badges use fields already in your logbook and are dated by the climb that completes them:

| Badge                | Rule                                                                                                                                                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Crowded Belay**    | One ascent lists 3 or more different partners (names are matched ignoring case).                                                                                                                                                           |
| **Multipitch Day**   | You send 3 or more pitches in one calendar day: pitch ranges and lists are expanded and deduplicated per route/day. Whole-route and individual-pitch logs do not double-count. When cached API pitch ticks exist, only sent pitches count. |
| **Travel Week**      | You log climbs at 4 different outdoor crags within any 7 consecutive days. Gyms and unknown crags do not count.                                                                                                                            |
| **Persistence Pays** | You send a route for the first time after logging it on 4 or more different days (attempts included). Repeating a route you already sent does not count.                                                                                   |

They are one-shot badges, so they do not appear in **Almost there**.
