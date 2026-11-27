# Tipi di roccia

theCrag memorizza la geologia di molte vie sotto forma di tag strutturato **Tipo di roccia** (ad esempio Granito o Arenaria). Crag Stats legge quel tag dal logbook sincronizzato / cache delle vie — non effettua mai lo scraping delle pagine né ipotizza il tipo di roccia dal nome della falesia.

## Scheda Tipi di roccia

La scheda **Tipi di roccia** del dashboard conta le ascensioni la cui via ha un tag Tipo di roccia e mostra la quota di ciascun nome. Il tipo dominante può mostrare una breve descrizione geologica. Ogni nome rimanda al logbook filtrato con `?rock=`.

Le vie senza un tag Tipo di roccia sono escluse dal grafico, quindi le percentuali descrivono solo le arrampicate taggate.

## Scheda Roccia e performance

Una volta che **20 o più** giornate di arrampicata includono almeno una chiusura o un tentativo su una via con tag Tipo di roccia, la scheda **Roccia e performance** confronta l'andamento di quelle scalate in base alla roccia. Prima di allora, mostra quante giornate taggate hai accumulato finora. La scheda rimane nascosta finché non esiste alcuna chiusura o tentativo taggato, e può essere spostata o nascosta da Impostazioni → Dashboard.

**Cosa viene contato.** Chiusure e tentativi (la stessa classificazione dei tick usata altrove) su vie con un tag Tipo di roccia. Le scalate non taggate sono riportate solo come copertura (“Altre N… non hanno un tag tipo di roccia”).

**Metriche** (stessi concetti di [Meteo e performance](/docs/weather)):

- **Tasso di chiusura:** le chiusure come quota di chiusure e tentativi su quel tipo di roccia.
- **Vicino al limite:** la quota di chiusure con grado entro 2 gradi (1 grado-V sulla scala V) rispetto alla tua chiusura più difficile dello **stesso stile e scala di gradi** nei 365 giorni precedenti a quel giorno. La scala V e i gradi delle vie non vengono mai mescolati.
- **A vista/flash:** a vista e flash come quota di chiusure su quel tipo di roccia.

**Leggere i dati con onestà.**

- Un tipo di roccia necessita di almeno **10** ascensioni (per il denominatore di quella metrica) in almeno **3** giorni prima di mostrare un tasso.
- **Superiore** / **Inferiore** utilizza lo stesso test cluster-robust della performance meteo: ogni gruppo roccia-giorno è un'unità, quindi una singola sessione intensa non può creare un pattern da sola.
- La scelta della falesia, i viaggi e i progetti possono confondere il dato sul tipo di roccia. Considera le differenze come correlazioni, non come cause.
- Quando hai molti nomi di roccia distinti, i meno frequenti vengono raggruppati in **Altro** (senza link al logbook). Le fasce con nome rimandano a `/logbook?rock=…` con la stessa corrispondenza case-insensitive della scheda Tipi di roccia.

La visualizzazione della scheda non attiva mai una richiesta al provider e le note private non vengono mai utilizzate.

Il riferimento per il 'vicino al limite' include le tue chiusure dello stesso stile e della stessa scala anche quando quelle vie di riferimento non hanno un tag roccia. Utilizza il grado del tiro più difficile salito quando disponibile, include il 365º giorno precedente ed esclude tutte le chiusure del giorno oggetto del confronto. Le performance per roccia e meteo condividono questo calcolo di riferimento; il meteo limita ulteriormente le chiusure di riferimento alle scalate outdoor.
