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

## Summer Sun Face

Log an outdoor climb on an equator-facing route in local meteorological summer: N/NE/NW during December–February in the southern hemisphere, or S/SE/SW during June–August in the northern hemisphere. This conservative version covers absolute latitudes from 25° up to (but not including) 60°. Attempts count as logged climbs, as with weather-day badges. The badge unlocks once on the earliest qualifying day and has no Almost there counter.

Use the route's own sun/aspect tags first. When it has no exposure tags of its own, tags inherited from its **immediate parent** (for example its sector, cliff or boulder) can fill in. The cached tag's source ID must match that exact parent. Tags from higher ancestors, unknown sources and broad geographic areas never fill in. A route's own exposure tags take priority even when the parent says something different; unknown or conflicting route directions do not trigger a parent fallback.

At the chosen level, **All day sun** can qualify without a facing direction. **Always shady** prevents the award. Otherwise, the aspect must face the equator as described above; morning/noon/afternoon-only sun tags do not qualify on their own. Both sun and aspect tags are not required together.

Indoor climbs, invalid dates, tropical/high-latitude locations, legacy points of unknown precision and nearby-town approximations do not qualify. Cached-data upgrades recover route/parent/higher-ancestor provenance without another sync or external request.

This records provider-described exposure plus a seasonal heuristic. It does not establish the time you climbed, actual sunshine, shade from overhangs or rock temperature, and requires no Open-Meteo cache. The separate heat badge describes cached high air temperature. Minimized real API tag fixtures and their provenance are documented in the repository.

## Greenpoint

**Greenpoint** is a one-shot badge for leading a bolted sport route on your own trad gear. It unlocks the first time you either:

- log a theCrag **Green point**, **Green point onsight** or **Green point flash** tick that counts as a send, or
- send a route listed as **Sport** with your ascent recorded as **Trad**, using a clean lead tick (onsight, flash, red point, pink point, ground-up red point or Lead).

Generic Tick/Send/Clean entries, attempts, top-rope and seconding don't count for the second path, because they don't show that you led on gear. Like the badges above, it does not appear in **Almost there**. See theCrag's [tick types](https://www.thecrag.com/en/article/ticktypes) for how Green point ticks are defined.
