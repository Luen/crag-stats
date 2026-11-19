# Anzeigeeinstellungen

**Einstellungen → Anzeige & Sichtbarkeit** legt fest, wie Datum und Maßeinheiten auf der gesamten Website dargestellt werden. Die Einstellungen gelten für alle Besucher – nicht nur im Browser des Besitzers – und werden beim nächsten Laden der Seite wirksam.

## Datumsformat

| Option          | Beispiel      |
| --------------- | ------------- |
| **Automatisch** | 27. Okt. 2026 |
| **TT/MM/JJJJ**  | 27/10/2026    |
| **MM/TT/JJJJ**  | 10/27/2026    |
| **JJJJ-MM-TT**  | 2026-10-27    |

**Auto** richtet sich nach dem Anzeige-Gebietsschema der Website (`DISPLAY_LOCALE`), sodass es für die meisten Besucher ohne zusätzliche Konfiguration natürlich lesbar ist.

Das Format ändert die sichtbaren Kalendertage auf dem Dashboard, im Tourenbuch, auf den Wetterseiten, bei Abzeichen, Zielen, Meilensteinen und Diagrammen. Filter-Links, `datetime`-Attribute, Diagrammdaten und URL-Parameter behalten ihre ISO-Werte im Format `YYYY-MM-DD`, sodass ein geteilter Link immer auf denselben Tag verweist.

## Maßeinheiten

Jede Maßeinheit hat ihre eigene Einstellung, sodass du sie beliebig kombinieren kannst:

| Messgröße        | Optionen                      |
| ---------------- | ----------------------------- |
| **Höhe**         | Meter (m), Fuß (ft)           |
| **Distanz**      | Kilometer (km), Meilen (mi)   |
| **Temperatur**   | Celsius (°C), Fahrenheit (°F) |
| **Wind**         | km/h, mph                     |
| **Niederschlag** | Millimeter (mm), Zoll (in)    |

Die Voreinstellungen füllen alle fünf auf einmal aus:

- **Metrisch**: Meter, Kilometer, Celsius, km/h und Millimeter.
- **Imperial (US)**: Fuß, Meilen, Fahrenheit, mph und Zoll.
- **UK (Gemischt)**: Meter, Meilen, Celsius, mph und Millimeter.

Voreinstellungen sind nur eine Abkürzung: Wenn du danach eine einzelne Einheit änderst, erhältst du eine benutzerdefinierte Mischung, und das Formular „Einstellungen“ zeigt an, welche Werte gespeichert sind.

## Was metrisch bleibt

Die Datenbank speichert Höhen immer in Metern, Entfernungen in Kilometern, Temperaturen in °C, Wind in km/h und Niederschlag in Millimetern. Die Umrechnung erfolgt erst beim Rendern einer Seite. Das Wechseln von Einheiten überschreibt daher niemals dein Tourenbuch, deine Ziele oder deine Importe.

- Der **CSV-Export** behält seine kanonischen metrischen Spalten bei.
- **Abzeichen-Schwellenwerte** (Höhenmarken, Hitze, Frost, Regen, Wind usw.) sind metrisch definiert. Nur der Wortlaut wird umgerechnet. Zum Beispiel heißt es bei **Hitzewelle** metrisch „35 °C oder heißer“ und in Fahrenheit „95 °F oder heißer“. Dieselben Begehungen bringen in beiden Fällen dieselben Abzeichen ein.
- **Wetterfilter** wie die Filter für Hitze, Frost, Regen, Schnee und Wind im Tourenbuch behalten ihre metrischen Schwellenwerte bei.
- **Umrechnungen werden für die Anzeige gerundet**, sodass ein in Fuß, Meilen oder Zoll angezeigter Wert eine Annäherung ist und kein zweiter gespeicherter Messwert.

## Einmalige Überschreibungen

Das Dashboard akzeptiert `?units=metric`, `?units=imperial` oder `?units=uk`, um eine Vorschau einer Voreinstellung anzuzeigen, ohne sie zu speichern. Einzelne Parameter überschreiben jeweils eine Messgröße: `unitHeight`, `unitDistance`, `unitTemp`, `unitWind` und `unitPrecip` (zum Beispiel `?unitTemp=fahrenheit&unitWind=mph`). Diese gelten nur für diesen Seitenaufruf und ändern die Einstellungen nicht.

## Wo die Einstellungen erscheinen

Datums- und Einheiteneinstellungen wirken sich auf das Dashboard, das Tourenbuch, den Aktivitätskalender, die Trainingsbelastung, die Wetterseiten, Sektoren, die Kletterkarte, Ziele, Abzeichen, Meilensteine, Einbettungs-Karten und den Offline-Snapshot aus. Gradsysteme sind separat: Siehe [Schwierigkeitsgrade](/docs/grades).
