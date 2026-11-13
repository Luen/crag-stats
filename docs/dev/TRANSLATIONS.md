# Internationalisation (i18n) & Crowdin Integration

Crag Stats supports multiple languages so climbers worldwide can analyze their climbing data in their native language. Community translations are managed on [Crowdin](https://crowdin.com/), synchronized via automated GitHub Actions, and bundled directly into the application and Docker image with zero runtime dependencies.

For detailed API automation, Gemini AI configuration, quota rotation, and QA check baselines, see [`CROWDIN_SETUP_AND_QA.md`](CROWDIN_SETUP_AND_QA.md).

---

## Initial Priority Languages

Climbing is a global sport, but initial localization focuses on communities with high theCrag adoption and vibrant climbing cultures:

| Code | Language | Native Name | Rationale & Climbing Hubs                                                                                      |
| ---- | -------- | ----------- | -------------------------------------------------------------------------------------------------------------- |
| `en` | English  | English     | Source catalogue (default)                                                                                     |
| `de` | German   | Deutsch     | Germany, Austria, and Switzerland (Frankenjura, Alps, Elbe Sandstone); massive theCrag user base               |
| `fr` | French   | Français    | Birthplace of modern sport climbing (Fontainebleau, Verdon, Céüse, Buoux); origin of the French grading system |
| `es` | Spanish  | Español     | World-class sport climbing destinations (Siurana, Margalef, Chulilla, Rodellar); Spain and Latin America       |
| `it` | Italian  | Italiano    | Iconic European climbing hubs (Arco, Dolomites, Sardinia, Finale Ligure, Val di Mello)                         |

**theCrag aligned target languages:** Korean (`ko`), Portuguese (`pt` / `pt-BR`), and Simplified Chinese (`zh-CN` / `zh-Hans`). (Additional community candidates: Japanese `ja`, and Polish `pl`).

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
     - Italian: _A vista_, _Flash_, _Rotpunkt_, _Chiusura_, _Falesia_

2. **Zero Runtime Dependency & Complete Offline Capability:**
   - All locale dictionaries ship inside the repository and container image (`src/lib/i18n/locales/`).
   - Self-hosted instances run completely offline without contacting Crowdin, external CDNs, or third-party APIs.

3. **No Mixed Grade Pyramids:**
   - Grade pyramids never mix grade systems or localized strings into grade scores.

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
  types.ts                               # SupportedLocale, metadata, and locale normalization
  format.ts                              # ICU plural parser and string interpolator
  context.svelte.ts                      # Svelte 5 reactive context (initI18n, useI18n, and t)
  index.ts                               # Public module exports
```

---

## Architecture: Svelte 5 Native Context

Internationalisation in Crag Stats leverages native Svelte 5 runes (`$state` and `$derived`) combined with Svelte's context API (`setContext` and `getContext`):

1. **Context Initialization:**
   In the root layout (`src/routes/+layout.svelte`), `initI18n(data.locale)` initializes the reactive state.
2. **Reactivity:**
   When the user toggles their language in the top navigation bar or settings, `i18n.setLocale(newLocale)` updates the `$state` variable. All `$derived` translations across the page update instantaneously without requiring a page reload.
3. **Cookie & Setting Persistence:**
   Switching the language sets the `cs_locale` cookie with a 1-year max age and updates `app_settings.locale` when modified in Settings.
4. **HTML Lang Attribute:**
   An `$effect` keeps `document.documentElement.lang` in sync with the current active locale, while `hooks.server.ts` transforms `%lang%` in `app.html` on the initial server render for search engines and screen readers.

---

## Locale Resolution Order

On request, the active locale is resolved through the following hierarchy:

1. **URL parameter:** `?locale=de` (one-off preview / explicit link override).
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

   	const { t } = useI18n();
   	let count = $state(5);
   </script>

   <h2>{t('logbook.filterTitle')}</h2><p>{t('logbook.ascentsCount', { count })}</p>
   ```

3. **Fallback guarantee:**
   If a string key is missing in a target language, it automatically falls back to the English source string. If missing from English, it safely renders the key name itself (e.g. `logbook.filterTitle`) to prevent crashes while remaining easy to spot during testing.

---

## Translation Style Guide

[`i18n-style-guide.md`](i18n-style-guide.md) codifies tone, register (German *du*, French *vous*, Spanish *tú*, and Italian *tu*), brand name rules (`theCrag`), climbing grade honesty, and typographic conventions. It is uploaded to Crowdin as the project's official style guide, which Crowdin also uses to derive its AI translation prompt instructions. The repository copy is the source of truth; when editing it, re-upload to Crowdin (`POST /storages` with the file, then `PATCH /style-guides/{id}` pointing to the new storage ID).

---

## Glossary & Terminology

[`i18n-glossary.csv`](i18n-glossary.csv) holds the version-controlled domain terminology (54 entries across English, German, French, Spanish, and Italian) and is the source copy for the project glossary in Crowdin. It covers climbing disciplines (*Sport*, *Trad*, *Boulder*, *Top rope*), tick types (*Onsight*, *Flash*, *Rotpunkt*, *Clean*), analytics metrics (*CPR*, *Eddington number*, *training load*, *rewind*), and crag concepts (*pitch*, *multipitch*, *crag*, *send*, *first ascent*).

Keep the file and the Crowdin glossary in sync when adding new terms of art (`POST /glossaries/{glossaryId}/terms`).

---

## File Context

The source catalog, `src/lib/i18n/locales/en.json`, carries a file description in Crowdin (`PATCH /projects/{id}/files/{fileId}`, path `/context`) that explains the product purpose, target audience, mobile screen constraints, and screen mapping per key prefix (`common.*`, `nav.*`, `dashboard.*`, `logbook.*`, `settings.*`, `disciplines.*`, `ticks.*`, `grades.*`, `weather.*`). Update it whenever a new top-level domain prefix is introduced.

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

- **Spellcheck in specialized domains:** Generic spellchecking engines flag valid compound words and technical climbing terms (e.g. German *Tourenbuch*, *Begehungsnotizen*, *Trad-Routen*, *Boulderprobleme*, *Toprope*, and *Eddington-Zahl*). Generic dictionary spellchecking is disabled in project QA categories to avoid false-positive alert noise, while the glossary guides translators.
- **Enforced structural checks:** Structural safety checks remain active: empty translations, max length limits, mismatched tags, missing spaces, ICU plural formatting, and variable placeholders (`{count}`, `{name}`).
- **Baseline:** With authentic terminology registered in the glossary and length limits set, the project maintains a **0-issue baseline**.
