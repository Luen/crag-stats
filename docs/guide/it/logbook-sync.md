# Sincronizzazione del logbook

Crag Stats ottiene il tuo logbook in uno dei due modi seguenti:

- **Sincronizzazione API** con una chiave API supporter di theCrag. Viene eseguita secondo la pianificazione esistente (`SYNC_CRON`, giornaliera per impostazione predefinita), da **Impostazioni → Sincronizza ora** (apri **`/settings`**, o prima **`/login`** se `APP_PASSWORD` è impostata), e dal worker Docker. Una nuova installazione si sincronizza all'avvio quando viene configurata una chiave.
- **Caricamento manuale CSV**. Esporta il tuo logbook su theCrag e carica il file in **Impostazioni → Importazione CSV** ogni volta che vuoi aggiornarlo.

## Backup: conserva una copia locale

Il tuo account theCrag rimane la fonte di verità per il logbook live. Crag Stats memorizza le salite sincronizzate, le impostazioni, gli obiettivi, la cache della cronologia delle vie, i giorni meteo e lo stato relativo in **SQLite** (`DATABASE_PATH`, solitamente `./data/crag-stats.sqlite` o `/data/crag-stats.sqlite` in Docker). Esegui il backup del **volume dati** Docker (o della directory host che monti in `/data`) insieme al resto dei backup del tuo homelab. Per un backup coerente dei file, interrompi ogni app e worker che utilizza quel database, copia il volume includendo eventuali file collaterali `-wal` / `-shm`, quindi riavviali. Copiare questi file uno alla volta mentre i processi di scrittura sono in esecuzione può produrre un backup incoerente; usa uno strumento di backup online compatibile con SQLite se hai bisogno di mantenere l'app in funzione. Compose mantiene già il volume persistente durante gli aggiornamenti dell'immagine.

Per una copia portatile in formato foglio di calcolo, apri **Impostazioni → Privacy e controllo dati** e usa **Scarica CSV del logbook** (stessa azione di `/settings/export`). Il file è un CSV in stile theCrag del logbook locale: vie, segnature, compagni, qualità, date e commenti/note. Le note sono sempre incluse in questo download perché è il tuo backup; tratta il file come dati personali. Puoi importarlo di nuovo in seguito con **Impostazioni → Importazione CSV** (solo upsert — non rimuove le salite mancanti nel file). Scarica un CSV prima di **Cancella tutti i dati locali** se desideri un piano di riserva mentre ricostruisci da theCrag — un backup del volume rimane comunque il percorso di ripristino completo.

Il CSV nelle Impostazioni proviene da Crag Stats, non è un recupero in tempo reale da theCrag. Per un backup a monte del logbook stesso, usa anche la funzione di theCrag **Azione → Esporta logbook come CSV** nel tuo logbook online.

## Cosa ha importato una sincronizzazione manuale

Al termine di **Sincronizza ora** o **Sincronizzazione completa**, le Impostazioni mostrano le salite elaborate, le nuove salite, le salite esistenti aggiornate, le nuove vie e le salite/vie rimosse.
Una via condivisa da più salite conta come una nuova via. “Aggiornata” significa che una salita esistente è stata elaborata di nuovo; non significa che il suo contenuto sia cambiato.
Un logbook invariato mostra quindi zero aggiunte/rimozioni e le salite esistenti aggiornate. Le esecuzioni saltate e gli errori mostrano i propri messaggi, non un riepilogo di successo.

Anche i caricamenti manuali di CSV mostrano i conteggi di elaborati/nuovi/aggiornati, ma non rimuovono mai le voci mancanti. Route data and weather enrichment are separate background
imports: when enabled, they start after every successful sync or CSV upload
(including uploads to `POST /api/logbook/csv`), and are not included in these
logbook counts. Il riepilogo descrive l'azione del pulsante completata; non è una cronologia di sincronizzazione persistente.

## Sincronizzazione API

Imposta `THECRAG_API_KEY` sulla tua chiave di lettura del logbook supporter. Ogni sincronizzazione legge l'intero logbook e riconcilia le salite locali, incluse le eliminazioni. Questa modalità fornisce dati più ricchi su vie, profili e multipitch, ed è l'unico modo in cui Crag Stats contatta automaticamente theCrag per il tuo logbook.

### Se la sincronizzazione API fallisce

Le Impostazioni mostrano il fallimento e conservano l'ora dell'ultima sincronizzazione riuscita. Il messaggio indica la causa quando theCrag ne riporta una, seguita dal codice di errore breve di theCrag (ad esempio `invalid-api-key`):

- **Chiave non valida:** theCrag ha rifiutato `THECRAG_API_KEY`. Controlla se ci sono errori di battitura, o sostituiscila se è scaduta o è stata revocata, quindi riavvia il server.
- **Accesso negato:** la chiave non ha i permessi di lettura del logbook. Controlla la tua chiave supporter, oppure carica manualmente il tuo export CSV (sotto).
- **Limite di utilizzo:** la chiave ha raggiunto il limite di richieste di theCrag. Attendi che venga ripristinato, quindi sincronizza di nuovo.

Se una pagina successiva fallisce, gli aggiornamenti delle pagine precedenti rimangono in cache, ma nessuna chiusura mancante viene eliminata e l'esecuzione non viene contrassegnata come riuscita. La successiva esecuzione pianificata (giornaliera per impostazione predefinita) o **Sincronizza ora** riprova l'intero logbook dalla pagina 1. I fallimenti delle API non mettono in pausa la pianificazione.

