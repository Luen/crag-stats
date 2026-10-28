# Karma

theCrag awards **Karma** for contributions to the climbing index — logging ascents and editing guidebook data. See [Karma on theCrag](https://www.thecrag.com/article/cragkarma).

## What Crag Stats can show

The supporter **logbook** API account object does **not** include your personal karma total or an ascents/edits split. Area `/karma` endpoints are contributor leaderboards for a crag, not a substitute for your account score.

Until theCrag exposes personal karma (or negotiated access), the dashboard card is an **approximation of the ascent portion only**:

| Source                                        | Points                                                                          |
| --------------------------------------------- | ------------------------------------------------------------------------------- |
| Log Ascent                                    | **1** once per route (node), matching theCrag’s once-per-contribution-type rule |
| Guide edits (descriptions, topos, history, …) | **Unavailable** — not reconstructible from the logbook cache                    |

When your synced account includes `routesTicked` and that figure is at least as large as the local route cache, the card uses it for the ascent total (it matches “routes you’ve logged” on theCrag). Otherwise it counts distinct routes in your local SQLite cache.

The **local routes logged** tile always shows the number of distinct routes linked to your cached ascents, even when the ascent estimate uses the larger account counter. Repeat ticks count once; route metadata without an ascent does not count.

## What it is not

- Not a byte-for-byte clone of the score on your theCrag profile.
- Real karma sits in a **review queue** for about a week before it lands on your account.
- Deleting or editing ascents, private accounts, and historical imports can leave local counts and theCrag out of sync.
- We do **not** invent edit points from FA marks or route-setter credits — those activities may earn karma on theCrag, but the scoring rules are one-per-node per contribution type and we do not have your edit history.

## When this can improve

If theCrag adds karma (or ascent/edit totals) to the logbook account payload or a documented climber endpoint we can sync safely, Crag Stats can replace the estimate with the real numbers and fill in the edits tile.
