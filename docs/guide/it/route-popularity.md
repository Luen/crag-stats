# Popolarità della via

La scheda **Popolarità della via** utilizza le statistiche della community che theCrag salva in cache per ogni via: **numero di ascensioni**, **popolarità** e **popolarità relativa** (0–100). Crag Stats le memorizza quando viene eseguita l'importazione dei dati delle vie (`ROUTE_DATA_IMPORT=true` sul server, poi riavvia e sincronizza).

## Percorsi battuti vs percorsi poco frequentati

Per ogni ascensione per la quale esistono dati di popolarità, confrontiamo la **popolarità relativa**, se presente, altrimenti la **popolarità globale**:

| Categoria                     | Regola            |
| ----------------------------- | ----------------- |
| **Percorso battuto**          | Punteggio ≥ 50    |
| **Percorso poco frequentato** | Punteggio &lt; 50 |

La scheda mostra quale **quota di tali chiusure** rientra in ogni categoria. Le ascensioni su vie senza statistiche in cache sono escluse dalle percentuali.

## Perle nascoste

**Le perle nascoste** sono **chiusure** su vie che sono sia ben considerate (`qualityScore` ≥ 70, o almeno ★★★, o una valutazione di qualità elevata nella tua chiusura) che poco frequentate (**numero di ascensioni** della community ≤ 100 e punteggio di popolarità &lt; 50). Vengono elencate fino a tre vie distinte, classificate in base alla qualità.

## Logbook

Ordina per **Pop.** per disporre le chiusure in base alla popolarità della via (la più alta per prima per impostazione predefinita). Le righe senza statistiche in cache vengono visualizzate in fondo.

## Fonte

I numeri provengono dalle API delle vie di theCrag (`show=info`). Riflettono l'intera community, non solo il tuo logbook.

La popolarità utilizza la popolarità relativa quando disponibile, altrimenti la popolarità globale. Il numero di ascensioni della community viene mostrato separatamente e non viene mai confrontato numericamente con i punteggi di popolarità.

Per mantenere aggiornati i totali delle ascensioni della community, la popolarità e le valutazioni, il proprietario del server può impostare `ROUTE_DATA_REFRESH_DAYS` su un numero intero di giorni da 30 a 3650 (ad es. `90` consigliato, o `180` per circa sei mesi), con `ROUTE_DATA_IMPORT=true`. Si tratta di intervalli di giorni mobili. Dopo che la sincronizzazione del logbook è andata a buon fine, le nuove vie hanno la priorità, poi i recuperi di dati più vecchi vengono aggiornati entro lo stesso limite di 100 vie e lo stesso ritmo. L'smaltimento di un arretrato può richiedere diverse sincronizzazioni. Se non impostato, o con valori `0`, inferiori a 30 o superiori a 3650, viene mantenuta la cache predefinita di un solo caricamento; **Aggiorna tutto** rimane disponibile nelle Impostazioni.
