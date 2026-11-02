# Weather

Crag Stats can cache **daily outdoor weather** for climbs that have route coordinates, then use it for badges, dashboard and logbook surfaces, and a comparison of how your climbing went in different weather.

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
- **Share of days** shows perfect, rainy, snowy, freezing and hot days as a share of days with cached weather, using the same rules as the badges above (rain ≥ 1 mm and not snow, snow codes, low ≤ 0°C, high ≥ 35°C). A day can appear in more than one row, for example a freezing, snowy day.
- A **Perfect** day is a fair day (high 15–25°C, dry, no snow or thunderstorm) that is also calm (max wind under 25 km/h), not humid (mean humidity under 85%) and stayed above freezing overnight. If the wind, humidity or low is missing for a day, it is not counted as perfect.
- **Daily high** is a small histogram of each day's maximum temperature in 5° bins.

These are model values for the nearest grid cell, not official climate normals or a measurement at the wall.

## Weather & performance card

Once **20 or more** outdoor location-days have cached weather, the **Weather & performance** card compares how your outdoor climbing went in different weather. Before that it shows how many days are cached so far. Like the Weather conditions card it stays hidden while no weather is cached, and can be moved or hidden from Settings → Dashboard.

**What is counted.** Outdoor sends and attempts (the same tick classification as everywhere else) whose location-day has cached weather. Gym routes, ticks that are neither a send nor an attempt, and ascents without a weather location are left out. Ascents whose weather comes from an approximate nearby place or area polygon are included, and the card says how many there are.

**Group by:**

- **Daily high:** under 10°, 10–17°, 18–24°, 25–29° and 30°+. Each band includes its lower edge and stops just below the next one, like the logbook temperature range.
- **Conditions:** Fair, Dry (measured precipitation under 1 mm and no snow; missing rain is unknown, not dry), Rainy, Snowy, Hot, Freezing and Windy, using the badge rules above. One day can be in several conditions.

**Measures:**

- **Send rate:** sends as a share of sends and attempts.
- **Near-limit:** the share of graded sends within 2 grades (1 V-grade on the V-scale) of your hardest outdoor send of the **same style and grade scale** in the 365 days before that day. Trad is compared with trad and sport with sport, and V-scale and route grades are never mixed. Using your recent best rather than your all-time best means getting stronger over the years does not make recent weather look better. Sends with no earlier same-style send in that year, and ungraded sends, are left out of this measure.
- **Onsight/flash:** onsights and flashes as a share of sends.

**Reading it honestly.**

- Each bar shows the band's rate; the line marks your overall rate. A band needs at least **10** ascents (for that measure's denominator) over at least **3** days before it shows a rate. Smaller bands show "Not enough data".
- A band is marked **Higher** or **Lower** only when it differs from all your _other_ weather days by more than day-to-day variation explains (a two-sided test at about 95%), with at least 5 days on each side. Ascents on the same day share the same weather and usually the same crag and partner, so the test treats each location-day as one unit rather than each ascent. One big day out cannot create a pattern by itself.
- The one-line summary names the band that stands out most for the selected measure, or says that nothing stands out yet.
- This is a **correlation, not a cause**. Season, crag, partners and where you are in a project all change with the weather. With many bands and measures, an occasional "Higher" or "Lower" can appear by chance.

Each daily-high band and each condition with a logbook filter (fair, rain, snow, heat and freeze) links to the logbook filtered to those ascents. Dry and Windy have no logbook filter yet. A values table under the bars lists every band with counts for all three measures. Viewing the card never triggers a weather request, and private notes are never used.

## Logbook filters and chips

When any weather is cached, the logbook gains a **Weather on the day** filter (`?weather=`): `fair`, `perfect`, `heat`, `freeze`, `rain` or `snow`, using the same rules as the badges. It only matches **outdoor** ascents with route coordinates and a cached day for that location; gym routes, ascents without coordinates and days that have not been fetched never match.

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

### From the card to your logbook

