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

### Adding a locale

A locale is _supported_ once its catalogue exists, and _enabled_ once it is translated well enough to ship. Only `en` and `de` are enabled today; `fr`, `es`, and `it` keep their catalogues, stay validated by `i18n.test.ts`, and stay out of the header menu, the Settings picker, and locale resolution until they are switched on.

1. Finish the target in Crowdin first — `crowdin-pretranslate.yml` translates one language per scheduled run, so add the next id to its `CROWDIN_LANGUAGES` line and let the daily top-up work through the catalogue. Seeded but unshipped: `ko`, `pl`, `zh-CN`, `pt-PT` (already translated), and `ja` (already translated).
2. Add the language id to `ENABLED_LOCALES` in `src/lib/i18n/types.ts`. If the catalogue is new, add it to `SUPPORTED_LOCALES`, `LOCALE_METADATA`, and the `LOCALES` map in `format.ts` too.
3. Nothing else needs touching: the header menu, the Settings picker, `?locale=`, the `cs_locale` cookie, and `Accept-Language` all read `ENABLED_LOCALES`.
4. Run `pnpm test` and `pnpm test:e2e` — `i18n.test.ts` asserts the enabled subset, and `e2e/shell.spec.ts` asserts the menu lists exactly the enabled locales and that a disabled one stays unreachable.

**Regional variants collide.** `crowdin.yml` writes `%two_letters_code%.json`, so adding `pt-BR` beside `pt-PT` would have both targets overwrite `pt.json`. Before the first such pair, switch the `translation:` pattern to `%locale%.json` and rename the committed catalogues (`es.json` → `es-ES.json`, and so on), updating the imports in `src/lib/i18n/format.ts`.

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
  crowdin_topup.mjs                     # AI pre-translate quota manager & Gemini model rotator
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

Extracted:

