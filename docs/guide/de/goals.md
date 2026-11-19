# Ziele

Ziele verwandeln ein Ziel in deinem theCrag-Tourenbuch in einen Fortschrittsbalken auf dem Dashboard und der Seite **Ziele**. Höhen- und Klettertage-Ziele füllen sich linear. **Grad**-Ziele nutzen ein ungefähres **Pyramiden-Bereitschaftsmodell**, damit das Verharren einen Grad unter dem Ziel nicht mehr so aussieht, als wärst du fast fertig.

## Zielarten

| Art                      | Was „erledigt“ bedeutet                              | Fortschrittsbalken                     |
| ------------------------ | ---------------------------------------------------- | -------------------------------------- |
| **Grad in diesem Jahr**  | Eine Begehung auf oder über dem Zielwert im Zieljahr | Pyramiden-Bereitschaft (unten)         |
| **Höhe in diesem Jahr**  | Gekletterte Meter in diesem Jahr                     | Linear: Meter ÷ Ziel                   |
| **Tage in diesem Monat** | Verschiedene Klettertage im aktuellen Kalendermonat  | Linear: Tage ÷ Ziel                    |
| **Benutzerdefiniert**    | Du markierst es als abgeschlossen                    | Manuell (kein automatisches Ausfüllen) |

Ortsbereich (Outdoor / Indoor / Beliebig) filtert, welche Begehungen zählen. Grad-Ziele stehen standardmäßig auf **Outdoor**.

Höhenziele **speichern immer Meter**. Das Erstellungsformular fragt nach dem Ziel in deiner ausgewählten Höheneinheit (Meter oder Fuß) und rechnet Fuß vor dem Speichern um. Auch die Fortschritts- und Ziel-Beschriftungen folgen dieser Einheit. Ein spätes Wechseln der Einheiten ändert nur die Beschriftung des Ziels, ohne das gespeicherte Ziel zu verändern. Siehe [Anzeigeeinstellungen](/docs/display-settings).

Grad-Ziele behalten ihre Skala für **Routen** oder **Boulder** bei. Ziele und Fortschritts-Beschriftungen folgen dem entsprechenden Gradsystem in den Einstellungen; das Ändern des Anzeigesystems ändert weder das Ziel noch den Prozentsatz. Vorgeschlagene Zieltitel folgen ebenfalls den Einstellungen, während benutzerdefinierte Titel wie eingegeben erhalten bleiben. In den **Grad-Einstellungen** eines Ziels kannst du seine Skala wählen und entscheiden, ob ein automatischer Titel verwendet werden soll.

Wenn bei einem Ziel **Gradskala erforderlich** steht, ist der Fortschritt nicht verfügbar, bis der Besitzer **Routen** oder **Boulder** auswählt. Titel und gespeichertes Ziel bleiben erhalten; ein Titel, der einen Grad erwähnt, entscheidet nicht über seine Skala.

## Grad-Bereitschaft

Ein Grad-Ziel erfordert eine **Begehung ≥ Ziel** (kanonischer Wert, gewöhnlich Ewbank für Routen oder V-Skala für Boulder) im Zieljahr. Der Balken ist **nicht** `beste Begehung ÷ Ziel` — dadurch sah 22→23 aus wie ~96 %, obwohl du immer noch die Begehung auf 23 brauchtest.

Stattdessen prüft das Modell, wie gut deine Pyramide unter dem Ziel **N** aufgebaut ist und wie viel du nahe daran gearbeitet hast:

1. **Erledigt (100 %)**, wenn deine beste gewertete Begehung bereits ≥ N ist.
2. **Basis**, wenn du eine Begehung bei N−1 (~35 %) oder nur bei N−2 (~10 %) hast.
3. **Pyramiden-Auffüllung** durch verschiedene Routen mit einer Begehung in diesen Kategorien — richtweisender Bedarf von etwa **2 Routen bei N−1** und **4 bei N−2** (bis zu etwa +20 % und +25 %).
4. **Versuchs-Auffüllung** durch Nicht-Begehungs-Einträge (Projektieren) mit effektivem Wert **≥ N−1** — bis zu etwa +20 %, mit einem **horizontskalierten** richtweisenden Bedarf, sodass sich kurzfristige Projekte pro Versuch schneller bewegen als langfristige.
5. **Deckelung des Basismodells bei 94 %.** Die erste gewertete Session legt die Basis fest; jeder weitere verschiedene Klettertag mit Projekt-Einträgen bei ≥ N−1 fügt einen Bereitschaftspunkt hinzu, bis zu 99 %. Nur eine gewertete Begehung erreicht 100 %. Mehrere Routen oder Versuche am selben Tag ergeben eine Session; fehlende, ungültige und zukünftige Daten ergeben keine. Session-Gutschriften folgen dem Zieljahr sowie dem Ortsbereich und verändern die Zielverhältnisse für Höhe oder Klettertage nicht.

