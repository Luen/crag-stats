# Projects

Crag Stats lists outdoor routes as **open projects** after unsent attempts on **at least two separate climbing days** in the logbook. Multiple tries on one day alone do not create an open project. Open projects disappear after a year without activity.

A **completed project** is a route sent after work across at least two days, or after **at least two unsuccessful tries on the send day** (three or more tries including the send). Attempts can be separate log entries or recorded in the send’s attempt count. Separate entries and the send count are not added together, to avoid counting the same tries twice. First-go sends and one failed try followed by a same-day send are not projects. Only work up to the first send counts; later repeats do not turn an earlier send into a project. Missing or invalid dates do not establish sessions. Completed projects appear on the **Recently sent** shelf for about a month.

## New route?

When a project has **no grade** on theCrag (or is literally graded “Project” / “Proj”), cards show a **New route?** badge — usually a new line you are bolting or still working. The same badge also appears for **wide provisional spans** such as `21-23` or `V1-3`, which often mean the grade is still being dialled in. Adjacent half-grades like `V1/2` stay ordinary published grades and do not get the badge. The grade chip still shows the parsed midpoint when one exists; only the badge changes. A definite theCrag **Project** flag (from route-info import) shows the separate Project badge instead.

## Guidebook text on project cards

When **route history import** has cached public guidebook data for a route, project cards can show:

- A short **description** excerpt
- An **access** warning when the guidebook lists access issues (for example closed or tolerated crags)

That text comes from theCrag’s public route pages (`beta` fields such as Description and Access issues). It is **not** your private logbook notes.

### Privacy

- **Private ascent notes** (`ascents.comment`) stay separate. They only appear in the logbook when you opt in under Settings, and never on project cards or dashboard stats.
- **Guidebook beta** is public community content. Crag Stats stores short excerpts in `routes.beta_json` during the same opt-in route import as FA history — never mixed with notes.

### Licensing & attribution

theCrag guidebook content may be licensed under terms such as [Creative Commons BY-SA](https://creativecommons.org/licenses/by-sa/4.0/). Route pages often credit contributors (for example local clubs). Crag Stats shows **short excerpts** only, links back to the **route page on theCrag**, and labels the source (CC BY-SA). For the full description, ethics, approach and current access status, use the link on the card.

Route import is **off by default** (`ROUTE_HISTORY_IMPORT`). Turn it on in Settings if you want guidebook excerpts and automatic FA hints; see [First ascents](/docs/first-ascents) for the privacy and pacing limits.
