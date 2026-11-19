# Wochentag

Die Karte **Wochentag** zeigt dir, an welchen Wochentagen du kletterst, inspiriert von [Dreeve](https://dreeve.app/)s Wochentagsdiagramm für Strava. Die Verteilung ist ein **Donut- (Kuchen-) Diagramm** mit einer Legende von Mo.–So. Standardmäßig befindet sie sich links von **Sessions pro Woche** (halbe Breite), in der Zeile unter den **Monatlichen** / **Jährlichen** Statistiken; über „Dashboard anpassen“ lässt sich jede der beiden Karten verschieben.

## Was gezählt wird

- **Sessions** (Standard) – ein Kalendertag mit mindestens einer passenden Begehung (gleiches Konzept wie bei [Sessions pro Woche](/docs/sessions-per-week))
- **Begehungen** – jeder passende Tick an diesem Wochentag

Der Wochentag wird aus dem Datum der Begehung im Format `YYYY-MM-DD` in UTC übernommen – Tourenbuch-Zeilen sind tagesgenau ohne Uhrzeit versehen.

## Filter

- **Gesamtzeitraum** / **Letzte 12 Wochen** – inklusives 84-Tage-Fenster, das heute endet, für den kurzen Zeitraum
- **Sessions** / **Begehungen** – was die Segmentgröße bedeutet
- **Alle** / **Sport** / **Trad** / **Boulder** – Stil-Chips verwenden dieselben Disziplin-Farben wie der Rest der App und entsprechen den Stil-Filtern des Tourenbuchs (gekletterter Stil **oder** Routenstil). Toprope und andere Stile erscheinen nur unter **Alle**.

Die Auswahlen werden im Browser gespeichert (`cs_weekday_range`, `cs_weekday_metric`, `cs_weekday_style`).

## Aktivster Tag

Die Mitte des Donuts und die Führungslinie nennen den Wochentag mit dem höchsten Wert für die aktuelle Metrik (bei Gleichstand entscheidet die andere Metrik). Das Segment und die Legendenzeile dieses Wochentags werden hervorgehoben. **Wochentagswerte anzeigen** unter dem Diagramm listet genaue Sessions, Begehungen und Anteile für Screenreader und Tastaturnutzer auf.
