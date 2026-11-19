# Projekte

Crag Stats führt Outdoor-Routen als **offene Projekte**, wenn im Tourenbuch nicht durchstiegene Versuche an **mindestens zwei verschiedenen Klettertagen** erfasst sind. Mehrere Versuche an nur einem Tag allein erstellen noch kein offenes Projekt. Offene Projekte verschwinden nach einem Jahr ohne Aktivität.

Ein **abgeschlossenes Projekt** ist eine Route, die nach Vorarbeit an mindestens zwei Tagen oder nach **mindestens zwei erfolglosen Versuchen am Durchstiegstag** (drei oder mehr Versuche inklusive Durchstieg) durchstiegen wurde. Versuche können separate Tourenbucheinträge sein oder in der Versuchsanzahl des Durchstiegs erfasst werden. Separate Einträge und die Versuchsanzahl des Durchstiegs werden nicht zusammengezählt, um doppelte Zählungen derselben Versuche zu vermeiden. Durchstiege im ersten Versuch und ein Fehlversuch mit anschließendem Durchstieg am selben Tag gelten nicht als Projekte. Nur die Vorarbeit bis zum ersten Durchstieg zählt; spätere Wiederholungen machen aus einem früheren Durchstieg kein Projekt. Fehlende oder ungültige Daten zählen nicht als Sessions. Abgeschlossene Projekte erscheinen für die vergangenen sechs Kalendermonate im Bereich **Kürzlich durchstiegen**.

Wenn sowohl ein Versuch als auch der erste Durchstieg Zeitstempel enthalten, werden Versuche nach diesem Durchstieg von der Einstufung ausgenommen. Einträge am Tag des Durchstiegs, die nur ein Datum enthalten, werden als Vorarbeit gewertet, da die genaue Reihenfolge innerhalb des Tages unbekannt ist. Haben mehrere Durchstiege am selben Tag keine verwertbaren Uhrzeiten, wird ihre gespeicherte Begehungsreihenfolge verwendet, sodass eine spätere Wiederholung nicht den ersten erfassten Durchstieg ersetzt. Die Gesamtzahl der Sessions auf Karten und im Dashboard verwendet dieselben gültigen Kalendertage wie die automatische Einstufung.

**Kürzlich durchstiegen** umfasst die letzten sechs Kalendermonate in UTC, einschließlich des Stichtags bei Durchstiegen ohne Uhrzeit. Am Monatsende springt der Stichtag auf den letzten gültigen Tag (der 31. Oktober blickt auf den 30. April zurück). Zukünftige Daten werden ausgeschlossen. Durchstiege mit Zeitstempel behalten die Referenzuhrzeit am Stichtag bei. Das Dashboard nutzt dasselbe Zeitfenster, wenn freie Projektplätze mit kürzlichen Durchstiegen aufgefüllt werden.

## Eigene Projekte auswählen

Als Profilinhaber siehst du kompakte Projekt-Pills neben den FA/FFA-Optionen im Tourenbuch sowie auf den Projektkarten/-details:

- **Als Projekt markieren** wählt eine erfasste Outdoor-Route selbst nach nur einer Session oder einem Jahr ohne Aktivität aus.
- **Kein Projekt** / **Projektmarkierung aufheben** entfernt sie aus den Projekten, dem Dashboard und der Zählung aktiver Projekte, bis du sie wieder markierst oder die automatische Erkennung wiederherstellst.
- **Automatisch bestimmen** entfernt die manuelle Auswahl und wendet wieder die oben genannten Regeln an.

Jede Auswahl wird direkt gespeichert. Pills im Tourenbuch halten dich auf derselben gefilterten Seite; Pills auf Projektkarten/-details führen zurück zur Projektliste. Das Tag „Projekt“ / „Kein Projekt“ zeigt eine manuelle Auswahl an, ohne sich allein auf Farben zu verlassen.

Auswahlen sind lokale Metadaten und bleiben bei Synchronisierungen, Cache-Neuerstellungen und selbst dann erhalten, wenn eine Route auf der Quellplattform entfernt und später wieder hinzugefügt wird. Sie verändern weder das Tourenbuch auf theCrag noch die dortige öffentliche Projekt-Markierung. Nur ein tatsächlich erfasster Durchstieg markiert ein ausgewähltes Projekt als durchstiegen. Ausgewählte Durchstiege außerhalb des Sechs-Monats-Fensters erscheinen unter **Frühere ausgewählte Durchstiege** statt unter „Kürzlich durchstiegen“. Einstellungen → Zurücksetzen löscht die Auswahlen. Besucher können die resultierenden Projekte sehen, die Auswahl jedoch nicht ändern. Indoor-Routen und nicht im Tourenbuch erfasste Routen können nicht manuell hinzugefügt werden.

