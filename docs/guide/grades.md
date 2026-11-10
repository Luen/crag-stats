# Grades & grade bands

Crag Stats shows grades the way [theCrag](https://www.thecrag.com/en/article/grades) does. Every grading system is converted onto one internal scale, and that scale is split into five colour-coded **bands**.

## The five bands

<!-- component:grade-bands -->

These colours appear in every pyramid, grade chip, CPR chart and band breakdown. They match theCrag, so a grade looks the same here as it does there.

## How grades are compared

- **One internal scale per kind of climbing.** Routes (sport, trad, top rope, alpine…) are scored on the **Ewbank** scale (the Australian numbers). Boulders are scored on the **V-scale**. They're never mixed in one list: a V5 boulder and a grade 21 route sit in different pyramids.
- **The grade decides the scale, not the style.** Deep water solos and highballs are often given V-grades even though they aren't boulders. Those stay on the V-scale: they're counted with boulders in hardest sends and grade indexes, and get their own pyramid (for example **DWS · V**), never an Ewbank one.
- **Your display systems** are chosen in **Settings → Display & visibility**, one for each kind of climbing. **Route grades** (Ewbank, French, or YDS; Ewbank by default) cover sport, trad, top rope, and other roped climbing. **Boulder grades** (V-scale (Hueco) or Fontainebleau; V-scale by default) cover boulders and V-graded highballs. The two are independent, so you can show French routes with Font boulders. A shared link can override them once with `?system=` (a route or boulder system) and `?boulderSystem=`.
- **Assigned vs your grade.** theCrag stores both the route's consensus grade and the grade you gave it. Crag Stats prefers the grade on the ascent when it's in the right system, and falls back to the route's grade.
- **Reading individual climbs.** Projects, project history, and Logbook show your selected grade first. When the original theCrag route grade differs, it follows in parentheses, for example `6b (20)`. For a partial multi-pitch ascent, the first grade still describes the pitches you climbed; the parentheses show the route's original grade. Unscored grades keep their original text rather than guessing a conversion.
- **Multi-pitch:** the effective grade of an ascent is the hardest pitch _you_ climbed, not the hardest pitch on the route. For systems the text parser cannot read, such as UIAA, a complete climb or a matching pitch grade uses the ascent's universal score. Other pitches use their difficulty band's midpoint when available.
- **Ambiguous boulder numbers:** provider grade-system context decides whether a bare number means V-scale or Ewbank. Country alone never changes a grade on API rows. Repairs preserve the original API evidence. CSV exports have no grade-system column, so Australian boulder rows with bare digits (`9`, `1`) get an AU hint from Country / Crag Path / australia URL stubs; explicit `V5` / `VB` stay V-scale. As with API imports, an inferred AU ascent grade does not override an explicit V-scale route grade.
- **Ranges** such as `V1/2` count as the midpoint (V1.5).
- **theCrag's universal score.** theCrag scores every grade, in every grading system, on one difficulty scale. Synced ascents carry that score, so Crag Stats can rank grades in any system theCrag supports (UIAA, Saxon, Nordic, Polish, Brazilian, and more), even ones it can't read as text. Bare numbers in those systems (a UIAA `7`) are never mistaken for Ewbanks.
- **In-between grades.** French, YDS, and Fontainebleau conversions use theCrag's scores too, so grades without a whole Ewbank or V equivalent (French `5c+`, `6a`, and `7a+`, Font `6A+` and `7C+`) still rank strictly between their neighbours (`7a` < `7a+` < `7b`). French, YDS, and Font pyramids group by the nearest grade in that display system, with midpoint ties going to the harder grade. Each row links to its own grade range in the logbook. Ewbank and V-scale pyramids keep whole-grade rows. Their band comes from theCrag's score as well, so a French `6a` stays Intermediate and a `7a+` stays Experienced.
- **CSV uploads** have no score column, so their grades are read from the text. French, YDS, Ewbank, V, and Font grades convert as above; grades in other systems may show unconverted.

## Conversion tables

Conversions between systems are approximate: grades are cultural, and a "6c" at one crag isn't always a "23" at another. The tables below are generated from the same code the dashboard uses.

### Routes (Ewbank ↔ French ↔ YDS)

<!-- component:route-conversions -->

### Boulders (V-scale ↔ Fontainebleau)

<!-- component:boulder-conversions -->

## Sources

- theCrag: [Grades and grade conversions](https://www.thecrag.com/en/article/grades)
- theCrag: [Grades on theCrag](https://www.thecrag.com/en/article/gradesonthecrag)
