# Display settings

**Settings → Display & visibility** sets how dates and measurements appear across the whole site. The choices apply to every visitor, not just the owner's browser, and they take effect on the next page load.

## Date format

| Option         | Example     |
| -------------- | ----------- |
| **Auto**       | 27 Oct 2026 |
| **DD/MM/YYYY** | 27/10/2026  |
| **MM/DD/YYYY** | 10/27/2026  |
| **YYYY-MM-DD** | 2026-10-27  |

**Auto** follows the site's display locale (`DISPLAY_LOCALE`), so it reads naturally for most visitors without extra configuration.

The format changes visible calendar days on the dashboard, logbook, weather pages, badges, goals, milestones, and charts. Filter links, `datetime` attributes, chart data, and URL parameters keep their ISO `YYYY-MM-DD` values, so a shared link always points at the same day.

## Units of measurement

Each measurement has its own setting, so you can mix and match:

| Measurement       | Options                       |
| ----------------- | ----------------------------- |
| **Height**        | Metres (m), feet (ft)         |
| **Distance**      | Kilometres (km), miles (mi)   |
| **Temperature**   | Celsius (°C), Fahrenheit (°F) |
| **Wind**          | km/h, mph                     |
| **Precipitation** | Millimetres (mm), inches (in) |

The presets fill all five at once:

- **Metric**: metres, kilometres, Celsius, km/h, and millimetres.
- **Imperial (US)**: feet, miles, Fahrenheit, mph, and inches.
- **UK (Mixed)**: metres, miles, Celsius, mph, and millimetres.

Presets are only a shortcut: changing an individual unit afterwards gives a custom mix, and the Settings form shows which values are stored.

## What stays metric

The database always stores heights in metres, distances in kilometres, temperatures in °C, wind in km/h, and precipitation in millimetres. Conversion happens only when a page is rendered, so switching units never rewrites your logbook, goals or imports.

- **CSV export** keeps its canonical metric columns.
- **Badge thresholds** (height marks, heat, frost, rain, wind, and so on) are defined in metric. Only the wording converts, for example **Heat Wave** reads "35°C or hotter" in metric and "95°F or hotter" in Fahrenheit. The same climbs earn the same badges either way.
- **Weather filters** such as the logbook's heat, frost, rain, snow, and wind filters keep their metric thresholds.
- **Conversions are rounded** for display, so a value shown in feet, miles or inches is approximate rather than a second stored reading.

## One-off overrides

The dashboard accepts `?units=metric`, `?units=imperial`, or `?units=uk` to preview a preset without saving it. Individual parameters override one measurement at a time: `unitHeight`, `unitDistance`, `unitTemp`, `unitWind`, and `unitPrecip` (for example `?unitTemp=fahrenheit&unitWind=mph`). These apply only to that page load and do not change Settings.

## Where the settings appear

Date and unit choices reach the dashboard, logbook, activity calendar, training load, weather pages, sectors, the climbing map, goals, badges, milestones, embed cards, and the offline snapshot. Grade systems are separate: see [Grades](/docs/grades).
