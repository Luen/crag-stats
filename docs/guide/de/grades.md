# Schwierigkeitsgrade & Grade-Bänder

Crag Stats stellt Grade so dar wie [theCrag](https://www.thecrag.com/en/article/grades). Jedes Gradsystem wird auf eine interne Skala umgerechnet, und diese Skala ist in fünf farbcodierte **Bänder** unterteilt.

## Die fünf Bänder

<!-- component:grade-bands -->

Diese Farben erscheinen in jeder Pyramide, jedem Grad-Chip, jedem CPR-Diagramm und jeder Bänder-Aufschlüsselung. Sie entsprechen theCrag, sodass ein Grad hier genauso aussieht wie dort.

## Wie Grade verglichen werden

- **Eine interne Skala pro Kletterart.** Routen (Sportklettern, Trad, Toprope, Alpin…) werden auf der **Ewbank**-Skala bewertet (den australischen Zahlen). Boulder werden auf der **V-Skala** bewertet. Sie werden niemals in einer Liste vermischt: Ein V5-Boulder und eine Route im Grad 21 befinden sich in unterschiedlichen Pyramiden.
- **Der Grad bestimmt die Skala, nicht der Kletterstil.** Deep-Water-Solos und Highballs erhalten oft V-Grade, auch wenn es sich nicht um klassische Boulder handelt. Diese verbleiben auf der V-Skala: Sie werden bei den schwersten Durchstiegen und Grad-Indizes mit Bouldern gezählt und erhalten eine eigene Pyramide (zum Beispiel **DWS · V**), niemals eine Ewbank-Pyramide.
- **Deine Anzeigesysteme** wählst du in den **Einstellungen → Anzeige & Sichtbarkeit**, jeweils eines für jede Kletterart. **Routengrade** (Ewbank, Französisch oder YDS; standardmäßig Ewbank) decken Sportklettern, Trad, Toprope und anderes Seilklettern ab. **Bouldergrade** (V-Skala (Hueco) oder Fontainebleau; standardmäßig V-Skala) decken Boulder und V-bewertete Highballs ab. Beide sind unabhängig voneinander, sodass du französische Routen mit Font-Bouldern kombinieren kannst. Ein geteilter Link kann diese Einstellungen einmalig mit `?system=` (ein Routen- oder Bouldersystem) und `?boulderSystem=` überschreiben.
- **Zugewiesener vs. eigener Grad.** theCrag speichert sowohl den Konsensgrad der Route als auch den Grad, den du vergeben hast. Crag Stats bevorzugt den Grad an der Begehung, wenn er im passenden System vorliegt, und fällt andernfalls auf den Routengrad zurück.
- **Einzelne Begehungen lesen.** Projekte, Projektverlauf und das Tourenbuch zeigen zuerst dein ausgewähltes System an. Weicht der ursprüngliche theCrag-Routengrad ab, folgt er in Klammern, zum Beispiel `6b (20)`. Bei Mehrseillängen-Teilbegehungen beschreibt der erste Grad die von dir gekletterten Seillängen; die Klammern zeigen den Originalgrad der Route. Unbewertete Grade behalten ihren Originaltext, anstatt eine Umrechnung zu schätzen.
- **Mehrseillängen:** Der effektive Grad einer Begehung ist die schwerste Seillänge, die _du_ geklettert bist, nicht die schwerste Seillänge der gesamten Route. Für Systeme, die der Textparser nicht lesen kann, etwa UIAA, nutzt eine vollständige Begehung oder ein passender Seillängengrad den universellen Score der Begehung. Andere Seillängen nutzen den Mittelwert ihres Schwierigkeitsbandes, sofern verfügbar.
- **Mehrdeutige Boulder-Zahlen:** Der Kontext des Gradsystems beim Anbieter entscheidet, ob eine reine Zahl V-Skala oder Ewbank bedeutet. Das Land allein ändert bei API-Zeilen niemals einen Grad. Reparaturen bewahren die ursprünglichen API-Daten. CSV-Exporte haben keine Spalte für das Gradsystem; australische Boulder-Zeilen mit reinen Ziffern (`9`, `1`) erhalten daher einen AU-Hinweis über Land / Gebietspfad / australia-URL-Stubs; explizite `V5` / `VB` bleiben V-Skala. Wie bei API-Imports überschreibt ein abgeleiteter AU-Begehungsgrad keinen expliziten V-Skala-Routengrad.
- **Bereiche** wie `V1/2` zählen als Mittelwert (V1.5).
- **theCrags universeller Score.** theCrag bewertet jeden Grad in jedem System auf einer einheitlichen Schwierigkeitsskala. Synchronisierte Begehungen tragen diesen Score, sodass Crag Stats Grade in jedem von theCrag unterstützten System einordnen kann (UIAA, Sächsisch, Skandinavisch, Polnisch, Brasilianisch und weitere), selbst wenn sie nicht als Text geparst werden können. Reine Zahlen in diesen Systemen (eine UIAA `7`) werden niemals fälschlicherweise für Ewbank-Grade gehalten.
- **Zwischengrade.** Französische, YDS- und Fontainebleau-Umrechnungen nutzen ebenfalls theCrags Scores. Grade ohne glatte Ewbank- oder V-Entsprechung (französisch `5c+`, `6a` und `7a+`, Font `6A+` und `7C+`) reihen sich dennoch exakt zwischen ihren Nachbarn ein (`7a` < `7a+` < `7b`). Französische, YDS- und Font-Pyramiden gruppieren nach dem nächstgelegenen Grad im jeweiligen Anzeigesystem, wobei Gleichstände auf halber Strecke zum schwereren Grad aufgerundet werden. Jede Zeile verlinkt auf ihren eigenen Gradbereich im Tourenbuch. Ewbank- und V-Skala-Pyramiden behalten Ganzgrad-Zeilen bei. Ihr Band stammt ebenfalls aus theCrags Score, sodass eine französische `6a` im Band Fortgeschritten und eine `7a+` im Band Erfahren bleibt.
- **CSV-Uploads** enthalten keine Score-Spalte; ihre Grade werden aus dem Text gelesen. Französische, YDS-, Ewbank-, V- und Font-Grade konvertieren wie oben; Grade in anderen Systemen werden unter Umständen unkonvertiert angezeigt.

## Umrechnungstabellen

Umrechnungen zwischen Systemen sind Näherungswerte: Grade sind kulturell gewachsen, und eine „6c“ in einem Klettergebiet entspricht nicht immer einer „23“ in einem anderen. Die folgenden Tabellen werden aus demselben Code generiert, den auch die Übersicht nutzt.

### Routen (Ewbank ↔ Französisch ↔ YDS)

<!-- component:route-conversions -->

### Boulder (V-Skala ↔ Fontainebleau)

<!-- component:boulder-conversions -->

## Quellen

- theCrag: [Schwierigkeitsgrade und Gradumrechnungen](https://www.thecrag.com/en/article/grades)
- theCrag: [Schwierigkeitsgrade auf theCrag](https://www.thecrag.com/en/article/gradesonthecrag)

## Rekorde in der Übersicht

Die Übersicht beginnt mit **Schwerster Durchstieg** und **Schwerster Onsight / Flash**. Sie zeigen deinen allzeit höchsten erfolgreichen Grad und höchsten ersten Versuch in deinen gewählten Systemen. Versuche und unbewertete Begehungen zählen nicht. Routen und Boulder haben getrennte Ergebnisse; V-bewertete DWS und Highballs zählen zu den Bouldern. Mehrseillängen-Teilbegehungen nutzen die schwerste von dir gekletterte Seillänge. Jedes Ergebnis nennt seinen Begehungsstil und verlinkt auf die entsprechende Begehung. Bei Gleichstand zwischen Onsight- und Flash-Rekorden wird der Onsight angezeigt. Fehlt ein Rekord, erscheint ein Gedankenstrich mit Erklärung.
