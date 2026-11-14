# Crag Stats Translation Style Guide

For translators and AI translation of Crag Stats. It is uploaded to Crowdin as the project's style guide; this file is the source copy, so edit it here and re-upload (see [TRANSLATIONS.md](TRANSLATIONS.md#style-guide)).

Terminology lives in the [glossary](i18n-glossary.csv). This guide covers tone, register, formatting, and critical constraints.

---

## The Product and Its Readers

Crag Stats is a self-hosted climbing analytics platform that connects to [theCrag](https://www.thecrag.com/). It visualizes personal ascents, difficulty pyramids, bouldering, training load, weather trends, and partner stats. It is not an editable logbook; theCrag is the upstream source of truth.

Two groups read it:

- **Climbers at home or at work**, reviewing past ascents, analyzing pyramid distributions, and planning goals on desktop.
- **Climbers at the crag or gym**, checking ticks, route details, and training load on mobile screens, often between burns with chalky fingers.

Write so labels and metrics are clear, concise, and immediately readable at a glance.

---

## Voice

Authentic, direct, and data-driven. Use the natural vocabulary active rock climbers and boulderers use at the crag or gym. Do not sell and avoid corporate, stiff, or overly academic phrasing. The English is friendly and clean — maintain that same distance in target languages.

---

## Register

Keep the form of address consistent across every screen:

| Language | Address | Example |
| -------- | ------- | ------- |
| German | informal **du** / **dein** — never *Sie* | *Wähle dein bevorzugtes Gradsystem …* |
| French | formal/polite **vous** / **votre** — standard in software UI | *Sélectionnez votre système de cotation préféré …* |
| Spanish (Spain & LatAm) | informal **tú** — standard for outdoor/sports software | *Elige tu sistema de graduación preferido …* |
| Italian | friendly/informal **tu** — universal in Italian climbing | *Scegli il tuo sistema di gradi preferito …* |
| Japanese | polite UI register (丁寧語) with concise noun forms for buttons | *グレード体系を選択…* |
| Polish | direct software imperative (*Wybierz*, *Zapisz*) without stiff honorifics | *Wybierz preferowany system wycen…* |

In climbing culture (especially German and Italian), formal address (*Sie*, *Lei*) feels entirely foreign and out of place at a climbing cliff or gym.

---

## Capitalisation & Brand Names

The English source uses Title Case for headings, navigation links, and table column headers (*Ascent Logbook*). Do not blindly copy English title case:
- Follow target language rules: sentence case in French, Spanish, and Italian; standard noun capitalisation in German.
- **Brand name `theCrag`:** Always starts with lowercase `the` and capitalized `Crag`. When starting a sentence or heading with `theCrag`, keep the lowercase `t` (e.g. *theCrag: sincronización del libro de vías*).
- **Brand name `Crag Stats`:** Always capitalized with a space.

---

## Climbing Grade Honesty (CRITICAL)

- Numerical and letter climbing grades (e.g., **21**, **6b+**, **5.10a**, **V5**, **7A**) are universal identifiers and **MUST NEVER be translated, converted, or altered**.
- Grade scale names (Ewbank, French, YDS, V-scale, Fontainebleau) remain exact identifiers.
- Difficulty bands (*Beginner*, *Intermediate*, *Experienced*, *Expert*, and *Elite*) are localized, but the grade scores themselves remain untouched.

---

## Length and Abbreviations

Many strings are compact labels in navigation rails, stat cards, pyramid charts, filter chips, and table headers on narrow phone screens (≤860px).

- Where a string has a **maximum length** in Crowdin, it is a hard limit — choose concise phrasing or a standard climbing abbreviation.
- Accepted abbreviations in tight column headers and chips: *P1*, *P2* (pitches), *FA* (first ascent), *FFA* (first free ascent), *DWS* (deep water solo), *m* (meters), *km* (kilometers).
- Sentence copy on help cards and doc pages has no character limit; write naturally rather than truncating.

---

## Placeholders and ICU Syntax

- Keep every `{placeholder}` exactly as written (`{count}`, `{name}`, `{style}`, `{grade}`) — same braces, same identifier. Never translate the variable inside the braces.
- ICU plural syntax (e.g., `{count, plural, one {# ascent} other {# ascents}}`) must be preserved and adapted to the plural categories of the target language.
- Inline HTML tags (like `<b>`, `</b>`, `<a>`, `</a>`) must remain intact and wrap the corresponding localized text.

---

## Punctuation and Numbers

- **Ellipsis:** Always use the single-character ellipsis glyph **…** (`U+2026`), never three full stops `...`.
- **Colons:** In French, place a space (ideally a non-breaking space `U+00A0`) before colons (*theCrag : synchronisation*).
- **Units and Numbers:** Keep standard metric symbols (*m*, *km*, *°C*, *km/h*). Format decimals and thousands according to the target language locale (e.g., comma decimal separator in German, French, and Spanish).

---

## Key Climbing Terminology per Language

Use these established authentic climbing terms:

| English | German | French | Spanish | Italian |
| ------- | ------ | ------ | ------- | ------- |
| **logbook** | Tourenbuch | carnet de croix | libro de vías | diario delle salite |
| **ascent** | Begehung | ascension | ascensión | salita |
| **onsight** | Onsight | à vue | a vista | a vista |
| **flash** | Flash | flash | flash | flash |
| **redpoint** | Rotpunkt | après travail | punto rojo | rotpunkt / lavorato |
| **pinkpoint** | Pinkpoint | pink point | punto rosa | pink point |
| **top rope** | Toprope | moulinette | en polea | moulinette |
| **clean** | Clean | enchaîné | encadenado | pulito |
| **lead** | Vorstieg | tête | de primero | da primo |
| **sport** | Sport | sportive | deportiva | sportiva |
| **trad** | Trad | trad | clásica | trad |
| **boulder** | Boulder | bloc | bloque / búlder | blocco |
| **crag** | Klettergarten / Fels | falaise | escuela de escalada | falesia |
| **pitch** | Seillänge | longueur | largo | tiro |
| **send** / **sent** | Durchstieg / Geklettert | enchaînement / enchaîné | encadene / encadenado | chiusura / chiuso |
| **first ascent** | Erstbegehung | première ascension | primera ascensión | prima salita |
| **training load** | Trainingsbelastung | charge d'entraînement | carga de entrenamiento | carico di allenamento |
| **rewind** | Jahresrückblick | rétrospective | resumen anual | riepilogo annuale |

---

## Do Not Translate

- `theCrag`, `Crag Stats`, `Open-Meteo`, `SQLite`, `Docker`, `GitHub`.
- Grade system names: `Ewbank`, `YDS`, `V-scale`, `Fontainebleau`.
- Code identifiers that appear in error messages or parameters (`api_key`, `sync_cron`, `db_path`).
