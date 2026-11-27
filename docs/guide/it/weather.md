# Meteo

Crag Stats può salvare nella cache il **meteo giornaliero outdoor** per le salite dotate di coordinate della via, per poi usarlo nei badge, nella dashboard, nel diario e per confrontare il tuo rendimento su roccia in diverse condizioni meteo.

## Attivazione facoltativa

Disattivato per impostazione predefinita. Il proprietario del server imposta `WEATHER_IMPORT=true` in `.env` e riavvia. After each successful logbook sync or CSV upload, on the background import schedule (`IMPORT_CRON`, daily by default), and from **Settings → Import weather**, Crag Stats fetches up to **50** missing outdoor days per run from [Open-Meteo](https://open-meteo.com/)'s historical weather API, oldest climb days first, with at least **1.1 seconds** between requests. L'azione nelle Impostazioni avvia l'esecuzione in background in modo che la pagina non debba attendere il completamento dell'intero blocco. L'azzeramento svuota la cache.

Il piano gratuito non commerciale di Open-Meteo è pensato per installazioni personali self-hosted. Non attivare questa funzione per un servizio commerciale multi-tenant senza aver prima verificato i loro termini e le opzioni a pagamento.

## Cosa viene recuperato

- **Solo outdoor** — le vie probabilmente indoor / in palestra vengono saltate (stesse euristiche degli obiettivi).
- **Coordinate obbligatorie** — la via deve avere latitudine e longitudine (dalla sincronizzazione con theCrag o dall'importazione dei dati delle vie per i diari CSV).
- **Giorni passati** — la data UTC odierna viene saltata; l'archivio è spesso incompleto per la giornata in corso.
- **Chiave di cache condivisa** — latitudine e longitudine vengono arrotondate a **una cifra decimale**, così le vie vicine nella stessa falesia condividono un'unica riga giornaliera.

Campi salvati: temperatura massima/minima giornaliera (°C), precipitazioni (mm), codice meteo WMO, umidità media e vento massimo/medio a 10 m (km/h). Le unità di visualizzazione per temperatura (°C o °F), vento (km/h o mph) e precipitazioni (mm o in) possono essere scelte in **Impostazioni → Visualizzazione e visibilità**.

## Badge

Una volta che un giorno è nella cache, questi badge possono sbloccarsi con qualsiasi salita **outdoor** registrata quel giorno in quella località (anche i tentativi contano; le righe indoor/palestra vengono saltate anche se condividono lat/lon nella cache):

| Badge                      | Regola                                                                                                |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Ondata di caldo**        | Massima giornaliera ≥ 35°C                                                                            |
| **Fermo immagine**         | Minima giornaliera ≤ 0°C                                                                              |
| **Rinvio per pioggia**     | ≥ 1 mm di precipitazioni non classificate come neve                                                   |
| **Arrampicata sulla neve** | Codici neve WMO (71–77, 85–86) oppure ≥ 1 mm di precipitazioni con massima ≤ 1°C                      |
| **Spazzato dal vento**     | Vento massimo giornaliero a 10 m ≥ 50 km/h                                                            |
| **Cielo limpido**          | Massima 15–25°C, precipitazioni misurate < 0,1 mm, nessun codice WMO neve/temporale                   |
| **Aderenza umida**         | Umidità media ≥ 85%                                                                                   |
| **Chiusura in tempesta**   | Una **chiusura** in un giorno con ≥ 10 mm di precipitazioni non nevose                                |
| **Quattro stagioni**       | Ottieni Ondata di caldo, Fermo immagine, Rinvio per pioggia e Arrampicata sulla neve almeno una volta |

Senza `WEATHER_IMPORT` (o prima che lo storico venga recuperato), questi badge restano bloccati anche se hai arrampicato in quelle condizioni. Una «serie rovente» (molti giorni di caldo intenso in una settimana) è rimandata a sviluppi futuri.

## Pagina di dettaglio meteo

Apri [Meteo](/weather) dalla barra laterale delle statistiche o dal titolo di una delle due schede meteo nella dashboard. La dashboard mostra condizioni compatte e un riepilogo tra temperatura massima giornaliera e tasso di chiusura quando emerge un segnale chiaro. In assenza di un segnale chiaro, le prestazioni mantengono le fasce dettagliate e i controlli; la pagina di dettaglio offre sempre la vista completa. La visibilità e la posizione salvate delle schede nella dashboard continuano a essere rispettate.

Nella pagina di dettaglio, il raggruppamento e la metrica delle prestazioni vengono salvati nell'URL (`group=temperature|conditions`, `measure=sendRate|nearLimit|onsightFlash`), così puoi salvare una vista nei segnalibri e usare Indietro/Avanti. Gli andamenti meteo descrivono correlazioni, non raccomandazioni o cause.

**Copertura e qualità della posizione** distingue i giorni-località utilizzabili nella cache, i giorni controllati con meteo non disponibile e i giorni non ancora controllati (inclusi oggi e le date future). Le salite outdoor con date valide ma senza posizione risolta vengono contate separatamente: non possono essere assegnate a un giorno-località e sono escluse da quel denominatore. Le condizioni contano tutte le salite outdoor registrate; le prestazioni contano solo chiusure e tentativi. I controlli di importazione e posizione restano nelle Impostazioni, collegati da Meteo per il proprietario autenticato.

Senza dati meteo outdoor nella cache, la pagina spiega come funziona l'importazione. Con pochi dati in cache vengono comunque mostrate le condizioni, mentre le prestazioni attendono il campione minimo previsto. La visualizzazione della pagina Meteo non invia mai richieste al fornitore.

## Condizioni meteo

La scheda **Condizioni meteo** della dashboard compare appena almeno un giorno di arrampicata outdoor ha una riga meteo in cache; senza `WEATHER_IMPORT` (o prima del termine del primo recupero) resta nascosta. Può essere mostrata, nascosta o spostata da Impostazioni → Dashboard come qualsiasi altra scheda.

- I **giorni** sono _giorni-località_: un giorno di calendario in una località nella cache (lat/lon arrotondate a un decimale). Una giornata divisa tra due falesie conta due volte; le vie in palestra e le altre vie probabilmente indoor non contano mai.
- **Copertura** confronta i giorni che hanno una riga meteo in cache con tutti i giorni outdoor dotati di coordinate della via. I giorni senza una riga utilizzabile in cache (inclusi quelli non controllati e quelli controllati ma non disponibili) sono elencati come «senza meteo utilizzabile» ed esclusi da tutti gli altri numeri nella vista delle condizioni.
- **Salita più calda / più fredda** usano la temperatura massima e minima della giornata. Il collegamento porta alla prima salita registrata quel giorno su theCrag.
- **Quota di giorni** mostra i giorni perfetti, piovosi, nevosi, gelidi e caldi come percentuale dei giorni con meteo in cache, usando le stesse regole dei badge sopra (pioggia ≥ 1 mm e non neve, codici neve, minima ≤ 0°C, massima ≥ 35°C). Un giorno può comparire in più di una riga, ad esempio una giornata gelida e nevosa.
- Un giorno **Perfetto** è una giornata favorevole (massima 15–25°C, asciutta, senza neve né temporali) che sia anche calma (vento massimo sotto i 25 km/h), poco umida (umidità media sotto l'85%) e rimasta sopra lo zero durante la notte. Se per un giorno mancano vento, umidità o minima, non viene contato come perfetto.
- **Massima giornaliera** è un piccolo istogramma della temperatura massima di ciascun giorno in intervalli di 5°C, etichettato nell'unità di temperatura scelta. Gli intervalli includono l'estremo inferiore ed escludono quello superiore (ad esempio 0–<5°C o 32–<41°F).

Si tratta di valori di modello per la cella di griglia più vicina, non di medie climatiche ufficiali né di una misurazione alla parete.

## Meteo e prestazioni

Quando **20 o più** giorni-località outdoor hanno dati meteo in cache, la vista di dettaglio **Meteo e prestazioni** confronta com'è andata la tua arrampicata outdoor in condizioni meteo diverse. Prima di allora mostra quanti giorni-località idonei sono presenti finora nella cache. Il riepilogo della dashboard resta nascosto finché non ci sono dati meteo in cache e può essere spostato o nascosto da Impostazioni → Dashboard; la pagina di dettaglio resta accessibile con una spiegazione dello stato vuoto.

**Cosa viene contato.** Chiusure e tentativi outdoor (la stessa classificazione delle salite usata ovunque) il cui giorno-località ha dati meteo in cache. Le vie in palestra, le salite che non sono né una chiusura né un tentativo e le salite senza una posizione meteo vengono escluse. Le salite il cui meteo proviene da una località vicina approssimativa o dal poligono di un'area sono incluse, e la vista indica quante sono.

Il riepilogo compatto della dashboard mostra il rapporto tra massima giornaliera e tasso di chiusura. Il fallback in assenza di segnale chiaro e la pagina di dettaglio offrono entrambi i controlli indicati di seguito.

**Raggruppa per:**

- **Massima giornaliera:** sotto 10°, 10–17°, 18–24°, 25–29° e 30°+. Ogni fascia include il proprio limite inferiore e si ferma appena sotto la fascia successiva, come l'intervallo di temperatura del diario.
- **Condizioni:** Buono, Asciutto (precipitazioni misurate sotto 1 mm e niente neve; la pioggia mancante è sconosciuta, non asciutta), Piovoso, Nevoso, Caldo, Gelido, Calmo (vento massimo sotto 25 km/h) e Ventoso (≥ 50 km/h), usando le regole di badge e diario indicate sopra. Uno stesso giorno può rientrare in più condizioni. Un vento misurato tra 25 e meno di 50 km/h non è né Calmo né Ventoso.

**Metriche:**

- **Tasso di chiusura:** chiusure in rapporto al totale di chiusure e tentativi.
- **Vicino al limite:** la quota di chiusure gradate entro 2 gradi (1 grado V sulla scala V) dalla tua chiusura outdoor più dura dello **stesso stile e scala di gradi** nei 365 giorni precedenti a quel giorno. Il trad viene confrontato con il trad e la sportiva con la sportiva, e la scala V e i gradi delle vie non vengono mai mescolati. Usare il tuo miglior risultato recente anziché il record assoluto evita che migliorare negli anni faccia apparire migliore il meteo recente. Le chiusure senza una chiusura precedente dello stesso stile in quell'anno e le chiusure senza grado sono escluse da questa metrica.
- **A vista/flash:** salite a vista e flash in rapporto al totale delle chiusure.

**Come leggerlo correttamente.**

- Ogni barra mostra il tasso della fascia; la linea indica il tuo tasso complessivo. Una fascia richiede almeno **10** salite (per il denominatore di quella metrica) distribuite su almeno **3** giorni prima di mostrare un tasso. Le fasce più piccole mostrano «Dati insufficienti».
- Una fascia è contrassegnata come **Più alto** o **Più basso** solo quando differisce da tutti gli _altri_ tuoi giorni meteo più di quanto spieghi la variabilità giornaliera (un test a due code intorno al 95%), con almeno 5 giorni per lato. Le salite dello stesso giorno condividono lo stesso meteo e di solito la stessa falesia e lo stesso compagno, quindi il test tratta ogni giorno-località come un'unica unità anziché contare ogni singola salita. Una singola giornata intensa non può creare una tendenza da sola.
- Il riepilogo su una riga indica la fascia che spicca maggiormente per la metrica selezionata, oppure segnala che al momento non emerge nulla di significativo.
- Si tratta di una **correlazione, non di una causa**. Stagione, falesia, compagni e fase di un progetto cambiano tutti insieme al meteo. Con molte fasce e metriche, un occasionale «Più alto» o «Più basso» può comparire per puro caso.

Ogni fascia di massima giornaliera e le condizioni buono, pioggia, neve, caldo, gelo, calma e vento rimandano al diario filtrato su quelle salite. Asciutto non ha un filtro nel diario. Una tabella dei valori sotto le barre nella pagina di dettaglio elenca ogni fascia con i conteggi per tutte e tre le metriche. La visualizzazione della scheda non avvia mai una richiesta meteo e le note private non vengono mai utilizzate.

Quando il confronto tra massima giornaliera e tasso di chiusura nella dashboard non mostra un segnale chiaro, la scheda Meteo e prestazioni mantiene le fasce dettagliate, i controlli locali di raggruppamento/metrica e la tabella dei valori. Questi controlli lasciano invariato l'URL della dashboard. Un segnale chiaro mantiene il riepilogo compatto; entrambe le versioni rimandano alla pagina meteo. Le soglie minime del campione restano invariate.

## Filtri del diario ed etichette

I riferimenti vicino al limite utilizzano lo stesso calcolo per stile e scala di gradi di [Roccia e prestazioni](/docs/rock-types), usando i gradi dei tiri effettivamente saliti quando disponibili.
Il riferimento meteo include le chiusure outdoor prive di meteo in cache, include il 365° giorno precedente ed esclude le chiusure del giorno confrontato.

Quando ci sono dati meteo in cache, il diario aggiunge il filtro **Meteo del giorno** (`?weather=`): `fair`, `perfect`, `heat`, `freeze`, `rain`, `snow`, `wind` o `calm`. **Giornata ventosa** corrisponde a un vento massimo giornaliero a 10 m **≥ 50 km/h**, la stessa soglia di **Spazzato dal vento**. **Giornata calma / senza vento** corrisponde a un vento massimo misurato **sotto i 25 km/h**, la soglia di calma usata da **Giornata perfetta**, senza richiedere temperature miti, tempo asciutto o bassa umidità. Le letture del vento mancanti non corrispondono a nessuna delle due opzioni; i giorni da 25 a meno di 50 km/h non corrispondono a nessun filtro del vento. Le altre opzioni usano le stesse regole dei badge. Corrisponde solo alle salite **outdoor** con coordinate della via e un giorno in cache per quella località; le vie in palestra, le salite senza coordinate e i giorni non ancora recuperati non corrispondono mai.

Le righe dei giorni presenti in cache mostrano anche piccole etichette di testo (ad esempio «Caldo 36°C», «Gelido -2°C», «Pioggia 4 mm», «Neve», «Ventoso 55 km/h», «Bel tempo 21°C»). I giorni ordinari non mostrano nulla.

Il proprietario autenticato dispone anche di **Nessun meteo memorizzato in cache** (`?missing=weather`), che elenca le salite outdoor con coordinate e data passata prive di meteo in cache, così puoi vedere cosa recupereranno le prossime importazioni. I visitatori non vedono mai questa opzione.

L'elenco dei dati meteo mancanti esclude i giorni già verificati dal fornitore ma non disponibili. Queste voci negative nella cache non generano etichette meteo e non vengono riaccodate automaticamente. Le date di calendario non valide sono escluse sia dall'importatore sia dall'elenco arretrato.

## Attività recenti

La scheda **Attività recenti** della dashboard mostra le stesse etichette di testo sotto una salita outdoor quando il relativo giorno è in cache. Vengono lette come un breve elenco etichettato «Meteo del giorno», mai basato solo sul colore, e la striscia viene omessa per vie in palestra, giorni non in cache e meteo ordinario.

## Storia di arrampicata

Le percentuali della storia descrivono i giorni-località outdoor in cache, non i giorni il cui meteo è ancora sconosciuto.

Quando la cache copre almeno 20 giorni outdoor e almeno la metà dei tuoi giorni outdoor, la [Storia di arrampicata](/docs/climbing-story) può aggiungere una breve riga sulle condizioni in cui arrampichi (neve, freddo, caldo, pioggia o un'ampia escursione termica). Descrive le condizioni in cui arrampichi, mai quelle che eviti, e non compare nella storia quando la copertura è scarsa.

## Calendario delle salite

Il [Calendario delle salite](/docs/ascent-calendar) ha una modalità colore **Meteo** (mostrata solo quando ci sono dati meteo in cache). Condivide le regole dei badge; consulta quella pagina per la legenda dei colori.

## Settori: clima durante le tue visite

Nella pagina **Settori**, una falesia con almeno **5** giorni di visita outdoor in cache mostra un riepilogo su una riga: massima e minima giornaliera media e la quota di quei giorni con pioggia, neve, gelo o caldo (neve, gelo e caldo solo quando superiori allo 0%). Descrive i giorni in cui hai effettivamente arrampicato lì, quindi riflette le stagioni in cui la frequenti. **Non** si tratta di medie climatiche ufficiali né di una previsione, ed è nascosto per le falesie sotto la soglia, per le vie in palestra e quando non ci sono dati meteo in cache.

## Percentuale bel tempo

Quando **20 o più** giorni outdoor hanno dati meteo in cache, la scheda Condizioni meteo aggiunge una **Percentuale bel tempo**: la percentuale di quei giorni che sono stati _favorevoli_ (massima 15–25°C, asciutti, senza neve né temporali — la stessa regola di **Cielo limpido**). Riporta inoltre la percentuale di giorni _impegnativi_ (caldi, gelidi, piovosi, nevosi o molto ventosi). I giorni intermedi, come una giornata asciutta a 29°C, non vengono contati in nessuno dei due gruppi.

L'etichetta è descrittiva, non una valutazione: **Incline al bel tempo** dal 60% di bel tempo in su, **Scalatore per ogni tempo** dal 50% di giorni impegnativi in su, altrimenti **Un po' di entrambi**. I gruppi possono sovrapporsi: una giornata mite e asciutta può comunque essere molto ventosa o scendere sotto lo zero di notte. Quando vengono soddisfatte entrambe le soglie, **Scalatore per ogni tempo** ha la priorità. Sotto i 20 giorni non viene mostrato nulla, così una cache ridotta non ti etichetta mai. Il collegamento apre il diario filtrato sui giorni favorevoli.
Per le indicazioni stagionali tratte dai metadati delle vie, vedi [Mesi migliori](/docs/best-months); tali indicazioni sono separate dal meteo campionato durante le tue visite registrate.

Le etichette sul bel tempo usano i conteggi esatti dei giorni per le loro soglie; le percentuali mostrate sono arrotondate a una cifra decimale. Il solo arrotondamento di visualizzazione non cambia mai la tua etichetta.

### Dai dettagli meteo al tuo diario

Ogni riga di condizione e ogni barra della massima giornaliera nella vista di dettaglio **Condizioni meteo** apre il diario filtrato su quei giorni. Una barra di temperatura include il limite inferiore e si ferma appena sotto la barra successiva (ad esempio 20–24° copre da 20,0 °C fino a 25 °C esclusi). L'intervallo resta applicato mentre ordini, cambi pagina o aggiungi altri filtri; usa **Cancella intervallo meteo** per rimuovere solo quell'intervallo.

La scheda conta i _giorni_ outdoor in ogni località, mentre il diario elenca ogni _salita_ corrispondente, quindi i due numeri possono differire. Sugli schermi ampi il diario mostra una colonna Meteo con massima, minima e pioggia in cache; sugli schermi più piccoli compaiono invece le etichette di condizione accanto alla via. Le salite indoor o non in cache mostrano un trattino. La visualizzazione di queste pagine non avvia mai una richiesta meteo.

## Posizioni meteo quando mancano le coordinate della via

Le esportazioni CSV non includono le coordinate. Con l'importazione meteo e l'importazione dei dati delle vie entrambe attive (`WEATHER_IMPORT=true` e `ROUTE_DATA_IMPORT=true`), la chiave API supporter configurata può anche cercare le posizioni per gli ID di falesia/settore presenti nei dati delle vie in cache. Questo non importa il diario né il profilo del titolare della chiave. Sono supportati sia gli antenati del diario con chiave sia gli array di antenati dell'API delle vie.

Le ricerche per area condividono il budget di dieci richieste e la cadenza di un secondo dell'importazione delle vie. I controlli delle vie usano il budget per primi; le richieste rimanenti controllano fino a dieci aree ciascuna. Le Impostazioni mostrano **aree meteo in sospeso** e offrono **Verifica posizioni meteo ora** quando tutte le vie sono state verificate. Le installazioni CSV esistenti possono completare le posizioni delle aree mancanti senza **Aggiorna tutte le vie**. Anche la successiva esecuzione di importazione controlla l'arretrato. Al termine dei controlli di posizione, viene avviato un blocco meteo in background se esistono giorni idonei.

Le risposte delle aree (incluse le posizioni mancanti) vengono salvate in cache una sola volta per ID area del fornitore. `ROUTE_DATA_REFRESH_DAYS` controlla anche la loro età di aggiornamento facoltativo e **Aggiorna tutte le vie** rende nuovamente idonee le ricerche per area. Gli errori di accesso interrompono l'importazione e usano il backoff esistente; una chiave che può leggere la cronologia delle vie non garantisce l'accesso alle posizioni delle aree. Se l'API non fornisce una posizione supportata, usa il fallback esplicito alla località vicina descritto sotto. Nessuna chiamata API viene eseguita durante la visualizzazione delle pagine meteo.

Il meteo preferisce un punto esplicito della via, poi il punto della falesia principale (TLC), quindi il punto del settore immediato dai dati del fornitore in cache. Ignora le geometrie limitate al solo paese e quelle di antenati arbitrari. I punti più vecchi in cache privi della geometria originale del fornitore restano utilizzabili e sono etichettati come «Punto memorizzato in cache»; la loro precisione originale non può essere recuperata da quel solo punto. Le vie indoor restano escluse.

Impostazioni → Importa meteo → **Rivedi posizioni meteo** elenca le aree outdoor e il numero di vie non risolte. Per una posizione mancante, cerca una città vicina usando nome/regione e un codice paese di due lettere, quindi scegli esplicitamente il risultato corretto. La ricerca invia solo il testo inserito e il codice paese a [Open-Meteo geocoding](https://open-meteo.com/en/docs/geocoding-api), i cui dati geografici provengono da GeoNames. Non invia vie, date di salita, note private né chiavi API. Le ricerche avvengono solo dopo l'invio del modulo, sono memorizzate in cache per 30 giorni, cadenzate e applicano un backoff in caso di errori.

Una città scelta funge da **fallback approssimativo a una località vicina**, condiviso solo dallo stesso ID area del fornitore (o dall'identità della via se non esiste un ID area). Non sovrascrive le coordinate della via, non altera le mappe delle vie e non pretende di essere il centro abitato più vicino. Un punto valido di via/settore/falesia ha sempre la precedenza. Il meteo della città può differire da quello della parete per distanza, altitudine e orografia, quindi i dati basati su una città compaiono nelle viste e nei filtri meteo ma **non sbloccano i badge meteo**. Puoi rimuovere il fallback in qualsiasi momento.

Il diario e le attività recenti mostrano l'origine della posizione meteo. L'importatore, l'arretrato, il calendario, la scheda delle condizioni, i riepiloghi delle visite in falesia e il diario usano la stessa chiave risolta di posizione/giorno. La modifica o rimozione di un fallback interrompe immediatamente l'uso della vecchia chiave; i vecchi dati meteo restano in cache e possono ancora essere usati da altre salite in quella località. Recupera il blocco meteo successivo per popolare una posizione appena scelta. L'azzeramento cancella risoluzioni, scelte di località e risultati di ricerca, e annulla le ricerche in corso.

Quando quei punti mancano, una geometria GeoJSON Polygon/MultiPolygon tipizzata esplicitamente su una falesia o un settore identificato può fornire direttamente la prima coordinata del proprio confine esterno; non viene calcolato alcun centro o centroide. Questo è etichettato come **Poligono d'area approssimativo** e non sblocca i badge meteo o Parete al sole estivo. I punti delle vie e delle falesie hanno sempre la priorità. I confini di paesi/regioni, le forme malformate, le aree estese (oltre una diagonale di delimitazione prudenziale di 15 km) e le forme che attraversano la linea del cambio di data sono esclusi. Gli array di confini non tipizzati e i formati Fence non documentati rimangono non supportati; non è ancora disponibile alcuna fixture di poligono acquisita dal provider. Una località selezionata viene utilizzata solo se falliscono anche questi fallback geometrici. L'importazione meteo deve comunque essere abilitata per recuperare i giorni mancanti. Parete al sole estivo utilizza riscontri dai tag delle vie verificati separatamente; vedi [Badge](/docs/badges).
