# Weather polygon preparation (#309)

**Activation is blocked on provider evidence.** Route, immediate-sector and crag
points plus owner-confirmed qualified settlement fallback already shipped in
#317. This change prepares the remaining geometry calculation; it does not
enable polygon weather resolution or finish #309.

`src/lib/server/weatherPolygon.ts` accepts only the GeoJSON Polygon/MultiPolygon
geometry contract defined by [RFC 7946](https://www.rfc-editor.org/rfc/rfc7946).
Coordinates are longitude then latitude. It is not a theCrag payload parser and
has no production caller. All test shapes are synthetic, explicitly labelled as
such, and must not be presented as provider fixtures.

## Calculation and conservative limits

- Scan horizontal lines between vertex heights; choose the midpoint of the
  widest interior interval across components. Even/odd crossings exclude holes.
  Concavity cannot put the result outside the polygon, unlike a centroid.
- Require closed, simple rings with distinct vertices and non-collinear turns.
  Reject intersecting/touching rings, holes outside the outer ring, nested or
  overlapping holes, and intersecting/overlapping components. Winding order
  does not matter.
- At most 16 components, 16 rings per component and 256 total vertices. Work is
  bounded even for malformed inputs; no geometry library or network calls.
- Bounding diagonal must be at most 15 km, using 111.32 km per degree for both
  axes as a conservative upper bound. Reject antimeridian-spanning geometry and
  latitudes at/above 85 degrees. Some valid polygons deliberately remain
  unresolved; guessing a country/region centre is worse than missing weather.

## Evidence needed before wiring the resolver

The provider's [API guide](https://www.thecrag.com/en/article/api) names Point,
BoundedBox and Fence fields, but does not establish that cached logbook/route
`geometry` contains GeoJSON polygons. Its published
[JavaScript wrapper](https://github.com/theCrag/thecrag-javascript) has no polygon
fixture. Read-only inspection of the owner's existing cache found bare point
arrays, not a polygon payload. No authenticated provider requests or website
scraping were performed for this investigation.

Before activation:

1. Capture one actual polygon-bearing response from an authorized, already paced
   import or an official published fixture. Record endpoint, field path,
   coordinate order and the area's identity/type. Remove private notes,
   credentials and identifying account data. Document any sanitization.
2. Add a provider-specific adapter and fixture regression for that observed
   contract. Do not assume Fence is GeoJSON, coerce nested arrays into points,
   or select arbitrary ancestors. Keep known country/region sources excluded.
3. Insert polygon fallback after reliable route/sector/crag points across both
   cached payloads and before settlement fallback. Persist explicit polygon
   precision/provenance without overwriting route coordinates. Decide badge
   eligibility explicitly; geometry is an approximation.
4. Version the weather-location signature to invalidate previously unresolved
   cached locations when the resolver changes. Verify all consumers, backlog,
   wipe and Settings provenance through the shared weather key path, including
   malformed/oversized geometry and a real cached upgrade.

Keep #309 open until that evidence and end-to-end integration are complete.
