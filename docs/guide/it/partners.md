# Partner

La pagina **Partner** (e la scheda della dashboard) ordina le persone taggate nel campo `with` / partner del tuo logbook. Clicca su un nome per aprire il logbook filtrato per quel partner esatto.

## Metriche (`/partners`)

Usa il selettore in alto a destra:

- **Salite** (predefinito) — ogni salita registrata in cui compare quel partner
- **Sessioni** — giorni di calendario univoci con almeno una salita condivisa (stessa idea di “sessione = giorno” di [Sessioni a settimana](/docs/sessions-per-week); i segnaposto non validi come `2018-00-00` vengono saltati, come in Giorno della settimana)
- **Aree** — falesie distinte scalate con quel partner, utilizzando gli ID delle aree dei provider in cache quando disponibili. I cambi di nome mantengono un'unica identità, mentre le falesie con lo stesso nome ma ID diversi rimangono separate. Senza un ID, i nomi vengono confrontati senza distinzione tra maiuscole e minuscole; i nomi vuoti o “Unknown” vengono saltati. Una riga con solo il nome viene associata a un ID noto solo quando quel nome corrisponde esattamente a un unico ID

La tua scelta viene salvata nel browser (`cs_partners_metric`).

## Note

- Gli handle vengono normalizzati (la `@` iniziale viene rimossa); la stessa persona con diverse maiuscole/minuscole condivide un'unica barra.
- Le giornate multi-pitch con molte salite gonfiano le **Salite** più delle **Sessioni**.
- Qualcuno con cui scali solo in un'unica falesia risulterà più in basso in **Aree** rispetto a un partner di viaggio con meno salite.

L'anteprima della dashboard e la pagina completa utilizzano le stesse salite registrate, incluse le salite legacy per le quali il record della via non è disponibile. I dettagli mancanti sulle vie non cancellano le salite con i partner o i giorni di sessione validi; tuttavia, non contribuiscono a nessuna area senza un luogo conosciuto. Altre analisi della dashboard basate sulle vie richiedono comunque il record della via.

La scheda della dashboard condivide la metrica selezionata con questa pagina e mostra i primi sette partner per tale metrica. Clicca sul titolo Partner per vedere l'elenco completo.

Badge, chiusure più difficili, salite degne di nota, attività recenti e traguardi specifici per grado/FA mostrano anche i compagni registrati. L'attribuzione segue la salita selezionata, non ogni ripetizione della via. Le schede di sviluppo/community a livello di via e i traguardi aggregati non deducono i compagni. I nomi vengono deduplicati ignorando le maiuscole/minuscole; i nomi mancanti vengono omessi e non sono mai considerati come prova di arrampicata in solitaria.
