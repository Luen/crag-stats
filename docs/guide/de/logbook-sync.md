# Tourenbuch-Synchronisierung

Crag Stats bezieht dein Tourenbuch auf einem von zwei Wegen:

- **API-Synchronisierung** mit einem theCrag-Unterstützer-API-Schlüssel. Sie läuft nach dem bestehenden Zeitplan (`SYNC_CRON`, standardmäßig täglich), über **Einstellungen → Jetzt synchronisieren** (öffne **`/settings`** oder zuerst **`/login`**, wenn `APP_PASSWORD` gesetzt ist) sowie über den Docker-Worker. Eine Neuinstallation synchronisiert beim ersten Start, sobald ein Schlüssel hinterlegt ist.
- **Manueller CSV-Upload**. Exportiere dein Tourenbuch auf theCrag und lade die Datei unter **Einstellungen → CSV-Import** hoch, wann immer du die Daten aktualisieren möchtest.

## Datensicherung: Lokale Kopie behalten

Dein theCrag-Konto bleibt die maßgebliche Quelle für dein aktives Tourenbuch. Crag Stats speichert synchronisierte Begehungen, Einstellungen, Ziele, den Routenhistorie-Cache, Wettertage und zugehörige Daten in **SQLite** (`DATABASE_PATH`, typischerweise `./data/crag-stats.sqlite` oder `/data/crag-stats.sqlite` in Docker). Sichere das Docker-**Daten-Volume** (oder das Host-Verzeichnis, das du unter `/data` einbindest) zusammen mit deinen restlichen Homelab-Backups. Um eine konsistente Dateisicherung zu gewährleisten, stoppe alle Apps und Worker, die auf diese Datenbank zugreifen, kopiere das Volume inklusive aller `-wal`- und `-shm`-Dateien und starte die Dienste anschließend neu. Das einzelne Kopieren dieser Dateien bei laufendem Schreibzugriff kann zu inkonsistenten Backups führen; nutze bei laufendem Betrieb ein SQLite-fähiges Online-Backup-Tool. Docker Compose behält das Volume bei Image-Upgrades standardmäßig bei.

Für eine portable Kopie im Tabellenformat öffne **Einstellungen → Datenschutz & Datenkontrolle** und nutze **Tourenbuch-CSV herunterladen** (entspricht `/settings/export`). Die Datei ist ein theCrag-kompatibles CSV des lokalen Tourenbuchs: Routen, Ticks, Partner, Qualität, Daten und Kommentare/Notizen. Notizen sind in diesem Download immer enthalten, da es sich um deine persönliche Sicherung handelt; behandle die Datei wie sensible persönliche Daten. Du kannst sie später über **Einstellungen → CSV-Import** wieder importieren (nur Upsert – fehlende Einträge werden nicht gelöscht). Lade vor dem Ausführen von **Alle lokalen Daten löschen** eine CSV-Datei herunter, falls du beim Wiederaufbau über theCrag ein Fallback benötigst – ein Volume-Backup bleibt der vollständigste Wiederherstellungsweg.

Das CSV aus den Einstellungen stammt aus Crag Stats, nicht aus einem Live-Abruf von theCrag. Für eine vorgelagerte Sicherung des Tourenbuchs selbst nutze zusätzlich in deinem Online-Tourenbuch auf theCrag **Aktion → Tourenbuch als CSV exportieren**.

## Was eine manuelle Synchronisierung importiert hat

Nach erfolgreichem **Jetzt synchronisieren** oder **Vollständig neu synchronisieren** zeigen die Einstellungen verarbeitete Begehungen, neue Begehungen, aktualisierte bestehende Begehungen, neue Routen und entfernte Begehungen/Routen an.
Eine Route, die von mehreren Begehungen geteilt wird, zählt als eine neue Route. „Aktualisiert“ bedeutet, dass eine bestehende Begehung erneut verarbeitet wurde; es bedeutet nicht zwangsläufig, dass sich ihr Inhalt geändert hat.
Ein unverändertes Tourenbuch zeigt daher null Hinzufügungen/Entfernungen und aktualisierte bestehende Begehungen an. Übersprungene Durchläufe und Fehler zeigen eigene Meldungen statt einer Erfolgsübersicht.

Manuelle CSV-Uploads zeigen ebenfalls Zähler für verarbeitet/neu/aktualisiert, entfernen jedoch niemals fehlende Einträge. Route data and weather enrichment are separate background
imports: when enabled, they start after every successful sync or CSV upload
(including uploads to `POST /api/logbook/csv`), and are not included in these
logbook counts. Die Zusammenfassung beschreibt die abgeschlossene Aktion; sie ist kein dauerhafter Synchronisierungsverlauf.

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

