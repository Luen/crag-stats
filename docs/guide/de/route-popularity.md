# Routenbeliebtheit

Die Karte **Routenbeliebtheit** nutzt Community-Statistiken, die theCrag für jede Route speichert: **Anzahl der Begehungen**, **Beliebtheit** und **relative Beliebtheit** (0–100). Crag Stats speichert diese, wenn der Routendaten-Import ausgeführt wird (`ROUTE_DATA_IMPORT=true` auf dem Server, dann neu starten und synchronisieren).

## Ausgetretene Pfade vs. abseits der ausgetretenen Pfade

Für jede Begehung, für die Beliebtheitsdaten existieren, vergleichen wir die **relative Beliebtheit**, sofern vorhanden, andernfalls die **globale Beliebtheit**:

| Kategorie                           | Regel         |
| ----------------------------------- | ------------- |
| **Ausgetretene Pfade**              | Score ≥ 50    |
| **Abseits der ausgetretenen Pfade** | Score &lt; 50 |

Die Karte zeigt, welcher **Anteil dieser Begehungen** in jede Kategorie fällt. Begehungen von Routen ohne zwischengespeicherte Statistiken werden von den Prozentwerten ausgeschlossen.

## Geheimtipps

**Geheimtipps** sind **Durchstiege** auf Routen, die sowohl gut bewertet sind (`qualityScore` ≥ 70, oder mindestens ★★★, oder eine hohe Qualitätsbewertung bei deiner Begehung) als auch wenig frequentiert sind (Community-**Anzahl der Begehungen** ≤ 100 und Beliebtheits-Score &lt; 50). Es werden bis zu drei verschiedene Routen aufgeführt, sortiert nach Qualität.

## Tourenbuch

Nach **Pop.** sortieren, um Begehungen nach Routenbeliebtheit zu ordnen (standardmäßig die höchste zuerst). Zeilen ohne zwischengespeicherte Statistiken werden nach unten sortiert.

## Quelle

Die Zahlen stammen aus der Routen-API von theCrag (`show=info`). Sie spiegeln die gesamte Community wider, nicht nur dein Tourenbuch.

Für die Beliebtheit wird die relative Beliebtheit verwendet, sofern verfügbar, ansonsten die globale Beliebtheit. Die Anzahl der Begehungen in der Community wird separat angezeigt und niemals numerisch mit Beliebtheits-Scores verglichen.

Um die Gesamtzahl der Community-Begehungen, die Beliebtheit und die Bewertungen aktuell zu halten, kann der Server-Administrator `ROUTE_DATA_REFRESH_DAYS` auf eine ganze Zahl von Tagen von 30 bis 3650 festlegen (z. B. `90` empfohlen oder `180` für etwa ein halbes Jahr), zusammen mit `ROUTE_DATA_IMPORT=true`. Dies sind fortlaufende Tagesintervalle. Nach erfolgreichen Tourenbuch-Synchronisierungen haben neue Routen Priorität; anschließend werden die ältesten veralteten Abrufe innerhalb desselben Limits von 100 Routen und demselben Tempo aktualisiert. Der Abbau von Rückständen kann mehrere Synchronisierungen dauern. Ist die Variable nicht gesetzt, steht sie auf `0`, unter 30 oder über 3650, bleibt der Standard-Cache mit einmaligem Abruf erhalten; **Alle aktualisieren** bleibt in den Einstellungen verfügbar.
