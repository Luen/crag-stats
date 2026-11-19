# Aktivität

Die Dashboard-Karten **Monatsstatistik** und **Jahresstatistik** fassen das Volumen auf einen Blick zusammen. **Aktivität** (`/activity`) ist die Detailseite, wenn du mehr als nur die Diagramme möchtest: eine vollständige Tabelle pro Monat (Begehungen, Durchstiege, Höhenmeter, Stilmix) sowie die jährliche Aufschlüsselung im Jahresvergleich.

## Was zählt

- **Begehungen** — jeder eingetragene Tick an diesem Tag, in diesem Monat oder in diesem Jahr (einschließlich Versuchen).
- **Durchstiege** — als erfolgreich eingestufte Ticks (siehe [Begehungsarten](/docs/tick-types)).
- **Höhe** — Meter aus der Begehungs- oder Routenhöhe, sofern vorhanden.
- **Stile** — Sport / Trad / Boulder entsprechend dem Absicherungsstil; alles andere wird in der Tabelle unter **Sonstige** zusammengefasst.

Monatslinks öffnen das Tourenbuch für den jeweiligen Kalendermonat. Jahreslinks (auf der Jahreskarte oder in der Jahrestabelle) öffnen `/logbook?year=`.

## Warum eine eigene Seite

Nur dieselben beiden Diagramme zu wiederholen, würde die Seitenleiste unnötig aufblähen. Die Aktivitätsseite bietet mit der **monatlichen Detailtabelle** und übersichtlichen Vorjahresvergleichen einen echten Mehrwert — statt lediglich einfache Karten zu wiederholen.

## Serien

Die Serienkarte zeigt deine aktuellen Tages-, Wochen- und Monatsserien neben deiner bisher **längsten** Tagesserie (vier Kennzahlenfelder). Anfangs- und Enddatum der längsten Serie stehen unter den Feldern. Bei gleich langen Rekorden wird der früheste Zeitraum angezeigt.
Ein einzelner Klettertag zeigt ein Datum; ohne Einträge gibt es keine Rekorddaten.

Die Fußzeile zeigt außerdem deinen letzten Klettertag, wie viele ganze Tage
seitdem vergangen sind, wenn die aktuelle Tagesserie unterbrochen ist, sowie die **aktiven Tage** insgesamt
(unterschiedliche Klettertage). Die Tage stammen aus gültigen eingetragenen Begehungsdaten; Versuche und
Durchstiege, in der Halle und draußen, zählen gleichermaßen, und mehrere Begehungen an einem Tag zählen
einmal. Die Meilensteine für 7, 10 und 30 Tage findest du unter [Abzeichen](/docs/badges).

Die aktuelle Tagesserie endet heute oder gestern, solange du heute noch nicht geklettert bist.
Kalendertage werden in UTC verglichen, damit die Server-Zeitzone und Zeitumstellungen keinen eingetragenen Tag verschieben. Einträge mit einem Datum in der Zukunft verlängern die aktuelle Serie nicht.

Für aktuelle Wochen- und Monatsserien gilt dieselbe Übergangsregel: Gezählt werden aufeinanderfolgende Zeiträume bis zum aktuellen Zeitraum oder bis zum unmittelbar vorherigen, wenn du im aktuellen noch nicht geklettert bist. Nach einer vollständig leeren Woche oder einem vollständig leeren Monat steht der jeweilige Zähler auf null. Wochen beginnen am Montag. Kalendergrenzen werden in UTC bestimmt, auch über die ISO-Kalenderwoche 53 und den Jahreswechsel hinweg. Einträge mit einem Datum in der Zukunft zählen für diese Zähler nicht.

## Letzte Aktivitäten

Das Dashboard zeigt den neuesten **Klettertag** zuerst. Innerhalb eines Tages steht die zuletzt **eingetragene** Begehung zuerst. Maßgeblich ist der Erstellungszeitpunkt des Eintrags beim Anbieter.
Das angezeigte Datum bleibt der Klettertag: Wenn du heute eine ältere Begehung einträgst, rückt sie nicht vor Begehungen von späteren Klettertagen. Wenn du Begehungen in ihrer Reihenfolge einträgst, dient die Eintragsreihenfolge als Näherung für die Kletterreihenfolge — sie ist keine aufgezeichnete Begehungszeit.

Einträge mit fehlenden oder ungültigen Eintragszeiten stehen hinter zeitlich zugeordneten Einträgen desselben Tages.
Bei gleichen oder fehlenden Eintragszeiten sorgt die gespeicherte Begehungs-ID für eine stabile Reihenfolge, mit der neuesten zuerst. Bearbeitungs-/Synchronisierungszeitstempel werden nicht als Erstellungszeitpunkte von Einträgen verwendet.

Letzte Aktivitäten zeigen außerdem dieselben Kletterstil-Abzeichen wie das Tourenbuch: die Routendisziplin, gegebenenfalls einen abweichenden erfassten Sicherungsstil der Begehung sowie explizite Solo-Varianten wie Vorstieg-Solo oder Toprope-Solo. Fehlende Partner bedeuten niemals ein Solo.
