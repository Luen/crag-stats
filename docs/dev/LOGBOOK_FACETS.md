# Logbook facets vs theCrag

Inventory for [#86](https://github.com/Luen/crag-stats/issues/86). Crag Stats is a single-owner self-hosted logbook: climber-side facets (been climbed by, gender, supporter, country of climber) do not apply. We do **not** HTML-scrape theCrag route pages.

| theCrag facet                              | Local data today                       | Status                                                                                              |
| ------------------------------------------ | -------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Ascent grade min/max                       | `effective_grade_*` / preferred system | Done (#85 `minScore`/`maxScore`, routes only)                                                       |
| Tick type                                  | `ascents.tick_type`                    | Done (#85 multi)                                                                                    |
| Ascent style                               | `ascent_gear_style` / `gear_style`     | Done (#85 multi)                                                                                    |
| Climbers rating (quality)                  | `ascents.quality`                      | Done (#85 multi)                                                                                    |
| Climbed between / dates                    | `ascent_date`                          | Done (`from`/`to`, year, season)                                                                    |
| Who with                                   | `ascents.partners`                     | Done (`with`, `partners=has\|missing`)                                                              |
| Min stars                                  | `routes.stars`                         | Done (`minStars`)                                                                                   |
| Multipitch                                 | pitch label / `pitches_total`          | Done (`multipitch=1`)                                                                               |
| FA / FFA by me                             | `first_ascents`                        | Done (`fa=`)                                                                                        |
| History not fetched                        | `route_history_fetches`                | Done (`history=pending`, owner + import on)                                                         |
| Missing height                             | `routes.height_m` null                 | Done here (`missing=height`)                                                                        |
| Missing bolts                              | `routes.bolts` null                    | Done here (`missing=bolts`)                                                                         |
| Route / ascent hash tags                   | `routes.tags_json` names               | Partial (`tag=` substring)                                                                          |
| Structured tags (FA milestone, gear on, …) | tags sometimes present; IDs not synced | Blocked / partial — prefer negotiated API                                                           |
| Setting natural/artificial                 | raw `routes.flags_json` (#82)          | Blocked — no verified flag name yet; check a real route-info payload before adding a facet          |
| Is project                                 | `routes.is_project` (#77)              | Done (`project=yes\|no`; routes without route info match neither)                                   |
| Is bolted / can top rope                   | raw `routes.flags_json` (#82)          | Blocked — no verified flag names yet; `missing=bolts` and the Sport style facet cover most of it    |
| No pitch list cached                       | `routes.pitches_json` (#82)            | Done (`missing=pitch`; alias `pitches`; see [pitch list facet](#no-pitch-list-cached-missingpitch)) |
| Route setter                               | cached `route_history` setter rows     | Done (`setter=me\|none`, owner login on setter rows, #76)                                           |
| Seasonality / popularity / qualityScore    | route info (#78–#80)                   | Not facets: `sort=popularity`, Best months and quality cards use them                               |
| Beta / access                              | `routes.beta_json` (#81)               | Not a facet: shown on project cards                                                                 |
| Climber filters (by, gender, country, …)   | N/A single owner                       | Out of scope                                                                                        |

Richer near-term filters from columns we already sync: [#85](https://github.com/Luen/crag-stats/issues/85). Route-info fields come from the opt-in route-history import, so `project` only matches routes it has fetched and `setter=none` includes routes it hasn't checked yet.

## No pitch list cached (`missing=pitch`)

Label: **No pitch list cached** (URL value `missing=pitch`, alias `pitches`, unchanged). It matches routes where route info **has been fetched** (`routes.route_info_updated_at` is set) but `routes.pitches_json` is `null`, `[]` or not a JSON array.

- **Not "missing data" in a strict sense.** We have no live `/api/route` fixture showing whether theCrag omits `pitches` for single-pitch or boulder routes. If it does, those routes land here after a successful fetch, so this facet is **not** a list of multipitch routes with missing pitch data, and single-pitch routes are not inferred to be missing anything.
- **Unchecked routes match nothing.** `route_info_updated_at` null (never fetched, or fetched before route info was cached) is excluded. This is **not** the same as `history=pending`, which tracks the route-history fetch ledger (`route_history_fetches`); a route can be history-fetched but route-info-unchecked, or the reverse.
- **Unparseable values.** `classifyRoutePitches()` (`routePitches.ts`) reports non-array or unparseable JSON as `invalid`, distinct from `empty`; the facet still counts it, since there is no usable list.
- Revisit once a sanitized fixture shows what the API returns for single-pitch routes.
