# Rock types

theCrag stores geology on many routes as a structured **Rock type** tag (for example Granite or Sandstone). Crag Stats reads that tag from the synced logbook / route cache — it never scrapes pages or guesses rock from the crag name.

## Rock types card

The dashboard **Rock types** card counts ascents whose route has a Rock type tag and shows each name’s share. The dominant type can show a short geology blurb. Each name links to the logbook filtered with `?rock=`.

Routes without a Rock type tag are left out of the chart, so the percentages describe tagged climbs only.

## Rock & performance card

Once **20 or more** climbing days include at least one send or attempt on a Rock-type-tagged route, the **Rock & performance** card compares how those climbs went by rock. Before that it shows how many tagged days you have so far. The card stays hidden while no tagged send or attempt exists, and can be moved or hidden from Settings → Dashboard.

**What is counted.** Sends and attempts (the same tick classification as everywhere else) on routes with a Rock type tag. Untagged climbs are reported only as coverage (“N more … have no rock type tag”).

**Measures** (same ideas as [Weather & performance](/docs/weather)):

- **Send rate:** sends as a share of sends and attempts on that rock.
- **Near-limit:** the share of graded sends within 2 grades (1 V-grade on the V-scale) of your hardest send of the **same style and grade scale** in the 365 days before that day. V-scale and route grades are never mixed.
- **Onsight/flash:** onsights and flashes as a share of sends on that rock.

**Reading it honestly.**

- A rock needs at least **10** ascents (for that measure’s denominator) over at least **3** days before it shows a rate.
- **Higher** / **Lower** uses the same cluster-robust test as weather performance: each rock-and-day group is one unit, so one big session cannot invent a pattern alone.
- Crag choice, travel and projects confound rock type. Treat differences as correlation, not cause.
- When you have many distinct rock names, the least frequent fold into **Other** (no logbook link). Named bands link to `/logbook?rock=…` with the same case-insensitive match as the Rock types card.

Viewing the card never triggers a provider request, and private notes are never used.
