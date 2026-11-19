# Erstbegehungen

Die Karte **Erstbegehungen** zählt die Routen und Boulder, bei denen du die Erstbegehung (**FA**) oder die erste Freibegehung (**FFA**) gemacht hast. Wenn der Routenverlauf im Cache gespeichert ist, zeigt sie auch an, für wie viele Routen du als **Routenbauer** (Einrichten / Schrauben) eingetragen bist.

## Was du benötigst

- **Besitzer-Login** — Wenn `APP_PASSWORD` gesetzt ist, melde dich an, damit du die Einstellungen öffnen und **FA markieren** / **FFA** im Tourenbuch verwenden kannst. Besucher sehen die Karte und Abzeichen, sobald mindestens eine Route markiert ist, können selbst aber keine Markierungen hinzufügen.
- **Optionaler Routendaten-Import** — Setze `ROUTE_DATA_IMPORT=true` auf dem Server, wenn Crag Stats FAs und FFAs automatisch aus dem öffentlichen theCrag-Routenverlauf markieren soll (siehe unten). Manuelle Markierungen und der Import schreiben beide in dieselbe `first_ascents`-Tabelle; keiner von beiden hängt von privaten Notizen ab.
- **Private Notizen spielen keine Rolle** — **Einstellungen → Private Notizen anzeigen** steuert nur, ob deine **Begehungskommentare** auf `/logbook` (und in der Suche) erscheinen. Es schränkt die Karte „Erstbegehungen“, FA/FFA-Abzeichen, Meilensteine oder den Routendaten-Import nicht ein.

## Eine Erstbegehung markieren

theCrag erfasst Erstbegehungen im **Verlauf** jeder Route (die FA-/FFA-Einträge auf der Routenseite) und nicht als Begehungsstil. Die Tourenbuch-API von theCrag gibt keinen Routenverlauf zurück, sodass eine normale Synchronisierung diese nicht sehen kann. Du kannst sie selbst markieren oder den optionalen Import unten aktivieren.

### Selbst eine Markierung vornehmen

1. Öffne das **Tourenbuch** und suche eine beliebige Begehung der Route.
2. Bewege den Mauszeiger über die Zeile (oder navigiere mit der Tab-Taste dorthin) und klicke auf **FA markieren** oder **FFA**.
3. Klicke auf **Markierung aufheben**, um dies rückgängig zu machen.

Nur wer die Einstellungen öffnen kann, kann FAs markieren: alle, wenn kein `APP_PASSWORD` gesetzt ist, ansonsten nur im angemeldeten Zustand. Besucher sehen das FA-Abzeichen und die Karte, aber nicht die Schaltflächen.

Die Markierung wird anhand der Routen-ID von theCrag gespeichert, sodass sie Neusynchronisierungen übersteht. Sie verschwindet von der Karte, wenn jede Begehung der Route auf theCrag gelöscht wird, und erscheint wieder, wenn du die Route erneut einträgst. **Einstellungen → Zurücksetzen** entfernt alle Markierungen.

### Das Tourenbuch filtern

Verwende im **Tourenbuch** die Steuerung **Erstbegehungsmarkierung**, um nur deine FAs, FFAs, beides oder Begehungen ohne bisherige Markierung anzuzeigen (`?fa=FA|FFA|any|none`). Wenn der Routendaten-Import aktiviert ist, erhält der Besitzer auch **Verlauf noch nicht geprüft** (`?history=pending`), was Begehungen auflistet, die der Importer noch nicht abgerufen hat.

### Aus dem Routenverlauf importieren (optional, standardmäßig deaktiviert)

Wenn der Serverbesitzer dies aktiviert (`ROUTE_DATA_IMPORT=true`; ältere Versionen nannten dies `ROUTE_HISTORY_IMPORT`, was nicht mehr gelesen wird, also benenne es um und starte neu), liest Crag Stats im Hintergrund den öffentlichen Verlauf jeder Tourenbuch-Route von theCrag aus und markiert die FAs und FFAs, die deinen Namen nennen.

- **Nur Einträge, die deinen theCrag-Benutzernamen nennen** (`@yourlogin`), zählen. Namen im Klartext werden ignoriert, da sie zu leicht verwechselt werden können. Die API-Synchronisierung speichert diesen Login; wenn dein Tourenbuch aus CSV-Uploads stammt, setze `THECRAG_USERNAME`, damit der Import weiß, welche Einträge dir gehören.
- **Deine Entscheidungen haben Vorrang.** Von dir gesetzte Markierungen bleiben bestehen, und Routen, deren Markierung du aufgehoben hast, bleiben unmarkiert. **Einstellungen → Routendaten importieren → Erneut anwenden** kann beides überschreiben, indem bereits gespeicherter Verlauf verwendet wird, ohne erneut bei theCrag anzufragen.
- **Schonend für theCrag.** Jede Route wird standardmäßig **einmal** überprüft (optionale regelmäßige Datenaktualisierungen werden unten beschrieben), höchstens **100 Routen pro Durchlauf** und eine Anfrage pro Sekunde. Ein Durchlauf erfolgt nach jeder Tourenbuch-Synchronisierung, gemäß dem Hintergrund-Importzeitplan (`IMPORT_CRON`, standardmäßig täglich), wenn die App mit noch ausstehenden Routen neu startet (zum Beispiel nach einem Upgrade) oder wenn du auf **Nächste 100 Routen jetzt prüfen** klickst. Wenn theCrag Anfragen abweist, pausiert der Import für mindestens einen Tag.
- In den Einstellungen wird angezeigt, wie viele deiner Routen bisher überprüft wurden. Mit der täglichen Synchronisierung dauern einige hundert Routen einige Wochen; das Klicken auf die Schaltfläche beschleunigt dies.