Der Begehungsnachweis nutzt denselben Jahres- und Ortsbereichsfilter wie die Fertigstellung: **effektiver Grad** (schwerste gekletterte Seillänge bei Mehrseillängen) und **verschiedene Routen** pro Pyramidenkategorie (wiederholte Begehungen einer Route zählen einmal). Versuche zählen jeden gewerteten Projekt-Eintrag (Wiederholungen derselben Route schieben den Balken trotzdem leicht voran).

Die Fortschrittszeile zeigt deine beste Begehung, die Routenanzahl für N−1 / N−2, Versuchsnachweise, wenn vorhanden, und einen kurzen Horizont-Hinweis:

| Abstand zum Ziel             | Hinweis       | Richtweisender Versuchsbedarf (≈ Ausfüllen des Versuchsbereichs) |
| ---------------------------- | ------------- | ---------------------------------------------------------------- |
| 1 Grad                       | Kurzfristig   | ~15 Versuche                                                     |
| 2 Grade                      | Mittelfristig | ~35 Versuche                                                     |
| Größer / noch keine Begehung | Langfristig   | ~75 Versuche                                                     |

## Vorgeschlagener nächster Grad

Auf der Seite **Ziele** kann Crag Stats dir einen unverbindlichen Vorschlag machen, wenn du in den letzten **zwei Jahren** Outdoor-Begehungen hattest: Nimm deine schwerste Outdoor-Begehung (Route und/oder Boulder, getrennt gewertet) und nimm dir für dieses Jahr den **nächsten Gradschritt** vor (V5 → V6, 25 → 26). Vorschläge erstellen erst dann ein Ziel, wenn du auf **Ziel hinzufügen** klickst. Wenn du dieses Outdoor-Ziel für das Jahr bereits verfolgst, zeigt der Chip **Wird bereits verfolgt** an.

## Was du siehst

- **Dashboard**-Karte „Aktive Ziele“: bis zu einige offene Ziele mit denselben Prozentsätzen und Beschriftungen.
- Seite **Ziele**: optionale Chips für vorgeschlagene nächste Grade, vollständige Listen für Aktive / Erreichte Ziele, Erstellen/Bearbeiten und derselbe Bereitschaftstext für Grad-Ziele.

## Hinweise

- **Ungefähr.** Richtweisende Pyramidenzahlen sind eine Faustregel aus dem Coaching und keine Vorhersage, dass du N klettern wirst.
- **Werte im selben System.** Die unterstützenden Kategorien sind die Wertbereiche [N−1, N) und [N−2, N−1), sodass auch fraktionierte Begehungen unterhalb eines Ziels dieses unterstützen. Werte nutzen den kanonischen Wert des Ziels; gemischte Gradsysteme werden innerhalb des Balkens nicht umgerechnet.
- **Skala, Jahr und Ortsbereich.** Nachweise für Routen und V-Skala werden niemals gemischt. Ältere Einträge außerhalb des Zieljahres oder aus dem falschen Ortsbereich tragen nicht zur Bereitschaft bei. Mit V-Graden bewertetes DWS und Highballs zählen zu Boulder-Zielen, wobei das Gradsystem und nicht der Ausrüstungsstil ausschlaggebend ist.
- **Versuche sind ungefähr.** Wir sehen nur eingetragene Nicht-Begehungen mit einem Grad von ≥ N−1 — nicht jeden Versuch in einem unbewerteten Projekt.
- **Benutzerdefinierte Ziele** werden niemals automatisch aus dem Tourenbuch ausgefüllt.

Höhen- und Tage-Ziele bleiben einfache lineare Verhältnisse, sodass ein halb vollendeter Kilometer oder Monat immer noch als die Hälfte angezeigt wird.
