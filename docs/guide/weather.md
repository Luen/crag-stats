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

The missing-weather backlog excludes days the provider has already checked but could not supply. These negative cache entries do not produce weather chips and are not automatically queued again. Invalid calendar dates are excluded from both the importer and backlog.

## Recent activities

The dashboard **Recent activities** card shows the same text chips under an outdoor climb when its day is cached. They are read as a short list labelled "Weather on the day", never colour-only, and the strip is omitted for gym routes, uncached days and ordinary weather.

## Climbing story

Story percentages describe cached outdoor location-days, not days whose weather is still unknown.

When the cache covers at least 20 outdoor days and half or more of your outdoor days, the [Climbing story](/docs/climbing-story) can add one short line about the conditions you climb in (snow, cold, heat, rain or a wide temperature spread). It describes what you do climb in, never what you avoid, and stays out of the story when coverage is thin.

## Ascent calendar

The [Ascent calendar](/docs/ascent-calendar) has a **Weather** colour mode (only shown once weather is cached). It shares the badge rules; see that page for the colour key.

## Sectors: climate on your visits

On the **Sectors** page, a crag with at least **5** cached outdoor visit days shows a one-line summary: average daily high and low, and the share of those days with rain, snow, freezing or hot weather (snow, freezing and hot only when above 0%). It describes the days you actually climbed there, so it leans towards the seasons you visit. It is **not** official climate normals or a forecast, and it is hidden for crags below the threshold, for gym routes and when no weather is cached.

## Fair-weather rate

Once **20 or more** outdoor days have cached weather, the Weather conditions card adds a **Fair-weather rate**: the share of those days that were _fair_ (high 15-25°C, dry, no snow or thunderstorm - the same rule as **Bluebird**). It also reports the share of _tough_ days (hot, freezing, wet, snowy or very windy). Days in between, such as a dry 29°C day, are counted in neither group.

The label is descriptive, not a grade: **Fair-weather leaning** at 60% fair or more, **All-weather climber** at 50% tough or more, otherwise **A bit of both**. The groups can overlap: a mild dry day may still be very windy or freezing overnight. When both label thresholds are met, **All-weather climber** takes priority. Below 20 days nothing is shown, so a thin cache never labels you. The link opens the logbook filtered to fair days.
For seasonal recommendations from route metadata, see [Best months](/docs/best-months); those recommendations are separate from the weather sampled on your logged visits.

Fair-weather labels use the exact day counts for their thresholds; displayed rates are rounded to one decimal place. Display rounding alone never changes your label.

Weather drill-downs (#307): the Weather conditions card links each condition row and entire daily-high bar to the logbook. Temperature ranges use `weatherHighMin` (inclusive) and `weatherHighMax` (exclusive), in Celsius, and persist through filtering, sorting and pagination. Card counts are outdoor location-days; the logbook shows every matching ascent, so counts can differ. The logbook Weather column shows cached daily high/low and precipitation plus notable condition chips on screens at least 1280px wide; smaller screens hide its header and cells. Indoor or uncached rows show a dash. No weather requests are made while viewing pages.
