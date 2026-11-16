# Internationalisation (i18n) & Crowdin Integration

Crag Stats supports multiple languages so climbers worldwide can analyse their climbing data in their native language. Community translations are managed on [Crowdin](https://crowdin.com/), synchronised via automated GitHub Actions, and bundled directly into the application and Docker image with zero runtime dependencies.

For detailed API automation, Gemini AI configuration, quota rotation, and QA check baselines, see [`CROWDIN_SETUP_AND_QA.md`](CROWDIN_SETUP_AND_QA.md).

---

## Initial Priority Languages

Climbing is a global sport, but initial localisation focuses on communities with high theCrag adoption and vibrant climbing cultures:

| Code | Language | Native Name | Rationale & Climbing Hubs                                                                                      |
| ---- | -------- | ----------- | -------------------------------------------------------------------------------------------------------------- |
| `en` | English  | English     | Source catalogue (default)                                                                                     |
| `de` | German   | Deutsch     | Germany, Austria, and Switzerland (Frankenjura, Alps, Elbe Sandstone); massive theCrag user base               |
| `fr` | French   | Français    | Birthplace of modern sport climbing (Fontainebleau, Verdon, Céüse, Buoux); origin of the French grading system |
| `es` | Spanish  | Español     | World-class sport climbing destinations (Siurana, Margalef, Chulilla, Rodellar); Spain and Latin America       |
| `it` | Italian  | Italiano    | Iconic European climbing hubs (Arco, Dolomites, Sardinia, Finale Ligure, Val di Mello)                         |

**Next wave target languages configured in Crowdin:**

- Korean (`ko`): High gym density and growing outdoor crags (Seoraksan, Bukhansan, and Insubong).
- Portuguese (`pt-PT` / `pt-BR`): Portugal (Sintra, Cascais, and Arrábida) and Brazil (Rio de Janeiro and Serra do Cipó).
- Simplified Chinese (`zh-CN`): Vibrant climbing communities across Yangshuo, Getu, and Liming.
- Japanese (`ja`): Historic climbing hubs and world-class bouldering (Mizugaki, Ogawayama, and Mitake).
- Polish (`pl`): Rich climbing and alpine heritage (Jura Krakowsko-Częstochowska, High Tatras, and Sokoliki).

---

## Core Principles & Climbing Terminology

1. **Grade Honesty (Critical):**
   - Numerical and letter climbing grades are universal identifiers and **must never be translated or converted** (e.g., `21`, `6b+`, `5.10a`, `V5`, and `7A`).
   - Difficulty band names (_Beginner_, _Intermediate_, _Experienced_, _Expert_, and _Elite_) **are translated**.
   - Gear and route styles (_Sport_, _Trad_, _Boulder_, _Top rope_, and _Alpine_) **are translated**.
   - Tick types (_Onsight_, _Flash_, _Red point_, _Pink point_, and _Clean_) use authentic local climbing vocabulary:
     - German: _Rotpunkt_, _Flash_, _Onsight_, _Begehung_, _Tourenbuch_
     - French: _À vue_, _Flash_, _Après travail_, _Moulinette_, _Carnet de croix_
     - Spanish: _A vista_, _Flash_, _Punto rojo_, _Libro de vías_, _Bloque_
     - Italian: _A vista_, _Flash_, _Rotpunkt_, _Chiusura_, _Pulito_
     - Japanese: オンサイト (_onsight_), フラッシュ (_flash_), レッドポイント (_redpoint_), 完登 (_send/clean_), 岩場 (_crag_)
     - Polish: _A vista_ / _Onsight_, _Flash_, _RP (Czysto)_, _Skały / Rejon_, _Na wędkę_

2. **Zero Runtime Dependency & Complete Offline Capability:**
   - All locale dictionaries ship inside the repository and container image (`src/lib/i18n/locales/`).
   - Self-hosted instances run completely offline without contacting Crowdin, external CDNs, or third-party APIs.

3. **No Mixed Grade Pyramids:**
   - Grade pyramids never mix grade systems or localised strings into grade scores.

4. **Oxford Comma:**
   - Every list of three or more items in English UI copy, documentation, and comments must use the Oxford comma: "Sport, Trad, Boulder, or Alpine".

---

## File Structure

```
crowdin.yml                              # Crowdin project configuration
.github/workflows/
  crowdin-sync.yml                       # Bidirectional Crowdin sync on push to main
  crowdin-pretranslate.yml               # Automated Gemini AI pre-translation top-up
  SETUP.md                               # Secrets, token scopes, and workflow setup guide
scripts/
  crowdin_topup.py                       # AI pre-translate quota manager & Gemini model rotator
src/lib/i18n/
  locales/
    en.json                              # Source catalogue of truth (English)
    de.json                              # German catalogue
    fr.json                              # French catalogue
    es.json                              # Spanish catalogue
    it.json                              # Italian catalogue
  types.ts                               # SupportedLocale, metadata, and locale resolution
  format.ts                              # ICU plural parser and string interpolator
  context.svelte.ts                      # Svelte 5 reactive context (initI18n and useI18n)
  index.ts                               # Public module exports
```

---

## Architecture: Svelte 5 Native Context

Internationalisation in Crag Stats leverages native Svelte 5 runes (`$state`) combined with Svelte's context API (`setContext` and `getContext`):

1. **Context initialisation:**
   In the root layout (`src/routes/+layout.svelte`), `initI18n(() => data.locale)` initialises the reactive state from a getter, so it follows fresh loader data after a navigation.
2. **Reactivity:**
   When the user cycles the language in the top navigation bar, `refreshLocale()` calls `i18n.setLocale(next)`, which updates the `$state` variable and `document.documentElement.lang`. It then runs `invalidateAll()` so server-rendered copy (titles, story, docs) reloads in the same language; client-rendered copy updates immediately either way.
3. **Cookie & setting persistence:**
   Switching the language sets the `cs_locale` cookie with a 1-year max age. The Settings page saves the stored default in `app_settings.locale` instead, so one visitor's choice never overrides the owner's site-wide preference.
4. **HTML `lang` attribute:**
   The server render transforms `%lang%` in `app.html` from the resolved request locale (`hooks.server.ts`) for search engines and screen readers, and the layout keeps `document.documentElement.lang` in sync on the client.
5. **Dates and numbers:**
   `Intl` output follows the active UI locale through `intlLocale()` (`en` maps to `en-AU` so English output keeps the app's Australian conventions) unless the owner sets `DISPLAY_LOCALE`.

### Current coverage

Extracted: the shell (navigation, footer, theme and language controls), difficulty-band names, style badges, tick icons, the doc table blocks, and the dashboard card chrome — component titles, hints, legends, empty states, buttons, and accessible labels across `src/lib/components/`. Page chrome for the dashboard, logbook filters, goals, projects, seasonality, weather, settings, share, map, activity, badges, offline, login, and the weather-location picker also reads from the catalogue.

Still hard-coded English: long prose inside cards (for example the Yearly stats and Weather performance bodies), most of the Settings form copy (labels and descriptions around inputs), project detail tables, and copy generated in server modules (climbing story paragraphs, Eddington tile captions, badge names and details, goal progress labels, project readiness horizons, and the milestones list). Those server builders have no locale, so translating them needs the resolved locale passed into the builder rather than a component change.

Run `node scripts/i18n-audit.mjs` for the current list; `node scripts/i18n-audit.mjs --verbose` prints sample strings per file. The count is a heuristic (text nodes and literal `aria-label`/`title`/`placeholder`/`alt` values), so treat it as a worklist, not a target of zero. Extracting the rest is tracked in [#492](https://github.com/Luen/crag-stats/issues/492); convert one surface at a time rather than machine-translating whole pages. Native review of the seeded catalogues is [#493](https://github.com/Luen/crag-stats/issues/493).

---

## Locale Resolution Order

On request, `hooks.server.ts` resolves the active locale once into `event.locals.locale` through the following hierarchy:

1. **URL parameter:** `?locale=de` (explicit link override; the layout remembers it in the `cs_locale` cookie).
2. **Cookie:** `cs_locale` (visitor selection in browser via globe icon).
3. **Database setting:** `app_settings.locale` (configured by the admin in Settings when set to an explicit language).
4. **Browser header:** `Accept-Language` (autodetects visitor's browser language when the site is in Auto mode or unset).
5. **Environment variable:** `DISPLAY_LOCALE` (fallback if browser language is unsupported).
6. **Fallback default:** `en` (English).

---

## The Crowdin Round Trip

```
src/lib/i18n/locales/en.json  ──push to main──▶  Crowdin  ──translators / AI──▶  PR back to main
```

### 1. `crowdin-sync.yml` (On Push & Manual)

- Triggers whenever `src/lib/i18n/locales/en.json`, `crowdin.yml`, or `.github/workflows/crowdin-sync.yml` changes on `main`.
- **Bot loop prevention:** Path filtering ensures the workflow runs only when the source catalogue changes. Because Crowdin pull requests only modify target files (`de.json`, `fr.json`, etc.), merging a translation PR never triggers `crowdin-sync.yml` again.
- Uploads the source file and pulls completed translations into branch `chore/crowdin-translations`, opening or updating a single consolidated PR.

### 2. `crowdin-pretranslate.yml` & `scripts/crowdin_topup.py` (Daily Scheduled AI Top-up)

- Runs daily at 08:15 UTC (after midnight Pacific, catching fresh Google AI Studio free quotas).
- Calls Crowdin's API to run AI pre-translation passes against untranslated strings using Google Gemini.
- **Model Rotation:** Google AI Studio free quotas are metered per model. When a model's minute or daily quota is reached, `scripts/crowdin_topup.py` automatically rotates to the next model in the hierarchy (`gemini-3.8-flash` → `gemini-3.6-flash` → `gemini-2.5-flash` → `gemini-3.5-flash-lite` → `gemini-2.5-flash-lite`).
- **Idempotency:** Only untranslated strings are submitted (`scope: untranslated`); human reviews and existing translations are never overwritten.
- When new translations are added, it pulls them and opens or updates the pull request on `chore/crowdin-translations`.

---

## Adding New UI Strings

Follow these steps when writing new UI features:

1. **Add strings to `src/lib/i18n/locales/en.json`:**
   Group strings logically by domain (`common`, `nav`, `dashboard`, `logbook`, `projects`, `settings`, etc.):

   ```json
   {
   	"logbook": {
   		"filterTitle": "Filter logbook",
   		"ascentsCount": "{count, plural, one {# ascent} other {# ascents}}"
   	}
   }
   ```

2. **Use in Svelte 5 components:**

   ```svelte
   <script lang="ts">
   	import { useI18n } from '#lib/i18n';

   	const i18n = useI18n();
   	let count = $state(5);
   </script>

   <h2>{i18n.t('logbook.filterTitle')}</h2><p>{i18n.t('logbook.ascentsCount', { count })}</p>
   ```

   Keep the whole context object rather than destructuring `t`: `locale` is a getter over reactive state, and keeping one reference makes it obvious where copy comes from.

3. **Fallback guarantee:**
   If a string key is missing in a target language, it automatically falls back to the English source string. If missing from English, it safely renders the key name itself (e.g. `logbook.filterTitle`) to prevent crashes while remaining easy to spot during testing.

4. **Run the coverage test:**
   `src/lib/i18n/i18n.test.ts` scans `src/**/*.{svelte,ts}` for dotted string literals whose first segment is a catalogue section, and fails when one is missing from `en.json`. Add the key to `en.json` first; Crowdin fills the translations later.

   Catalogue parity is one-way on purpose: a target catalogue may **omit** keys that English defines (it falls back until Crowdin syncs), but it must never **add** keys English does not define, because a renamed key would otherwise linger and never render. Do not hand-write target values to make a test pass — a fake translation is worse than the English fallback, and the next Crowdin pull overwrites it.

---

## Translation Style Guide

[`i18n-style-guide.md`](i18n-style-guide.md) codifies tone, register (German _du_, French _vous_, Spanish _tú_, and Italian _tu_), brand name rules (`theCrag`), climbing grade honesty, and typographic conventions. It is uploaded to Crowdin as the project's official style guide, which Crowdin also uses to derive its AI translation prompt instructions. The repository copy is the source of truth; when editing it, re-upload to Crowdin (`POST /storages` with the file, then `PATCH /style-guides/{id}` pointing to the new storage ID).

---

## Glossary & Terminology

[`i18n-glossary.csv`](i18n-glossary.csv) holds the version-controlled domain terminology (54 entries across English, German, French, Spanish, and Italian) and is the source copy for the project glossary in Crowdin. It covers climbing disciplines (_Sport_, _Trad_, _Boulder_, _Top rope_), tick types (_Onsight_, _Flash_, _Rotpunkt_, _Clean_), analytics metrics (_CPR_, _Eddington number_, _training load_, _rewind_), and crag concepts (_pitch_, _multipitch_, _crag_, _send_, _first ascent_).

Keep the file and the Crowdin glossary in sync when adding new terms of art (`POST /glossaries/{glossaryId}/terms`).

---

## File Context

The source catalog, `src/lib/i18n/locales/en.json`, carries a file description in Crowdin (`PATCH /projects/{id}/files/{fileId}`, path `/context`) that explains the product purpose, target audience, mobile screen constraints, and screen mapping per key prefix (`common.*`, `nav.*`, `theme.*`, `language.*`, `dashboard.*`, `cards.*` (per dashboard component), `pages.*` (per route), `logbook.*`, `projects.*`, `settings.*`, `badges.*`, `styles.*`, `ticks.*`, `grades.*`, `footer.*`, and `crowdin.*`). Update it whenever a new top-level domain prefix is introduced.

---

## Character Limits & Length Policy

Strings in tight UI slots carry a Crowdin **maximum length**: navigation rails, action buttons, filter chips, difficulty badges, and table column headers (`Date`, `Route`, `Grade`, `Style`, `Tick`, `Crag`, `Partner`, `Weather`). Sentence copy in help text, doc pages, and modals remains unlimited.

The rule for tight slots is:

$$\text{limit} = \max(\text{len} + 10,\, 2 \times \text{len})$$

Where an existing translation was already longer, the limit is set to accommodate it with headroom. Because **size is an enforced QA check in Crowdin**, generous limits ensure translations do not overflow compact mobile layouts (≤860px) while preventing false-positive blocking for translators.

Limits live on the Crowdin string asset, not in `en.json`, so GitHub Actions sync never sets them. When adding a new key in a tight slot, set its limit over the API (`PATCH /projects/{id}/strings/{stringId}`, path `/{stringId}/maxLength`).

---

## Ellipses Normalisation

Always use the single-character typographical ellipsis glyph **`…`** (`U+2026`), never three individual full stops `...`. All catalogs (`en.json`, `de.json`, `fr.json`, `es.json`, and `it.json`) adhere strictly to this rule. Using three dots in source strings causes Crowdin QA punctuation warnings when translators correctly use the single ellipsis character.

---

## QA Checks Baseline

Crowdin's QA panel is a **dynamic background linter**, not a task backlog. It recomputes live against current translations on every load and has no manual "mark as resolved" button. Issues clear only when the translation changes, the word is added to the project glossary/dictionary, or the check category is adjusted.

- **Spellcheck in specialized domains:** Generic spellchecking engines flag valid compound words and technical climbing terms (e.g. German _Tourenbuch_, _Begehungsnotizen_, _Trad-Routen_, _Boulderprobleme_, _Toprope_, and _Eddington-Zahl_). Generic dictionary spellchecking is disabled in project QA categories to avoid false-positive alert noise, while the glossary guides translators.
- **Enforced structural checks:** Structural safety checks remain active: empty translations, max length limits, mismatched tags, missing spaces, ICU plural formatting, and variable placeholders (`{count}`, `{name}`).
- **Baseline:** With authentic terminology registered in the glossary and length limits set, the project maintains a **0-issue baseline**.
