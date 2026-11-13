# Tick types

A **tick type** records _how_ you climbed something, not just whether you reached the top. An onsight is worth more than a red point of the same route. That's why theCrag (and Crag Stats) keep them apart.

In the tables below, **Send** means Crag Stats counts the tick as a successful (clean) ascent, for example in "successful ascents", send rates and pyramids. **Attempt** means it's logged as an attempt: it shows as grey in charts, still counts as climbing volume, and can mark a route as a project.

<!-- component:tick-types -->

## How ticks are used here

- **Pyramids and charts** colour each tick type consistently: onsight green, flash yellow, red point red, pink point pink, send/clean blue, attempts grey.
- **CPR** shifts each tick by a grade offset (an onsight counts as harder than a red point); see [CPR](/docs/cpr).
- **Projects** are routes with attempts but no send yet. A route you sent first go (onsight or flash) is never a project.
- **Training load** counts attempts at 0.8× a send, since working a route is still hard work; see [Training load](/docs/training-load).

## Counted tick types in analytics

On theCrag, non-send attempts (such as `Working`, `Attempt`, `Hang dog`, or `Retreat`) are logged as ascents. If you log numerous working burns while projecting, counting every attempt in dashboard totals can skew your headline ascent count, style share, and climber type.

In **Settings → Display & visibility → Counted tick types**, you can configure how each tick type is treated across Crag Stats:

- **Enable (Count everywhere):** Included in headline ascents, discipline breakdown, crags and sectors, pyramids, map totals, Eddington numbers, route repeats, the climber profile axes, activity heatmaps, training load, projects, and goals.
- **Projects & goals only (Out of totals):** Excluded from headline ascents, discipline share, crags, sectors, pyramids, map totals, Eddington numbers, route repeats, and the climber profile axes, but still counted towards project detection, session activity (heatmap, sessions per week, and weekday charts), training load fatigue, and grade goals.
- **Hide (Exclude completely):** Excluded across all analytics, projects, and goals.

The logbook always preserves and displays all your logged ascents with full filtering regardless of this setting.

While any tick type is set to _Projects & goals only_ or _Hide_, the dashboard also recalculates the profile figures that normally come from theCrag (outdoor and indoor ascents, routes ticked, total height, and climber type) from your counted ascents, so every total on the page describes the same set of ticks. Clear the configuration with the **All logged ticks** preset to go back to theCrag's own totals.

## Source

Definitions are paraphrased from theCrag's [Tick types](https://www.thecrag.com/en/article/ticktypes) article. Not every tick type applies to every gear style.
