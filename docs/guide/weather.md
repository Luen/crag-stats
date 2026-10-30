# Weather

Crag Stats can cache **daily outdoor weather** for climbs that have route coordinates, then use it for badges and (when enabled) dashboard / logbook surfaces. Conditions-vs-performance charts are not built yet.

## Opt-in

Off by default. The server owner sets `WEATHER_IMPORT=true` in `.env` and restarts. After each successful logbook sync (and from **Settings → Import weather**), Crag Stats fetches up to **50** missing outdoor days per run from [Open-Meteo](https://open-meteo.com/)'s historical weather API, oldest climb days first, with at least **1.1 seconds** between requests. The Settings action starts that run in the background so the page does not wait on the full batch. Wipe clears the cache.

Open-Meteo's free non-commercial tier is intended for personal self-hosted installs. Do not enable this for a commercial multi-tenant service without reviewing their terms and paid options.

## What gets fetched

- **Outdoor only** — likely indoor / gym routes are skipped (same heuristics as goals).
- **Coordinates required** — the route must have latitude and longitude (from theCrag sync).
- **Past days** — today's UTC date is skipped; the archive is often incomplete for the current day.
- **Shared cache key** — lat/lon are rounded to **one decimal place**, so nearby routes at one crag share a day row.

Stored fields: daily max/min temperature (°C), precipitation (mm), WMO weather code, mean humidity, max/mean 10 m wind (km/h).

## Badges

Once a day is cached, these badges can unlock from any **outdoor** logged ascent that day at that location (attempts count; indoor/gym rows are skipped even if they share a cached lat/lon):

| Badge                    | Rule                                                                             |
| ------------------------ | -------------------------------------------------------------------------------- |
| **Heat Wave**            | Day's high ≥ 35°C                                                                |
| **Freeze Frame**         | Day's low ≤ 0°C                                                                  |
| **Rain Check**           | ≥ 1 mm precipitation and not classified as snow                                  |
| **Climbing in the Snow** | WMO snow codes (71–77, 85–86), or ≥ 1 mm precip with high ≤ 1°C                  |
| **Blown Away**           | Day's max 10 m wind ≥ 50 km/h                                                    |
| **Bluebird**             | High 15–25°C, measured precip < 0.1 mm, not snow/thunderstorm WMO                |
| **Sticky**               | Mean humidity ≥ 85%                                                              |
| **Storm Send**           | A **send** on a day with ≥ 10 mm non-snow precip                                 |
| **Four Seasons**         | Earn Heat Wave, Freeze Frame, Rain Check, and Climbing in the Snow at least once |

Without `WEATHER_IMPORT` (or before the backlog is fetched), these badges stay locked even if you climbed in those conditions. A “scorcher streak” (many heat days in one week) is deferred.

## Weather conditions card

The dashboard **Weather conditions** card appears once at least one outdoor climbing day has a cached weather row; without `WEATHER_IMPORT` (or before the first fetch finishes) it stays hidden. It can be shown, hidden or moved from Settings → Dashboard like any other card.

- **Days** are _location-days_: one calendar day at one cached location (lat/lon rounded to one decimal). A day split across two crags counts twice; gym and other likely-indoor routes never count.
- **Coverage** compares days that have a cached weather row with all outdoor days that have route coordinates. Days not fetched yet (including today) are listed as "not cached yet" and left out of every other number on the card.
- **Hottest / coldest climb** use the day's maximum and minimum temperature. The link goes to the earliest-logged ascent that day on theCrag.
- **Share of days** shows rainy, snowy, freezing and hot days as a share of days with cached weather, using the same rules as the badges above (rain ≥ 1 mm and not snow, snow codes, low ≤ 0°C, high ≥ 35°C). A day can appear in more than one row, for example a freezing, snowy day.
- **Daily high** is a small histogram of each day's maximum temperature in 5° bins.

These are model values for the nearest grid cell, not official climate normals or a measurement at the wall.

## Logbook filters and chips

When any weather is cached, the logbook gains a **Weather on the day** filter (`?weather=`): `fair`, `heat`, `freeze`, `rain` or `snow`, using the same rules as the badges. It only matches **outdoor** ascents with route coordinates and a cached day for that location; gym routes, ascents without coordinates and days that have not been fetched never match.

Rows on cached days also show small text chips (for example "Hot 36°C", "Freezing -2°C", "Rain 4 mm", "Snow", "Windy 55 km/h", "Fair 21°C"). Ordinary days show nothing.

The signed-in owner also gets **No weather cached** (`?missing=weather`), which lists outdoor ascents with coordinates and a past date that still have no cached weather, so you can see what the next imports will fetch. Visitors never see this option.

## Recent activities

The dashboard **Recent activities** card shows the same text chips under an outdoor climb when its day is cached. They are read as a short list labelled "Weather on the day", never colour-only, and the strip is omitted for gym routes, uncached days and ordinary weather.

## Climbing story

Story percentages describe cached outdoor location-days, not days whose weather is still unknown.

When the cache covers at least 20 outdoor days and half or more of your outdoor days, the [Climbing story](/docs/climbing-story) can add one short line about the conditions you climb in (snow, cold, heat, rain or a wide temperature spread). It describes what you do climb in, never what you avoid, and stays out of the story when coverage is thin.

## Ascent calendar

The [Ascent calendar](/docs/ascent-calendar) has a **Weather** colour mode (only shown once weather is cached). It shares the badge rules; see that page for the colour key.
