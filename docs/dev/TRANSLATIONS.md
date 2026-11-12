# Translations & Crowdin Integration

Crag Stats supports multiple languages (i18n) so climbers can use their climbing analytics in their preferred language. Community translations are hosted on [Crowdin](https://crowdin.com/), and translations are bundled directly into the application and Docker image with zero runtime external dependencies.

---

## Initial Priority Languages

Climbing communities are globally distributed, but the initial translation priority focuses on regions with high theCrag adoption and vibrant climbing scenes:

| Code | Language | Native Name | Rationale                                                                                                       |
| ---- | -------- | ----------- | --------------------------------------------------------------------------------------------------------------- |
| `en` | English  | English     | Source language                                                                                                 |
| `de` | German   | Deutsch     | Germany, Austria, and Switzerland (Frankenjura, Alps, Elbe Sandstone); major theCrag user base                  |
| `fr` | French   | Français    | Heart of sport climbing and bouldering (Fontainebleau, Verdon, Céüse); French grading system origin             |
| `es` | Spanish  | Español     | Major sport climbing destination (Siurana, Margalef, Chulilla, Rodellar); widespread in Spain and Latin America |
| `it` | Italian  | Italiano    | Iconic European climbing hubs (Arco, Dolomites, Sardinia, Val di Mello)                                         |

**Next wave candidates:** Japanese (`ja`), Portuguese (`pt` / `pt-BR`), and Polish (`pl`).

---

## Principles & Climbing Terminology

1. **Grade honesty:**
   - Numerical and letter climbing grades are universal identifiers and **never translated** (e.g. `21`, `6b+`, `5.10a`, `V5`, `7A`).
   - Difficulty band names (_Beginner_, _Intermediate_, _Experienced_, _Expert_, and _Elite_) **are translated**.
   - Gear and route styles (_Sport_, _Trad_, _Boulder_, _Top rope_, and _Alpine_) **are translated**.
   - Tick types (_Onsight_, _Flash_, _Red point_, _Pink point_, and _Clean_) use authentic local climbing vocabulary (e.g., French _À vue_, German _Rotpunkt_, and Spanish _A vista_).
2. **Zero runtime dependency:**
   - All locale dictionaries ship inside the app repository (`src/lib/i18n/locales/`).
   - Self-hosted instances run completely offline without contacting Crowdin at runtime.
3. **Oxford comma:**
   - Every list of three or more in English copy, comments, and documentation must use the Oxford comma: "hot, freezing, wet, or windy", not "hot, freezing, wet or windy".

---

## File Structure

```
crowdin.yml                    # Crowdin CLI & GitHub App integration config
src/lib/i18n/
  locales/
    en.json                    # Source catalog (English)
    de.json                    # German translations
    fr.json                    # French translations
    es.json                    # Spanish translations
    it.json                    # Italian translations
  types.ts                     # SupportedLocale, metadata, and validation
  format.ts                    # ICU plural parser and string interpolator
  context.svelte.ts            # Svelte 5 reactive context (initI18n, useI18n, and t)
  index.ts                     # Module exports
```

---

## Crowdin Workflow

1. **Source catalog:**
   - Developers add or edit English strings in `src/lib/i18n/locales/en.json`.
   - When changes merge into `main`, the Crowdin GitHub integration imports the updated source file.
2. **Translating on Crowdin:**
   - Translators work on Crowdin via the web UI.
   - Crowdin provides translation memory, glossary terms (for climbing jargon), and verification checks.
3. **Automated pull requests:**
   - Crowdin periodically synchronizes approved translations back to GitHub by opening automated pull requests that update the target locale files (`src/lib/i18n/locales/<locale>.json`).
   - CI runs tests, linting, and typechecks before merging.

---

## Adding New Strings

When introducing new UI strings:

1. Add the key to `src/lib/i18n/locales/en.json` under the appropriate category (`common`, `nav`, `settings`, `dashboard`, `logbook`, `projects`, etc.).
2. For counts or plurals, use ICU MessageFormat syntax:
   ```json
   "ascentsCount": "{count, plural, one {# ascent} other {# ascents}}"
   ```
3. Use the translation in components:
   ```svelte
   <script lang="ts">
   	import { useI18n } from '#lib/i18n';
   	const { t } = useI18n();
   </script>

   <span>{t('nav.dashboard')}</span>
   ```
   Or using the standalone helper:
   ```ts
   import { t } from '#lib/i18n';
   const label = t('common.save');
   ```

---

## Locale Resolution Order

When a user visits Crag Stats, their active locale is determined in this order:

1. One-off query parameter: `?locale=de` (useful for previews and linking).
2. Cookie preference: `cs_locale` (set when selecting a language in the UI).
3. Instance-wide setting: `app_settings.locale` (configured in Settings).
4. `DISPLAY_LOCALE` environment variable (if set in Docker / container env).
5. Browser `Accept-Language` request header.
6. Default fallback: `en`.
