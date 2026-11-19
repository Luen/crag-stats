# Begehungskalender

Der **Begehungskalender** ist eine Jahres-Heatmap der Tage, an denen du Begehungen geloggt hast. Die Zellen verlinken auf `/logbook?day=` für das jeweilige Datum.

## Intensität

Die Farben skalieren danach, wie viele Begehungen du an diesem Tag geloggt hast (keine → wenige → viele), und verwenden denselben grünen Farbverlauf. Versuche zählen zur Intensität; im Tooltip wird die Anzahl der Durchstiege weiterhin separat angezeigt.

## Schwierigkeitsgrad

Jeder Tag wird nach der **schwierigsten erfolgreichen Begehung** an diesem Tag eingefärbt, wobei dieselbe Farbpalette von Anfänger → Elite wie bei den Grad-Chips an anderer Stelle verwendet wird. Tage mit reinen Versuchen (keine Begehung) verwenden eine gedämpfte „Versuch“-Füllung. Wenn an einem Tag Boulder- und Routengrade zusammenkommen, wählt der Kalender die höhere Bandkennung — die Bänder sind zwischen den Systemen nicht vollständig vergleichbar.

Deine Auswahl zwischen Intensität und Schwierigkeitsgrad wird im Browser gespeichert (`cs_heatmap_mode`).

## Wetter

Sobald der optionale [Wetter-Cache](/docs/weather) Daten für einen deiner Klettertage enthält, erscheint ein dritter Modus: **Wetter**. Jeder Klettertag erhält die Farbe der Bedingungen bei seiner ersten Outdoor-Begehung mit gespeicherten Wetterdaten: Schnee, Regen, Hitze (35°C+), Frost, gutes Wetter (15–25°C und trocken) oder mildes Wetter. Dabei gelten dieselben Regeln wie für die Abzeichen. Tage ohne zwischengespeicherte Wetterdaten (Kletterhalle, keine Koordinaten, noch nicht abgerufen) bleiben in einem gedämpften Grau. Tooltips führen Höchst- und Tiefsttemperatur sowie Regen auf, und eine Tabelle **Wetterwerte anzeigen** unter dem Kalender zeigt dieselben Zahlen als Text für das ausgewählte Jahr an.

Kalenderzellen behalten in jeder Browser-Zeitzone das eingetragene Kalenderdatum bei, auch über Zeitumstellungen hinweg. Sie wandeln Klettertage nicht in lokale Zeitstempel um.
