# Abzeichen

Die meisten Abzeichen würdigen Klettermeilensteine: deine erste Einheit oder deinen ersten Durchstieg, Begehungszahlen, Schwierigkeitsgrade und mehr. Sie verwenden das Datum der jeweiligen Begehung in deinem Tourenbuch. Der Import einer älteren Begehung kann einen Klettermeilenstein daher auf ein früheres Datum verschieben.

**Erste Züge** würdigt, dass du dein Tourenbuch in Crag Stats eingebracht hast. Das Datum entspricht dem ersten erfolgreichen Import oder der ersten erfolgreichen Synchronisierung mit mindestens einer Begehung; die Anzahl wird bei diesem Import gespeichert. Spätere Synchronisierungen und importierte ältere Begehungen ändern dieses Datum nicht. Es gibt keinen Link zu einer einzelnen Begehung. Importzeitpunkte verwenden die Anzeige-Zeitzone der Website.

Wenn in einer älteren Datenbank kein Importdatum gespeichert ist, liefert es der nächste erfolgreiche Import mit mindestens einer Begehung. Bereits gespeicherte Daten bleiben erhalten.

Das Löschen der lokalen Daten setzt diesen Meilenstein zusammen mit dem Tourenbuch zurück; der nächste erfolgreiche Import mit Begehungen beginnt einen neuen.

## Reihenfolge

Verdiente Abzeichen werden nach der auslösenden Begehung sortiert, mit der neuesten zuerst. Die Dashboard-Karte zeigt die neuesten acht. Am selben Tag verdiente Abzeichen behalten ihre Reihenfolge aus der Galerie. Erste Züge und die Schätzungen zu Community-Begehungen sind keiner Begehung zugeordnet und stehen deshalb hinter allen Abzeichen mit Begehungsdatum.

## Gezählte Begehungsarten

Die Einstellung **Gezählte Begehungsarten** unter Einstellungen → Anzeige und Sichtbarkeit bestimmt, welche deiner eingetragenen Begehungen für die jeweiligen Abzeichen zählen. Die Einstellung selbst wird unter [Begehungsarten](/docs/tick-types) erklärt.

- Begehungsarten mit **Nur Projekte und Ziele** fehlen in den hervorgehobenen Begehungszahlen und Dashboard-Summen, zählen aber weiterhin für Abzeichen: **Beharrlichkeit zahlt sich aus**, Tagesserien, **Mehrseillängentag**, **Reisewoche**, Höhenmeilensteine und andere Aktivitätsabzeichen berücksichtigen sie weiterhin. Höhenmeilensteine wachsen daher auch durch Projektversuche, obwohl deine Begehungssummen diese nicht mitzählen.
- Begehungsarten mit **Ausblenden** bringen keine Abzeichen: Diese Begehungen sind von Abzeichen und allen anderen Auswertungen ausgeschlossen.

Diese Unterscheidung ist beabsichtigt. Die hervorgehobenen Summen filtern deine Durchstiege, während Abzeichen deine Aktivitäten beschreiben — ein Projektversuch bleibt ein Tag am Fels und zählt für die entsprechenden Aktivitätsabzeichen. Wenn ein erwartetes Abzeichen fehlt, prüfe, ob die Begehungsart ausgeblendet und nicht nur von den Summen ausgeschlossen ist.

## Gekletterte Strecke

Höhenabzeichen zählen die Gesamthöhe deiner eingetragenen Begehungen: 1, 5, 10, 20, 50, 100 und 150 km. Jedes erhält das Datum der Begehung, mit der deine laufende Summe die Marke überschreitet. **250-m-Tag** summiert dagegen die an einem einzelnen Kalendertag gekletterte Höhe.

Abzeichenschwellen sind metrisch definiert und ändern sich nie mit der eingestellten Anzeigeeinheit. Nur die Beschriftung wird umgerechnet: Bei imperialen Einheiten wird **1 km geklettert** in Meilen und **250-m-Tag** in Fuß angezeigt. Dieselben Begehungen bringen in beiden Einheitensystemen genau dieselben Abzeichen. Siehe [Anzeigeeinstellungen](/docs/display-settings).

