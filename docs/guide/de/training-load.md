# Trainingsbelastung

Die Karte **Trainingsbelastung** (und die eigene Seite [`/training-load`](/training-load)) schätzt ab, wie hart du in letzter Zeit geklettert bist, verglichen mit dem, was dein Körper gewohnt ist. Bei einem schnellen Anstieg passieren Finger- und Schulterverletzungen am häufigsten. Die Dashboard-Karte fasst die neuesten 12 Wochen zusammen; die Seite zeigt 26 Wochen plus einen 28-Tage-Streifen für die tägliche Belastung.

## 1. Belastung pro Begehung

Jede Begehung erhält einen Belastungswert:

> **Belastung = 10 × Intensität × Stilfaktor**

**Intensität** vergleicht den Grad der Begehung mit deinem **schwersten Durchstieg der letzten 12 Monate** in derselben Disziplin. Routen werden auf der Ewbank-Skala verglichen und Boulder auf der V-Skala.

| Grad im Vergleich zu deinem 12-Monats-Maximum                                   | Intensität |
| ------------------------------------------------------------------------------- | ---------- |
| Auf deinem Maximum                                                              | 1.0        |
| 2 Ewbank-Grade (1 V-Grad) darunter                                              | 0.5        |
| 4 Ewbank-Grade (2 V-Grade) darunter                                             | 0.25       |
| Über deinem Maximum (neuer Höchstwert)                                          | bis zu 1.5 |
| Projektieren einer unbewerteten Route oder eines theCrag-Projekts (siehe unten) | 1.0        |
| Unbewerteter Durchstieg oder keine Durchstiege in 12 Monaten                    | 0.3        |

Klettern nahe deinem Limit zählt deutlich mehr als viele Meter weit darunter. Ein Tag mit zehn leichten Routen und ein Tag an einem einzelnen Projekt können am Ende ein ähnliches Ergebnis liefern.

**Unbewertete und markierte Projekte:** Ein Versuch, Hangdog oder ein anderer Eintrag ohne Durchstieg bei einer Route **ohne Grad** oder bei einer Route, die theCrag mit der Markierung **Project** versieht (aus dem optionalen Routen-Info-Import), wird als Klettern **auf deinem Maximum** gewertet. Unbewertete Routen, an denen du weiter arbeitest, sind normalerweise neue Linien nahe deinem Limit; die Markierung ist der eindeutige Fall, wenn sie vorhanden ist. Dieselben Versuche zählen auch zum Anteil nahe am Limit. Wenn du dem Eintrag auf theCrag selbst einen Grad gegeben hast, wird stattdessen dieser Grad verwendet. Ein unbewerteter _Durchstieg_ zählt weiterhin als leicht (0.3), da eine unbenannte leichte Route nicht wie ein Tag am Limit aussehen sollte.

**Stilfaktor:** Ein Vorstiegsdurchstieg zählt 1.0. Versuche und Hangdogs zählen 0.8, da das Ausbouldern einer Route immer noch eine echte Anstrengung ist. Toprope oder Nachstieg zählt zusätzlich 0.8×.

## 2. Ermüdung und Fitness

Die täglichen Belastungen werden auf zwei Arten gemittelt, beide gewichtet in Richtung der letzten Tage:

- **Ermüdung (akut):** ein exponentiell gewichteter 7-Tage-Durchschnitt.
- **Fitness (chronisch):** ein exponentiell gewichteter 28-Tage-Durchschnitt.

## 3. Akut-zu-chronisch-Verhältnis

**Verhältnis = Ermüdung ÷ Fitness**

| Verhältnis | Status             | Bedeutung                                                                                    |
| ---------- | ------------------ | -------------------------------------------------------------------------------------------- |
| —          | Ruhend             | Kürzlich nichts eingetragen                                                                  |
| < 0.8      | Unter dem Üblichen | Leichter als gewohnt: erholt, Tapering oder Fitnessverlust                                   |
| 0.8 – 1.3  | Optimaler Bereich  | Passend zu dem, was du gewohnt bist                                                          |
| 1.3 – 1.5  | Steigend           | Du kletterst mehr als gewohnt; achte auf deine Erholung                                      |
| > 1.5      | Belastungsspitze   | Ein großer Sprung; der Bereich, der am häufigsten mit Überlastungsverletzungen verbunden ist |

Diese Bereiche stammen aus dem in Sportwissenschaft und Klettertraining verwendeten Verhältnis akuter zu chronischer Trainingsbelastung. Betrachte sie als Hinweis, nicht als Diagnose.

## Außerdem auf der Karte / Seite

- **Wöchentliche Belastung:** die Gesamtbelastung für jede Woche (12 auf der Karte, 26 auf der Seite). Die aktuelle Woche ist der hervorgehobene Balken.
- **Tägliche Belastung (Seite):** die letzten 28 Tage intensivitätsgewichteter Belastung, einschließlich Ruhetagen.
- **Durchstiege nahe am Limit · 28d:** Durchstiege in den letzten 28 Tagen innerhalb von 2 Ewbank-Graden (1 V-Grad) deines 12-Monats-Maximums.
- **Anteil nahe am Limit:** der Prozentsatz der bewerteten Begehungen der letzten 28 Tage, die nahe an deinem Limit lagen. Ein hoher Anteil über mehrere Wochen bedeutet viel Klettern am Limit; ziehe Entlastungswochen in Betracht.
- **Letzte 7 / 28 Tage:** Begehungen, Durchstiege, aktive Tage und Ruhetage, gekletterte Höhe und Durchstiegsquote.

## Hinweise

- **Nur was du einträgst, zählt.** Kletterhallen-Sessions, Hangboard-Training und anderes nicht eingetragenes Training sind unsichtbar.
- **Schwierigkeitsgrade sind subjektiv**, und eine weich oder hart bewertete Route verzerrt die Intensität.
- **Das Verhältnis benötigt eine Historie.** Bei weniger als einigen Wochen an Einträgen ist die „Fitness“ niedrig und das Verhältnis schwankt stark.

Bei Projekt-Routen muss ein persönlicher Grad aus der Begehung oder einer gekletterten Seillänge stammen (oder aus dem CSV-Feld „Ascent Grade“). Ein von der Route übernommener effektiver Grad dient nur als Ausweichoption, sodass er die Annahme „Projekt = am Maximum“ nicht aufhebt.
