# Wetter

Crag Stats kann das **tägliche Wetter im Freien** für Klettereien mit Routenkoordinaten zwischenspeichern und es dann für Abzeichen, Dashboard- und Tourenbuch-Ansichten sowie für einen Vergleich nutzen, wie dein Klettern bei unterschiedlichem Wetter gelaufen ist.

## Optional aktivieren

Standardmäßig deaktiviert. Der Serverbesitzer setzt `WEATHER_IMPORT=true` in `.env` und startet neu. Nach jeder erfolgreichen Tourenbuch-Synchronisierung, über den Hintergrund-Importplan (`IMPORT_CRON`, standardmäßig täglich, was auch per CSV importierte Tourenbücher abdeckt) und unter **Einstellungen → Wetter importieren** ruft Crag Stats pro Durchlauf bis zu **50** fehlende Outdoor-Tage aus der historischen Wetter-API von [Open-Meteo](https://open-meteo.com/) ab – die ältesten Klettertage zuerst – mit mindestens **1.1 Sekunden** zwischen den Anfragen. Die Aktion in den Einstellungen startet diesen Durchlauf im Hintergrund, sodass die Seite nicht auf den gesamten Batch warten muss. Das Löschen der lokalen Daten leert den Cache.

Die kostenlose, nicht-kommerzielle Nutzung von Open-Meteo ist für persönliche, selbst gehostete Installationen gedacht. Aktiviere dies nicht für einen kommerziellen Multi-Tenant-Dienst, ohne vorher deren Nutzungsbedingungen und kostenpflichtige Optionen zu prüfen.

## Was abgerufen wird

- **Nur im Freien** — wahrscheinliche Indoor-/Hallenrouten werden übersprungen (dieselben Heuristiken wie bei den Zielen).
- **Koordinaten erforderlich** — Die Route muss Breitengrad und Längengrad besitzen (aus der Synchronisierung mit theCrag oder aus dem Routendaten-Import für CSV-Tourenbücher).
- **Vergangene Tage** — Das heutige UTC-Datum wird übersprungen; das Archiv ist für den aktuellen Tag oft unvollständig.
- **Gemeinsamer Cache-Schlüssel** — Breite/Länge werden auf **eine Nachkommastelle** gerundet, sodass sich nahe gelegene Routen an einem Klettergebiet einen Tageseintrag teilen.

Gespeicherte Felder: tägliche Max-/Mintemperatur (°C), Niederschlag (mm), WMO-Wettercode, mittlere Luftfeuchtigkeit und max./mittlerer Wind in 10 m Höhe (km/h). Anzeigeeinheiten für Temperatur (°C oder °F), Wind (km/h oder mph) und Niederschlag (mm oder in) können unter **Einstellungen → Anzeige & Sichtbarkeit** ausgewählt werden.

## Abzeichen

Sobald ein Tag zwischengespeichert ist, können diese Abzeichen durch jede **im Freien** getätigte Begehung an diesem Tag an diesem Ort freigeschaltet werden (Versuche zählen; Indoor-/Hallen-Einträge werden übersprungen, selbst wenn sie sich gerundete Koordinaten teilen):

| Abzeichen              | Regel                                                                               |
| ---------------------- | ----------------------------------------------------------------------------------- |
| **Hitzewelle**         | Tageshöchsttemperatur ≥ 35°C                                                        |
| **Frostbeule**         | Tagestiefsttemperatur ≤ 0°C                                                         |
| **Regen-Test**         | ≥ 1 mm Niederschlag und nicht als Schnee klassifiziert                              |
| **Klettern im Schnee** | WMO-Schneecodes (71–77, 85–86) oder ≥ 1 mm Niederschlag mit Höchstwert ≤ 1°C        |
| **Vom Winde verweht**  | Tagesmaximum des Windes in 10 m Höhe ≥ 50 km/h                                      |
| **Kaiserwetter**       | Höchstwert 15–25°C, gemessener Niederschlag < 0,1 mm, kein Schnee/Gewitter laut WMO |
| **Grip**               | Mittlere Luftfeuchtigkeit ≥ 85%                                                     |
| **Sturm-Durchstieg**   | Ein **Durchstieg** an einem Tag mit ≥ 10 mm Niederschlag ohne Schnee                |
| **Vier Jahreszeiten**  | Erhalte Hitzewelle, Frostbeule, Regen-Test und Klettern im Schnee mindestens einmal |

Ohne `WEATHER_IMPORT` (oder bevor der Rückstand abgerufen wurde) bleiben diese Abzeichen gesperrt, selbst wenn du unter diesen Bedingungen geklettert bist. Eine „Hitze-Strähne“ (viele Hitzetage in einer Woche) ist zurückgestellt.

## Wetter-Detailseite

Öffne [Wetter](/weather) aus der Analyse-Seitenleiste oder über einen der Titel der Wetter-Karten auf dem Dashboard. Das Dashboard zeigt kompakte Bedingungen und eine Zusammenfassung der Tageshöchsttemperatur/Durchstiegsquote an, wenn ein eindeutiges Signal vorliegt. Ohne eindeutiges Signal behält die Leistung ihre detaillierten Bereiche und Steuerungselemente bei; die Detailseite bietet immer die vollständige Ansicht. Gespeicherte Sichtbarkeiten und Positionen der Dashboard-Karten gelten weiterhin.

Auf der Detailseite werden Leistungsgruppierung und Messwert in der URL gespeichert (`group=temperature|conditions`, `measure=sendRate|nearLimit|onsightFlash`), sodass du eine Ansicht als Lesezeichen speichern und Zurück/Vorwärts verwenden kannst. Wettermuster beschreiben Korrelationen, keine Empfehlungen oder Ursachen.

**Abdeckung & Ortsqualität** unterscheidet zwischen nutzbaren zwischengespeicherten Ortstagen, geprüften Tagen mit nicht verfügbarem Wetter und noch nicht geprüften Tagen (einschließlich heute und zukünftigen Daten). Outdoor-Begehungen mit gültigem Datum, aber ohne ermittelten Ort werden separat gezählt: Sie können keinem Ortstag zugeordnet werden und sind von diesem Nenner ausgeschlossen. Die Bedingungen berücksichtigen alle Outdoor-Ticks; die Leistung berücksichtigt nur Durchstiege und Versuche. Import- und Ortssteuerungen verbleiben in den Einstellungen und sind für den angemeldeten Besitzer von der Wetter-Seite aus verlinkt.

Ohne zwischengespeichertes Outdoor-Wetter erklärt die Seite, wie der Import funktioniert. Geringe Cache-Bestände zeigen weiterhin die Bedingungen an, während die Leistung auf ihre erforderliche Mindeststichprobe wartet. Das Aufrufen von Wetter fordert niemals Anbieterdaten an.

## Wetterbedingungen

Die Dashboard-Karte **Wetterbedingungen** erscheint, sobald für mindestens einen Outdoor-Klettertag ein Wetter-Eintrag zwischengespeichert ist; ohne `WEATHER_IMPORT` (oder bevor der erste Abruf abgeschlossen ist) bleibt sie verborgen. Sie kann wie jede andere Karte unter Einstellungen → Dashboard angezeigt, ausgeblendet oder verschoben werden.

- **Tage** sind _Ortstage_: ein Kalendertag an einem zwischengespeicherten Ort (Breite/Länge auf eine Nachkommastelle gerundet). Ein Tag, der auf zwei Klettergebiete aufgeteilt ist, zählt doppelt; Hallen- und andere wahrscheinliche Indoor-Routen zählen nie.
- **Abdeckung** vergleicht Tage mit einem zwischengespeicherten Wetter-Eintrag mit allen Outdoor-Tagen, die über Routenkoordinaten verfügen. Tage ohne nutzbaren zwischengespeicherten Eintrag (einschließlich ungeprüfter und geprüfter, aber nicht verfügbarer Tage) werden als „ohne nutzbares Wetter“ aufgeführt und in jeder anderen Zahl der Bedingungsansicht ausgelassen.
- **Heißeste / kälteste Kletterei** nutzt die Tageshöchst- und Tagestiefsttemperatur. Der Link führt zur am frühesten eingetragenen Begehung dieses Tages auf theCrag.
- **Anteil der Tage** zeigt perfekte, regnerische, verschneite, frostige und heiße Tage als Anteil der Tage mit zwischengespeichertem Wetter unter Verwendung derselben Regeln wie bei den Abzeichen oben (Regen ≥ 1 mm und kein Schnee, Schneecodes, Tiefstwert ≤ 0°C, Höchstwert ≥ 35°C). Ein Tag kann in mehr als einer Zeile erscheinen, zum Beispiel ein frostiger, verschneiter Tag.
- Ein **Perfekter** Tag ist ein schöner Tag (Höchstwert 15–25°C, trocken, kein Schnee oder Gewitter), der auch windstill ist (Maximalwind unter 25 km/h), nicht humid (mittlere Luftfeuchtigkeit unter 85%) und über Nacht frostfrei blieb. Fehlen Wind, Luftfeuchtigkeit oder Tiefsttemperatur für einen Tag, wird er nicht als perfekt gezählt.
- **Tageshöchstwert** ist ein kleines Histogramm der maximalen Temperatur jedes Tages in 5°C-Schritten, beschriftet in der von dir gewählten Temperatureinheit. Bereiche schließen die untere Grenze ein und schließen die obere Grenze aus (zum Beispiel 0–<5°C oder 32–<41°F).

Dies sind Modellwerte für die nächstgelegene Gitterzelle, keine offiziellen Klimanormalwerte oder Messungen direkt an der Wand.

## Wetter & Leistung

Sobald für **20 oder mehr** Outdoor-Ortstage Wetterdaten zwischengespeichert sind, vergleicht die Detailansicht **Wetter & Leistung**, wie dein Outdoor-Klettern bei unterschiedlichem Wetter gelaufen ist. Davor wird angezeigt, wie viele berechtigte Ortstage bisher zwischengespeichert wurden. Die Dashboard-Zusammenfassung bleibt verborgen, solange kein Wetter zwischengespeichert ist, und kann unter Einstellungen → Dashboard verschoben oder ausgeblendet werden; die Detailseite bleibt mit einer Erklärung im Leerzustand zugänglich.

**Was gezählt wird.** Outdoor-Durchstiege und -Versuche (dieselbe Begehungs-Klassifizierung wie überall sonst), deren Ortstag über zwischengespeichertes Wetter verfügt. Hallenrouten, Begehungen, die weder ein Durchstieg noch ein Versuch sind, und Begehungen ohne Wetter-Ort werden ausgelassen. Begehungen, deren Wetter von einem ungefähren nahegelegenen Ort oder Gebiets-Polygon stammt, sind enthalten, und die Ansicht zeigt an, wie viele es sind.

Die kompakte Dashboard-Zusammenfassung zeigt die Tageshöchsttemperatur/Durchstiegsquote. Der Fallback ohne Signal und die Detailseite bieten die beiden folgenden Steuerungselemente an.

**Gruppieren nach:**

- **Tageshöchstwert:** unter 10°, 10–17°, 18–24°, 25–29° und 30°+. Jeder Bereich schließt seine untere Grenze ein und endet knapp vor der nächsten, ähnlich wie der Temperaturbereich im Tourenbuch.
- **Bedingungen:** Schön, Trocken (gemessener Niederschlag unter 1 mm und kein Schnee; fehlender Regen gilt als unbekannt, nicht trocken), Regnerisch, Verschneit, Heiß, Frostig, Windstill (Maximalwind unter 25 km/h) und Windig (≥ 50 km/h) gemäß den obigen Abzeichen-/Tourenbuch-Regeln. Ein Tag kann mehrere Bedingungen erfüllen. Gemessener Wind von 25 bis unter 50 km/h ist weder Windstill noch Windig.

**Messwerte:**

- **Durchstiegsquote:** Durchstiege als Anteil an Durchstiegen und Versuchen.
- **Nahe am Limit:** der Anteil bewerteter Durchstiege innerhalb von 2 Grad (1 V-Grad auf der V-Skala) deines schwersten Outdoor-Durchstiegs des **gleichen Stils und der gleichen Skala** in den 365 Tagen vor diesem Tag. Trad wird mit Trad verglichen und Sportklettern mit Sportklettern; V-Skala und Routengrade werden niemals gemischt. Die Verwendung deiner kürzlichen Bestleistung anstelle deiner Allzeit-Bestleistung sorgt dafür, dass ein Kraftzuwachs über die Jahre hinweg das aktuelle Wetter nicht besser aussehen lässt. Durchstiege ohne früheren Durchstieg desselben Stils in diesem Jahr sowie unbewertete Durchstiege werden bei diesem Messwert ausgelassen.
- **Onsight/Flash:** Onsights und Flashes als Anteil an Durchstiegen.

**Ehrliche Auswertung.**

- Jeder Balken zeigt die Quote des Bereichs; die Linie markiert deine Gesamtquote. Ein Bereich benötigt mindestens **10** Begehungen (für den Nenner dieses Messwerts) über mindestens **3** Tage, bevor eine Quote angezeigt wird. Kleinere Bereiche zeigen „Nicht genügend Daten“ an.
- Ein Bereich wird nur dann als **Höher** oder **Niedriger** markiert, wenn er sich von all deinen _anderen_ Wettertagen stärker unterscheidet, als es Schwankungen von Tag zu Tag erklären (ein zweiseitiger Test bei etwa 95 %), mit mindestens 5 Tagen auf jeder Seite. Begehungen am selben Tag teilen sich dasselbe Wetter und meist dasselbe Klettergebiet und denselben Partner, daher behandelt der Test jeden Ortstag als eine Einheit und nicht jede Begehung. Ein einzelner großer Klettertag kann für sich genommen kein Muster erzeugen.
- Die einzeilige Zusammenfassung nennt den Bereich, der für den gewählten Messwert am stärksten hervorsticht, oder gibt an, dass noch nichts hervorsticht.
- Dies ist eine **Korrelation, keine Ursache**. Jahreszeit, Klettergebiet, Kletterpartner und dein Fortschritt in einem Projekt ändern sich alle mit dem Wetter. Bei vielen Bereichen und Messwerten kann gelegentlich rein zufällig ein „Höher“ oder „Niedriger“ auftreten.

Jeder Tageshöchstwert-Bereich und die Bedingungen schön, Regen, Schnee, Hitze, Frost, windstill und windig verlinken auf das Tourenbuch, gefiltert nach diesen Begehungen. Trocken hat keinen Tourenbuch-Filter. Eine Wertetabelle unter den Balken der Detailseite listet jeden Bereich mit Anzahlen für alle drei Messwerte auf. Das Aufrufen der Karte löst niemals eine Wetteranfrage aus, und private Notizen werden niemals verwendet.

Wenn der Vergleich zwischen Tageshöchstwert und Durchstiegsquote auf dem Dashboard kein eindeutiges Signal zeigt, behält die Karte „Wetter & Leistung“ ihre detaillierten Bereiche, lokalen Steuerungen für Gruppierung/Messwert und die Wertetabelle bei. Diese Steuerungen lassen die Dashboard-URL unverändert. Ein eindeutiges Signal behält die kompakte Zusammenfassung bei; beide Versionen verlinken auf die Wetter-Seite. Schwellenwerte für die Mindeststichprobe sind unverändert.

## Tourenbuch-Filter und Chips

Referenzen nahe am Limit nutzen dieselbe Berechnung nach Stil und Skala wie
[Fels & Leistung](/docs/rock-types), wobei – sofern verfügbar – die Grade der gekletterten Seillängen verwendet werden.
Die Wetterreferenz schließt Outdoor-Durchstiege ohne zwischengespeichertes Wetter ein, schließt
den 365. vorherigen Tag ein und schließt Durchstiege am verglichenen Tag aus.

Sobald irgendwelche Wetterdaten zwischengespeichert sind, erhält das Tourenbuch einen Filter **Tageswetter** (`?weather=`): `fair`, `perfect`, `heat`, `freeze`, `rain`, `snow`, `wind` oder `calm`. **Windiger Tag** entspricht einem täglichen Windmaximum in 10 m Höhe von **≥ 50 km/h**, derselben Schwelle wie bei **Vom Winde verweht**. **Windstiller / ruhiger Tag** entspricht einem gemessenen Maximalwind von **unter 25 km/h**, dem Schwellenwert für Windstille bei **Perfekter Tag**, ohne dass schöne Temperaturen, trockenes Wetter oder geringe Luftfeuchtigkeit erforderlich sind. Fehlende Windmesswerte passen zu keiner der Optionen; Tage von 25 bis unter 50 km/h passen zu keinem der beiden Windfilter. Die anderen Optionen nutzen dieselben Regeln wie die Abzeichen. Es entspricht nur **Outdoor**-Begehungen mit Routenkoordinaten und einem zwischengespeicherten Tag für diesen Ort; Hallenrouten, Begehungen ohne Koordinaten und Tage, die nicht abgerufen wurden, stimmen nie überein.

Zeilen an zwischengespeicherten Tagen zeigen auch kleine Text-Chips (zum Beispiel „Heiß 36°C“, „Frostig -2°C“, „Regen 4 mm“, „Schnee“, „Windig 55 km/h“, „Schön 21°C“). Gewöhnliche Tage zeigen nichts an.

Der angemeldete Besitzer erhält außerdem **Kein Wetter zwischengespeichert** (`?missing=weather`), was Outdoor-Begehungen mit Koordinaten und einem vergangenen Datum auflistet, die noch kein zwischengespeichertes Wetter haben, sodass du siehst, was die nächsten Importe abrufen werden. Besucher sehen diese Option nie.

Der Rückstand an fehlendem Wetter schließt Tage aus, die der Anbieter bereits geprüft hat, aber nicht liefern konnte. Diese negativen Cache-Einträge erzeugen keine Wetter-Chips und werden nicht automatisch erneut in die Warteschlange gestellt. Ungültige Kalenderdaten sind sowohl vom Importer als auch vom Rückstand ausgeschlossen.

## Neueste Aktivitäten

Die Dashboard-Karte **Neueste Aktivitäten** zeigt dieselben Text-Chips unter einer Outdoor-Kletterei an, wenn ihr Tag zwischengespeichert ist. Sie werden als kurze Liste mit der Beschriftung „Tageswetter“ gelesen, niemals nur in Farbe, und die Leiste wird bei Hallenrouten, nicht zwischengespeicherten Tagen und gewöhnlichem Wetter weggelassen.

## Kletter-Story

Story-Prozentangaben beschreiben zwischengespeicherte Outdoor-Ortstage, nicht Tage, deren Wetter noch unbekannt ist.

Wenn der Cache mindestens 20 Outdoor-Tage und die Hälfte oder mehr deiner Outdoor-Tage abdeckt, kann die [Kletter-Story](/docs/climbing-story) eine kurze Zeile über die Bedingungen hinzufügen, unter denen du kletterst (Schnee, Kälte, Hitze, Regen oder eine große Temperaturspanne). Sie beschreibt, bei was du tatsächlich kletterst, nie was du meidest, und bleibt bei geringer Abdeckung aus der Story heraus.

## Begehungskalender

Der [Begehungskalender](/docs/ascent-calendar) hat einen Farbmodus **Wetter** (wird erst angezeigt, wenn Wetterdaten zwischengespeichert sind). Er nutzt dieselben Abzeichen-Regeln; siehe diese Seite für die Farblegende.

## Sektoren: Klima bei deinen Besuchen

Auf der Seite **Sektoren** zeigt ein Klettergebiet mit mindestens **5** zwischengespeicherten Outdoor-Besuchstagen eine einzeilige Zusammenfassung: durchschnittlicher Tageshöchst- und -tiefstwert sowie der Anteil dieser Tage mit Regen, Schnee, Frost oder Hitze (Schnee, Frost und Hitze nur, wenn über 0%). Sie beschreibt die Tage, an denen du tatsächlich dort geklettert bist, tendiert also zu den Jahreszeiten, in denen du dort bist. Es handelt sich **nicht** um offizielle Klimanormalwerte oder eine Vorhersage, und die Angabe wird bei Klettergebieten unterhalb des Schwellenwerts, bei Hallenrouten und wenn kein Wetter zwischengespeichert ist, ausgeblendet.

## Schönwetter-Quote

Sobald für **20 oder mehr** Outdoor-Tage Wetterdaten zwischengespeichert sind, ergänzt die Karte „Wetterbedingungen“ eine **Schönwetter-Quote**: den Anteil jener Tage, die _schön_ waren (Höchstwert 15–25°C, trocken, kein Schnee oder Gewitter – dieselbe Regel wie bei **Kaiserwetter**). Sie berichtet auch über den Anteil _harter_ Tage (heiß, frostig, nass, verschneit oder sehr windig). Dazwischenliegende Tage, wie ein trockener Tag mit 29°C, werden in keiner Gruppe gezählt.

Die Bezeichnung ist beschreibend, keine Bewertung: **Neigung zu Schönwetter** bei 60% schön oder mehr, **Allwetter-Kletterer** bei 50% hart oder mehr, ansonsten **Ein bisschen von beidem**. Die Gruppen können sich überschneiden: Ein milder, trockener Tag kann dennoch sehr windig oder über Nacht frostig sein. Wenn beide Bezeichnungsschwellenwerte erreicht werden, hat **Allwetter-Kletterer** Vorrang. Unter 20 Tagen wird nichts angezeigt, sodass ein geringer Cache-Bestand dich niemals kategorisiert. Der Link öffnet das Tourenbuch, gefiltert nach schönen Tagen.
Für saisonale Empfehlungen aus Routen-Metadaten siehe [Beste Monate](/docs/best-months); diese Empfehlungen sind unabhängig vom Wetter, das bei deinen eingetragenen Besuchen gemessen wurde.

Schönwetter-Bezeichnungen nutzen die exakte Tagesanzahl für ihre Schwellenwerte; angezeigte Quoten werden auf eine Nachkommastelle gerundet. Die gerundete Anzeige allein ändert niemals deine Bezeichnung.

### Von den Wetter-Details zum Tourenbuch

Jede Bedingungszeile und jeder Tageshöchstwert-Balken in der Detailansicht **Wetterbedingungen** öffnet das Tourenbuch, gefiltert nach diesen Tagen. Ein Temperaturbalken schließt seine untere Grenze ein und endet knapp vor dem nächsten Balken (zum Beispiel deckt 20–24° 20.0 °C bis unter 25 °C ab). Der Bereich bleibt angewendet, während du sortierst, blätterst oder andere Filter hinzufügst; nutze **Wetterbereich löschen**, um nur diesen Bereich zu entfernen.

Die Karte zählt Outdoor-_Tage_ an jedem Ort, während das Tourenbuch jede passende _Begehung_ auflistet, sodass die zwei Zahlen voneinander abweichen können. Auf breiten Bildschirmen zeigt das Tourenbuch eine Wetter-Spalte mit dem zwischengespeicherten Tageshöchstwert, -tiefstwert und Regen; auf kleineren Bildschirmen erscheinen die Bedingungs-Chips stattdessen neben der Route. Indoor- oder nicht zwischengespeicherte Begehungen zeigen einen Bindestrich. Das Aufrufen dieser Seiten löst niemals eine Wetteranfrage aus.

## Wetter-Orte, wenn Routenkoordinaten fehlen

CSV-Exporte enthalten keine Koordinaten. Wenn sowohl Wetter-Import als auch Routendaten-Import aktiviert sind (`WEATHER_IMPORT=true` und `ROUTE_DATA_IMPORT=true`), kann der konfigurierte Supporter-API-Schlüssel auch Orte für die Klettergebiets-/Sektor-IDs nachschlagen, die in den zwischengespeicherten Routendaten gefunden wurden. Dies importiert weder das Tourenbuch noch das Profil des Besitzers dieses Schlüssels. Sowohl schlüsselbasierte Tourenbuch-Vorfahren als auch Routen-API-Vorfahren-Arrays werden unterstützt.

Gebiets-Abfragen teilen sich das Budget von zehn Anfragen und den Ein-Sekunden-Takt des Routenimports. Routenprüfungen verbrauchen das Budget zuerst; verbleibende Anfragen prüfen jeweils bis zu zehn Gebiete. Die Einstellungen zeigen **ausstehende Wetter-Gebiete** an und bieten **Wetter-Orte jetzt prüfen** an, sobald alle Routen geprüft wurden. Bestehende CSV-Installationen können fehlende Gebietsorte ohne **Alle Routen aktualisieren** auffüllen. Der nächste Import-Durchlauf prüft auch den Rückstand. Sobald die Ortsprüfungen abgeschlossen sind, startet ein Hintergrund-Wetter-Batch, sofern berechtigte Tage vorhanden sind.

Gebiets-Antworten (einschließlich fehlender Orte) werden einmalig anhand der Anbieter-Gebiets-ID zwischengespeichert. `ROUTE_DATA_REFRESH_DAYS` steuert auch deren optionales Aktualisierungsalter, und **Alle Routen aktualisieren** macht Gebiets-Abfragen wieder berechtigt. Zugriffsfehler stoppen den Import und nutzen dessen bestehendes Backoff; ein Schlüssel, der die Routen-Historie lesen kann, hat nicht garantiert Zugriff auf Gebietsorte. Wenn die API keinen unterstützten Ort liefert, nutze den expliziten Fallback für nahegelegene Orte unten. Beim Aufrufen von Wetter-Seiten werden keine API-Aufrufe ausgeführt.

Wetter bevorzugt einen expliziten Routenpunkt, dann den Punkt des übergeordneten Klettergebiets (TLC) und schließlich den Punkt des unmittelbaren Sektors aus den zwischengespeicherten Anbieterdaten. Reine Länder-Geometrien sowie beliebige Vorfahren-Geometrien werden ignoriert. Ältere zwischengespeicherte Punkte ohne originale Anbieter-Geometrie bleiben nutzbar und werden als „Zwischengespeicherter Punkt“ beschriftet; ihre ursprüngliche Genauigkeit kann nicht allein aus diesem Punkt wiederhergestellt werden. Hallenrouten bleiben ausgeschlossen.

Einstellungen → Wetter importieren → **Wetter-Orte überprüfen** listet Outdoor-Gebiete und die Anzahl ungelöster Routen auf. Suche bei einem fehlenden Ort nach einer nahegelegenen Stadt unter Verwendung ihres Namens/ihrer Region und eines zweistelligen Ländercodes und wähle dann explizit das richtige Ergebnis aus. Die Suche übermittelt nur den eingegebenen Text und den Ländercode an [Open-Meteo-Geokodierung](https://open-meteo.com/en/docs/geocoding-api), deren Ortsdaten von GeoNames stammen. Es werden keine Routen, Begehungsdaten, private Notizen oder API-Schlüssel gesendet. Suchen erfolgen erst nach Absenden des Formulars, werden für 30 Tage zwischengespeichert, getaktet und nutzen bei Fehlern ein Backoff.

Eine ausgewählte Stadt ist ein **ungefährer Fallback für nahegelegene Orte**, der nur von derselben Anbieter-Gebiets-ID (oder Routen-Identität, falls keine Gebiets-ID existiert) geteilt wird. Er überschreibt keine Routenkoordinaten, ändert keine Routenkarten und erhebt keinen Anspruch darauf, die nächstgelegene Siedlung zu sein. Ein gültiger Routen-/Sektor-/Klettergebietspunkt gewinnt immer. Das Wetter in der Stadt kann sich von dem an der Felswand aufgrund von Entfernung, Höhe und Gelände unterscheiden, daher erscheinen stadtbasierte Daten in Wetteransichten und -filtern, **schalten aber keine Wetter-Abzeichen frei**. Du kannst den Fallback jederzeit entfernen.

Das Tourenbuch und die neuesten Aktivitäten zeigen die Quelle des Wetter-Orts. Importer, Rückstand, Kalender, Bedingungskarte, Klettergebiets-Besuchszusammenfassungen und Tourenbuch nutzen denselben aufgelösten Ort/Tag-Schlüssel. Das Ändern oder Entfernen eines Fallbacks stoppt sofort die Nutzung seines alten Schlüssels; altes Wetter bleibt zwischengespeichert und kann weiterhin von anderen Klettereien an diesem Ort genutzt werden. Rufe den nächsten Wetter-Batch ab, um einen neu gewählten Ort aufzufüllen. Das Löschen der lokalen Daten entfernt Zuordnungen, Ortsauswahlen und Suchergebnisse und bricht laufende Suchen ab.

Fehlen diese Punkte, kann eine ausdrücklich als GeoJSON Polygon/MultiPolygon typisierte Geometrie eines identifizierten Gebiets oder Sektors direkt ihre erste Koordinate auf der äußeren Begrenzung liefern; es wird weder ein Mittelpunkt noch ein Flächenschwerpunkt berechnet. Dies ist als **Ungefähres Flächenpolygon** gekennzeichnet und schaltet weder Wetter- noch „Sommersonnenwand“-Abzeichen frei. Routen- und Klettergarten-Punkte haben immer Vorrang. Länder-/Regionsgrenzen, fehlerhafte Formen, große Flächen (über einer konservativen Begrenzungsdiagonale von 15 km) und Formen, die die Datumsgrenze kreuzen, sind ausgeschlossen. Untypisierte Grenz-Arrays und undokumentierte Fence-Formate werden weiterhin nicht unterstützt; bisher ist keine erfasste Provider-Polygon-Fixture verfügbar. Eine ausgewählte Stadt wird nur verwendet, wenn auch diese Geometrie-Fallbacks fehlschlagen. Der Wetterimport muss weiterhin aktiviert sein, um fehlende Tage abzurufen. Sommersonnenwand nutzt separat verifizierte Routen-Tag-Nachweise; siehe [Abzeichen](/docs/badges).
