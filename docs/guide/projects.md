# Projects

Crag Stats lists **projects** the same way RoxClimbs does: outdoor routes where you logged at least one **unsent** attempt in the last year, plus routes you **sent after a fight** (shown on the “Recently sent” shelf for about a month). A route you onsighted or flashed first go is never a project.

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