Es wird nur der öffentliche Routenverlauf gespeichert, niemals deine privaten Begehungsnotizen. **Einstellungen → Zurücksetzen** entfernt diesen zusammen mit deinen Markierungen.

## Was die Karte anzeigt

Wenn die Karte importierte FA/FFA- oder Routenbauer-Gutschriften enthält, verweist ihre Fußzeile auf den theCrag-Routenverlauf. Dies folgt den gespeicherten Gutschriften, selbst wenn der Import später deaktiviert wird. Manuelle Markierungen benötigen keinen Zuordnungshinweis; gemischte Sammlungen behalten den Quellennachweis des Routenverlaufs bei.

- **Anzahl:** wie viele Routen als FA oder FFA angerechnet werden, aus manuellen Markierungen oder dem Routendaten-Import (öffentlicher Routenverlauf). Wenn du FFAs hast, wird auch die Aufteilung zwischen FA und FFA angezeigt.
- **Eingerichtete Routen:** verschiedene Routen, deren zwischengespeicherter Verlauf dich als Routenbauer (`@yourlogin`) auflistet. Gleiche `@login`-Regel wie beim FA-Import; Freitext-Namen zählen nicht. Erfordert den Routendaten-Import (`ROUTE_DATA_IMPORT=true`), damit diese Zeilen lokal gespeichert werden.
- **Community-Begehungen (Schätzung):** zwischengespeicherte Begehungen von Routen, die du erstbegangen hast (FA/FFA-Markierungen **oder** Routenbauer-Gutschriften), abzüglich deiner eigenen beim selben Abruf erfassten Tourenbuch-Begehungen. Eine zweite Kachel schlüsselt **Sportkletter- / gebohrte** Routen auf (Absicherungsstil Sportklettern oder jede Route mit erfassten Bohrhaken). Spätere Wiederholungen oder Löschungen des Besitzers ändern den alten Schnappschuss nicht. Dies sind Schätzungen der Gesamtzahl der Begehungen, keine einzelnen Kletterer oder Live-Zähler; Sichtbarkeitsunterschiede und ein unvollständiges Tourenbuch des Besitzers können diese beeinflussen.
- **Community-Abdeckung:** Die Karte zeigt, wie viele der angerechneten Tourenbuch-Routen zugehörige Zählerschnappschüsse haben, gemessen an allen berechtigten Routen. Bekannte Nullwerte werden als Null angezeigt; nicht verfügbare Zählerstände werden ausgeschlossen, anstatt als Null behandelt zu werden. Teilweise Abdeckung wird explizit gekennzeichnet. Ein vollständig fehlender Cache zeigt eine Nachricht über die Nichtverfügbarkeit an.
- **Jahre:** vom Jahr deiner ersten FA bis zu deiner neuesten. Jede FA wird mit dem Datum deiner **ersten eingetragenen Begehung** der Route datiert (siehe unten).
- **Schwierigkeitsbereich:** deine leichteste und schwerste FA unter Verwendung des Gesamtgrads der Route (nicht einer einzelnen Seillänge). Routen und Boulder werden getrennt aufgeführt, da Ewbank- und V-Skalen nicht verglichen werden können. Schwierigkeitsgrade werden in deinen eingestellten Routen- und Bouldersystemen angezeigt.
- **Stile:** wie sich deine FAs auf Sportklettern, Trad, Boulder usw. aufteilen, basierend auf dem Routenstil auf theCrag.
- **Neueste:** deine drei neuesten FAs auf der Dashboard-Karte (vollständige Liste über das Tourenbuch).
- **Community nach Route:** die drei am höchsten angerechneten Routen auf dem Dashboard (weitere werden unter der Liste gezählt).
- **Community nach Route:** bis zu acht angerechnete Routen, sortiert nach der Community-Schätzung. Jede Zeile zeigt FA-, FFA- und/oder Routenbauer-Gutschriften, ein Stil-Abzeichen (Sportklettern/gebohrt, Trad, Boulder oder einen anderen bekannten Absicherungsstil aus den zwischengespeicherten Routeninformationen), die Schätzung (oder Nicht verfügbar) sowie den Zeitpunkt des Abrufs dieser Anzahl. Die Aktualität der Anzahl wird getrennt von anderen Routeninfofeldern gespeichert, sodass das Aktualisieren von Beta oder Qualität allein nicht vorgibt, dass der Zähler neu ist.

