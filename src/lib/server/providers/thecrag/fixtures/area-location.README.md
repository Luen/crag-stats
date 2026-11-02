# Area location envelope

`area-location.sanitized.json` retains the structure observed in a successful read-only `/api/area/ids?show=info,location` response on 2026-11-02. IDs, names and all coordinates were replaced with synthetic values; unrelated metadata was omitted. No credentials or logbook data are included.

The area response places numeric `lat` and `long` inside `geometry`, next to `bbox`, `boundary`, `center` and string-valued `point`. The resolver reads the supplied scalar coordinates as an area point. It does not calculate a centre or infer coordinate order from the untyped boundary/point arrays. Typed GeoJSON polygon fallback rules remain separate.

`area-ancestors.synthetic.json` reproduces the independently observed route ancestor array using synthetic identities. Combined, the two fixtures cover CSV route IDs → cached ancestor identity → area location → weather-day backlog.
