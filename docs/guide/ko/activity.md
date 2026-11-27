# Activity

The dashboard **Monthly stats** and **Yearly stats** cards summarise volume at a glance. **Activity** (`/activity`) is the detail page when you want more than the charts: a full per-month table (ascents, sends, height, style mix) and the yearly year-over-year breakdown.

## What counts

- **Ascents** — every logged tick that day/month/year (attempts included).
- **Sends** — ticks classified as sends (see [Tick types](/docs/tick-types)).
- **Height** — metres from ascent or route height when present.
- **Styles** — Sport / Trad / Boulder from gear style; everything else rolls into **Other** on the table.

Month links open the logbook for that calendar month. Year links (on the yearly card/table) open `/logbook?year=`.

## Why a separate page

Repeating the same two charts alone would be sidebar bloat. Activity earns its route by carrying the **monthly breakdown table** and keeping YoY deltas easy to scan — the same bar the issue set for shipping past thin cards.

## Streaks

The Streaks card shows current day, week and month streaks beside your all-time
**longest** day streak (four metric tiles). The longest run’s start and end dates
sit under the tiles. When equally long records exist, the earliest range is shown.
A single climbing day shows one date; an empty history has no record dates.

The footer also shows your last climbing day, how many whole days have passed
since then when the current day streak is broken, and lifetime **active days**
(distinct climbing days). Days come from valid written ascent dates; attempts and
sends, indoors and outdoors, count equally, and several climbs on one day count
once. See [Badges](/docs/badges) for the 7-, 10- and 30-day milestones.

The current day streak ends today, or yesterday while you have not climbed today.
Calendar-day comparisons use UTC, so the server time zone and daylight-saving
changes cannot shift a logged day. Future-dated entries do not extend the current streak.

Current week and month streaks follow the same grace rule: count consecutive
periods ending in the current period, or the immediately preceding one if there
has been no climb this period yet. After a whole empty week or month, that counter
is zero. Weeks start on Monday and calendar boundaries use UTC, including across
ISO week 53 and the new year. Future-dated entries do not count toward these counters.

## Recent activities

The dashboard lists the newest **climbing day** first. Within each day, the most
recently **logged** ascent comes first, using the provider’s log creation timestamp.
The displayed date remains the climbing date: logging an older climb today does
not move it above climbs from a later climbing day. Logging order is a proxy for
climbing order when you enter climbs in sequence, not a recorded ascent time.

Entries with missing or invalid log times follow timed entries on the same day.
Equal or unavailable log times use the stored ascent ID, newest first, to keep the
order stable. Edit/sync timestamps are not used as log creation times.

Recent activities also show the same climb-style badges as the logbook: route discipline, a different recorded ascent protection style when applicable, and explicit solo variants such as Lead solo or Top-rope solo. Missing partners never imply a solo.