Die Karte wird Besuchern erst angezeigt, sobald mindestens eine FA markiert ist. Bis dahin sieht der Besitzer stattdessen eine kurze Anleitung.

Der Routendaten-Import muss aktiviert sein (`ROUTE_DATA_IMPORT=true`), um Zählerschnappschüsse zu füllen. Community-Gesamtzahlen und Zählerschnappschüsse des Besitzers stammen während des Hintergrund-Imports aus der Routen-API (100 Routen pro Durchlauf, Taktung und Back-off finden Anwendung). Um Gesamtzahlen und andere Routendaten automatisch aktuell zu halten, setze `ROUTE_DATA_REFRESH_DAYS` auf eine ganze Zahl von Tagen von 30 bis 3650 (z. B. `90` empfohlen oder `180` für etwa ein halbes Jahr) zusammen mit `ROUTE_DATA_IMPORT=true`. Routen werden nach dieser Anzahl von Tagen berechtigt und nach einer erfolgreichen Tourenbuch-Synchronisierung aktualisiert, wobei sie sich das Budget von 100 Routen mit neuen Routen teilen. Neue Routen kommen zuerst, dann die ältesten veralteten Daten; große Rückstände können mehrere Synchronisierungen in Anspruch nehmen. Nicht gesetzt, `0`, unter 30 oder über 3650 behält das Einmal-Abrufen-Verhalten bei; **Alle aktualisieren** in den Einstellungen bleibt ein optionaler manueller Reset. Manuell gesetzte und aufgehobene Markierungen bleiben geschützt.

In den Einstellungen zählt die Schaltfläche zum Überprüfen des Routenverlaufs herunter, bis der nächste Durchlauf zulässig ist, und wird automatisch verfügbar. Durchläufe haben ein Mindestintervall von einer Minute; eine Sperre oder ein Fehler kann eine längere Wartezeit erfordern. Lade die Einstellungen ohne JavaScript neu, um die Verfügbarkeit zu aktualisieren.

## Wann eine FA zählt und ihr Datum

Eine Erstbegehung ist der Durchstieg, daher wird jede mit dem Datum deines **ersten eingetragenen Durchstiegs** der markierten Route datiert. Frühere Versuche und Ausbouldern während des Auscheckens zählen nicht, ebenso wenig wie spätere Wiederholungen. Wenn du bisher nur Versuche eingetragen hast, erscheint die Route trotzdem auf der Karte (datiert mit deiner frühesten Begehung), erhält aber keine Abzeichen oder Meilensteine, bis du den Durchstieg einträgst.

## Abzeichen und Meilensteine

Diese werden durch vom Besitzer markierte FAs/FFAs (und deinen ersten Durchstieg jeder markierten Route) freigeschaltet, nicht durch das Aktivieren privater Notizen. Die Meilensteine-Karte und der Abzeichen-Katalog verwenden dieselben Schwellenwerte — nicht eine Zeile pro Route.

- **Erstbegehung** und **Erste Freibegehung:** dein erster Durchstieg einer Route, die du als FA oder FFA markiert hast.
- **Kombinierte Erstbegehungsanzahl** (5, 10 / Pionier, 20, 50, 100): so viele verschiedene Routen, die als FA oder FFA markiert sind.
- **Erste-Freibegehungs-Anzahl** (5, 10, 20, 50, 100): nur FFA-Markierungen.
- **Stil-Erstbegehungs-Anzahl** (10, 20, 50 für Sportklettern, Trad und Boulder): FA- oder FFA-Markierungen in diesem Absicherungsstil.
- **Routenbauer**, **Routenentwickler** (5), **Wandbauer** (10), **Felsarchitekt** (25): Routenbauer-Gutschriften aus dem zwischengespeicherten Routenverlauf, datiert mit dem frühesten Routenbauer-Eintrag, der deinen `@login` bei jeder Route nennt (nicht nach Tourenbuch-Durchstiegen).
- **Shared Crag** (10), **Publikumsliebling** (50), **Hundert Hände** (100), **Lokalklassiker** (500): ungefähre Community-Begehungen von Routen, die du erstbegangen oder eingerichtet hast (FA/FFA oder Routenbauer), aus zugehörigen Zählerschnappschüssen. Zählungen sind Begehungen, keine einzelnen Kletterer. Unvollständige Abdeckung wird in den Abzeichen-Details vermerkt.
- **Bolted Buzz** (10), **Sportkletter-Magnet** (50), **Clip-Klassiker** (100): dieselbe Schätzung beschränkt auf den Stil Sportklettern oder gebohrte Routen.

Jeder Schwellenwert wird mit dem Datum des ersten Durchstiegs der Route datiert, die ihn überschritten hat; das Detail nennt diese freischaltende Route.

Routenbauer-Gutschriften ohne gültiges Verlaufsdatum zählen weiterhin für Routenbauer-Abzeichen, aber ihr Erreichungsdatum bleibt unbekannt. Bei Community-Begehungs-Abzeichen bleibt das Erreichungsdatum ebenfalls unbekannt — die Gesamtzahlen sind zwischengespeicherte Summen, kein Ereignistag.
