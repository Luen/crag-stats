# First ascents

The **First ascents** card counts the routes and boulders where you did the first ascent (**FA**) or the first free ascent (**FFA**). When route history is cached, it also shows how many routes credit you as **route setter** (bolting / setting).

## What you need

- **Owner login** — If `APP_PASSWORD` is set, sign in so you can open Settings and use **Mark FA** / **FFA** in the logbook. Visitors see the card and badges once at least one route is marked, but cannot add marks themselves.
- **Optional route-history import** — Set `ROUTE_HISTORY_IMPORT=true` on the server if you want Crag Stats to auto-mark FAs and FFAs from public theCrag route history (see below). Manual marks and import both write to the same `first_ascents` table; neither depends on private notes.
- **Private notes are unrelated** — `SHOW_PRIVATE_NOTES` and **Settings → Show private notes** only control whether your **ascent comments** appear on `/logbook` (and in search). They do not gate the First ascents card, FA/FFA badges, milestones, or route-history import.

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
- **Gentle on theCrag.** Each route is checked **once** (first ascents don't change), at most **20 routes per run** and one request a second. A run happens after each logbook sync, or when you press **Check next 20 routes now**. If theCrag pushes back, the import pauses for at least a day.
- Settings shows how many of your routes have been checked so far. With the daily sync, a few hundred routes take a few weeks; pressing the button speeds that up.

Only public route history is saved, never your private ascent notes. **Settings → Wipe** removes it along with your marks.

## What the card shows

- **Count:** how many routes you've marked. When you have FFAs, it also shows the FA / FFA split.
- **Routes set:** distinct routes whose cached history lists you as route setter (`@yourlogin`). Same `@login` rule as FA import; free-text names don't count. Needs route-history import (`ROUTE_HISTORY_IMPORT=true`) so those rows are saved locally.
- **Community ascents:** how many ticks other climbers have logged on routes you put up (FA/FFA marks **or** setter credits), using each route's cached theCrag `ascentCount` minus your own ticks of that route. A second tile splits out **sport / bolted** routes (Sport gear style, or any route with bolts recorded) — useful when you've invested in hardware. Counts stay at zero until route-history import has fetched those routes (`ROUTE_HISTORY_IMPORT=true`); they are ascent totals, not unique climbers.
- **Years:** from the year of your first FA to your latest. Each FA is dated by your **first logged send** of the route (see below).
- **Grade range:** your easiest and hardest FA, using the route's grade (not a single pitch). Routes and boulders are listed separately, because Ewbank and V-grades can't be compared. Grades show in your display grade system.
- **Styles:** how your FAs split across sport, trad, boulder and so on, using the route's style on theCrag.
- **Latest:** your five most recent FAs.

The card only appears for visitors once at least one FA is marked. Until then, the owner sees a short how-to instead.

## When an FA counts, and its date

A first ascent is the send, so each one is dated by your **first logged send** of the marked route. Earlier attempts and hang-dogs while you worked it don't count, and neither do later repeats. If you've only logged attempts so far, the route still appears on the card (dated by your earliest ascent), but it doesn't earn badges or a milestone until you log the send.

## Badges and milestones

These unlock from owner-marked FAs/FFAs (and your first send of each marked route), not from turning on private notes.

- **First Ascent** and **First Free Ascent:** your first send of a route you marked FA, or FFA.
- **5 First Ascents** and **Pioneer** (10): first ascents of that many different routes, FA and FFA combined.
- **Route Setter**, **Route Developer** (5), **Wall Builder** (10), **Crag Architect** (25): route setter credits from cached route history, dated by the earliest setter entry that names your `@login` on each route (not by logbook sends).
- Each FA also adds a milestone on the date of that first send.

Setter credits with no valid history date still count toward setter badges, but their earned date is left unknown.
