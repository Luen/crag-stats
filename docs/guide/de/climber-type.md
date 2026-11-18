# Klettertyp

Die Übersicht ordnet dir einen **Klettertyp** zu, wie beispielsweise _Sportkletterer_ oder _Allrounder_. Dieser steht ganz oben im Dashboard und in der Karte „Klettertyp“.

## Wie die Einstufung ermittelt wird

1. **Zuerst theCrag, solange alle Begehungsstile gezählt werden.** Wenn dein theCrag-Profil einen Klettertyp festgelegt hat (über die API synchronisiert), übernimmt Crag Stats diesen direkt. Sobald du in den Einstellungen einen Begehungsstil auf _Nur Projekte & Ziele_ oder _Ausblenden_ setzt, wird der Typ stattdessen aus deinen gezählten Begehungen neu berechnet, damit Projektierungsversuche dich nicht in der falschen Disziplin halten.
2. **Andernfalls aus deinem Tourenbuch.** Jede gezählte Begehung zählt für ihre jeweilige Disziplin (Kletterstil): Sportklettern, Trad, Bouldern, Toprope, Alpin, Technisch (Aid), Deep-Water-Soloing und so weiter. Standardmäßig zählen auch Versuche, aber du kannst in den Einstellungen [gezählte Begehungsstile](/docs/tick-types) konfigurieren, damit Projektierungsversuche (wie das Ausbouldern von Problemen) deinen Klettertyp nicht verzerren.
3. **Die 40%-Regel.** Wenn eine einzelne Disziplin **mindestens 40%** all deiner gezählten Begehungen ausmacht, _und_ diese Disziplin **Sportklettern, Trad oder Bouldern** ist, bist du ein „Sportkletterer“, „Trad-Kletterer“ oder „Boulderer“.
4. **Alles andere** gilt als **Allrounder**. Das greift, wenn keine Disziplin 40% erreicht oder der größte Anteil auf einen Stil wie Toprope entfällt.

Der farbige Balken in der Karte zeigt den Anteil jeder Disziplin in den gewohnten Farben: Sportklettern Blau, Trad Orange und Bouldern Rot.

## Warum 40%?

Die meisten Kletterer kombinieren verschiedene Disziplinen. Ein Schwellenwert deutlich unter 50% erfasst eine klare Vorliebe (zum Beispiel 47% Sport, 24% Boulder und 24% Trad), ohne vielseitige Kletterer in eine unpassende Schublade zu zwingen. Kletterer, deren Zeit sich gleichmäßig verteilt, bleiben „Allrounder“.

## Klettertyp ändern

- Lege einen Klettertyp in deinem theCrag-Profil fest und synchronisiere neu,
- passe deine gezählten Begehungsstile in den Einstellungen an, falls Projektierungsversuche deinen Disziplinanteil verzerren, oder
- logge mehr Routen in dem Stil, mit dem du dich identifizierst. Die Einstufung aktualisiert sich beim nächsten Laden der Seite.
