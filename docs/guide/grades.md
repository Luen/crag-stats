# Grades & grade bands

Crag Stats shows grades the way [theCrag](https://www.thecrag.com/en/article/grades) does. Every grading system is converted onto one internal scale, and that scale is split into five colour-coded **bands**.

## The five bands

<!-- component:grade-bands -->

These colours appear in every pyramid, grade chip, CPR chart and band breakdown. They match theCrag, so a grade looks the same here as it does there.

## How grades are compared

- **One internal scale per kind of climbing.** Routes (sport, trad, top rope, alpine…) are scored on the **Ewbank** scale (the Australian numbers). Boulders are scored on the **V-scale**. They're never mixed in one list: a V5 boulder and a grade 21 route sit in different pyramids.
- **The grade decides the scale, not the style.** Deep water solos and highballs are often given V-grades even though they aren't boulders. Those stay on the V-scale: they're counted with boulders in hardest sends and grade indexes, and get their own pyramid (for example **DWS · V**), never an Ewbank one.
- **Your display system** is chosen in **Settings → Display & visibility** (Ewbanks, French, YDS, V-scale or Fontainebleau). Routes convert to the chosen route system. Boulders show in V-scale, or Font if you pick Fontainebleau.
- **Assigned vs your grade.** theCrag stores both the route's consensus grade and the grade you gave it. Crag Stats prefers the grade on the ascent when it's in the right system, and falls back to the route's grade.
- **Multi-pitch:** the effective grade of an ascent is the hardest pitch _you_ climbed, not the hardest pitch on the route.
- **Ranges** such as `V1/2` count as the midpoint (V1.5).

## Conversion tables

Conversions between systems are approximate: grades are cultural, and a "6c" at one crag isn't always a "23" at another. The tables below are generated from the same code the dashboard uses.

### Routes (Ewbank ↔ French ↔ YDS)

<!-- component:route-conversions -->

### Boulders (V-scale ↔ Fontainebleau)

<!-- component:boulder-conversions -->

## Sources

- theCrag: [Grades and grade conversions](https://www.thecrag.com/en/article/grades)
- theCrag: [Grades on theCrag](https://www.thecrag.com/en/article/gradesonthecrag)
