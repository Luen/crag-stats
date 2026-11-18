# Tourenbuch-Synchronisierung

Crag Stats bezieht dein Tourenbuch auf einem von zwei Wegen:

- **API-Synchronisierung** mit einem theCrag-Unterstützer-API-Schlüssel. Sie läuft nach dem bestehenden Zeitplan (`SYNC_CRON`, standardmäßig täglich), über **Einstellungen → Jetzt synchronisieren** (öffne **`/settings`** oder zuerst **`/login`**, wenn `APP_PASSWORD` gesetzt ist) sowie über den Docker-Worker. Eine Neuinstallation synchronisiert beim ersten Start, sobald ein Schlüssel hinterlegt ist.
- **Manueller CSV-Upload**. Exportiere dein Tourenbuch auf theCrag und lade die Datei unter **Einstellungen → CSV-Import** hoch, wann immer du die Daten aktualisieren möchtest.

## Datensicherung: Lokale Kopie behalten

Dein theCrag-Konto bleibt die maßgebliche Quelle für dein aktives Tourenbuch. Crag Stats speichert synchronisierte Begehungen, Einstellungen, Ziele, den Routenhistorie-Cache, Wettertage und zugehörige Daten in **SQLite** (`DATABASE_PATH`, typischerweise `./data/crag-stats.sqlite` oder `/data/crag-stats.sqlite` in Docker). Sichere das Docker-**Daten-Volume** (oder das Host-Verzeichnis, das du unter `/data` einbindest) zusammen mit deinen restlichen Homelab-Backups. Um eine konsistente Dateisicherung zu gewährleisten, stoppe alle Apps und Worker, die auf diese Datenbank zugreifen, kopiere das Volume inklusive aller `-wal`- und `-shm`-Dateien und starte die Dienste anschließend neu. Das einzelne Kopieren dieser Dateien bei laufendem Schreibzugriff kann zu inkonsistenten Backups führen; nutze bei laufendem Betrieb ein SQLite-fähiges Online-Backup-Tool. Docker Compose behält das Volume bei Image-Upgrades standardmäßig bei.

Für eine portable Kopie im Tabellenformat öffne **Einstellungen → Datenschutz & Datenkontrolle** und nutze **Tourenbuch-CSV herunterladen** (entspricht `/settings/export`). Die Datei ist ein theCrag-kompatibles CSV des lokalen Tourenbuchs: Routen, Ticks, Partner, Qualität, Daten und Kommentare/Notizen. Notizen sind in diesem Download immer enthalten, da es sich um deine persönliche Sicherung handelt; behandle die Datei wie sensible persönliche Daten. Du kannst sie später über **Einstellungen → CSV-Import** wieder importieren (nur Upsert – fehlende Einträge werden nicht gelöscht). Lade vor dem Ausführen von **Alle lokalen Daten löschen** eine CSV-Datei herunter, falls du beim Wiederaufbau über theCrag ein Fallback benötigst – ein Volume-Backup bleibt der vollständigste Wiederherstellungsweg.

Das CSV aus den Einstellungen stammt aus Crag Stats, nicht aus einem Live-Abruf von theCrag. Für eine vorgelagerte Sicherung des Tourenbuchs selbst nutze zusätzlich in deinem Online-Tourenbuch auf theCrag **Aktion → Tourenbuch als CSV exportieren**.

## Was eine manuelle Synchronisierung importiert hat

Nach erfolgreichem **Jetzt synchronisieren** oder **Vollständig neu synchronisieren** zeigen die Einstellungen verarbeitete Begehungen, neue Begehungen, aktualisierte bestehende Begehungen, neue Routen und entfernte Begehungen/Routen an. Eine Route, die von mehreren Begehungen geteilt wird, zählt als eine neue Route. „Aktualisiert“ bedeutet, dass eine bestehende Begehung erneut verarbeitet wurde; es bedeutet nicht zwangsläufig, dass sich ihr Inhalt geändert hat. Ein unverändertes Tourenbuch zeigt daher null Hinzufügungen/Entfernungen und aktualisierte bestehende Begehungen an. Übersprungene Durchläufe und Fehler zeigen eigene Meldungen statt einer Erfolgsübersicht.

Manuelle CSV-Uploads zeigen ebenfalls Zähler für verarbeitet/neu/aktualisiert, entfernen jedoch niemals fehlende Einträge. Routenhistorie und Wetteranreicherung sind separate Hintergrundimporte und in diesen Tourenbuch-Zählern nicht enthalten. Die Zusammenfassung beschreibt die abgeschlossene Aktion; sie ist kein dauerhafter Synchronisierungsverlauf.

## API-Synchronisierung

Setze `THECRAG_API_KEY` auf deinen Unterstützer-Schlüssel mit Leserechten für das Tourenbuch. Jede Synchronisierung liest das vollständige Tourenbuch und gleicht lokale Begehungen ab, einschließlich Löschungen. Dieser Modus liefert reichhaltigere Routen-, Profil- und Mehrseillängendaten und ist der einzige Weg, wie Crag Stats dein Tourenbuch automatisch von theCrag abruft.

### Wenn die API-Synchronisierung fehlschlägt

