# Mesi migliori

La scheda **Mesi migliori** confronta la [stagionalità di theCrag](https://www.thecrag.com/article/Seasonality) per le falesie in cui arrampichi di più con **quando vi arrampichi effettivamente**.

## Da dove provengono i dati

theCrag memorizza una **curva di stagionalità a 12 valori** per ogni via (un valore per ogni mese di calendario). Crag Stats la salva in cache per ciascuna via durante l'importazione opzionale dei dati delle vie (`ROUTE_DATA_IMPORT`, disattivata di default). Fino a quando una via non è stata recuperata almeno una volta, non c'è alcuna stagionalità da mostrare.

## Come aggregiamo i dati

Per ogni falesia nel tuo logbook:

1. **Il tuo volume** — conta le tue salite per mese di calendario (tutti gli anni combinati).
2. **Stagionalità di theCrag** — per ogni via che hai segnato in quella falesia, prende la curva a 12 mesi salvata in cache e la pondera in base a **quante volte hai scalato quella via**. Le vie con più salite registrate influenzano maggiormente la media della falesia.

Mostriamo fino a **sei** falesie classificate in base alle tue salite totali, ma solo le falesie in cui almeno una via scalata ha la stagionalità salvata in cache.

## Leggere il grafico

- **Barre arancioni** — stagionalità media ponderata (più alta = più popolare su theCrag in quel mese).
- **Barre grigie** — le tue salite in quel mese in quella falesia.

Quando le barre grigie raggiungono il picco in mesi diversi rispetto alla striscia arancione, potresti arrampicare fuori stagione — oppure il tuo campione è ridotto.

## Aggiornare la stagionalità

Esegui **Sync** da Impostazioni. Con l'importazione dei dati delle vie abilitata, la stagionalità si aggiorna in background (con limite di frequenza, fino a 100 vie per esecuzione).

La pagina Settori può anche mostrare il [meteo nei giorni delle tue visite in cache](/docs/weather). Questo descrive le condizioni nei giorni delle tue salite registrate, separatamente dalla stagionalità delle vie usata qui.

## Cerca per mese

Apri [Ricerca stagionalità](/seasonality) dalla scheda Mesi migliori per esplorare tutte le falesie e le vie nel tuo logbook sincronizzato con dati mensili in cache. Scegli un mese (di default il mese corrente nel tuo fuso orario di visualizzazione), cerca il nome di una falesia, area o via e passa da **Falesie** a **Vie** e viceversa. Le ricerche, la selezione del mese, l'ordinamento e le pagine vengono salvati nell'URL in modo da poterli aggiungere ai preferiti o condividerli. Scegli **Vedi vie** per restringere il campo a una sola falesia, oppure **Cerca in tutte le falesie** per uscire da tale ambito.

I risultati sono classificati in base al valore del mese selezionato diviso per il valore massimo nella curva annuale di quel risultato. Ad esempio, un valore di 5 con un picco annuale di 10 mostra **50% del picco annuale**. I nomi risolvono i pareggi; puoi anche ordinare per nome. Non esiste una soglia per definire l'"alta stagione". Una curva con soli zeri ha **Nessun segnale stagionale** e viene ordinata dopo le curve con un picco positivo. La striscia dei mesi e la tabella espandibile dei valori mostrano tutti i dodici mesi.

Le curve delle falesie usano la stessa media ponderata sulle salite della dashboard: le vie con più salite registrate hanno maggiore influenza; le curve delle vie mancanti non rientrano nella media. Cercare il nome di una via può individuare la sua falesia, ma non modifica la curva completa di quella falesia. Le falesie sono mantenute separate in base all'identità dell'area del provider, dove disponibile. Ogni falesia mostra quante delle sue vie registrate dispongono di dati; la pagina riporta anche la copertura tra le vie corrispondenti. Le curve mancanti o non valide rimangono sconosciute e vengono omesse dai risultati classificati.

I risultati delle vie includono link a tutte le voci del tuo logbook per quella via specifica e alla sua pagina guida su theCrag. Il pulsante Indietro del browser torna alla ricerca. La ricerca legge solo la cache locale e non attiva un recupero dal provider né cerca nell'intero catalogo di theCrag. Abilita l'importazione opzionale dei dati delle vie e sincronizza per aumentare la copertura.

La stagionalità descrive i **modelli di arrampicata della community**, non le previsioni meteo o le condizioni misurate durante le tue visite registrate. Vedi [Meteo](/docs/weather) per le osservazioni relative a quei giorni di visita.
