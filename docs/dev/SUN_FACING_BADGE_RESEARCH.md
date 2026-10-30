# Sun-facing badge research (#283)

This spike records the available aspect evidence and a conservative design. It does not add a badge. A sanitized, representative sync payload and an agreed rule are still required before implementation.

## Evidence and current parsing

The [theCrag logbook read API](https://www.thecrag.com/en/article/logbookreadapi) describes route tags as a summary that can include aspect. The [structured tagging guide](https://www.thecrag.com/en/article/tagging) lists the eight compass aspects. These documents establish a plausible supported source; they do not prove that a given account's current logbook response contains a particular shape or inherited sector aspect.

`flattenRouteTags` in `src/lib/server/providers/thecrag/api.ts` already flattens nested route tags to `{category,name}` pairs stored in `routes.tags_json`. Its comment describes a potential `Aspect` map. No code change is needed merely to retain a supported category/name pair. The spike found no sanitized real Aspect response fixture in the repository. There is no basis yet to assume an aspect field in route info/flags or to scrape one from HTML.

Before implementing, obtain an owner-approved, minimized fixture through the existing permitted API sync path, retaining only route identity, aspect tag/category and any evidence of inheritance. Verify direct route tags versus parent/sector tags, exact labels and absent/unknown values. Keep private notes, keys, account identifiers and unrelated raw payloads out of fixtures. Document the API endpoint and observation date. An example invented from documentation must be labeled synthetic and cannot satisfy this gate.

## Solar geometry and the badge claim

[NOAA's solar definitions](https://gml.noaa.gov/grad/solcalc/glossary.html) and the [US Naval Observatory's seasons explanation](https://aa.usno.navy.mil/faq/rs_solstices) support the distinction between seasons and solar position. Solar declination changes through the year. A north-facing cliff in the southern mid-latitudes or a south-facing cliff in the northern mid-latitudes may receive substantial midday sun, but aspect plus month does not establish hot rock.

Near the equator, the midday sun moves between the north and south of the observer seasonally. Therefore, “near equator = always sun-facing/hot” is not a valid award rule. Neither a broad compass direction nor a calendar season accounts for overhangs, local terrain, clouds, shade or time of ascent. Daily maximum air temperature also cannot measure sun exposure on the rock.

## Proposed implementation choices to review

1. Prefer an accurately named, modest claim such as **Summer sun face** over asserting measured sunbaked rock. Use a new stable ID only after the rule is accepted; do not overlap the existing ≥35°C air-temperature heat badge without a distinct reason.
2. For a first version, restrict coverage to outdoor routes with verified route-level aspect and reliable latitude outside the tropics. Candidate bounds: absolute latitude >23.44° and <60°, north sector (N/NE/NW) in the southern hemisphere or south sector (S/SE/SW) in the northern hemisphere, and local meteorological summer (Dec–Feb south, Jun–Aug north). These are design proposals, not a validated physical heat model; the 60° gate is a conservative product choice requiring review. No tropical award in this version.
3. If the intended claim is actual sun exposure rather than a seasonal heuristic, use date, coordinates, an aspect azimuth interval and a chosen solar-elevation window. Time-of-day and horizon evidence remain unknown for date-only ascents; either require appropriate evidence or label the result as potential exposure. Do not imply the climber was there at solar noon.
4. Missing, contradictory, broad or inherited aspect stays unknown unless the provider semantics and inheritance rule have been verified. Do not infer aspect from route names, hemisphere or temperature.
5. Keep badge evaluation pure and local. No page-view API requests. A one-shot award links to the earliest qualifying dated ascent and stays out of Almost there.

## Test matrix before enabling

- Real sanitized aspect tag survives API mapping, ingestion, storage and dashboard badge input.
- Eight supported compass values, case/spacing normalization, unknown values and conflicting tags.
- Route-level versus inherited evidence, with explicit provenance policy.
- Both hemispheres and summer boundaries, equator and tropic boundaries, high latitudes.
- Indoor, unknown latitude, invalid date and missing aspect never qualify.
- Air-temperature heat badge alone cannot unlock the new badge.
- Earliest day/ascent tie-break and no Almost there entry.
- User docs describe a seasonal/potential-exposure heuristic and its coverage limits without claiming measured rock temperature.

## Status

Documented source identified; real payload contract and final award semantics remain unresolved. Keep #283 open and this PR as a research draft until those gates are met. No upstream API credentials or undocumented endpoints were used for this research.
