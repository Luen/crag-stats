# Partner

Die Seite **Partner** (und die Dashboard-Karte) erstellt ein Ranking der Personen, die in deinem Tourenbuch im Feld `with` / Partner getaggt sind. Klicke auf einen Namen, um das Tourenbuch mit einer genauen Partner-Übereinstimmung zu öffnen.

## Metriken (`/partners`)

Nutze den Schalter oben rechts:

- **Begehungen** (Standard) — jede eingetragene Begehung, bei der dieser Partner genannt wird
- **Sessions** — einzelne Kalendertage mit mindestens einer gemeinsamen Begehung (gleiche „Session = Tag“-Idee wie bei [Sessions pro Woche](/docs/sessions-per-week); ungültige Platzhalter wie `2018-00-00` werden wie bei Wochentag übersprungen)
- **Gebiete** — verschiedene Klettergebiete, die mit diesem Partner geklettert wurden, unter Verwendung zwischengespeicherter Provider-Gebiets-IDs, falls verfügbar. Umbenennungen behalten eine Identität bei, und gleichnamige Klettergebiete mit unterschiedlichen IDs bleiben getrennt. Ohne ID werden Namen ohne Berücksichtigung von Groß-/Kleinschreibung abgeglichen; leere und „Unknown“-Namen werden übersprungen. Eine Zeile, die nur aus einem Namen besteht, wird einer bekannten ID nur dann zugeordnet, wenn dieser Name exakt einer ID zugewiesen werden kann

Deine Auswahl wird im Browser gespeichert (`cs_partners_metric`).

## Hinweise

- Usernames werden normalisiert (führendes `@` wird entfernt); dieselbe Person wird trotz unterschiedlicher Groß-/Kleinschreibung in einem einzelnen Balken zusammengefasst.
- Mehrseillängen-Tage mit vielen Ticks erhöhen die Anzahl der **Begehungen** stärker als die der **Sessions**.
- Jemand, mit dem du nur in einem einzigen Klettergebiet kletterst, schneidet unter **Gebiete** schlechter ab als ein Reisepartner mit weniger Ticks.

Die Dashboard-Vorschau und die vollständige Seite nutzen dieselben eingetragenen Begehungen, einschließlich älterer Begehungen, deren Routeneintrag nicht verfügbar ist. Fehlende Routendetails löschen weder Partner-Begehungen noch gültige Session-Tage; ohne bekanntes Gebiet tragen sie zu keinem Klettergebiet bei. Andere routenbasierte Dashboard-Analysen erfordern weiterhin einen Routeneintrag.

Die Dashboard-Karte teilt deine ausgewählte Metrik mit dieser Seite und zeigt die besten sieben Partner für diese Metrik an. Klicke auf den Titel „Partner“, um die vollständige Liste zu sehen.

Abzeichen, schwerste Begehungen, bemerkenswerte Begehungen, letzte Aktivitäten und kletterspezifische Grad-/Erstbegehungs-Meilensteine zeigen ebenfalls erfasste Begleiter an. Die Zuordnung folgt der ausgewählten Begehung, nicht jeder Wiederholung der Route. Entwicklungs-/Community-Karten auf Routenebene und aggregierte Meilensteine leiten keine Begleiter ab. Namen werden ohne Berücksichtigung der Groß-/Kleinschreibung bereinigt; fehlende Namen werden weggelassen und niemals als Beweis für Soloklettern gewertet.
