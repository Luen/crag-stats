# Crag Stats Translation Style Guide

For translators and AI translation of Crag Stats. It is uploaded to Crowdin as the project's style guide; this file is the source copy, so edit it here and re-upload (see [TRANSLATIONS.md](TRANSLATIONS.md#style-guide)).

Terminology lives in the [glossary](i18n-glossary.csv). This guide covers tone, register, formatting, and critical constraints.

---

## The Product and Its Readers

Crag Stats is a self-hosted climbing analytics platform that connects to [theCrag](https://www.thecrag.com/). It visualises personal ascents, difficulty pyramids, bouldering, training load, weather trends, and partner stats. It is not an editable logbook; theCrag is the upstream source of truth.

Two groups read it:

- **Climbers at home or at work**, reviewing past ascents, analysing pyramid distributions, and planning goals on desktop.
- **Climbers at the crag or gym**, checking ticks, route details, and training load on mobile screens, often between burns with chalky fingers.

Write so labels and metrics are clear, concise, and immediately readable at a glance.

---

## Voice

Authentic, direct, and data-driven. Use the natural vocabulary active rock climbers and boulderers use at the crag or gym. Do not sell and avoid corporate, stiff, or overly academic phrasing. The English is friendly and clean — maintain that same distance in target languages.

---

## Register

Keep the form of address consistent across every screen:

| Language                | Address                                                                   | Example                                            |
| ----------------------- | ------------------------------------------------------------------------- | -------------------------------------------------- |
| German                  | informal **du** / **dein** — never _Sie_                                  | _Wähle dein bevorzugtes Gradsystem …_              |
| French                  | formal/polite **vous** / **votre** — standard in software UI              | _Sélectionnez votre système de cotation préféré …_ |
| Spanish (Spain & LatAm) | informal **tú** — standard for outdoor/sports software                    | _Elige tu sistema de graduación preferido …_       |
| Italian                 | friendly/informal **tu** — universal in Italian climbing                  | _Scegli il tuo sistema di gradi preferito …_       |
| Japanese                | polite UI register (丁寧語) with concise noun forms for buttons           | _グレード体系を選択…_                              |
| Polish                  | direct software imperative (_Wybierz_, _Zapisz_) without stiff honorifics | _Wybierz preferowany system wycen…_                |

In climbing culture (especially German and Italian), formal address (_Sie_, _Lei_) feels entirely foreign and out of place at a climbing cliff or gym.

---

## Capitalisation & Brand Names

The English source uses Title Case for headings, navigation links, and table column headers (_Ascent Logbook_). Do not blindly copy English title case:

- Follow target language rules: sentence case in French, Spanish, and Italian; standard noun capitalisation in German.
- **Brand name `theCrag`:** Always starts with lowercase `the` and capitalized `Crag`. When starting a sentence or heading with `theCrag`, keep the lowercase `t` (e.g. _theCrag: sincronización del libro de vías_).
- **Brand name `Crag Stats`:** Always capitalized with a space.

---

## Climbing Grade Honesty (CRITICAL)

- Numerical and letter climbing grades (e.g., **21**, **6b+**, **5.10a**, **V5**, **7A**) are universal identifiers and **MUST NEVER be translated, converted, or altered**.
- Grade scale names (Ewbank, French, YDS, V-scale, Fontainebleau) remain exact identifiers.
- Difficulty bands (_Beginner_, _Intermediate_, _Experienced_, _Expert_, and _Elite_) are localised, but the grade scores themselves remain untouched.

---

## Length and Abbreviations

Many strings are compact labels in navigation rails, stat cards, pyramid charts, filter chips, and table headers on narrow phone screens (≤860px).

- Where a string has a **maximum length** in Crowdin, it is a hard limit — choose concise phrasing or a standard climbing abbreviation.
- Accepted abbreviations in tight column headers and chips: _P1_, _P2_ (pitches), _FA_ (first ascent), _FFA_ (first free ascent), _DWS_ (deep water solo), _m_ (metres), _km_ (kilometres).
- Sentence copy on help cards and doc pages has no character limit; write naturally rather than truncating.

---

## Placeholders and ICU Syntax

- Keep every `{placeholder}` exactly as written (`{count}`, `{name}`, `{style}`, `{grade}`) — same braces, same identifier. Never translate the variable inside the braces.
- ICU plural syntax (e.g., `{count, plural, one {# ascent} other {# ascents}}`) must be preserved and adapted to the plural categories of the target language.
- Inline HTML tags (like `<b>`, `</b>`, `<a>`, `</a>`) must remain intact and wrap the corresponding localised text.

---

## Punctuation and Numbers

- **Ellipsis:** Always use the single-character ellipsis glyph **…** (`U+2026`), never three full stops `...`.
- **Colons:** In French, place a space (ideally a non-breaking space `U+00A0`) before colons (_theCrag : synchronisation_).
- **Units and Numbers:** Keep standard metric symbols (_m_, _km_, _°C_, _km/h_). Format decimals and thousands according to the target language locale (e.g., comma decimal separator in German, French, and Spanish).

---

## Key Climbing Terminology per Language

Use these established authentic climbing terms:

| English             | German                  | French                  | Spanish                | Italian               |
| ------------------- | ----------------------- | ----------------------- | ---------------------- | --------------------- |
| **logbook**         | Tourenbuch              | carnet de croix         | libro de vías          | diario delle salite   |
| **ascent**          | Begehung                | ascension               | ascensión              | salita                |
| **onsight**         | Onsight                 | à vue                   | a vista                | a vista               |
| **flash**           | Flash                   | flash                   | flash                  | flash                 |
| **redpoint**        | Rotpunkt                | après travail           | punto rojo             | rotpunkt / lavorato   |
| **pinkpoint**       | Pinkpoint               | pink point              | punto rosa             | pink point            |
| **top rope**        | Toprope                 | moulinette              | en polea               | moulinette            |
| **clean**           | Clean                   | enchaîné                | encadenado             | pulito                |
| **lead**            | Vorstieg                | tête                    | de primero             | da primo              |
| **sport**           | Sport                   | sportive                | deportiva              | sportiva              |
| **trad**            | Trad                    | trad                    | clásica                | trad                  |
| **boulder**         | Boulder                 | bloc                    | bloque / búlder        | blocco                |
| **crag**            | Klettergarten / Fels    | falaise                 | escuela de escalada    | falesia               |
| **pitch**           | Seillänge               | longueur                | largo                  | tiro                  |
| **send** / **sent** | Durchstieg / Geklettert | enchaînement / enchaîné | encadene / encadenado  | chiusura / chiuso     |
| **first ascent**    | Erstbegehung            | première ascension      | primera ascensión      | prima salita          |
| **training load**   | Trainingsbelastung      | charge d'entraînement   | carga de entrenamiento | carico di allenamento |
| **rewind**          | Jahresrückblick         | rétrospective           | resumen anual          | riepilogo annuale     |

---

## Do Not Translate

- `theCrag`, `Crag Stats`, `Open-Meteo`, `SQLite`, `Docker`, `GitHub`.
- Grade system names: `Ewbank`, `YDS`, `V-scale`, `Fontainebleau`.
- Code identifiers that appear in error messages or parameters (`api_key`, `sync_cron`, `db_path`).
