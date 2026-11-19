# Karma

theCrag vergibt **Karma** für Beiträge zum Kletterindex – das Eintragen von Begehungen und das Bearbeiten von Kletterführerdaten. Siehe [Karma auf theCrag](https://www.thecrag.com/article/cragkarma).

## Was Crag Stats anzeigen kann

Das Supporter-**Tourenbuch**-API-Account-Objekt enthält **nicht** dein persönliches Gesamtkarma oder eine Aufteilung nach Begehungen/Bearbeitungen. Die Gebiets-Endpunkte `/karma` sind Bestenlisten der Mitwirkenden für ein Klettergebiet und kein Ersatz für deinen Account-Punktestand.

Bis theCrag persönliches Karma (oder ausgehandelten Zugriff) bereitstellt, ist die Dashboard-Karte nur eine **Annäherung an den Begehungsanteil**:

| Quelle                                                           | Punkte                                                                                   |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Begehung eintragen                                               | **1** einmal pro Route (Node), entsprechend der theCrag-Regel von einmal pro Beitragsart |
| Kletterführer-Bearbeitungen (Beschreibungen, Topos, Historie, …) | **Nicht verfügbar** – lässt sich nicht aus dem Tourenbuch-Cache rekonstruieren           |

Wenn dein synchronisierter Account `routesTicked` enthält und dieser Wert mindestens so groß ist wie der lokale Routen-Cache, verwendet die Karte ihn für die Gesamtzahl der Begehungen (entspricht „geloggte Routen“ auf theCrag). Andernfalls zählt sie verschiedene Routen in deinem lokalen SQLite-Cache.

Die Kachel **Lokal eingetragene Routen** zeigt immer die Anzahl verschiedener Routen, die mit deinen zwischengespeicherten Begehungen verknüpft sind, selbst wenn die Begehungsschätzung den größeren Zähler des Accounts verwendet. Wiederholungen zählen einmal; Routen-Metadaten ohne Begehung zählen nicht.

## Was es nicht ist

- Kein Byte-für-Byte-Klon des Punktestands auf deinem theCrag-Profil.
- Echtes Karma verbleibt für etwa eine Woche in einer **Prüfwarteschlange**, bevor es auf deinem Account gutgeschrieben wird.
- Das Löschen oder Bearbeiten von Begehungen, private Accounts und historische Importe können dazu führen, dass lokale Zähler und theCrag nicht synchron sind.
- Wir erfinden **keine** Bearbeitungspunkte aus Erstbegehungsmarkierungen oder Routeneinrichter-Nennungen — diese Aktivitäten können auf theCrag Karma einbringen, aber pro Knoten und Beitragsart zählt nur ein Beitrag, und dein Bearbeitungsverlauf liegt uns nicht vor.

## Wann sich das verbessern kann

Falls theCrag Karma (oder Gesamtzahlen für Begehungen/Bearbeitungen) in den Tourenbuch-Account-Payload oder einen dokumentierten Kletterer-Endpunkt aufnimmt, den wir sicher synchronisieren können, kann Crag Stats die Schätzung durch die echten Zahlen ersetzen und die Kachel für Bearbeitungen ausfüllen.