## Wetter

**Hitzewelle**, **Frostbeule**, **Regen-Test**, **Klettern im Schnee**, **Vom Winde verweht**, **Kaiserwetter**, **Grip**, **Sturm-Durchstieg** und **Vier Jahreszeiten** benötigen den optionalen Outdoor-Wetter-Cache (`WEATHER_IMPORT`). Siehe [Wetter](/docs/weather). Solange diese Tage nicht abgerufen wurden, bleiben die Abzeichen gesperrt. **Sturm-Durchstieg** erfordert einen erfolgreichen Durchstieg an einem Tag mit Starkregen; Versuche allein zählen nicht.

## Fast geschafft

Auf der vollständigen Seite **[Abzeichen](/badges)** zeigt **Fast geschafft** bis zu drei gesperrte Abzeichen, deren Abschluss am nächsten liegt. Berücksichtigt werden nur **zählbare** Schwellenwerte (Begehungssummen, Höhe, Durchstiege in Schwierigkeitsbändern, EB-/EFB-Zahlen, eingerichtete Routen und Ähnliches). Einmalige Ereignisabzeichen wie Feiertage, Wettertage oder Erste Züge sind ausgeschlossen. Der Fortschritt wird nach dem erreichten Zielanteil sortiert (bis zum Erwerb auf unter 100% begrenzt); bei gleichem Anteil stehen kleinere Ziele zuerst. Die Abzeichenkarte im Dashboard zeigt weiterhin nur kürzlich verdiente Abzeichen.

## Partner, Mehrseillängen und Reisen

Diese vier Abzeichen verwenden bereits vorhandene Tourenbuchfelder und erhalten das Datum der Begehung, die sie vervollständigt:

| Abzeichen                         | Regel                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Voller Standplatz**             | Eine Begehung nennt mindestens 3 verschiedene Partner (Namen werden ohne Berücksichtigung der Groß-/Kleinschreibung abgeglichen).                                                                                                                                                                                                                           |
| **Mehrseillängentag**             | Du steigst an einem Kalendertag mindestens 3 Seillängen durch: Bereiche und Listen von Seillängen werden aufgelöst und je Route und Tag ohne Duplikate gezählt. Einträge für die gesamte Route und einzelne Seillängen werden nicht doppelt gezählt. Wenn gespeicherte API-Ticks für Seillängen vorliegen, zählen nur erfolgreich durchstiegene Seillängen. |
| **Reisewoche**                    | Du trägst innerhalb von 7 aufeinanderfolgenden Tagen Begehungen in 4 verschiedenen Outdoor-Gebieten ein. Kletterhallen und unbekannte Gebiete zählen nicht.                                                                                                                                                                                                 |
| **Beharrlichkeit zahlt sich aus** | Du steigst eine Route erstmals durch, nachdem du sie an mindestens 4 verschiedenen Tagen eingetragen hast (einschließlich Versuchen). Wiederholungen bereits durchstiegener Routen zählen nicht.                                                                                                                                                            |

Es handelt sich um einmalige Ereignisabzeichen; deshalb erscheinen sie nicht unter **Fast geschafft**.

## Wiederholungen und neue Routen

Diese Abzeichen verwenden die Regeln der Karte [Wiederholungen und neue Routen](/docs/repeats). Routen werden anhand ihrer theCrag-Routen-ID zugeordnet, Versuche zählen mit, und jedes Abzeichen erhält das Datum der Begehung, die es vervollständigt.

