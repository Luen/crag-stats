# Projects

Crag Stats lists outdoor routes as **open projects** after unsent attempts on **at least two separate climbing days** in the logbook. Multiple tries on one day alone do not create an open project. Open projects disappear after a year without activity.

A **completed project** is a route sent after work across at least two days, or after **at least two unsuccessful tries on the send day** (three or more tries including the send). Attempts can be separate log entries or recorded in the send’s attempt count. Separate entries and the send count are not added together, to avoid counting the same tries twice. First-go sends and one failed try followed by a same-day send are not projects. Only work up to the first send counts; later repeats do not turn an earlier send into a project. Missing or invalid dates do not establish sessions. Completed projects appear on the **Recently sent** shelf for the past six calendar months.

When both an attempt and the first send include timestamps, attempts after that send are excluded from the classification. Date-only entries on the send day are treated as work leading to it because their within-day order is unknown. Multiple sends tied on a date without usable times use their stored ascent order, so a later repeat does not replace the first recorded send. Session totals on cards and the dashboard use the same valid calendar days as the classifier.

**Recently sent** covers the past six calendar months in UTC, including the boundary day for date-only sends. At month ends the boundary clamps to the last valid day (31 October looks back to 30 April). Future dates are excluded. Timestamp sends preserve the reference clock at the boundary. The dashboard uses the same window when filling spare project slots with recent sends.

## Project details, progression and estimates

Click a project name on the Projects page or dashboard to open its detail page. It shows the route, public guidebook excerpts when cached, dated session progression, and previous tries/sends (including climbed pitch labels). The bottom link opens every logbook entry for that exact route, including older repeats. Private ascent notes stay in the logbook under the existing owner-only visibility setting.

The **approximate readiness** bar follows the goals readiness approach: it measures supporting evidence, not a percentage of a grade or the probability of sending. Only a logged send on this route completes the bar. Another route at the same grade cannot do that. Earlier sessions use only evidence available by that climbing day, so a later send does not rewrite their readiness.

For each reference day, the model uses the preceding 365 days (including that day) of outdoor sends in the same discipline and grade scale, using effective climbed grades. Supporting pyramid counts use distinct routes; repeats do not fill the pyramid again. The target route is excluded from supporting evidence.

- Best recent send at/above target: 60 points; one step below: 35; two steps below: 10; otherwise zero.
- Two distinct routes one step below add up to 20 points, and four two steps below add up to 25 points.
- Unsuccessful tries on the target add up to 15 points, against a soft target of 15, 35 or 75 tries. The horizon is **Short-term** when the gap to your recent best is at most one step, **Medium** for two, otherwise **Long-haul** (also when no recent send is known).
- The result is capped at 95% until this project has a logged send. Unknown grades have no estimate. V-scale zero/negative grades are supported and never mixed with route grades.

Practice can raise this bar without proving that a particular move is solved. Grades and logged effort cannot reveal beta, conditions, injuries or confidence, so this is an explainable heuristic, not a scientifically validated model.

**Estimated work remaining** compares your history of completed outdoor projects in the same discipline and scale, within one numeric grade step. First-go sends do not enter this cohort; partial-pitch sends below the route grade do not stand in for whole-route sends. For each metric separately, at least three completed projects must have taken more sessions/tries than you have logged so far. The displayed range is the middle half (25th–75th percentile, using enclosing observed ranks) of those totals minus your logged work; remaining tries include the eventual send. When you exceed that history or there are too few comparisons, the estimate is withheld rather than inventing a deadline. Cohorts include all recorded years, while readiness uses recent sends.

These estimates describe completed projects only: unsent projects and unlogged attempts are absent, and ability changes over time. They are rough personal comparisons, not guaranteed remaining effort. Session totals count valid written calendar days. Missing, invalid and future dates are listed in history but excluded from progression/estimates. Send-entry attempt counts include the successful try and may overlap separate failure entries; summaries use the larger failure total instead of adding both. A later repeat remains visible without changing which send first completed the project.

## New route?

When a project has **no grade** on theCrag (or is literally graded “Project” / “Proj”), cards show a **New route?** badge — usually a new line you are bolting or still working. The same badge also appears for **wide provisional spans** such as `21-23` or `V1-3`, which often mean the grade is still being dialled in. Adjacent half-grades like `V1/2` stay ordinary published grades and do not get the badge. The grade chip still shows the parsed midpoint when one exists; only the badge changes. A definite theCrag **Project** flag (from route-info import) shows the separate Project badge instead.

## Guidebook text on project cards

When **route data import** has cached public guidebook data for a route, project cards can show:

- A short **description** excerpt
- An **access** warning when the guidebook lists access issues (for example closed or tolerated crags)

That text comes from theCrag’s public route pages (`beta` fields such as Description and Access issues). It is **not** your private logbook notes.

### Privacy

- **Private ascent notes** (`ascents.comment`) stay separate. They only appear in the logbook when you opt in under Settings, and never on project cards or dashboard stats.
- **Guidebook beta** is public community content. Crag Stats stores short excerpts in `routes.beta_json` during the same opt-in route import as FA history — never mixed with notes.

### Licensing & attribution

theCrag guidebook content may be licensed under terms such as [Creative Commons BY-SA](https://creativecommons.org/licenses/by-sa/4.0/). Route pages often credit contributors (for example local clubs). Crag Stats shows **short excerpts** only, links back to the **route page on theCrag**, and labels the source (CC BY-SA). For the full description, ethics, approach and current access status, use the link on the card.

Route import is **off by default** (`ROUTE_DATA_IMPORT`). Set `ROUTE_DATA_IMPORT=true` on the server and restart if you want guidebook excerpts and automatic FA hints; see [First ascents](/docs/first-ascents) for the privacy and pacing limits.
