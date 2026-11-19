# Beste Monate

Die Karte **Beste Monate** vergleicht die [Saisonalität von theCrag](https://www.thecrag.com/article/Seasonality) für deine meistbesuchten Klettergebiete damit, **wann du dort tatsächlich kletterst**.

## Woher die Daten stammen

theCrag speichert pro Route eine **12-Werte-Saisonalitätskurve** (einen Wert pro Kalendermonat). Crag Stats speichert sie beim optionalen Routendaten-Import (`ROUTE_DATA_IMPORT`, standardmäßig deaktiviert) für jede Route im Cache. Solange eine Route noch nicht mindestens einmal abgerufen wurde, kann keine Saisonalität angezeigt werden.

## Wie wir die Daten zusammenfassen

Für jedes Klettergebiet in deinem Tourenbuch:

1. **Dein Umfang** — deine Begehungen werden nach Kalendermonat gezählt (alle Jahre zusammen).
2. **Saisonalität von theCrag** — für jede von dir begangene Route in diesem Gebiet wird die gespeicherte 12-Monats-Kurve mit der **Anzahl deiner Begehungen dieser Route** gewichtet. Routen mit mehr deiner Ticks beeinflussen den Gebietsdurchschnitt stärker.

Angezeigt werden bis zu **sechs** Gebiete, sortiert nach der Gesamtzahl deiner dortigen Begehungen. Berücksichtigt werden nur Gebiete mit gespeicherter Saisonalität für mindestens eine begangene Route.

## Das Diagramm lesen

- **Orange Balken** — gewichtete mittlere Saisonalität (höher = in diesem Monat auf theCrag beliebter).
- **Graue Balken** — deine Begehungen in diesem Monat in diesem Gebiet.

Wenn die grauen Balken in anderen Monaten ihren Höhepunkt erreichen als die orange Darstellung, kletterst du möglicherweise außerhalb der Hauptsaison — oder deine Stichprobe ist klein.

## Saisonalität aktualisieren

Starte **Synchronisieren** in den Einstellungen. Bei aktiviertem Routendatenimport wird die Saisonalität im Hintergrund ergänzt (mit begrenzter Anfragerate, bis zu 100 Routen pro Durchlauf).

Die Sektorenseite kann auch das [Wetter an deinen gespeicherten Besuchstagen](/docs/weather) anzeigen. Das beschreibt die Bedingungen an deinen eingetragenen Tagen, unabhängig von der hier verwendeten Routensaisonalität.

## Nach Monat suchen

Öffne die [Saisonalitätssuche](/seasonality) über die Karte Beste Monate, um alle Gebiete und Routen deines synchronisierten Tourenbuchs mit gespeicherten Monatsdaten zu durchsuchen. Wähle einen Monat (standardmäßig der aktuelle Monat in deiner angezeigten Zeitzone), suche nach dem Namen eines Felsens, Gebiets oder einer Route und wechsle zwischen **Felsen** und **Routen**. Suchanfragen, Monatsauswahl, Sortierung und Seiten werden in der URL gespeichert, sodass du sie als Lesezeichen speichern oder teilen kannst. Wähle **Routen anzeigen**, um auf ein Gebiet einzugrenzen, oder **Alle Gebiete durchsuchen**, um diese Eingrenzung aufzuheben.

Die Ergebnisse werden nach dem Wert des gewählten Monats geteilt durch den höchsten Wert der jeweiligen Jahreskurve sortiert. Ein Wert von 5 bei einem Jahreshöchstwert von 10 ergibt beispielsweise **50% des Jahreshöchstwerts**. Bei Gleichstand entscheidet der Name; du kannst auch direkt nach Namen sortieren. Es gibt keinen festen Grenzwert für „in der Saison“. Eine Kurve mit ausschließlich Nullwerten hat **Kein saisonales Signal** und wird hinter Kurven mit positivem Höchstwert eingeordnet. Die Monatsleiste und die aufklappbare Wertetabelle zeigen alle zwölf Monate.

Gebietskurven verwenden denselben nach Begehungen gewichteten Mittelwert wie das Dashboard: Routen mit mehr deiner eingetragenen Begehungen haben mehr Einfluss; fehlende Routenkurven gehen nicht in den Mittelwert ein. Die Suche nach dem Namen einer Route kann das zugehörige Klettergebiet finden, ändert jedoch nicht die vollständige Kurve dieses Klettergebiets. Klettergebiete werden, sofern verfügbar, anhand der Gebietskennung des Anbieters getrennt geführt. Jedes Klettergebiet zeigt an, wie viele seiner geloggten Routen über Daten verfügen; die Seite gibt außerdem die Abdeckung unter den passenden Routen an. Fehlende oder fehlerhafte Kurven bleiben unbekannt und werden aus der Rangliste ausgelassen.

Routenergebnisse verlinken auf alle deine Tourenbucheinträge für genau diese Route und auf ihre Führerseite bei theCrag. Mit der Zurück-Schaltfläche deines Browsers gelangst du wieder zur Suche. Die Suche liest nur den lokalen Cache. Sie löst weder eine Abfrage beim Anbieter aus noch durchsucht sie den gesamten theCrag-Katalog. Aktiviere den optionalen Routendatenimport und synchronisiere, um die Datenabdeckung aufzubauen.

Saisonalität beschreibt **Klettergewohnheiten der Community**, keine Wettervorhersagen oder gemessenen Bedingungen bei deinen eingetragenen Besuchen. Diese Beobachtungen zu Besuchstagen findest du unter [Wetter](/docs/weather).