Die Einstellungen zeigen den Fehler an und behalten den Zeitpunkt der letzten erfolgreichen Synchronisierung bei. Die Meldung nennt die Ursache, sofern theCrag eine meldet, gefolgt vom kurzen theCrag-Fehlercode (zum Beispiel `invalid-api-key`):

- **Ungültiger Schlüssel:** theCrag hat `THECRAG_API_KEY` abgewiesen. Prüfe den Schlüssel auf Tippfehler oder ersetze ihn, falls er abgelaufen ist oder widerrufen wurde, und starte den Server neu.
- **Zugriff verweigert:** Dem Schlüssel fehlen die Leserechte für das Tourenbuch. Überprüfe deinen Unterstützer-Schlüssel oder lade deinen CSV-Export manuell hoch (siehe unten).
- **Nutzungslimit erreicht:** Der Schlüssel hat theCrags Anfragelimit erreicht. Warte auf das Zurücksetzen des Limits und synchronisiere erneut.

Schlägt eine spätere Seite fehl, bleiben Aktualisierungen früherer Seiten zwischengespeichert, es werden jedoch keine fehlenden Begehungen gelöscht und der Durchlauf wird nicht als erfolgreich markiert. Der nächste geplante Durchlauf (standardmäßig täglich) oder **Jetzt synchronisieren** versucht das vollständige Tourenbuch ab Seite 1 erneut. API-Fehler unterbrechen den Zeitplan nicht.

## Manueller CSV-Upload

Kein Unterstützer-Schlüssel? Öffne auf theCrag dein Tourenbuch, wähle **Aktion → Tourenbuch als CSV exportieren** und lade die Datei unter **Einstellungen → CSV-Import** hoch. Wiederhole dies, wann immer du neue Ticks übernehmen möchtest.

Manuelle Uploads fügen Begehungen hinzu und aktualisieren sie, entfernen jedoch niemals Einträge, die in der Datei fehlen. Um gelöschte Ticks zu entfernen, führe **Alle lokalen Daten löschen** aus und lade einen frischen Export hoch. Das CSV enthält weniger Felder als die API, darunter weniger Profil-, Routen-Metadaten- und Mehrseillängen-Informationen, und beinhaltet nicht theCrags private Begehungsnotizen (`privateMarkdown`); lediglich die öffentliche Kommentar-Spalte wird importiert. Australische reine Ziffern bei Bouldern nutzen Land / Pfad als AU-Hinweis, damit daraus keine fehlerhaften V-Grade entstehen.

Der Routendaten-Import gleicht Erstbegeher-Angaben mit deinem theCrag-Benutzernamen ab. Die API-Synchronisierung übernimmt ihn aus deinem Profil, und `THECRAG_USERNAME` wird in diesem Modus ignoriert; eine reine CSV-Installation setzt ihn stattdessen. Ohne Login stoppt der Import vor dem Abruf von Daten. Setze ihn daher (oder trage Erstbegehungen manuell im Tourenbuch ein).

## CSV-Tourenbuch mit Routendaten

Du kannst dein Tourenbuch per CSV pflegen und trotzdem Routendaten und automatische FA/FFA-Markierungen erhalten. Setze diese drei Werte:

- `CSV_INGEST_TOKEN`: ein langer Zufallswert für CSV-Uploads. Sobald er gesetzt ist, sind Uploads die Quelle des Tourenbuchs. Die API-Synchronisierung läuft dann nicht, löscht keine hochgeladenen Begehungen und überschreibt dein Kletterprofil nicht.
- `THECRAG_API_KEY`: dein Unterstützer-Schlüssel, der in diesem Modus nur für Routendaten und Standortabfragen verwendet wird.
- `THECRAG_USERNAME`: dein theCrag-Benutzername für den Abgleich von FA/FFA-Einträgen.

Ohne `CSV_INGEST_TOKEN` synchronisiert der API-Schlüssel weiterhin das Tourenbuch. Routendaten- und Wetterimporte folgen unabhängig davon `IMPORT_CRON` (standardmäßig täglich). Unter **Einstellungen → Routendaten importieren** kannst du einen Lauf starten und den Fortschritt sehen.

## CSV aus einem anderen Container hochladen

Nach dem Setzen von `CSV_INGEST_TOKEN` und einem Neustart akzeptiert `POST /api/logbook/csv` einen vorhandenen Export:

```bash
curl -X POST https://cragstats.example.com/api/logbook/csv \
  -H "Authorization: Bearer $CSV_INGEST_TOKEN" \
  -H "Content-Type: text/csv" \
  --data-binary @thecrag-logbook.csv
```

Ein Multipart-Upload mit dem Feld `file` funktioniert ebenfalls. Ein falscher Token wird mit `401` abgewiesen. Leere Dateien, HTML-Anmeldeseiten und Dateien über 25 MB werden nicht importiert. Erfolgreiche Antworten enthalten `ok`, `imported` und `created` mit den Zählern für Routen und Begehungen. Wie beim Upload in den Einstellungen werden fehlende Begehungen niemals gelöscht.

Crag Stats lädt keine CSV-Exporte von theCrag herunter und meldet sich nicht auf dessen Website an. Erstelle den Export selbst im Browser; automatisierte Zugriffe auf theCrag müssen dessen API verwenden.
