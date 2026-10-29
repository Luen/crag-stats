# Branding & UI style — Crag Stats

Developer reference for the look and feel. **Keep it current:** if you change a colour, token, icon or shell behaviour, update this file (and the short summary in `AGENTS.md`).

Visual direction: a clean, card-based analytics dashboard in the style of [Dreeve](https://dreeve.app/) (Stats for Strava). It uses neutral surfaces, one warm accent, and dense but readable data. Data colours (grade bands, disciplines) follow [theCrag](https://www.thecrag.com/) so climbers recognise them right away.

The First ascents card labels community totals as cached estimates and displays cached/eligible route coverage. Known zero totals stay visible; missing data uses an unavailable message rather than a zero tile.

The Karma card separates the approximate ascent total, the number of locally logged routes, and unavailable edit points. Its footer identifies whether the estimate came from the account counter or local logbook.

Logbook Project and Route setter selects use the standard filter controls. Project yes/no excludes unknown flags; label the setter complement "No setter credit found" and explain that it includes unimported history. Keep both filters in sort and pagination links.

---

## Logo

File: `src/lib/assets/favicon.svg`. It is both the favicon and the header mark.

- A solid **rope-orange (`#ea580c`) two-peaked crag**. Three **rising bars** (a grade pyramid / bar chart) are cut out of the rock face and are **transparent**: they're done with an SVG `<mask>`, not painted white, so the page background shows through in light and dark mode.
- The bars run **through the base** of the mountain (the mask rects extend past y=56), so there's no orange sliver under them and they merge into the background. Their tops sit a little below the slopes (y = 43 / 35 / 27) to give them room to breathe.
- No circle, no gradient, no outline. Keep it flat and single-colour.
- Wordmark: **"Crag Stats"** in Plus Jakarta Sans 800, tight tracking. "Crag" is in `--ink` and "Stats" in `--brand`. Use this same lockup everywhere the name appears as a logo (header, login card). Never write the whole name in orange.
- Minimum size: about 16px (favicon). Below about 20px the bars blur, which is acceptable.

## Typography

- **Plus Jakarta Sans** (variable), bundled through `@fontsource-variable/plus-jakarta-sans` and imported in `app.css`. Don't load fonts from a CDN: the app is self-hosted and privacy-first.
- Tokens: `--font-sans`, and `--font-display` (currently the same family). Headings are 650–700 weight with slight negative tracking. Big numbers use `font-variant-numeric: tabular-nums`.
- The old Fraunces serif and Source Sans fonts are retired.

## Colour tokens (`src/app.css`)

Always use tokens. **Don't** hard-code `white`, `#fff` surfaces or ink-tinted `rgba(...)`: they break dark mode. For tints use `color-mix(in srgb, var(--ink) 8%, transparent)` or `color-mix(in srgb, var(--accent) 12%, var(--paper))`. Text on a solid `--accent` fill uses `var(--on-accent)` (white in light mode, near-black in dark); `#fff` is fine on band/discipline fills.

| Token                 | Light              | Dark      | Use                                                                   |
| --------------------- | ------------------ | --------- | --------------------------------------------------------------------- |
| `--bg`                | `#f5f6f8`          | `#0f1218` | Page background                                                       |
| `--paper` / `--panel` | `#ffffff`          | `#171b23` | Cards, header, sidebar                                                |
| `--surface-2`         | `#f8f9fb`          | `#1d222c` | Table header, hover rows, inset blocks                                |
| `--surface-3`         | `#eceef2`          | `#262c38` | Icon-button hover, version pill, empty heatmap cells                  |
| `--ink`               | `#161a23`          | `#e8eaf0` | Text                                                                  |
| `--ink-muted`         | `#576071`          | `#98a1b3` | Secondary text, icons                                                 |
| `--line`              | `#e6e8ec`          | `#2a303c` | Borders, dividers                                                     |
| `--brand`             | `#ea580c`          | `#fb7a3c` | Logo + wordmark orange only                                           |
| `--accent`            | `#c2410c`          | `#fb7a3c` | UI orange: active nav, badges, primary buttons, highlight metric (AA) |
| `--on-accent`         | `#ffffff`          | `#1c0f06` | Text on solid `--accent` fills                                        |
| `--accent-strong`     | `#9a3412`          | `#fdba74` | Button hover                                                          |
| `--accent-soft`       | 8% accent on paper | 14%       | Active nav background, highlight card                                 |
| `--accent-2`          | `#0f766e`          | `#2dd4bf` | Secondary accent (sparingly)                                          |
| `--shadow`            | very soft          | subtle    | `.panel` elevation                                                    |

More tokens: `--style-*` (discipline colours, kept equal to `STYLE_BADGE_COLORS` by a unit test), `--danger`, `--gold` / `--gold-soft` (stars), `--series-1/2` (chart series), `--heat-1..4` (ascent calendar, dark-aware), `--shadow-lg`, `--scrim`.

**Contrast (WCAG AA) is tested** by the axe e2e suite in both themes. Text drawn in a data colour should be mixed toward ink, e.g. `color-mix(in srgb, var(--badge) 55%, var(--ink))`: this darkens it in light mode and lightens it in dark mode.

Gotcha: SVG presentation attributes (`fill="var(--x)"`) don't reliably take `var()`. Use `style="fill: var(--ink)"` instead.

### Dark mode

- The OS preference is the default (`@media (prefers-color-scheme: dark)` on `:root:not([data-theme='light'])`).
- The header button cycles **System → Light → Dark**. Light/Dark set `html[data-theme]` and `localStorage.cs_theme`; System removes both and follows the OS again.
- A nonce'd inline script in `src/app.html` applies the saved theme **before first paint**, so there's no flash. If you add tokens, define them in **both** dark blocks in `app.css`.

## Data colours (theCrag-aligned) — don't rebrand these

These are data semantics, not brand colours. They stay the same in both themes and match theCrag so pyramids and badges read the same as on thecrag.com.

### Grade bands (`src/lib/grades/bands.ts`, CSS `--band-*`)

| Band         | Colour | Value               |
| ------------ | ------ | ------------------- |
| Beginner     | Green  | `rgb(84, 180, 26)`  |
| Intermediate | Yellow | `rgb(254, 225, 0)`  |
| Experienced  | Orange | `rgb(229, 131, 41)` |
| Expert       | Red    | `rgb(201, 9, 9)`    |
| Elite        | Purple | `rgb(178, 24, 130)` |

Boulder V-scale banding (`bandFromVScale`): VB± green, **V0± yellow**, V1–V4 orange, V5–V10 red, V11+ purple.

### Disciplines (`STYLE_COLORS` in `src/lib/ticks.ts`)

| Style    | Colour        | Value     |
| -------- | ------------- | --------- |
| Sport    | Blue          | `#1d6fa5` |
| Trad     | Orange        | `#e07a2f` |
| Boulder  | Red (crimson) | `#a12b4a` |
| Top rope | Purple        | `#7b5ea7` |
| Alpine   | Teal          | `#2a9d8f` |
| Aid      | Grey          | `#6c757d` |
| Unknown  | Light grey    | `#9aa0a6` |

Use `STYLE_COLORS` / `styleBadgeColor()` everywhere: pyramids, style mix, climber-type bar, `StyleBadge`. Never invent a per-component palette.

### Tick icons (`TickTypeIcon.svelte`)

Onsight = blue eye · Flash = yellow bolt with red outline · Red point = red dot · Pink point = pink dot · Tick = check in `--ink` · Clean/Send = green check · Top rope = "Top" plus a check. All inline SVG, so they theme and print cleanly.

Because the brand accent is orange, it sits close to _Trad_ and _Experienced_. That's acceptable: the accent marks UI chrome (navigation, buttons, highlights) and data colours mark data. Don't use `--accent` to encode data.

## App shell (`src/routes/+layout.svelte`)

- **Top bar** (fixed, `--header-h` 3.75rem): sidebar toggle · logo plus wordmark · then GitHub, theme toggle, settings and (when signed in with `APP_PASSWORD` set) a log-out icon on the right. Log out is also in Settings → Admin session.
- **Sidebar** (`--side-w` 15rem): Dreeve-style groups separated by `<hr>`:
  Dashboard | Logbook, Projects, Sectors | Goals, Rewind | Settings.
  - Icons come from `src/lib/components/NavIcon.svelte` (Lucide-style outline, 24px grid, 1.8 stroke). Projects uses a quickdraw.
  - Count badges (orange pill) come from `navCounts` in `+layout.server.ts`: total ascents and active projects (the same "working on" rule as `/projects`). They're hidden for logged-out visitors when `AUTH_SCOPE=all`.
  - The active item gets an `--accent-soft` background with accent text and icon.
  - A version pill sits at the bottom and links to GitHub releases.
- **Mini sidebar** (desktop): the toggle collapses the sidebar to an icon rail (`--side-mini-w` 4.5rem) with hover/focus tooltips. It's stored in `localStorage.cs_sidebar = 'mini'` and applied pre-paint as `html[data-sidebar='mini']`.
- **Mobile (≤ 860px)**: the same toggle opens an off-canvas drawer with a backdrop. Esc, tapping the backdrop or navigating closes it. Mini mode doesn't apply on mobile.
- **Breadcrumb** (home icon plus page label) above content. `<title>` is `Page · Crag Stats`.
- **Dashboard hero** shows only the profile (avatar, name, climber type). Sync status and grade system live in **Settings**. Admins see a red "Last sync failed" pill on the hero only when a sync errors.
- **Dashboard layout** lives in Settings (`/settings#dashboard`, `DashboardLayoutEditor`). The dashboard only shows a small "Customize dashboard" link, and only to admins (`showSettings`). The layout actions (`saveDashboardLayout` / `resetDashboardLayout`) also return 403 for logged-out visitors.

## Components & patterns

- Cards: `.panel` (paper, 1px `--line`, `--shadow`) with a radius of about 0.9–1rem. Card titles are `h2` at about 1.1rem, weight 650.
- Primary button: accent background, `--on-accent` text, 700 weight, `--accent-strong` on hover. Secondary button: paper background with a `--line` border. Links that act as actions (for example the CSV backup download) use `.btn` / `.btn.secondary` with an icon, not a plain text link.
- Tables: a `--surface-2` header row, with header text in small uppercase `--ink-muted` (0.72rem, letter-spacing 0.05em). Rows highlight on hover with `--surface-2`.
- Pills and filters: the active state is solid accent with white text.
- Highlight metric (for example, onsights): `--accent-soft` background with the number in accent.
- Focus: a 2px accent `:focus-visible` outline globally.

## Settings-driven site preferences

Stored in the `app_settings` key/value table (migration `0008`) through `src/lib/server/appSettings.ts`:

- `grade_system`: the site-wide display grade system, used for every visitor. Settings value, or Ewbank when unset. `?system=` on `/` is a one-off override for a shared link. The old per-browser `cs_grade_system` cookie is no longer read.
- `search_indexing`: **Show in search engines** (default on). When off, `/robots.txt` disallows everything and every response carries `X-Robots-Tag: noindex, nofollow` plus a `<meta name="robots">` tag. It's forced off when `APP_PASSWORD` is set with `AUTH_SCOPE=all`. `/settings`, `/login`, `/logout` and `/api/` are always noindex. The pure rules live in `src/lib/server/seo.ts` (unit-tested). `robots.txt` is a dynamic route (`src/routes/robots.txt/+server.ts`) and is public even behind the password gate.

## README screenshots

The README showcase images live in `docs/screenshots/`. Regenerate them when the UI changes noticeably, with `pnpm dev` running and a synced database. They use headless Chrome:

- `--blink-settings=preferredColorScheme=1` for light mode, `=0` for dark.
- Pass a normal desktop `--user-agent`: theCrag's image CDN refuses the `HeadlessChrome` UA, so avatars break without it.
- Headless Chrome won't lay out narrower than about 500px. Use `--window-size=500,1000 --force-device-scale-factor=2` for the mobile shot.
- `charts.png` is a crop (PIL) of a tall `--window-size=1440,6000` capture. Avoid sections with other people's names (the Partners card).
- Use a throwaway `--user-data-dir` so your own browser storage (theme or sidebar) doesn't leak into the shots.

```bash
chrome --headless=new --hide-scrollbars --user-data-dir=/tmp/cs-shots \
  --user-agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36" \
  --window-size=1440,1300 --virtual-time-budget=20000 --blink-settings=preferredColorScheme=1 \
  --screenshot=docs/screenshots/dashboard-light.png http://localhost:5173/
```

## GitHub social preview

`docs/social-preview.png` (1280×640) is the repo's social preview image (GitHub → Settings → General → Social preview). Its source is `docs/dev/social-preview.html`. It uses made-up numbers and loads the bundled Plus Jakarta Sans from `node_modules`, so run `pnpm install` first. Regenerate from the repo root:

```bash
chrome --headless=new --hide-scrollbars --user-data-dir=/tmp/cs-shots --window-size=1280,640 \
  --virtual-time-budget=5000 --allow-file-access-from-files \
  --screenshot=docs/social-preview.png "file://$PWD/docs/dev/social-preview.html"
```

Seasonality strips provide an expandable monthly values table so touch, keyboard and screen-reader users can read both series without hover.
Chart values must be readable without hover: the Eddington timeline exposes point titles and an expandable values table. Metric toggle buttons expose aria-pressed.

The First ascents community list retains FA versus FFA credit, shows missing counts separately from known zero estimates, and displays count-specific freshness in the configured locale.

Setter-only First ascents cards omit the empty style chart and Latest section; keep setter and community totals visible. Validate this state with axe in light and dark themes.

Settings mutes the notes checkbox when CSV sync prevents enabling it. An existing opt-in stays editable so the owner can turn it off; keep the password warning visible in either sync mode.

Settings explains that automatic CSV sync removes missing entries with drop guards; distinguish it from manual CSV upload, which never prunes.

First Moves is dated automatically on the first successful non-empty import; Settings no longer has a First Moves date panel.