| Abzeichen                   | Regel                                                                                                                                              |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Entdecker**               | Eingetragene Begehungen auf 50 verschiedenen Routen.                                                                                               |
| **Routensammler**           | Eingetragene Begehungen auf 100 verschiedenen Routen.                                                                                              |
| **Routensammler**           | Eingetragene Begehungen auf 250 verschiedenen Routen.                                                                                              |
| **Kletterführer-Entdecker** | Eingetragene Begehungen auf 500 verschiedenen Routen.                                                                                              |
| **Dauerbrenner**            | Eine Route an 10 verschiedenen Tagen geklettert. Mehrere Begehungen an einem Tag zählen einmal.                                                    |
| **Heimgebiet**              | 25 Wiederholungsbegehungen auf Routen in einem Gebiet (an Tagen nach dem ersten eingetragenen Tag der jeweiligen Route). Erstbesuche zählen nicht. |

Alle sechs sind zählbar und können daher unter **Fast geschafft** erscheinen.

## Sommersonnenwand

Trage im örtlichen meteorologischen Sommer eine Outdoor-Begehung an einer zum Äquator ausgerichteten Route ein: N/NE/NW im Dezember–Februar auf der Südhalbkugel oder S/SE/SW im Juni–August auf der Nordhalbkugel. Diese konservative Variante gilt für absolute Breitengrade von 25° bis 60° (ausschließlich). Versuche zählen als eingetragene Begehungen, wie bei den Wettertagsabzeichen. Das Abzeichen wird einmalig am frühesten passenden Tag freigeschaltet und hat keinen Zähler unter Fast geschafft.

Zuerst werden die eigenen Sonnen- und Ausrichtungs-Tags der Route verwendet. Hat sie keine eigenen Expositions-Tags, können geerbte Tags des **unmittelbar übergeordneten Objekts** einspringen (zum Beispiel Sektor, Felswand oder Boulder). Die Quell-ID des gespeicherten Tags muss genau diesem übergeordneten Objekt entsprechen. Tags höherer Vorfahren, unbekannter Quellen und großer geografischer Gebiete werden niemals als Ersatz verwendet. Eigene Expositions-Tags der Route haben Vorrang, auch wenn das übergeordnete Objekt etwas anderes angibt; unbekannte oder widersprüchliche Routenausrichtungen lösen keinen Rückgriff auf dessen Tags aus.

Auf der gewählten Ebene kann **Ganztägig Sonne** auch ohne Himmelsrichtung genügen. **Immer schattig** verhindert die Vergabe. Andernfalls muss die Ausrichtung wie oben beschrieben zum Äquator zeigen; Tags für Sonne nur am Morgen, Mittag oder Nachmittag reichen allein nicht aus. Sonnen- und Ausrichtungs-Tags müssen nicht gemeinsam vorhanden sein.

Indoor-Begehungen, ungültige Daten, tropische oder hoch gelegene Breitengrade, ältere Standortangaben unbekannter Genauigkeit und Näherungen über benachbarte Orte erfüllen die Voraussetzungen nicht. Aktualisierungen der gespeicherten Daten stellen die Herkunft von Route, direktem Elternobjekt und höheren Vorfahren ohne erneute Synchronisierung oder externe Anfrage wieder her.

Erfasst wird die vom Anbieter beschriebene Exposition zusammen mit einer saisonalen Näherungsregel. Daraus lassen sich weder deine Kletterzeit noch tatsächlicher Sonnenschein, Schatten durch Überhänge oder die Felstemperatur ableiten; ein Open-Meteo-Cache ist nicht erforderlich. Das separate Hitzeabzeichen beschreibt eine gespeicherte hohe Lufttemperatur. Reduzierte echte API-Tag-Testdaten und ihre Herkunft sind im Repository dokumentiert.

## Greenpoint

**Greenpoint** ist ein einmaliges Abzeichen für den Vorstieg einer mit Bohrhaken gesicherten Sportroute mit eigener mobiler Sicherung. Es wird freigeschaltet, sobald du erstmals entweder:

