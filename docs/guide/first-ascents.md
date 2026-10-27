# First ascents

The **First ascents** card counts the routes and boulders where you did the first ascent (**FA**) or the first free ascent (**FFA**).

## Marking a first ascent

theCrag records first ascents in each route's **history** (the FA / FFA entries on the route page), not as a tick type. Its logbook API doesn't return route history, so Crag Stats can't detect them on its own. You mark them yourself:

1. Open the **Logbook** and find any ascent of the route.
2. Hover the row (or tab to it) and press **Mark FA** or **FFA**.
3. Press **Unmark** to undo.

Only someone who can open Settings can mark FAs: anyone if no `APP_PASSWORD` is set, otherwise only when logged in. Visitors see the FA badge and the card, but not the buttons.

The mark is stored against theCrag's route ID, so it survives re-syncs. It disappears from the card if every ascent of the route is deleted on theCrag, and it comes back if you log the route again. **Settings → Wipe** removes all marks.

## What the card shows

- **Count:** how many routes you've marked. When you have FFAs, it also shows the FA / FFA split.
- **Years:** from the year of your first FA to your latest. Each FA is dated by your earliest logged ascent of the route.
- **Grade range:** your easiest and hardest FA, using the route's grade (not a single pitch). Routes and boulders are listed separately, because Ewbank and V-grades can't be compared. Grades show in your display grade system.
- **Styles:** how your FAs split across sport, trad, boulder and so on, using the route's style on theCrag.
- **Latest:** your five most recent FAs.

The card only appears for visitors once at least one FA is marked. Until then, the owner sees a short how-to instead.