## Projektdetails, Fortschritt und Schätzungen

Klicke auf einen Projektnamen auf der Projektseite oder im Dashboard, um die Detailseite zu öffnen. Sie zeigt die Route, gespeicherte öffentliche Kletterführerauszüge, den datierten Fortschritt deiner Einheiten und frühere Versuche/Durchstiege (einschließlich der Bezeichnungen gekletterter Seillängen). Der Link am Ende öffnet jeden Tourenbucheintrag für genau diese Route, einschließlich älterer Wiederholungen. Private Begehungsnotizen bleiben gemäß der bestehenden Sichtbarkeitseinstellung nur für dich im Tourenbuch sichtbar.

Der Balken **Ungefähre Bereitschaft** folgt dem Prinzip der Zielbereitschaft: Er misst die vorhandene Leistungsbasis, nicht den prozentualen Anteil eines Grades oder die Durchstiegswahrscheinlichkeit. Nur ein erfasster Durchstieg auf dieser Route füllt den Balken vollständig aus. Eine andere Route im selben Grad kann das nicht. Frühere Sessions berücksichtigen nur Daten, die bis zu diesem Klettertag vorlagen; ein späterer Durchstieg verändert ihre Bereitschaft also nicht rückwirkend.

Für jeden Stichtag nutzt das Modell die vorangegangenen 365 Tage (einschließlich dieses Tages) an Outdoor-Durchstiegen in derselben Disziplin und Bewertungsskala unter Verwendung der effektiv gekletterten Grade. Für die Routenpyramide werden verschiedene Routen herangezogen; Wiederholungen füllen die Pyramide nicht erneut auf. Die Zielroute ist von der unterstützenden Datenbasis ausgeschlossen.

- Bester kürzlicher Durchstieg im/über dem Zielgrad: 60 Punkte; eine Stufe darunter: 35; zwei Stufen darunter: 10; andernfalls null.
- Zwei verschiedene Routen eine Stufe darunter bringen bis zu 20 Punkte, und vier Routen zwei Stufen darunter bringen bis zu 25 Punkte.
- Fehlversuche an der Zielroute bringen bis zu 15 Punkte, gemessen an einem Richtwert von 15, 35 oder 75 Versuchen. Der Zeithorizont ist **Kurzfristig**, wenn der Abstand zu deiner kürzlichen Bestleistung maximal eine Stufe beträgt, **Mittelfristig** bei zwei, andernfalls **Langfristig** (auch wenn kein kürzlicher Durchstieg bekannt ist).
- Das Basismodell ist bei 94 % gedeckelt und steigt dann um einen Punkt pro weiterem gültigen Klettertag an dieser Route (der erste Tag bildet die Basis), bis zu maximal 99 %, solange für dieses Projekt kein Durchstieg erfasst ist. Bei unbekannten Graden gibt es keine Schätzung. Null- und Minusgrade der V-Skala werden unterstützt und niemals mit Seilrouten-Graden vermischt.

Ausbouldern kann diesen Balken ansteigen lassen, ohne zu beweisen, dass ein bestimmter Zug geknackt ist. Grade und erfasster Aufwand können Beta, Bedingungen, Verletzungen oder Selbstvertrauen nicht abbilden – daher handelt es sich um eine nachvollziehbare Heuristik, nicht um ein wissenschaftlich validiertes Modell.

**Geschätzter Restaufwand** vergleicht deine bisherigen abgeschlossenen Outdoor-Projekte in derselben Disziplin und Skala innerhalb einer numerischen Gradstufe. Durchstiege im ersten Versuch fließen nicht in diese Vergleichsgruppe ein; Durchstiege einzelner Seillängen unterhalb des Gesamtgrades ersetzen keine Durchstiege der ganzen Route. Für jede Metrik separat müssen mindestens drei abgeschlossene Projekte mehr Sessions/Versuche erfordert haben, als du bislang erfasst hast. Die angezeigte Spanne ist die mittlere Hälfte (25.–75. Perzentil anhand der umschließenden beobachteten Ränge) dieser Gesamtzahlen abzüglich deines erfassten Aufwands; verbleibende Versuche schließen den späteren Durchstieg ein. Wenn du diesen bisherigen Aufwand überschreitest oder zu wenige Vergleichswerte vorliegen, wird keine Schätzung angezeigt, anstatt eine willkürliche Frist zu erfinden. Vergleichsgruppen umfassen alle erfassten Jahre, während die Bereitschaft nur kürzliche Durchstiege heranzieht.