Der Routendaten-Import gleicht FA/FFA-Einträge mit deinem theCrag-Benutzernamen ab. Die API-Synchronisierung übernimmt ihn aus deinem Profil, und `THECRAG_USERNAME` wird in diesem Modus ignoriert; eine reine CSV-Installation setzt ihn stattdessen. Ohne Login stoppt der Import vor dem Abruf von Daten. Setze ihn daher (oder trage Erstbegehungen manuell im Tourenbuch ein).

## CSV-Tourenbuch mit Routendaten

Du kannst dein Tourenbuch per CSV pflegen und trotzdem Routendaten (Beliebtheit, Begehungszahlen, Qualität, Saisonalität, Seillängen) und automatische FA/FFA-Markierungen erhalten. Setze:

- `CSV_INGEST_TOKEN`: ein langer Zufallswert für CSV-Uploads. Damit kann ein Container oder Skript dir einen CSV-Export senden. Zugleich legt der Wert Uploads als Tourenbuchquelle fest: Die API-Synchronisierung läuft nicht, löscht keine hochgeladenen Begehungen und überschreibt das Kletterprofil nicht mit dem Profil des Schlüsselinhabers.
- `THECRAG_API_KEY`: dein Unterstützer-Schlüssel, der in diesem Modus nur für Routendaten und Standortabfragen verwendet wird.
- `THECRAG_USERNAME`: dein theCrag-Benutzername für den Abgleich von FA/FFA-Einträgen (CSV-Exporte enthalten ihn nicht).

Das ist die gesamte Konfiguration: drei Werte, kein zusätzlicher Modusschalter. Ohne `CSV_INGEST_TOKEN` synchronisiert der API-Schlüssel weiterhin das Tourenbuch. Background route and weather imports start after each successful sync or CSV upload, and also follow `IMPORT_CRON` (daily by default) rather than the logbook schedule, so a weekly or monthly `SYNC_CRON` still gets route data daily. Unter **Einstellungen → Routendaten importieren** kannst du einen Lauf starten und den Fortschritt sehen.

## CSV aus einem anderen Container hochladen

Für gelegentliche Aktualisierungen genügt ein manueller Upload. Liegt dein Export im Netzwerk bereit — in einem gemeinsamen Ordner, einer Nextcloud- oder Dropbox-Freigabe oder einem kleinen Container, der jeden neuen Export hochlädt — kann Crag Stats ihn stattdessen über HTTP empfangen. Setze `CSV_INGEST_TOKEN` auf einen langen Zufallswert, starte neu und sende die Datei mit `POST`:

```bash
curl -X POST https://cragstats.example.com/api/logbook/csv \
  -H "Authorization: Bearer $CSV_INGEST_TOKEN" \
  -H "Content-Type: text/csv" \
  --data-binary @thecrag-logbook.csv
```

Ein Multipart-Upload mit dem Feld `file` funktioniert ebenfalls. Anfragen ohne Token werden abgewiesen. Eine erfolgreiche Antwort nennt die verarbeiteten und neu hinzugefügten Begehungen:

```json
{ "ok": true, "imported": 412, "created": { "routes": 318, "ascents": 412 } }
```

Um eine Installation ohne Import zu prüfen, sende einen Inhalt, der kein Export ist:

```bash
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://cragstats.example.com/api/logbook/csv \
  -H "Authorization: Bearer $CSV_INGEST_TOKEN" \
  -H "Content-Type: text/csv" --data-binary 'x'
```

`400` bedeutet, dass der Endpunkt erreichbar ist und der Token akzeptiert wurde: Der Inhalt wurde abgewiesen, und es wurde nichts geschrieben. `401` bedeutet, dass der Token nicht stimmt; `404` bedeutet, dass das Image diesen Endpunkt noch nicht enthält. Bei einer vollständig geschützten Installation (`AUTH_SCOPE=all`) antwortet ein älteres Image für jeden unbekannten `/api/`-Pfad mit `401`. Lies `401` daher als "Token oder Image".

Leere Dateien, HTML-Anmeldeseiten und Dateien über 25 MB werden nicht importiert. Dieser Endpunkt importiert wie das Formular in den Einstellungen nur neue und aktualisierte Einträge. Er löscht niemals Begehungen, die in der Datei fehlen. Er stellt keine Anfrage an theCrag: Der Export muss weiterhin aus deinem Browser oder einem anderen von dir kontrollierten Werkzeug stammen.

## Warum es keine automatischen CSV-Downloads gibt

Crag Stats meldet sich niemals auf der theCrag-Website an und lädt keine Exporte für dich herunter. theCrags [Nutzungsbedingungen](https://www.thecrag.com/terms#ownership-and-licenses) verlangen, dass automatisierte Zugriffe über die API erfolgen. Jeder Export enthält das vollständige Tourenbuch und belastet die Server. Du kannst die CSV-Datei selbst exportieren und hochladen.