Each condition row and each daily-high bar on the **Weather conditions** card opens the logbook filtered to those days. A temperature bar includes its lower bound and stops just below the next bar (for example 20–24° covers 20.0 °C up to, but not including, 25 °C). The range stays applied while you sort, page or add other filters; use **Clear weather range** to remove only that range.

The card counts outdoor _days_ at each location, while the logbook lists every matching _ascent_, so the two numbers can differ. On wide screens the logbook shows a Weather column with the cached daily high, low and rain; on smaller screens the condition chips appear next to the route instead. Indoor or uncached ascents show a dash. Viewing these pages never triggers a weather request.

## Weather locations when route coordinates are missing

CSV exports do not include coordinates. With both weather import and route-data import enabled (`WEATHER_IMPORT=true` and `ROUTE_DATA_IMPORT=true`), the configured supporter API key can also look up locations for the crag/sector IDs found in cached route data. This does not import that key owner's logbook or profile. Both keyed logbook ancestors and route API ancestor arrays are supported.

Area lookups share the route import's ten-request budget and one-second pacing. Route checks use the budget first; remaining requests check up to ten areas each. Settings shows **weather areas pending** and offers **Check weather locations now** when all routes are checked. Existing CSV installations can fill missing area locations without **Refresh all routes**. The next successful logbook sync also checks the backlog. Once location checks finish, a background weather batch starts when eligible days exist.

Area responses (including missing locations) are cached once by provider area ID. `ROUTE_DATA_REFRESH_DAYS` also controls their optional refresh age, and **Refresh all routes** makes area lookups eligible again. Access failures stop the import and use its existing backoff; a key that can read route history is not guaranteed access to area locations. If the API supplies no supported location, use the explicit nearby-place fallback below. No API calls run while viewing weather pages.

Weather prefers an explicit route point, then its top-level crag (TLC) point, then its immediate sector point from cached provider data. It ignores country-only and arbitrary ancestor geometry. Older cached points without original provider geometry remain usable and are labelled “Cached point”; their original precision cannot be recovered from that point alone. Indoor routes remain excluded.

Settings → Import weather → **Review weather locations** lists outdoor areas and unresolved route counts. For a missing location, search a nearby town using its name/region and a two-letter country code, then explicitly choose the correct result. The search submits only that entered text and country code to [Open-Meteo geocoding](https://open-meteo.com/en/docs/geocoding-api), whose location data comes from GeoNames. It does not send routes, ascent dates, private notes or API keys. Searches happen only after submitting the form, are cached for 30 days, paced, and back off on errors.

A chosen town is an **approximate nearby-place fallback**, shared only by the same provider area ID (or route identity if no area ID exists). It does not overwrite route coordinates, alter route maps or claim to be the nearest settlement. A valid route/sector/crag point always wins. Town weather can differ from a cliff because of distance, elevation and terrain, so town-based data appears in weather views and filters but **does not unlock weather badges**. You can remove the fallback at any time.

The logbook and recent activity show the weather location source. The importer, backlog, calendar, conditions card, crag visit summaries and logbook use the same resolved location/day key. Changing or removing a fallback immediately stops using its old key; old weather stays cached and can still be used by other climbs at that location. Fetch the next weather batch to fill a newly chosen location. Wipe clears resolutions, place choices and search results, and cancels in-flight searches.

When those points are missing, explicitly typed GeoJSON Polygon/MultiPolygon geometry on an identified crag or sector can supply its first outer-boundary coordinate directly; no centre or centroid is calculated. This is labelled **Approximate area polygon** and does not unlock weather or Summer Sun Face badges. Route and crag points always take priority. Country/region boundaries, malformed shapes, large areas (over a conservative 15 km bounding diagonal), and shapes crossing the date line are excluded. Untyped boundary arrays and undocumented Fence formats remain unsupported; no captured provider polygon fixture is available yet. A selected town is used only if these geometry fallbacks also fail. Weather importing must still be enabled to fetch missing days. Summer Sun Face uses separately verified route-tag evidence; see [Badges](/docs/badges).
