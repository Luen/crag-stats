# Logbook facets vs theCrag

Inventory for [#86](https://github.com/Luen/crag-stats/issues/86). Crag Stats is a single-owner self-hosted logbook: climber-side facets (been climbed by, gender, supporter, country of climber) do not apply. We do **not** HTML-scrape theCrag route pages.

| theCrag facet                              | Local data today                        | Status                                                                                            |
| ------------------------------------------ | --------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Ascent grade min/max                       | `effective_grade_*` / preferred system  | Done (#85 `minScore`/`maxScore`, routes only)                                                     |
| Tick type                                  | `ascents.tick_type`                     | Done (#85 multi)                                                                                  |
| Ascent style                               | `ascent_gear_style` / `gear_style`      | Done (#85 multi)                                                                                  |
| Climbers rating (quality)                  | `ascents.quality`                       | Done (#85 multi)                                                                                  |
| Climbed between / dates                    | `ascent_date`                           | Done (`from`/`to`, year, season)                                                                  |
| Who with                                   | `ascents.partners`                      | Done (`with`, `partners=has\|missing`)                                                            |
| Min stars                                  | `routes.stars`                          | Done (`minStars`)                                                                                 |
| Multipitch                                 | pitch label / `pitches_total`           | Done (`multipitch=1`)                                                                             |
| FA / FFA by me                             | `first_ascents`                         | Done (`fa=`)                                                                                      |
| History not fetched                        | `route_history_fetches`                 | Done (`history=pending`, owner + import on)                                                       |
| Missing height                             | `routes.height_m` null                  | Done here (`missing=height`)                                                                      |
| Missing bolts                              | `routes.bolts` null                     | Done here (`missing=bolts`)                                                                       |
| Route / ascent hash tags                   | `routes.tags_json` names                | Partial (`tag=` substring on tag name)                                                            |
| Structured route tags (category + name)    | `routes.tags_json` via flattenRouteTags | Done (`tagExact=Category:Name`, repeat for AND; case-insensitive trim on category and name, #172) |
| Structured tags (FA milestone, gear on, …) | tags sometimes present; IDs not synced  | Blocked — prefer negotiated API for facets not in tags_json                                       |
| Setting natural/artificial                 | raw `routes.flags_json` (#82)           | Blocked — no verified flag name yet; check a real route-info payload before adding a facet        |
| Is project                                 | `routes.is_project` (#77)               | Done (`project=yes\|no`; routes without route info match neither)                                 |
| Is bolted / can top rope                   | raw `routes.flags_json` (#82)           | Blocked — no verified flag names yet; `missing=bolts` and the Sport style facet cover most of it  |
| Missing pitches                            | `routes.pitches_json` (#82)             | Partial via multipitch; pitch lists are cached but there is no `missing=pitches` facet yet        |
| Route setter                               | cached `route_history` setter rows      | Done (`setter=me\|none`, owner login on setter rows, #76)                                         |
| Seasonality / popularity / qualityScore    | route info (#78–#80)                    | Not facets: `sort=popularity`, Best months and quality cards use them                             |
| Beta / access                              | `routes.beta_json` (#81)                | Not a facet: shown on project cards                                                               |
| Climber filters (by, gender, country, …)   | N/A single owner                        | Out of scope                                                                                      |

Richer near-term filters from columns we already sync: [#85](https://github.com/Luen/crag-stats/issues/85). Route-info fields come from the opt-in route-history import, so `project` only matches routes it has fetched and `setter=none` includes routes it hasn't checked yet.
