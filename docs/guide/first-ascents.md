# First ascents

The **First ascents** card counts the routes and boulders where you did the first ascent (**FA**) or the first free ascent (**FFA**). When route history is cached, it also shows how many routes credit you as **route setter** (bolting / setting).

## What you need

- **Owner login** — If `APP_PASSWORD` is set, sign in so you can open Settings and use **Mark FA** / **FFA** in the logbook. Visitors see the card and badges once at least one route is marked, but cannot add marks themselves.
- **Optional route-history import** — Set `ROUTE_HISTORY_IMPORT=true` on the server if you want Crag Stats to auto-mark FAs and FFAs from public theCrag route history (see below). Manual marks and import both write to the same `first_ascents` table; neither depends on private notes.
- **Private notes are unrelated** — **Settings → Show private notes** only controls whether your **ascent comments** appear on `/logbook` (and in search). It does not gate the First ascents card, FA/FFA badges, milestones, or route-history import.

## Marking a first ascent

theCrag records first ascents in each route's **history** (the FA / FFA entries on the route page), not as a tick type. Its logbook API doesn't return route history, so a normal sync can't see them. You can mark them yourself, or turn on the optional import below.

### Mark one yourself

1. Open the **Logbook** and find any ascent of the route.
2. Hover the row (or tab to it) and press **Mark FA** or **FFA**.
3. Press **Unmark** to undo.

Only someone who can open Settings can mark FAs: anyone if no `APP_PASSWORD` is set, otherwise only when logged in. Visitors see the FA badge and the card, but not the buttons.

The mark is stored against theCrag's route ID, so it survives re-syncs. It disappears from the card if every ascent of the route is deleted on theCrag, and it comes back if you log the route again. **Settings → Wipe** removes all marks.

### Filter the logbook

On **Logbook**, use the **First ascent mark** control to show only your FAs, FFAs, either, or climbs with no mark yet (`?fa=FA|FFA|any|none`). If route-history import is enabled, the owner also gets **History not checked yet** (`?history=pending`), which lists climbs the importer has not fetched.

### Import them from route history (optional, off by default)

If your server owner turns it on (`ROUTE_HISTORY_IMPORT=true`), Crag Stats reads each logbook route's public history from theCrag in the background and marks the FAs and FFAs that name you.

- **Only entries naming your theCrag username** (`@yourlogin`) count. Plain-text names are ignored because they're too easy to mix up.
- **Your choices win.** Marks you set stay as they are, and routes you unmarked stay unmarked. **Settings → Route history → Re-apply** can override either, using history already saved, without asking theCrag again.
- **Gentle on theCrag.** Each route is checked **once** by default (optional periodic data refreshes are described below), at most **100 routes per run** and one request a second. A run happens after each logbook sync, or when you press **Check next 100 routes now**. If theCrag pushes back, the import pauses for at least a day.
- Settings shows how many of your routes have been checked so far. With the daily sync, a few hundred routes take a few weeks; pressing the button speeds that up.

Only public route history is saved, never your private ascent notes. **Settings → Wipe** removes it along with your marks.

## What the card shows

- **Count:** how many routes you've marked. When you have FFAs, it also shows the FA / FFA split.
- **Routes set:** distinct routes whose cached history lists you as route setter (`@yourlogin`). Same `@login` rule as FA import; free-text names don't count. Needs route-history import (`ROUTE_HISTORY_IMPORT=true`) so those rows are saved locally.
- **Community ascents (estimate):** cached ticks on routes you put up (FA/FFA marks **or** setter credits), minus your own logbook ticks recorded at the same fetch. A second tile splits out **sport / bolted** routes (Sport gear style, or any route with bolts recorded). Later owner repeats or deletions do not change the old snapshot. These are estimates of ascent totals, not unique climbers or live counters; visibility differences and an incomplete owner logbook can affect them.
- **Community coverage:** the card shows how many credited logbook routes have paired count snapshots, out of all eligible routes. Known zero totals are displayed as zero; unavailable counts are excluded rather than treated as zero. Partial coverage is labelled explicitly. An entirely missing cache shows an unavailable message.
- **Years:** from the year of your first FA to your latest. Each FA is dated by your **first logged send** of the route (see below).
- **Grade range:** your easiest and hardest FA, using the route's grade (not a single pitch). Routes and boulders are listed separately, because Ewbank and V-grades can't be compared. Grades show in your display grade system.
- **Styles:** how your FAs split across sport, trad, boulder and so on, using the route's style on theCrag.
- **Latest:** your five most recent FAs.
- **Community by route:** up to eight credited routes, ranked by the community estimate. Each row shows FA, FFA and/or setter credit, a style badge (Sport/bolted, Trad, Boulder, or other known gear style from cached route info), the estimate (or Unavailable), and when that count was fetched. Count freshness is stored separately from other route-info fields, so refreshing beta or quality alone does not pretend the counter is new.

The card only appears for visitors once at least one FA is marked. Until then, the owner sees a short how-to instead.

Route-history import must be enabled (`ROUTE_HISTORY_IMPORT=true`) to fill count snapshots. Community totals and owner-count snapshots come from the route API during background import (100 routes per run, pacing and back-off apply). To keep totals and other route data fresh automatically, set `ROUTE_DATA_REFRESH_DAYS=90` (recommended) or `30` alongside `ROUTE_HISTORY_IMPORT=true`. Routes become eligible after that many days and refresh after a successful logbook sync, sharing the 100-route budget with new routes. New routes go first, then the oldest stale data; large backlogs can take multiple syncs. Unset or `0` retains fetch-once behavior; **Refresh all** in Settings remains an optional manual reset. Manual marks and unmarks stay protected.

## When an FA counts, and its date

A first ascent is the send, so each one is dated by your **first logged send** of the marked route. Earlier attempts and hang-dogs while you worked it don't count, and neither do later repeats. If you've only logged attempts so far, the route still appears on the card (dated by your earliest ascent), but it doesn't earn badges or a milestone until you log the send.

## Badges and milestones

These unlock from owner-marked FAs/FFAs (and your first send of each marked route), not from turning on private notes. The Milestones card and badge catalog use the same thresholds — not one row per route.

- **First Ascent** and **First Free Ascent:** your first send of a route you marked FA, or FFA.
- **Combined first-ascent counts** (5, 10 / Pioneer, 20, 50, 100): that many different routes marked FA or FFA.
- **First free ascent counts** (5, 10, 20, 50, 100): FFA marks only.
- **Style first-ascent counts** (10, 20, 50 for Sport, Trad, and Boulder): FA or FFA marks on that gear style.
- **Route Setter**, **Route Developer** (5), **Wall Builder** (10), **Crag Architect** (25): route setter credits from cached route history, dated by the earliest setter entry that names your `@login` on each route (not by logbook sends).
- **Shared Crag** (10), **Crowd Pleaser** (50), **Hundred Hands** (100), **Local Classic** (500): approximate community ascents on routes you put up (FA/FFA or setter), from paired count snapshots. Counts are ascents, not distinct climbers. Incomplete coverage is noted on the badge detail.
- **Bolted Buzz** (10), **Sport Magnet** (50), **Clip Classic** (100): the same estimate restricted to Sport gear style or bolted routes.

Each threshold is dated by the first send of the route that crossed it; the detail names that unlocking route.

Setter credits with no valid history date still count toward setter badges, but their earned date is left unknown. Community-ascent badges likewise leave the earned date unknown — the totals are cached aggregates, not an event day.
