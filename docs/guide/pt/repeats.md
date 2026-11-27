# Repeats vs new routes

The **Repeats vs new routes** card shows how much of your climbing goes to routes you've logged before, compared with routes that are new to you. It sits after **Route popularity** by default (half width), and Customize dashboard can move it.

## What counts

Every logged ascent counts, sends and attempts alike, as long as it has a valid calendar date and a provider route ID.

- A **first visit** is any ascent on the first day you logged that route. An attempt and a send on that same first day are both first visits.
- A **repeat** is any ascent on a later day on the same route.

Routes are matched by their theCrag route ID, never by name, so two different routes called "Arete" stay separate. Days are the written climbing dates in your logbook, without any time-zone shift.

## Filters

- **All time** or **Last 12 months**. The short range is the 365 days ending today. Whether an ascent is a repeat always depends on your whole history, so a route you first climbed three years ago counts as a repeat this year.
- **All**, **Sport**, **Trad**, or **Boulder**. These match the logbook style filters (climbed style **or** route style). Top-rope and other styles appear only under **All**.

Your choices are saved in this browser (`cs_repeats_range`, `cs_repeats_style`).

## Labels

Once the current view has at least 20 ascents, the card adds a short, descriptive label:

| Label              | Rule                                     |
| ------------------ | ---------------------------------------- |
| **Explorer**       | At least 75% of ascents are first visits |
| **Repeat climber** | At least 50% of ascents are repeats      |
| **A bit of both**  | Anything in between                      |

The thresholds use exact shares; the percentages on the card are rounded. Neither style is better than the other: projecting, training laps, and favourite circuits all show up as repeats.

## Most repeated

Up to five routes you came back to most in the current view, ranked by the number of different days you climbed them, then by ascents, then by the most recent day. Each one links to its logbook entries.

## When it shows

The card stays hidden until you have at least 20 dated ascents with a route ID.

## Related badges

**Explorer**, **Wanderer**, **Route Collector**, **Guidebook Explorer**, **Old Faithful**, and **Home Turf** use the same first-visit and repeat rules. See [Badges](/docs/badges).
