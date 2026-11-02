# Weather polygon preparation (#309, follow-up #344)

**Typed GeoJSON fallback is enabled at the owner’s subsequent request.** The
weather resolver uses route point → crag point → sector point → validated area
polygon → selected town, comparing both cached provider payloads before choosing.
The original evidence gate still applies to additional undocumented provider
formats: no guessed Fence or nested-array adapter is enabled.

`src/lib/server/weatherPolygon.ts` accepts only the GeoJSON Polygon/MultiPolygon
geometry contract defined by [RFC 7946](https://www.rfc-editor.org/rfc/rfc7946).
Coordinates are longitude then latitude. The weather resolver calls it only for
explicitly typed `geometry` on an identified TLC or immediate parent node, after
known broad-area exclusions. All test shapes are synthetic, explicitly labelled as
such, and must not be presented as provider fixtures.

## Coordinate selection and conservative limits

- Read the first longitude/latitude pair of the first outer ring directly. Do not
  calculate a centre, average or centroid, and do not select a hole coordinate.
  It is a boundary location, labelled approximate, rather than a route position.
- Require explicitly typed Polygon/MultiPolygon geometry, closed rings with at
  least three distinct coordinates, numeric finite values and valid ranges.
  This is a bounded coordinate reader, not a full polygon topology validator;
  it does not promise valid winding, hole containment or nonintersecting edges.
- At most 16 components, 16 rings per component and 256 total vertices, including
  holes. Inspect the whole geometry before accepting its first coordinate.
- Bounding diagonal must be at most 15 km, using 111.32 km per degree for both
  axes as a conservative upper bound. Reject antimeridian-spanning geometry and
  latitudes at/above 85 degrees. Some valid polygons deliberately remain
  unresolved; a broad regional boundary is unsuitable for crag weather.

## Provider evidence and remaining format support

The provider's [API guide](https://www.thecrag.com/en/article/api) names Point,
BoundedBox and Fence fields, but does not establish that cached logbook/route
`geometry` contains GeoJSON polygons. Its published
[JavaScript wrapper](https://github.com/theCrag/thecrag-javascript) has no polygon
fixture. Read-only inspection of the owner's existing cache found bare point
arrays, not a polygon payload. No authenticated provider requests or website
scraping were performed for this investigation.

Before adding any other provider-specific boundary format:

1. Capture one actual polygon-bearing response from an authorized, already paced
   import or an official published fixture. Record endpoint, field path,
   coordinate order and the area's identity/type. Remove private notes,
   credentials and identifying account data. Document any sanitization.
2. Add a provider-specific adapter and fixture regression for that observed
   contract. Do not assume Fence is GeoJSON, coerce nested arrays into points,
   or select arbitrary ancestors. Keep known country/region sources excluded.
3. Preserve point precedence and broad-area exclusions across both caches.
   Source `polygon` records the chosen area ID/name and approximate boundary-coordinate
   precision without overwriting route coordinates. Polygon and town data are
   excluded from weather and sun-facing badges.
4. Bump the version in the weather-location signature whenever resolution policy
   changes. The current version invalidates old point ordering/unresolved results
   without deleting shared weather days. All views/import/backlog use the same
   resolved key; wipe already clears these resolutions.

Synthetic pipeline and browser regressions cover the enabled typed path, but do
not establish that theCrag currently supplies that shape. [#309](https://github.com/Luen/crag-stats/issues/309) shipped in
[#317](https://github.com/Luen/crag-stats/pull/317) and [#328](https://github.com/Luen/crag-stats/pull/328); [#344](https://github.com/Luen/crag-stats/issues/344) tracks the real
provider evidence and any additional format adapter. Close #344 only with a
sanitized provider-backed fixture regression, not with more synthetic coverage.

### Existing synthetic coverage (not provider evidence)

These regressions already cover the checklist's verification items for the typed
GeoJSON path. A real fixture must be run through the same cases:

- `weatherPolygon.test.ts`: first exterior coordinate in longitude/latitude order,
  holes/other components ignored, malformed/open/collapsed/nonnumeric rejection,
  and broad/dateline/polar/oversized rejection.
- `weatherLocations.test.ts`: route → crag → sector point precedence across both
  caches, country exclusion, polygons only after all points, the shared polygon
  pipeline (keys, labels, unchanged route coordinates, no badges), signature
  invalidation of pre-polygon results, and wipe.

### Evidence status (2026-11)

No polygon-bearing provider payload or official fixture is available yet. An
unauthenticated read of the API guide returned HTTP 403, so its Fence/BoundedBox
contract could not be rechecked. The next step stays the same as step 1 above:
capture a sanitized response from an authorized, already paced import.