- bei theCrag einen als Durchstieg zählenden Tick **Green point**, **Green point onsight** oder **Green point flash** einträgst oder
- eine als **Sport** eingestufte Route mit dem Begehungsstil **Trad** durchsteigst und dabei einen sauberen Vorstiegs-Tick verwendest (Onsight, Flash, Rotpunkt, Pinkpoint, Ground-up-Rotpunkt oder Lead).

Allgemeine Tick-/Send-/Clean-Einträge, Versuche, Toprope und Nachstieg zählen für den zweiten Weg nicht, weil sie keinen Vorstieg mit mobiler Sicherung belegen. Wie die Abzeichen oben erscheint es nicht unter **Fast geschafft**. Die Definition der Green-point-Ticks findest du bei den [Begehungsarten von theCrag](https://www.thecrag.com/en/article/ticktypes).

## Erste Seilsolo-Begehungen

**Erstes Rope-Solo im Vorstieg** wird mit deiner ersten erfolgreichen, ausdrücklich als Lead solo eingetragenen Begehung freigeschaltet. **Erstes Toprope-Solo** wird separat mit deiner ersten erfolgreichen Begehung als Roped Solo / Top rope solo freigeschaltet. Beide verlinken auf die früheste passende Begehung; bei gleichem Tag entscheidet die Begehungs-ID. Keines erscheint unter Fast geschafft.

Die Einstufung entspricht der Karte Solo-Klettern. Die [Anbieter-API](https://www.thecrag.com/en/article/api) dokumentiert `leadsolo` und `ropedsolo`; Anzeigebezeichnungen und Varianten bei Groß-/Kleinschreibung, Leerzeichen und Trennzeichen werden erkannt, ohne den ursprünglichen Tick-Text zu ändern. Eine Aktualisierung gespeicherter Daten korrigiert ältere Erfolgsmarkierungen nur, wenn die gespeicherte Anbieterantwort dieselbe ausdrückliche Solo-Methode bestätigt. Routendisziplin und Begehungsstil bleiben getrennt.

Versuche, Hangdogs, Rückzüge, Free Solos, Deep-Water-Solos, technische Solos, gewöhnliche Toprope-Begehungen und Einträge mit unbekanntem Erfolg erfüllen die Voraussetzungen nicht. Eine ausdrücklich als Boulder oder Nachstieg erfasste Begehung widerspricht ebenfalls beiden Seilsolo-Methoden und kann diese Abzeichen nicht freischalten. Fehlende Partner allein belegen kein Solo-Klettern. Diese Meilensteine gelten für Indoor- und Outdoor-Begehungen und benötigen weder Koordinaten noch Wetterimporte.

## Serien aufeinanderfolgender Tage

**7-Tage-Serie**, **10-Tage-Serie** und **30-Tage-Serie** würdigen mindestens eine eingetragene Begehung an jedem aufeinanderfolgenden Kalendertag. Versuche sowie Indoor- und Outdoor-Begehungen zählen, entsprechend der Serienkarte. Mehrere Begehungen an einem Tag zählen einmal; fehlende oder ungültige Daten begründen keinen Klettertag. Maßgeblich sind die Kletterdaten, nicht die Eintragszeiten. Die eingetragenen Daten werden nicht zwischen Zeitzonen verschoben.

Jedes Abzeichen erhält das Datum des frühesten Tages, an dem seine Schwelle erreicht wurde. Eine Pause löscht keinen Meilenstein aus deiner gespeicherten Historie. Dies sind einmalige Auszeichnungen; sie erscheinen nicht unter Fast geschafft.

## Mit wem du geklettert bist

Verdiente Abzeichen mit einer auslösenden Begehung zeigen deren eingetragene Begleiter. „Partner bei dieser Begehung“ bezieht sich nur auf die verlinkte Begehung, auch bei Abzeichen, die über mehrere Seillängen, Tage oder Routen verdient wurden. Die Angabe ist keine Liste aller Personen, die zur gesamten Leistung beigetragen haben. Fehlende Namen bedeuten keine Solo-Begehung.
