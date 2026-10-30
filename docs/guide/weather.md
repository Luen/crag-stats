# Weather

Crag Stats can cache **daily outdoor weather** for climbs that have route coordinates, then use it for a few badges. Conditions-vs-performance charts are not built yet — this is cache + badges only.

## Opt-in

Off by default. The server owner sets `WEATHER_IMPORT=true` in `.env` and restarts. After each successful logbook sync (and from **Settings → Import weather**), Crag Stats fetches up to **50** missing outdoor days per run from [Open-Meteo](https://open-meteo.com/)'s historical weather API, with at least **1.1 seconds** between requests. Wipe clears the cache.

Open-Meteo's free non-commercial tier is intended for personal self-hosted installs. Do not enable this for a commercial multi-tenant service without reviewing their terms and paid options.

## What gets fetched

- **Outdoor only** — likely indoor / gym routes are skipped (same heuristics as goals).
- **Coordinates required** — the route must have latitude and longitude (from theCrag sync).
- **Past days** — today's UTC date is skipped; the archive is often incomplete for the current day.
- **Shared cache key** — lat/lon are rounded to **one decimal place**, so nearby routes at one crag share a day row.

Stored fields: daily max/min temperature (°C), precipitation (mm), WMO weather code, mean humidity, max/mean 10 m wind (km/h).

## Badges

Once a day is cached, these badges can unlock from any logged ascent that day at that location (attempts count):

| Badge                    | Rule                                                            |
| ------------------------ | --------------------------------------------------------------- |
| **Heat Wave**            | Day's high ≥ 35°C                                               |
| **Freeze Frame**         | Day's low ≤ 0°C                                                 |
| **Rain Check**           | ≥ 1 mm precipitation and not classified as snow                 |
| **Climbing in the Snow** | WMO snow codes (71–77, 85–86), or ≥ 1 mm precip with high ≤ 1°C |
| **Blown Away**           | Day's max 10 m wind ≥ 50 km/h                                   |

Without `WEATHER_IMPORT` (or before the backlog is fetched), these badges stay locked even if you climbed in those conditions.
