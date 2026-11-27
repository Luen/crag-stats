# Calendario delle salite

Il **Calendario delle salite** è una mappa termica annuale dei giorni in cui hai registrato delle arrampicate. Le caselle rimandano a `/logbook?day=` per quella data.

## Intensità

I colori variano in base a quante salite hai registrato quel giorno (vuoto → poche → molte), utilizzando la stessa scala cromatica verde. I tentativi contano ai fini dell'intensità; il tooltip separa comunque il numero di chiusure.

## Grado

Ogni giorno è colorato in base alla **chiusura più difficile** di quella giornata, utilizzando la stessa palette di fasce da Principiante → Élite usata per i badge dei gradi altrove. I giorni con soli tentativi (senza alcuna chiusura) utilizzano un riempimento “tentativo” smorzato. Quando in un solo giorno si combinano gradi da boulder e da via, il calendario sceglie l'id della fascia più alta — le fasce non sono perfettamente comparabili tra sistemi diversi.

La tua preferenza per Intensità / Grado viene salvata nel browser (`cs_heatmap_mode`).

## Meteo

Quando la [cache meteo](/docs/weather) opzionale contiene uno qualsiasi dei tuoi giorni di arrampicata, appare una terza modalità **Meteo**. Ogni giorno con arrampicate è colorato in base alle condizioni della sua prima salita all'aperto con dati meteo in cache: neve, pioggia, caldo (35°C+), gelo, bello (15–25°C e asciutto) o mite, utilizzando le stesse regole dei badge. I giorni senza dati meteo in cache (palestra, assenza di coordinate, dati non ancora recuperati) rimangono di un grigio opaco. I tooltip elencano la temperatura massima, la minima e la pioggia, mentre una tabella **Mostra valori meteo** sotto il calendario mostra gli stessi numeri in formato testo per l'anno selezionato.

Le caselle del calendario mantengono la data di calendario registrata in qualsiasi fuso orario del browser, compresi i cambi dell'ora legale. Non convertono i giorni di arrampicata in timestamp locali.
