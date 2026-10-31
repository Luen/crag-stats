# Climbing map

The Map page shows where you have climbed around the world. Glowing markers grow with logged ascent counts, including repeat ascents, and glow more strongly for higher counts. Counts are not unique routes; the values table lists both measures.

Nearby places cluster in a projected grid at the current zoom. Each place belongs to one cluster. Zoom in to separate them, or select a marker to see individual places and exact counts. Fit places frames your filtered locations using the shortest longitude arc, including across the international date line. The world outline uses an equirectangular projection, so shapes are distorted at high latitudes.

Filter by date range, style and Indoor/Outdoor/All. Date bounds include both endpoint days; incomplete dates are skipped when a date bound is present. Style matches either ascent style or route style, as in the logbook. Each place links to an exact filtered logbook query that survives sorting, pagination and form submission. Clusters list their constituent places rather than constructing a misleading combined name filter.

Stable provider area IDs keep renamed areas together and same-name crags separate. Without an area ID, grouping uses provider, normalized country/name and rounded coordinates; unnamed venues fall back to route identity. Missing or invalid coordinates are counted separately, never moved to 0,0. A legitimate location at 0,0 is still valid. Cached crag coordinates can be approximate; location-source improvements are tracked separately in #309.

The outline is bundled Natural Earth public-domain data. No map tiles, ascent data, notes or location requests are sent to third-party services while viewing the page. Existing whole-app authentication applies. The full values table and native marker/navigation buttons provide keyboard and screen-reader access. There are no map animations.
