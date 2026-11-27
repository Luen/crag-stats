# Attività

Le schede **Statistiche mensili** e **Statistiche annuali** della dashboard riassumono il volume a colpo d'occhio. **Attività** (`/activity`) è la pagina di dettaglio per quando vuoi più di semplici grafici: una tabella mensile completa (salite, chiusure, altezza, mix di stili) e la suddivisione anno su anno.

## Cosa viene conteggiato

- **Salite** — ogni tick registrato in quel giorno/mese/anno (tentativi inclusi).
- **Chiusure** — i tick classificati come chiusure (vedi [Tipi di salita](/docs/tick-types)).
- **Altezza** — metri della salita o della via, quando presente.
- **Stili** — Sportiva / Tradizionale / Blocco in base allo stile di protezione; tutto il resto viene raggruppato in **Altro** nella tabella.

I link dei mesi aprono il logbook per quel mese solare. I link degli anni (sulla scheda/tabella annuale) aprono `/logbook?year=`.

## Perché una pagina separata

Ripetere semplicemente i due stessi grafici appesantirebbe inutilmente la barra laterale. La pagina Attività si guadagna il suo spazio includendo la **tabella di dettaglio mensile** e rendendo facili da consultare i delta YoY — lo stesso standard stabilito per andare oltre delle semplici schede minimali.

## Serie

La scheda Serie mostra le serie attuali per giorno, settimana e mese accanto alla tua serie giornaliera **più lunga** di sempre (quattro riquadri con le metriche). Le date di inizio e fine della serie più lunga
si trovano sotto i riquadri. Quando esistono record di pari durata, viene mostrato l'intervallo più risalente.
Un singolo giorno di arrampicata mostra una sola data; una cronologia vuota non riporta alcuna data record.

Il piè di pagina mostra anche l'ultimo giorno di arrampicata, quanti giorni interi sono trascorsi
da allora quando la serie giornaliera attuale si interrompe, e i **giorni attivi** complessivi
(giorni distinti di arrampicata). I giorni derivano da date di salita valide registrate; tentativi e
chiusure, al chiuso e all'aperto, contano allo stesso modo, e più arrampicate nello stesso giorno contano
una sola volta. Vedi [Badge](/docs/badges) per i traguardi di 7, 10 e 30 giorni.

La serie giornaliera attuale termina oggi, oppure ieri se non hai ancora arrampicato oggi.
I confronti dei giorni di calendario utilizzano UTC, in modo che il fuso orario del server e il cambio
dell'ora legale non possano spostare un giorno registrato. Le voci con date future non estendono la serie attuale.

Le serie attuali per settimana e mese seguono la stessa regola di tolleranza: contano i periodi
consecutivi che terminano nel periodo attuale, o in quello immediatamente precedente se non c'è
ancora stata alcuna arrampicata in questo periodo. Dopo un'intera settimana o mese senza attività, quel contatore
è pari a zero. Le settimane iniziano il lunedì e i limiti del calendario utilizzano l'ora UTC, anche tra la
settimana ISO 53 e il nuovo anno. Le voci con date future non vengono conteggiate in questi contatori.

## Attività recenti

La dashboard elenca per primo il **giorno di arrampicata** più recente. All'interno di ciascun giorno, viene prima la salita **registrata** più di recente,
utilizzando il timestamp di creazione del log fornito dal provider.
La data visualizzata rimane la data di arrampicata: registrare oggi un'arrampicata più vecchia
non la sposterà sopra le salite di un giorno di arrampicata successivo. L'ordine di registrazione funge da approssimazione dell'ordine
di arrampicata quando inserisci le salite in sequenza, non da orario di salita registrato.

Le voci con orari di registrazione mancanti o non validi seguono le voci con orari nello stesso giorno.
Orari di registrazione uguali o non disponibili utilizzano l'ID della salita salvato, dalla più recente alla più vecchia, per mantenere l'ordine
stabile. I timestamp di modifica/sincronizzazione non vengono usati come orari di creazione del log.

Le attività recenti mostrano anche gli stessi badge dello stile di arrampicata presenti nel logbook: disciplina della via, uno stile di protezione registrato diverso se applicabile, e varianti solo esplicite come Lead solo o Top-rope solo. L'assenza di compagni di cordata non implica mai una salita in solitario.