- **Every `.svelte` surface (#492):** the shell (navigation, footer, theme and language controls), difficulty-band names, style badges, tick icons, the doc table blocks, all dashboard cards (titles, hints, legends, empty states, buttons, accessible labels), and every page (dashboard, logbook and its facets, goals, projects and project detail, seasonality, weather, settings and the weather-location picker, share, map and sectors, activity, badges, eddington, milestones, rewind, training load, partners, offline, login, docs). Facet labels that double as URL values keep the provider value in the URL and map it to a key for display, so `?style=Sport` still filters correctly in every language.
- **Every server builder and `.ts` label table (#495):** copy generated in server modules (`climberBlurb.ts` climbing story paragraphs, `eddington.ts` and `eddingtonDisplay.ts` tile captions and milestones, `badges.ts` + `communityBadges.ts` + `routeSetters.ts` catalogue titles, hints, and earned details, `goals.ts` + `goalsShared.ts` + `suggestedGoals.ts` progress and readiness labels, `projectProgress.ts` + `projectDetails.ts` readiness horizons, `dashboardExtras.ts` milestones, `rockTypes.ts` profiles and blurbs, and `share/+page.server.ts` embed card titles/alts) and label tables in plain `.ts` modules (`dashboardLayout.ts` card names, `units.ts` presets and unit labels, `dates.ts` date formats, `grades/format.ts` system names, `weekdayStats.ts` weekday names, `partnerStats.ts` metric nouns, `weatherStats.ts` + `weatherPerformance.ts` band labels, and `routeRepeats.ts` persona labels). Builders receive the resolved `locals.locale` (defaulting to `DEFAULT_LOCALE` for unit tests), and exported `.ts` constant tables derive their default English labels directly from `en.json` via `formatMessage`.

Run `node scripts/i18n-audit.mjs` for the current list; `node scripts/i18n-audit.mjs --verbose` prints sample strings per file. The script reports both `.svelte` markup (only symbols, the `Crag Stats` brand lockup, and provider values remain) and the 25 module-level builder/label files (`0` hard-coded module copy strings). Keep both counts there: a new prose hit means copy slipped back into markup or a `.ts` builder. Two rules that keep the audit honest — `<style>`/`<script>` detection must match a real element (a component such as `<StyleBadge>` is not a style block), and month names come from `monthLabels(t)` rather than `Intl` or a local array. Sentences with inline links, code, or emphasis go through `RichText.svelte`; because the anchor or `<strong>` then belongs to that child component, the parent's scoped CSS needs `:global(a)`/`:global(strong)` or the link loses its styling. Native review of the seeded catalogues is [#493](https://github.com/Luen/crag-stats/issues/493).

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

### 2. `crowdin-pretranslate.yml` & `scripts/crowdin_topup.mjs` (Daily Scheduled AI Top-up)

- Runs daily at 08:15 UTC (after midnight Pacific, catching fresh Google AI Studio free quotas).
- Calls Crowdin's API to run AI pre-translation passes against untranslated strings using Google Gemini.
- **One language per run:** the workflow pre-translates a single target (`CROWDIN_LANGUAGES`, currently `de`) because a day's rotation covers about one catalogue. Translating every target at once splits the allowance and leaves each language half-done, so the next language is added to that line and to `ENABLED_LOCALES` only after the previous one ships.
- **Model Rotation:** Google AI Studio free quotas are metered per model. When a model's minute or daily quota is reached, `scripts/crowdin_topup.mjs` automatically rotates to the next model in the hierarchy (`gemini-4-hydrogen` → `gemini-3.8-flash` → `gemini-3.6-flash` → `gemini-3.5-flash` → `gemini-3-flash-preview`). Every entry is a full Flash model: the Flash Lite tier has ~25× the daily allowance but drifts on ICU plurals, `{placeholders}`, and glossary terms, and a translation that needs re-review costs more than another day of quota. The list lives in `DEFAULT_MODELS`; confirm an id against `GET /users/{userId}/ai/providers/{providerId}/models` before adding it, because Crowdin rejects retired ids. Delete retired ids rather than keeping them as a fallback — a dead id costs one failed pass plus a 65 s retry before the rotation moves on. Crowdin's model list can outlive Google's: a model Crowdin still lists may already be retired upstream.
- **Testable decisions:** The quota state machine lives in `scripts/crowdinTopup.mjs` (no network, no `process.env`) and is covered by `src/lib/server/crowdinTopup.test.ts`, the same pattern as `scripts/serverOrigin.mjs`. Adding a branch to the rotation logic means adding a test there; the CLI in `crowdin_topup.mjs` only wires those decisions to the API.
- **Budget:** `CROWDIN_TOPUP_BUDGET` caps the wall clock (default 3000 s) so the run always leaves room for the download and PR steps. `CROWDIN_LANGUAGES` / `CROWDIN_MODELS` override the project targets / rotation for a one-off manual run.
- **Idempotency:** Only untranslated strings are submitted (`scope: untranslated`); human reviews and existing translations are never overwritten.
- When new translations are added, it pulls them and opens or updates the pull request on `chore/crowdin-translations`.

### Editing translations and glossary terms over the API

Both syncs run with `skip_untranslated_strings: true`, so a target value that exists only in the repo is not durable: the next download rebuilds the file from the Crowdin strings and drops the key. Before merging a branch that adds or corrects target-language copy, write it to Crowdin first (or expect the sync PR to revert it).

- **One translation:** `POST /projects/{id}/translations` with `{ stringId, languageId, text }` returns `201` and _replaces_ that string's translation for the language, which is also how a reviewer corrects shipped copy. `PATCH /projects/{id}/translations` only accepts JSON Patch operations, and there is no `PUT .../translations/{translationId}` edit path.
- **Glossary terms:** `PATCH /glossaries/{id}/terms/{termId}` rejects field updates (`jsonPatchInvalid`), so a correction is `DELETE` on the term followed by `POST /glossaries/{id}/terms` with `{ conceptId, languageId, text }`. A `POST` without `conceptId` opens a new concept; the response returns the `conceptId` for the remaining languages.

---

## Adding New UI Strings

Follow these steps when writing new UI features:

1. **Add strings to `src/lib/i18n/locales/en.json`:**
   Group strings logically by domain (`common`, `nav`, `theme`, `language`, `grades`, `styles`, `ticks`, `footer`, `cards` (per dashboard component), and `pages` (per route)):

   ```json
   {
   	"pages": {
   		"logbook": {
   			"filterTitle": "Filter logbook",
   			"ascentsCount": "{count, plural, one {# ascent} other {# ascents}}"
   		}
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

   <h2>{i18n.t('pages.logbook.filterTitle')}</h2>
   <p>{i18n.t('pages.logbook.ascentsCount', { count })}</p>
   ```

   Keep the whole context object rather than destructuring `t`: `locale` is a getter over reactive state, and keeping one reference makes it obvious where copy comes from.

3. **Fallback guarantee:**
   If a string key is missing in a target language, it automatically falls back to the English source string. If missing from English, it safely renders the key name itself (e.g. `pages.logbook.filterTitle`) to prevent crashes while remaining easy to spot during testing.

4. **Run the coverage test:**
   `src/lib/i18n/i18n.test.ts` scans `src/**/*.{svelte,ts}` for dotted string literals whose first segment is a catalogue section, and fails when one is missing from `en.json`. Add the key to `en.json` first; Crowdin fills the translations later.

   Catalogue parity is one-way on purpose: a target catalogue may **omit** keys that English defines (it falls back until Crowdin syncs), but it must never **add** keys English does not define, because a renamed key would otherwise linger and never render. Do not hand-write target values to make a test pass — a fake translation is worse than the English fallback, and the next Crowdin pull overwrites it.

5. **Inline markup inside a sentence:**
   Keep one whole sentence in one key so a translator can move its parts. `RichText.svelte` renders two kinds of inline content without `{@html}`, so catalogue text can never inject markup:

   - `**bold**`, `*italic*`, and `` `code` `` wrap words that need translating in place, for example `CSV import upserts rows but does **not** remove missing entries.`
   - `{name}` tokens mark content that must not be translated, supplied by the call site: environment variables, file names, and links whose label and target come from elsewhere.

   ```svelte
   <RichText
   	message={i18n.t('pages.settings.hintNoApiKey')}
   	tokens={{
   		key: { kind: 'code', text: 'THECRAG_API_KEY' },
   		env: { kind: 'code', text: '.env' }
   	}}
   />
   ```

   Tokens may sit inside emphasis (`**No {appPassword} is set.**`), because markup is parsed first and tokens are substituted into the resulting text. An unknown `{name}` stays literal rather than disappearing, and an unmatched marker stays as text, so a damaged translation is visible but never breaks the layout. `src/lib/richText.test.ts` covers the parser, and `src/lib/i18n/i18n.test.ts` fails if an English sentence leaves an unbalanced `**` or backtick.

   Paths, environment-variable names, and property names must be tokens (not backticked literals), so Crowdin's placeholder protection keeps them intact. Brand names and ordinary words belong in the sentence.

---

## Translation Style Guide

[`i18n-style-guide.md`](i18n-style-guide.md) codifies tone, register (German _du_, French _vous_, Spanish _tú_, and Italian _tu_), brand name rules (`theCrag`), climbing grade honesty, and typographic conventions. It is uploaded to Crowdin as the project's official style guide, which Crowdin also uses to derive its AI translation prompt instructions. The repository copy is the source of truth; when editing it, re-upload to Crowdin (`POST /storages` with the file, then `PATCH /style-guides/{id}` pointing to the new storage ID).

---

## Glossary & Terminology

[`i18n-glossary.csv`](i18n-glossary.csv) holds the version-controlled domain terminology (54 entries across English, German, French, Spanish, and Italian) and is the source copy for the project glossary in Crowdin. It covers climbing disciplines (_Sport_, _Trad_, _Boulder_, _Top rope_), tick types (_Onsight_, _Flash_, _Rotpunkt_, _Clean_), analytics metrics (_CPR_, _Eddington number_, _training load_, _rewind_), and crag concepts (_pitch_, _multipitch_, _crag_, _send_, _first ascent_).

Keep the file and the Crowdin glossary in sync when adding new terms of art (`POST /glossaries/{glossaryId}/terms`).

---

## File Context

The source catalog, `src/lib/i18n/locales/en.json`, carries a file description in Crowdin (`PATCH /projects/{id}/files/{fileId}`, path `/context`) that explains the product purpose, target audience, mobile screen constraints, and screen mapping per key prefix (`common.*`, `nav.*`, `theme.*`, `language.*`, `grades.*`, `styles.*`, `ticks.*`, `footer.*`, `cards.*` (per dashboard component), and `pages.*` (per route)). Update it whenever a new top-level domain prefix is introduced. Every key in `en.json` must be referenced by the application: the catalogue has no reserved or placeholder strings, and unused keys are removed rather than translated.

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
