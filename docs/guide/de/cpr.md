# CPR (Leistungsbewertung für Kletterer)

**CPR** ist theCrags Einstufung deines Kletterkönnens. Crag Stats zeigt eine CPR-Zeitleiste getrennt nach **Sportklettern**, **Trad** und **Bouldern**, genau wie theCrag, da die drei Disziplinen sehr unterschiedlich bewertet werden.

## Wie theCrag CPR berechnet

theCrag hat CPR aus einer statistischen Analyse von rund einer Million Ticks entwickelt. Die Grundideen:

- **Jeder Grad ist etwa 5× schwerer als der darunterliegende** (Potenzfaktor _P_ = 5 auf der Ewbank-Skala). Jede einmalige Route, die du geklettert bist, fügt einer Gesamtsumme etwa _P_ hoch den Grad hinzu. Die Summe wird über einen Logarithmus zur Basis 5 wieder in einen Grad umgerechnet. Fünf Begehungen eines Grades sind also ungefähr so viel wert wie eine Begehung des nächsthöheren Grades.
- **Begehungs-Verschiebungen.** Wie du geklettert bist, zählt. Ticks werden vor der Bewertung um einen Grad-Offset verschoben. Sportkletterer klettern im Rotpunkt beispielsweise etwa **2,1 Grade** schwerer als im Onsight, und beim Trad-Klettern ist ein Pinkpoint etwa **0,8 Grade** leichter als ein Rotpunkt. Die Offsets werden für Sport, Trad und Bouldern getrennt ermittelt.
- **Grad festigen.** Ein einzelner Tick in einem neuen Grad könnte eine weich bewertete Route oder ein Zufall sein. Dein _Grad_ steigt erst nach etwa **drei** Ticks auf diesem Niveau, aber jede Begehung trägt weiterhin zur Bewertung bei.
- **Leistungsabfall.** Wenn du mit dem Klettern pausierst, sinkt das CPR um etwa **0,7 Ewbank-Grade pro Jahr** (ungefähr ein Dreiviertel-Grad).
- **Wiederholungen** einer Route zählen nur einmal (der beste Tick), und es wird der offizielle Konsensgrad der Route verwendet statt deiner persönlichen Meinung.

theCrag führt für Sport, Trad und Bouldern jeweils einen abgewerteten und einen nicht abgewerteten Wert.

## Woher Crag Stats die Werte bezieht

- **Aus theCrags API (bevorzugt).** Wenn du mit einem Unterstützer-API-Schlüssel synchronisierst, kann jede Begehung theCrags eigene CPR-Werte enthalten. Wenn genügend deiner Begehungen in einer Disziplin diese Werte aufweisen (mindestens 3 und mindestens 20% der Begehungen dieser Disziplin), nutzt die Zeitleiste **theCrags abgewertetes CPR**, gekennzeichnet als _theCrag CPR_.
- **Ungefähres Modell (Fallback).** Andernfalls berechnet Crag Stats ein eigenes CPR, gekennzeichnet als _Ungefähr_. Es nutzt dieselben Prinzipien: _P_ = 5, bester Tick pro Route, Tick-Offsets und 0,7 Grade/Jahr Leistungsabfall. Die Offsets sind Schätzwerte, z. B. Sport Onsight +2,1, Flash +1,4, Rotpunkt 0, Pinkpoint −0,5, Versuche −3. **Es ist keine Kopie der proprietären theCrag-Implementierung**, weshalb geringfügige Abweichungen zu erwarten sind.

## Die Zeitleiste lesen

- Jede **Spalte** steht für ein Quartal.
- **Candlesticks** zeigen die Bandbreite der Grade, die du in diesem Quartal mit jedem Begehungsstil geklettert bist. Wie bei theCrag liegt der reinste Stil oben: Onsight Grün, Flash Gelb, Rotpunkt Rot, Pinkpoint Rosa, Durchstieg/Begehung Blau, Versuche Grau.
- Die **schwarze Linie** stellt dein CPR im Zeitverlauf dar. Ein Ring markiert deinen **Höchstwert** und ein hohler Punkt deine **aktuelle** Einstufung.
- Der **farbige Hintergrund** zeigt die Grade-Bänder (Anfänger → Elite) an ihren realen Gradgrenzen.
- Die **Balken** darunter zeigen, wie viele Begehungen du in diesem Quartal geloggt hast. Klicke auf einen Balken, um diese Begehungen im Tourenbuch zu öffnen.
- Eine **gestrichelte Trennlinie** mit **⋯** auf der Zeitachse markiert eine Lücke von mehr als einem Quartal.
- **Leere Quartale anzeigen** gibt jedem Quartal zwischen deinem ersten und letzten geloggten Quartal eine eigene Spalte. Quartale ohne Begehungen bleiben leer und **unterbrechen die schwarze Linie**, sodass eine längere Pause nicht mehr fälschlicherweise als stetiger Fortschritt erscheint. Das Diagramm scrollt seitlich, wenn die zusätzlichen Spalten mehr Platz benötigen. Deaktiviere die Option für die kompakte Ansicht, in der nur Quartale mit Begehungen eine Spalte erhalten.

theCrag weist darauf hin, dass eine **graue Spitze** über der Linie (Fehlversuche in einem höheren Grad) oft unmittelbar vor einem Leistungssprung in einen neuen Grad auftritt.

## Quellen

- theCrag: [Leistungsbewertung für Kletterer (CPR)](https://www.thecrag.com/en/article/cpr)
- theCrag: [CPR-Zeitverlauf erklärt](https://www.thecrag.com/en/article/cprtimeline)
