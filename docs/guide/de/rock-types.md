# Gesteinsarten

theCrag speichert die Geologie bei vielen Routen als strukturierten Tag **Gesteinsart** (zum Beispiel Granit oder Sandstein). Crag Stats liest diesen Tag aus dem synchronisierten Tourenbuch / Routen-Cache – es scraped weder Seiten noch errät es das Gestein aus dem Namen des Klettergebiets.

## Karte „Gesteinsarten“

Die Dashboard-Karte **Gesteinsarten** zählt Begehungen, deren Route einen Tag für die Gesteinsart hat, und zeigt den Anteil jedes Namens. Die vorherrschende Gesteinsart kann einen kurzen Info-Text zur Geologie anzeigen. Jeder Name verlinkt auf das Tourenbuch, gefiltert mit `?rock=`.

Routen ohne Tag für die Gesteinsart werden im Diagramm nicht berücksichtigt, sodass sich die Prozentwerte nur auf getaggte Begehungen beziehen.

## Karte „Gestein & Leistung“

Sobald **20 oder mehr** Klettertage mindestens einen Durchstieg oder Versuch an einer Route mit Gesteinsart-Tag enthalten, vergleicht die Karte **Gestein & Leistung**, wie diese Klettereien je nach Gestein verlaufen sind. Davor zeigt sie an, wie viele getaggte Tage du bisher hast. Die Karte bleibt ausgeblendet, solange kein getaggter Durchstieg oder Versuch existiert, und kann unter Einstellungen → Dashboard verschoben oder ausgeblendet werden.

**Was gezählt wird.** Durchstiege und Versuche (dieselbe Tick-Klassifizierung wie überall sonst) an Routen mit einem Tag für die Gesteinsart. Nicht getaggte Klettereien werden nur als Abdeckung gemeldet („N weitere … haben keinen Tag für die Gesteinsart“).

**Messwerte** (gleiche Konzepte wie unter [Wetter & Leistung](/docs/weather)):

- **Durchstiegsquote:** Durchstiege als Anteil an Durchstiegen und Versuchen auf diesem Gestein.
- **Limitnah:** der Anteil der bewerteten Durchstiege innerhalb von 2 Grad (1 V-Grad auf der V-Skala) deines schwersten Durchstiegs des **gleichen Stils und der gleichen Bewertungsskala** in den 365 Tagen vor diesem Tag. V-Skala und Routengrade werden niemals gemischt.
- **Onsight/Flash:** Onsights und Flashes als Anteil an den Durchstiegen auf diesem Gestein.

**Ehrliche Interpretation.**

- Ein Gestein benötigt mindestens **10** Begehungen (für den Nenner dieses Messwerts) an mindestens **3** Tagen, bevor eine Quote angezeigt wird.
- **Höher** / **Niedriger** verwendet denselben cluster-robusten Test wie die Wetter-Leistung: Jede Gestein-und-Tag-Gruppe ist eine Einheit, sodass eine einzelne große Session nicht alleine ein Muster erzeugen kann.
- Gebietsauswahl, Reisen und Projekte beeinflussen die Ergebnisse bei den Gesteinsarten. Betrachte Unterschiede als Korrelation, nicht als Ursache.
- Wenn du viele verschiedene Gesteinsnamen hast, werden die am seltensten vorkommenden unter **Sonstige** zusammengefasst (kein Tourenbuch-Link). Benannte Abschnitte verlinken auf `/logbook?rock=…` mit demselben Abgleich unabhängig von Groß-/Kleinschreibung wie die Karte „Gesteinsarten“.

Das Betrachten der Karte löst niemals eine Anforderung an den Anbieter aus, und private Notizen werden niemals verwendet.

Die Referenz für „limitnah“ schließt deine Durchstiege desselben Stils und derselben Skala ein, selbst wenn
diese Referenzrouten keinen Gesteins-Tag haben. Sie verwendet den schwersten gekletterten Seillängengrad,
falls verfügbar, schließt den 365. vorherigen Tag ein und schließt alle Durchstiege am verglichenen Tag
aus. Gesteins- und Wetter-Leistung teilen sich diese Referenzberechnung;
beim Wetter werden die Referenzdurchstiege zusätzlich auf Klettereien im Freien beschränkt.
