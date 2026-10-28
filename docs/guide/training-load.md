# Training load

The **Training load** card estimates how hard you've been climbing recently compared with what your body is used to. A quick increase is when finger and shoulder injuries most often happen.

## 1. Load per ascent

Each ascent gets a load score:

> **load = 10 × intensity × style factor**

**Intensity** compares the ascent's grade with your **hardest send of the last 12 months** in the same discipline. Routes are compared on Ewbank and boulders on the V-scale.

| Grade compared with your 12-month max                      | Intensity |
| ---------------------------------------------------------- | --------- |
| At your max                                                | 1.0       |
| 2 Ewbank grades (1 V-grade) below                          | 0.5       |
| 4 Ewbank grades (2 V-grades) below                         | 0.25      |
| Above your max (a new high)                                | up to 1.5 |
| Working an ungraded route or a theCrag Project (see below) | 1.0       |
| Ungraded send, or no sends in 12 months                    | 0.3       |

Climbing near your limit counts much more than mileage well below it. A day of ten easy routes and a day spent on one project can come out similar.

**Ungraded and flagged projects:** an attempt, hang-dog or other unsent tick on a route with **no grade**, or on a route theCrag marks with the **Project** flag (from the optional route-info import), is treated as climbing **at your max**. Ungraded routes you keep working are usually new lines near your limit; the flag is the definite case when we have it. The same attempts also count towards the near-limit share. If you gave the tick a grade yourself on theCrag, that grade is used instead. An ungraded _send_ still counts as light (0.3), since an unnamed easy route shouldn't look like a limit day.

**Style factor:** a lead send is 1.0. Attempts and hang-dogs are 0.8, because working a route is still real effort. Top-roping or seconding is 0.8× on top of that.

## 2. Fatigue and fitness

Daily loads are averaged two ways, both weighted towards recent days:

- **Fatigue (acute):** a 7-day exponentially weighted average.
- **Fitness (chronic):** a 28-day exponentially weighted average.

## 3. Acute : chronic ratio

**ratio = fatigue ÷ fitness**

| Ratio     | Status      | Meaning                                                    |
| --------- | ----------- | ---------------------------------------------------------- |
| —         | Resting     | Nothing logged recently                                    |
| < 0.8     | Below usual | Lighter than normal: fresh, tapering, or losing fitness    |
| 0.8 – 1.3 | Sweet spot  | In line with what you're used to                           |
| 1.3 – 1.5 | Ramping up  | Climbing more than usual; keep an eye on recovery          |
| > 1.5     | Spike       | A big jump; the zone most associated with overuse injuries |

These bands come from the acute:chronic workload ratio used in sports science and climbing coaching. Treat them as a nudge, not a diagnosis.

## Also on the card

- **Weekly load:** the total load for each of the last 12 weeks. The current week is the highlighted bar.
- **Near-limit sends · 28d:** sends in the last 28 days within 2 Ewbank grades (1 V-grade) of your 12-month max.
- **Near-limit share:** the percentage of the last 28 days' graded ascents that were near your limit. A high share over several weeks means a lot of limit climbing; consider deload weeks.
- **Last 7 / 28 days:** ascents, sends, active and rest days, height climbed and send rate.

## Caveats

- **Only what you log counts.** Gym sessions, hangboarding and other training you don't log are invisible.
- **Grades are noisy**, and a soft or sandbagged route skews intensity.
- **The ratio needs history.** With fewer than a few weeks of logs, "fitness" is low and the ratio jumps around.

For Project routes, a personal grade must come from the ascent or a climbed pitch (or the CSV Ascent Grade field). An effective grade copied from the route is only a fallback, so it does not disable the at-max Project assumption.
