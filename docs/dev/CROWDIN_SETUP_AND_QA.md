# Crowdin Setup, API Automation, and QA Baseline

> **Living guide for AI agents and human maintainers.** Consult this document before modifying Crowdin configurations, AI pre-translation pipelines, glossaries, character limits, or QA settings.

This document details the architecture, API quirks, quota rotation strategies, and quality assurance baselines powering internationalization (i18n) for Crag Stats via [Crowdin](https://crowdin.com/).

---

## 1. High-Level Architecture

```
GitHub Repository (main)
  │
  ├── src/lib/i18n/locales/en.json   ──(Push on commit)──>   Crowdin Project 946179
  │                                                                 │
  │                                                           (AI / Community)
  │                                                                 │
  └── src/lib/i18n/locales/<lang>.json <──(Daily PR sync)──   Target Translations
```

- **Source of truth:** `src/lib/i18n/locales/en.json` is the sole source catalog.
- **Runtime engine:** Lightweight, reactive Svelte 5 context (`#lib/i18n`) with full ICU pluralization support (`{count, plural, one {# ascent} other {# ascents}}`). Zero runtime third-party npm dependencies.
- **Automated Workflows:**
  - `.github/workflows/crowdin-sync.yml`: Path-filtered to `en.json` to avoid bot loops. Pushes source changes on `main` and opens a PR back with community translations.
  - `.github/workflows/crowdin-pretranslate.yml`: Daily automated top-up with Google Gemini AI (`scripts/crowdin_topup.py`).

---

## 2. Crowdin API & Gemini AI Configuration

### Access Token & Scopes
The personal access token stored in GitHub Secret `CROWDIN_PERSONAL_TOKEN` requires the following scopes:
- **Projects** (read & write)
- **Source files & translations** (read & write)
- **AI** (read & write — required for triggering AI pre-translation passes and rotating models via API)

### Google Gemini Provider Type (`google_gemini_ai_studio`)
> [!IMPORTANT]
> When adding a Google AI Studio API key via the Crowdin API (`POST /users/{userId}/ai/providers`), the provider type MUST be:
> ```json
> {
>   "name": "Google Gemini",
>   "type": "google_gemini_ai_studio",
>   "credentials": {
>     "apiKey": "..."
>   }
> }
> ```
> Do **not** use `type: "google_gemini"`. In Crowdin's API v2, `google_gemini` is reserved for Google Cloud Vertex AI and will fail with `Either serviceAccountKey or workloadIdentityFederationAudience must be provided`.

### Quota-Aware Model Rotation
Google AI Studio's free tier meters requests **per day per model** (Requests Per Day / RPD):
- **Flash tier (`gemini-3.8-flash`, `gemini-3.6-flash`, `gemini-2.5-flash`):** ~20 requests/day each, capped at ~5 requests/minute.
- **Flash Lite tier (`gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`, `gemini-2.5-flash-lite`):** ~500 requests/day each.

`scripts/crowdin_topup.py` leverages this by rotating through models sequentially. When a pass adds 0 strings after waiting out the 65-second rate window, it patches the prompt to the next model via `PATCH /users/{userId}/ai/prompts/{promptId}` with `[{"op": "replace", "path": "/aiModelId", "value": model}]`.

### Pre-Translation Prompt (`Crag Stats pre-translate`)
- Prompt ID: `769183`
- Action: `pre_translate`
- Mode: `advanced`
- Key requirement: Advanced mode in Crowdin requires the `%strings%` placeholder in the prompt template.
- Content: Injects authentic climbing terminology (*Rotpunkt*, *À vue*, *A vista*, and *Chiusura*) and strict rules prohibiting the translation or conversion of numerical climbing grades (`6b+`, `V5`, `21`).

---

## 3. Context Advisor & Context Coverage

Crowdin's automated project inspector (Context Advisor) checks six context areas. Maintain 100% compliance:

### 1. File-Level Context
Set on `src/lib/i18n/locales/en.json` (File ID `10`) via `PATCH /projects/946179/files/10` with path `/context`:
- Describes product audience (rock climbers and boulderers at home or at the crag).
- Maps all key prefixes to UI screens (`common.*`, `nav.*`, `dashboard.*`, `logbook.*`, `settings.*`, `disciplines.*`, `ticks.*`, `grades.*`, and `weather.*`).
- Notes mobile viewport constraints (≤860px).

### 2. Terminology & Glossary
- Repository copy: [`docs/dev/i18n-glossary.csv`](i18n-glossary.csv).
- Crowdin Glossary: **Crag Stats's Glossary** (`id: 745241`).
- Contains 54+ core concepts mapped across English, German, French, Spanish, and Italian.
- When new features introduce specialized terminology, add entries in both git and Crowdin (`POST /glossaries/{glossaryId}/terms`).

### 3. Style Guide
- Repository copy: [`docs/dev/i18n-style-guide.md`](i18n-style-guide.md).
- Crowdin Style Guide: **Crag Stats Climbing Style Guide** (`id: 3089`).
- Enforces register: German informal *du*, French formal *vous*, Spanish informal *tú*, and Italian friendly *tu*.
- Re-upload after editing: `POST /storages` with the file, then `PATCH /style-guides/3089` pointing to the new `storageId`.

### 4. Character Limits (`maxLength`)
Crowdin flags projects where fewer than 20% of short strings have character limits.
- **Rule for tight UI slots:** Buttons, table headers, stat cards, navigation items, and badge chips receive:
  $$\text{limit} = \max(\text{len} + 10,\, 2 \times \text{len})$$
- Generous limits prevent compact mobile layouts from overflowing while ensuring translators are never blocked by an overly tight limit.
- **API updates:** `maxLength` lives on the Crowdin string asset, not in `en.json`. Set over the API: `PATCH /projects/946179/strings/{stringId}` with `[{"op": "replace", "path": "/maxLength", "value": n}]`.
- Current coverage: 69 strings (44.8% of the catalog), with 0 size violations.

---

## 4. Crowdin QA Checks Baseline

### The Linter Behavior
The Crowdin QA panel is a **dynamic background linter**, not a task backlog. It computes issues live across all translations on every page load. There is no manual "mark resolved" button; an issue clears only when the translation changes or the check category is adjusted.

### Avoid Common False-Positive Traps
1. **Generic Dictionary Spellcheck:**
   - Crowdin's default Aspell/Hunspell engine lacks a climbing lexicon. It flags valid German compound climbing words (*Tourenbuch*, *Begehungsnotizen*, *Trad-Routen*, *Boulderprobleme*, *Toprope*, *Eddington-Zahl*, and *Routenbeliebtheit*).
   - In `qaCheckCategories`, `spellcheck` is set to `false`. Translators are instead guided by the Climbing Glossary.
2. **Case Sensitivity (`symbol_register`):**
   - Brand name `theCrag` intentionally begins with a lowercase `t`.
   - Source strings like `theCrag logbook sync` trigger case warnings if Romance translations begin with a capital letter (`Sincronización...`).
   - Fix: Ensure translations lead with the brand lockup: `theCrag: sincronización del libro de vías`, `theCrag : synchronisation du carnet de croix`, and `theCrag: sincronizzazione del logbook`.
3. **Rigid Terminology Checking:**
   - Rigid 1-to-1 string matching flags legitimate grammatical declensions, plurals, or compound words. In `qaCheckCategories`, `terms` is set to `false` (remains active as suggestions in the editor).

### Mandatory Enforced QA Checks
The following structural and syntax safety checks **must always remain active** (`true` in `qaCheckCategories`):
- `empty` (no empty strings)
- `size` (enforces `maxLength`)
- `tags` (HTML/XML tags match)
- `spaces` (leading/trailing spacing matches)
- `variables` (placeholder `{count}` preservation)
- `punctuation` (punctuation integrity)
- `symbolRegister` (case consistency)
- `specialSymbols` (special characters)
- `icu` (ICU plural formatting)
- `duplicate` (duplicate detection)
- `numbers` (numerical integrity)
- `unifiedPlaceholders` (placeholder consistency)

With this configuration, the project maintains a clean **0-issue QA baseline**.

---

## 5. Typographic & String Conventions

- **Ellipses:** Always use the single-character ellipsis glyph **`…`** (`U+2026`), never three full stops `...`. All catalogs maintain 100% adherence.
- **French Colons:** Place a space before colons in French (`theCrag : synchronisation`).
- **Climbing Grades (Immutable):** Climbing grade scores and letters (`21`, `6b+`, `5.10a`, `V5`, `7A`) must remain untouched in all languages.
- **English Source Style:** Title Case for labels and headings; target languages follow native capitalization rules (sentence case for French/Spanish, noun capitalization for German).