## Caricamento manuale CSV

Non hai una chiave supporter? Su theCrag, apri il tuo logbook e scegli **Azione → Esporta logbook come CSV**, quindi carica il file in **Impostazioni → Importazione CSV**. Ripeti ogni volta che desideri inserire nuove segnature.

I caricamenti manuali aggiungono e aggiornano le salite, ma non rimuovono mai le salite mancanti nel file. Per eliminare le segnature cancellate, seleziona **Cancella tutti i dati locali** e carica un nuovo export. Il CSV ha meno campi rispetto all'API, inclusi meno metadati su profili, vie e informazioni sulle multipitch, e non include le note private delle salite di theCrag (`privateMarkdown`); viene importata solo la colonna pubblica Comment. Le cifre nude per il boulder australiano utilizzano il Paese / percorso come suggerimento AU per evitare che diventino falsi gradi V.

L'importazione dei dati delle vie confronta i crediti FA/FFA con il tuo nome utente theCrag. La sincronizzazione API lo salva dal tuo profilo e `THECRAG_USERNAME` viene ignorato in questa modalità; un'installazione solo tramite CSV lo imposta invece manualmente. Senza un login l'importazione si ferma prima di recuperare qualsiasi cosa, quindi impostalo (o contrassegna manualmente le prime salite nel logbook).

## Logbook CSV con dati delle vie

Puoi mantenere il logbook in CSV e avere comunque i dati delle vie (popolarità, conteggio salite, qualità, stagionalità, tiri) e i contrassegni automatici FA/FFA. Imposta:

- `CSV_INGEST_TOKEN`: un valore casuale lungo. È ciò che permette a un container o a uno script di inviarti un export CSV, quindi comunica anche a Crag Stats che i caricamenti sono la fonte del logbook: non viene eseguita alcuna sincronizzazione API, quindi le chiusure caricate non vengono mai rimosse e la sincronizzazione non scrive mai il profilo climber del titolare della chiave.
- `THECRAG_API_KEY`: la tua chiave di lettura del logbook supporter, ora utilizzata solo per i dati delle vie e la ricerca della posizione di falesie/settori.
- `THECRAG_USERNAME`: il tuo nome utente theCrag, così la cronologia FA/FFA corrisponde a te (gli export CSV non la includono).

Questa è l'intera configurazione: tre valori, nessun selettore di modalità. Senza `CSV_INGEST_TOKEN`, `THECRAG_API_KEY` sincronizza il logbook e i dati delle vie condividono la stessa chiave. Background route and weather imports start after each successful sync or CSV upload, and also follow `IMPORT_CRON` (daily by default) rather than the logbook schedule, so a weekly or monthly `SYNC_CRON` still gets route data daily. Impostazioni → **Importa dati vie** mostra l'avanzamento e avvia un'esecuzione manuale.

## Caricamento di un CSV da un altro container

Il caricamento manuale va bene per aggiornamenti occasionali. Se conservi il tuo export in un posto leggibile dalla tua rete — una cartella condivisa, una condivisione Nextcloud o Dropbox, o un piccolo container compagno che carica ogni nuovo export — Crag Stats può accettarlo tramite HTTP. Imposta `CSV_INGEST_TOKEN` su un valore casuale lungo, riavvia, quindi invia il file tramite `POST`:

```bash
curl -X POST https://cragstats.example.com/api/logbook/csv \
  -H "Authorization: Bearer $CSV_INGEST_TOKEN" \
  -H "Content-Type: text/csv" \
  --data-binary @thecrag-logbook.csv
```

Funziona anche un caricamento multipart con il file in un campo `file`. Le richieste senza il token vengono rifiutate e una risposta positiva riporta quante chiusure sono state elaborate e quante erano nuove:

```json
{ "ok": true, "imported": 412, "created": { "routes": 318, "ascents": 412 } }
```

Per controllare un'installazione senza importare nulla, invia un body che non sia un export:

```bash
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://cragstats.example.com/api/logbook/csv \
  -H "Authorization: Bearer $CSV_INGEST_TOKEN" \
  -H "Content-Type: text/csv" --data-binary 'x'
```

`400` significa che l'endpoint è raggiungibile e il token è stato accettato: ha rifiutato il body, quindi nulla è stato scritto. `401` significa che il token non corrisponde, mentre `404` significa che l'immagine è precedente a questo endpoint. Su un'installazione con interfaccia interamente protetta (`AUTH_SCOPE=all`), una vecchia immagine risponde `401` per qualsiasi percorso `/api/` sconosciuto, quindi interpreta `401` come "token o immagine".

Un file vuoto, una pagina di login salvata per errore o qualsiasi file superiore a 25 MB viene rifiutato invece di essere importato. Questo endpoint esegue la stessa importazione solo upsert del modulo nelle Impostazioni, quindi non rimuove mai le salite mancanti nel file. Non effettua alcuna richiesta a theCrag: l'export deve comunque provenire dal tuo browser o da un altro strumento sotto il tuo controllo.

## Perché non ci sono download automatici di CSV

Crag Stats non effettua mai il login al sito web di theCrag né scarica export per te. i [termini](https://www.thecrag.com/terms#ownership-and-licenses) di theCrag richiedono che ogni accesso programmatico avvenga tramite l'API, e ogni esportazione è un dump completo del logbook che risulta costoso per i loro server. Esportare e caricare il CSV autonomamente va bene.
