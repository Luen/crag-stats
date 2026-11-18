# Begehungsstile

Ein **Begehungsstil** hält fest, _wie_ du etwas geklettert bist, nicht nur, ob du oben angekommen bist. Ein Onsight ist mehr wert als ein Rotpunkt derselben Route. Deshalb halten theCrag (und Crag Stats) sie getrennt.

In den folgenden Tabellen bedeutet **Durchstieg**, dass Crag Stats den Tick als erfolgreiche (saubere) Begehung zählt, beispielsweise bei den „erfolgreichen Begehungen“, Durchstiegsraten und Pyramiden. **Versuch** bedeutet, dass die Begehung als Versuch geloggt ist: Sie wird in Diagrammen grau dargestellt, zählt weiterhin zum Klettervolumen und kann eine Route als Projekt kennzeichnen.

<!-- component:tick-types -->

## Wie Ticks hier verwendet werden

- **Pyramiden und Diagramme** färben jeden Begehungsstil einheitlich ein: Onsight Grün, Flash Gelb, Rotpunkt Rot, Pinkpoint Rosa, Durchstieg/Begehung Blau, Versuche Grau.
- **CPR** verschiebt jeden Tick um einen Grad-Offset (ein Onsight zählt schwerer als ein Rotpunkt); siehe [CPR](/docs/cpr).
- **Projekte** sind Routen mit Versuchen, aber noch ohne Durchstieg. Eine Route, die du auf Anhieb durchstiegen hast (Onsight oder Flash), ist niemals ein Projekt.
- **Trainingsbelastung** zählt Versuche mit dem 0,8-fachen eines Durchstiegs, da das Ausbouldern und Projektieren einer Route ebenfalls anstrengende Arbeit ist; siehe [Trainingsbelastung](/docs/training-load).

## Gezählte Begehungsstile in Statistiken

Auf theCrag werden auch Versuche ohne Durchstieg (wie `Working`, `Attempt`, `Hang dog` oder `Retreat`) als Begehungen erfasst. Wenn du beim Projektieren zahlreiche Versuche loggst, kann das Zählen jedes einzelnen Versuchs deine Hauptbegehungszahl, deinen Disziplinanteil und deinen Klettertyp verzerren.

Unter **Einstellungen → Anzeige & Sichtbarkeit → Gezählte Begehungsstile** kannst du festlegen, wie jeder Begehungsstil in Crag Stats behandelt wird:

- **Aktivieren (Überall zählen):** Enthalten in Gesamtbegehungen, Disziplinaufschlüsselung, Klettergebieten und Sektoren, Pyramiden, Kartensummen, Eddington-Zahlen, Routen-Wiederholungen, Klettererprofil-Achsen, Aktivitäts-Heatmaps, Trainingsbelastung, Abzeichen, Projekten und Zielen.
- **Nur Projekte & Ziele (Nicht in Gesamtwerten):** Ausgeschlossen aus Gesamtbegehungen, Disziplinanteil, Gebieten, Sektoren, Pyramiden, Kartensummen, Eddington-Zahlen, Wiederholungen und den Profilachsen, zählt jedoch weiterhin für Projekterkennung, Session-Aktivität (Heatmap, Streaks, Klettertage pro Woche und Wochentags-Diagramme), Trainingsbelastungs-Ermüdung, Abzeichen und Gradziele.
- **Ausblenden (Vollständig ausschließen):** Über alle Statistiken, Projekte, Ziele und Abzeichen hinweg komplett ausgeschlossen.

Das Tourenbuch behält unabhängig von dieser Einstellung stets alle deine geloggten Begehungen mit vollständiger Filterung bei. Welche Abzeichen welcher Auswahl folgen, erfährst du unter [Abzeichen](/docs/badges).

Wenn ein konfigurierter Begehungsstil einige deiner geloggten Begehungen ausschließt, berechnet die Übersicht auch die Profilwerte, die normalerweise von theCrag stammen (Outdoor- und Indoor-Begehungen, getickte Routen, Gesamthöhe und Klettertyp), aus deinen gezählten Begehungen neu, sodass alle Summen auf der Seite denselben Satz an Ticks beschreiben. Setze die Konfiguration mit der Voreinstellung **Alle geloggten Ticks** zurück, um zu theCrags Originalwerten zurückzukehren.

## Quelle

Die Definitionen sind an theCrags Artikel über [Begehungsstile](https://www.thecrag.com/en/article/ticktypes) angelehnt. Nicht jeder Begehungsstil gilt für jede Kletterdisziplin.
