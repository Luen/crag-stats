# Logbook facets vs theCrag

Inventory for [#86](https://github.com/Luen/crag-stats/issues/86). Crag Stats is a single-owner self-hosted logbook: climber-side facets (been climbed by, gender, supporter, country of climber) do not apply. We do **not** HTML-scrape theCrag route pages.

| theCrag facet                              | Local data today                       | Status                                                                                                            |
| ------------------------------------------ | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Ascent grade min/max                       | `effective_grade_*` / preferred system | Done (#85 `minScore`/`maxScore`, routes only)                                                                     |
| Tick type                                  | `ascents.tick_type`                    | Done (#85 multi)                                                                                                  |
| Ascent style                               | `ascent_gear_style` / `gear_style`     | Done (#85 multi)                                                                                                  |
| Climbers rating (quality)                  | `ascents.quality`                      | Done (#85 multi)                                                                                                  |
| Climbed between / dates                    | `ascent_date`                          | Done (`from`/`to`, year, season)                                                                                  |
| Who with                                   | `ascents.partners`                     | Done (`with`, `partners=has\|missing`)                                                                            |
| Min stars                                  | `routes.stars`                         | Done (`minStars`)                                                                                                 |
| Multipitch                                 | pitch label / `pitches_total`          | Done (`multipitch=1`)                                                                                             |
| FA / FFA by me                             | `first_ascents`                        | Done (`fa=`)                                                                                                      |
| History not fetched                        | `route_history_fetches`                | Done (`history=pending`, owner + import on)                                                                       |
| Missing height                             | `routes.height_m` null                 | Done here (`missing=height`)                                                                                      |
| Missing bolts                              | `routes.bolts` null                    | Done here (`missing=bolts`)                                                                                       |
| Route / ascent hash tags                   | `routes.tags_json` names               | Partial (`tag=` substring)                                                                                        |
| Structured tags (FA milestone, gear on, …) | tags sometimes present; IDs not synced | Blocked / partial — prefer negotiated API                                                                         |
| Setting natural/artificial                 | not in logbook API                     | Blocked — [#82](https://github.com/Luen/crag-stats/issues/82) / route info                                        |
| Is project                                 | not in logbook `route`                 | Blocked — [#77](https://github.com/Luen/crag-stats/issues/77)                                                     |
| Is bolted / can top rope                   | not stored as flags                    | Blocked — route flags (#77/#82)                                                                                   |
| Missing pitches                            | pitch count incomplete                 | Partial via multipitch; full pitch lists need [#82](https://github.com/Luen/crag-stats/issues/82)                 |
| Route setter                               | history types beyond FA/FFA            | Blocked — [#76](https://github.com/Luen/crag-stats/issues/76)                                                     |
| Seasonality / popularity / qualityScore    | route info                             | Blocked — [#78](https://github.com/Luen/crag-stats/issues/78)–[#80](https://github.com/Luen/crag-stats/issues/80) |
| Beta / access                              | route info                             | Blocked — [#81](https://github.com/Luen/crag-stats/issues/81)                                                     |
| Climber filters (by, gender, country, …)   | N/A single owner                       | Out of scope                                                                                                      |

Richer near-term filters from columns we already sync: [#85](https://github.com/Luen/crag-stats/issues/85).