Diese Schätzungen beziehen sich nur auf abgeschlossene Projekte: Noch nicht durchstiegene Projekte und nicht erfasste Versuche fehlen, und das Leistungsniveau ändert sich im Laufe der Zeit. Es handelt sich um grobe persönliche Vergleiche, nicht um eine Garantie für den verbleibenden Aufwand. Die Session-Gesamtzahl zählt gültige eingetragene Kalendertage. Fehlende, ungültige und in der Zukunft liegende Daten werden im Verlauf aufgeführt, sind jedoch vom Fortschritt und von Schätzungen ausgeschlossen. Die Versuchsanzahl beim Durchstiegseintrag enthält den erfolgreichen Versuch und kann sich mit separaten Fehlversuchseinträgen überschneiden; Zusammenfassungen nutzen die höhere Fehlversuchszahl, anstatt beide zu addieren. Eine spätere Wiederholung bleibt sichtbar, ohne zu ändern, welcher Durchstieg das Projekt zuerst abgeschlossen hat.

## Neue Route?

Wenn ein Projekt auf theCrag **keinen Grad** hat (oder wörtlich als „Project“ / „Proj“ bewertet ist), zeigen Karten das Abzeichen **Neue Route?** – meist eine neue Linie, die du einbohrst oder noch projektierst. Dasselbe Abzeichen erscheint auch bei **breiten vorläufigen Spannen** wie `21-23` oder `V1-3`, was meist bedeutet, dass sich der Grad erst noch einpendeln muss. Benachbarte Zwischengrade wie `V1/2` bleiben normale veröffentlichte Grade und erhalten das Abzeichen nicht. Der Grad-Chip zeigt weiterhin den ermittelten Mittelwert an, sofern vorhanden; nur das Abzeichen ändert sich. Eine eindeutige theCrag-Kennzeichnung als **Project** (aus dem Routeninfo-Import) zeigt stattdessen das separate Projekt-Abzeichen an.

## Topo-Text auf Projektkarten

Wenn der **Routendaten-Import** öffentliche Topo-Daten für eine Route zwischengespeichert hat, können Projektkarten Folgendes anzeigen:

- Einen kurzen Auszug der **Beschreibung**
- Eine Warnung zum **Zugang**, wenn im Topo Zugangsprobleme vermerkt sind (z. B. gesperrte oder geduldete Klettergebiete)

Dieser Text stammt von den öffentlichen Routenseiten auf theCrag (`beta`-Felder wie „Description“ und „Access issues“). Es handelt sich **nicht** um deine privaten Tourenbuchnotizen.

### Datenschutz

- **Private Begehungsnotizen** (`ascents.comment`) bleiben separat. Sie erscheinen nur dann im Tourenbuch, wenn du dies in den Einstellungen aktivierst, und niemals auf Projektkarten oder in Dashboard-Statistiken.
- **Topo-Beta** ist ein öffentlicher Community-Inhalt. Crag Stats speichert kurze Auszüge in `routes.beta_json` beim selben optionalen Routenimport wie die Erstbegehungshistorie — niemals vermischt mit Notizen.

### Lizenzierung & Namensnennung

Topo-Inhalte von theCrag können unter Lizenzen wie [Creative Commons BY-SA](https://creativecommons.org/licenses/by-sa/4.0/) stehen. Routenseiten nennen häufig Beitragende (zum Beispiel lokale Vereine oder Kletterclubs). Crag Stats zeigt nur **kurze Auszüge**, verlinkt zurück auf die **Routenseite auf theCrag** und kennzeichnet die Quelle (CC BY-SA). Für die vollständige Beschreibung, Kletterethik, Zustieg und den aktuellen Zugangsstatus nutze den Link auf der Karte.

Der Routen-Import ist **standardmäßig deaktiviert** (`ROUTE_DATA_IMPORT`). Setze auf dem Server `ROUTE_DATA_IMPORT=true` und starte neu, wenn du Kletterführerauszüge und automatische Erstbegehungshinweise möchtest; Datenschutz und Abrufbegrenzungen werden unter [Erstbegehungen](/docs/first-ascents) erklärt.
