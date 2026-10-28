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

Run **Sync** from Settings. With route-history import enabled, seasonality backfills in the background (rate-limited). Use **Refresh all route history** to re-fetch routes that were imported before seasonality was cached.
