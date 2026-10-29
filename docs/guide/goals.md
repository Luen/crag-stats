# Goals

Goals turn a target in your theCrag logbook into a progress bar on the dashboard and the **Goals** page. Height and climbing-day goals fill linearly. **Grade** goals use an approximate **pyramid readiness** model so sitting one grade under the target no longer looks almost done.

## Goal kinds

| Kind                 | What “done” means                                    | Progress bar               |
| -------------------- | ---------------------------------------------------- | -------------------------- |
| **Grade this year**  | A send at or above the target score in the goal year | Pyramid readiness (below)  |
| **Height this year** | Metres climbed in that year                          | Linear: metres ÷ target    |
| **Days this month**  | Distinct climbing days in the current calendar month | Linear: days ÷ target      |
| **Custom**           | You mark it complete                                 | Manual (no automatic fill) |

Venue scope (outdoor / indoor / any) filters which ascents count. Grade goals default to **outdoor**.

## Grade readiness

A grade goal asks for a **send ≥ target** (canonical score, usually Ewbank for routes or V-scale for boulders) in the goal year. The bar is **not** `best send ÷ target` — that made 22→23 look like ~96% when you still needed the send at 23.

Instead the model asks how built your pyramid is under the target **N**, then how much you’ve worked near it:

1. **Done (100%)** when your best qualifying send is already ≥ N.
2. **Base** when you have a send at N−1 (~35%) or only at N−2 (~10%).
3. **Pyramid fill** from distinct routes with a send in those buckets — soft need of about **2 routes at N−1** and **4 at N−2** (up to about +20% and +25%).
4. **Attempt fill** from non-send (working) ticks with effective score **≥ N−1** — up to about +20%, with a **horizon-scaled** soft need so short-term projects move faster per attempt than long-haul ones.
5. **Cap at 90%** until you actually send at N. Pyramid and attempts alone cannot complete the bar.

Send evidence uses the same year and venue filter as completion: **effective grade** (hardest climbed pitch on multipitch), and **distinct routes** per pyramid bucket (repeat sends on one route count once). Attempts count every qualifying working tick (repeats on the same route still nudge the bar).

The progress line shows your best send, the N−1 / N−2 route counts, attempt evidence when present, and a short horizon hint:

| Gap to target       | Hint       | Soft attempt need (≈ fill the attempt band) |
| ------------------- | ---------- | ------------------------------------------- |
| 1 grade             | Short-term | ~15 attempts                                |
| 2 grades            | Medium     | ~35 attempts                                |
| Wider / no send yet | Long-haul  | ~75 attempts                                |

## What you see

- **Dashboard** “Active goals” card: up to a few open goals with the same percentages and labels.
- **Goals** page: full Active / Achieved lists, create/edit, and the same readiness copy for grade goals.

## Caveats

- **Approximate.** Soft pyramid numbers are a coaching rule of thumb, not a prediction that you will send N.
- **Same-system scores.** Supporting buckets are the score ranges [N−1, N) and [N−2, N−1), so fractional sends below a target still support it. Scores use the goal’s canonical score; mixed grading systems are not converted inside the bar.
- **Year + venue only.** Older ticks outside the goal year, or the wrong venue, do not help readiness.
- **Attempts are approximate.** We only see logged non-sends with a grade at ≥ N−1 — not every burn on an ungraded project.
- **Custom goals** never auto-fill from the logbook.

Height and days goals stay simple linear ratios so a half-finished kilometre or month still reads as halfway.
