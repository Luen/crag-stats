# Route popularity

The **Route popularity** card uses community stats theCrag caches on each route: **ascent count**, **popularity**, and **relative popularity** (0–100). Crag Stats stores these when route history import runs (Settings → enable import, then sync).

## Beaten track vs off the beaten track

For each ascent where popularity data exists, we compare **relative popularity** when present, otherwise **global popularity**:

| Bucket                   | Rule          |
| ------------------------ | ------------- |
| **Beaten track**         | Score ≥ 50    |
| **Off the beaten track** | Score &lt; 50 |

The card shows what **share of those ticks** fall in each bucket. Ascents on routes without cached stats are excluded from the percentages.

## Hidden gems

**Hidden gems** are **sends** on routes that are both well regarded (`qualityScore` ≥ 70, or at least ★★★, or a strong quality label on your tick) and quiet (community **ascent count** ≤ 100 and popularity score &lt; 50). Up to three distinct routes are listed, ranked by quality.

## Logbook

Sort by **Pop.** to order ticks by route popularity (highest first by default). Rows without cached stats sort to the bottom.

## Source

Numbers come from theCrag’s route API (`show=info`). They reflect the whole community, not just your logbook.

Popularity uses relative popularity when available, then global popularity. Community ascent counts are shown separately and never compared numerically with popularity scores.

To keep community ascent totals, popularity and ratings fresh, the server owner can set `ROUTE_DATA_REFRESH_DAYS` to a whole number of days from 30 through 3650 (e.g. `90` recommended, or `180` for about half a year), with `ROUTE_HISTORY_IMPORT=true`. These are rolling day intervals. After successful logbook syncs, new routes take priority, then the oldest stale fetches refresh within the same 100-route limit and pacing. A backlog can take several syncs. Unset, `0`, under 30, or over 3650 keeps the default fetch-once cache; **Refresh all** remains available in Settings.
