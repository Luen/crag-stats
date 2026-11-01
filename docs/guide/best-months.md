# Best months

The **Best months** card compares [theCrag seasonality](https://www.thecrag.com/article/Seasonality) for the crags you climb most with **when you actually climb there**.

## Where the data comes from

theCrag stores a **12-value seasonality curve** per route (one value per calendar month). Crag Stats caches it on each route during the optional route-history import (`ROUTE_HISTORY_IMPORT`, off by default). Until a route has been fetched at least once, there is no seasonality to show.

## How we aggregate it

For each crag in your logbook:

1. **Your volume** — count your ascents by calendar month (all years combined).
2. **theCrag seasonality** — for each route you have ticked at that crag, take the cached 12-month curve and weight it by **how many times you climbed that route**. Routes with more of your ticks influence the crag average more.

We show up to **six** crags ranked by your total ascents there, but only crags where at least one climbed route has seasonality cached.

## Reading the chart

- **Orange bars** — weighted mean seasonality (higher = more popular on theCrag that month).
- **Grey bars** — your ascents that month at that crag.

When the grey bars peak in different months than the orange strip, you may be climbing off-peak — or your sample is small.

## Refreshing seasonality

Run **Sync** from Settings. With route-history import enabled, seasonality backfills in the background (rate-limited, up to 100 routes per run).

The Sectors page can also show [weather on your cached visit days](/docs/weather). This describes conditions on your logged days, separately from the route seasonality used here.

## Search by month

Open [Seasonality search](/seasonality) from the Best months card to browse all crags and climbs in your synced logbook with cached monthly data. Choose a month (the current month in your display time zone by default), search a crag, area or climb name, and switch between **Crags** and **Climbs**. Searches, month selection, sorting and pages are stored in the URL so you can bookmark or share them. Choose **View climbs** to narrow to one crag, or **Search all crags** to leave that scope.

Results are ranked by the selected month’s value divided by the highest value in that result’s annual curve. For example, a value of 5 with an annual peak of 10 shows **50% of annual peak**. Names break ties; you can also sort by name. There is no “in season” cutoff. A zero-only curve has **No seasonal signal** and sorts after curves with a positive peak. The month strip and expandable values table show all twelve months.

Crag curves use the same ascent-weighted mean as the dashboard: routes with more of your logged ascents have more influence; missing route curves do not enter the mean. Searching a climb name can find its crag, but does not change that crag’s full curve. Crags are kept separate by provider area identity where available. Each crag shows how many of its logged climbs have data; the page also reports coverage among matching climbs. Missing or malformed curves stay unknown and are omitted from ranked results.

Climb results link to all your logbook entries for that exact climb and to its guidebook page on theCrag. Your browser’s Back button returns to the search. Searching reads the local cache only and does not trigger a provider fetch or search the whole theCrag catalogue. Enable the optional route-history import and sync to build coverage.

Seasonality describes **community climbing patterns**, not forecast weather or measured conditions on your logged visits. See [Weather](/docs/weather) for those visit-day observations.
