# Badge

La maggior parte dei badge celebra traguardi arrampicatori: la tua prima sessione o chiusura, il totale delle salite, i gradi e altro ancora. Questi utilizzano le date delle relative salite nel tuo carnet. Importare una salita meno recente può quindi anticipare la data di un traguardo arrampicatorio.

**Primi movimenti** celebra l'importazione del tuo carnet su Crag Stats. La sua data corrisponde alla prima importazione o sincronizzazione riuscita contenente almeno una salita, e il relativo conteggio viene salvato con quell'importazione. Le sincronizzazioni successive e l'importazione di salite meno recenti non ne modificano la data. Non è collegato a una singola salita. I timestamp di importazione utilizzano il fuso orario di visualizzazione del sito.

Se un database meno recente non ha una data di importazione salvata, sarà la successiva importazione non vuota andata a buon fine a fornirla. Le date salvate esistenti vengono conservate.

Cancellare i dati locali ripristina questo traguardo insieme al carnet; la successiva importazione non vuota combined andata a buon fine ne avvierà uno nuovo.

## Ordinamento

I badge ottenuti sono elencati in base alla salita con cui sono stati conquistati, dalla più recente. La scheda della dashboard mostra gli ultimi otto. I badge conquistati nello stesso giorno mantengono l'ordine della galleria. First Moves e le stime delle salite della community non sono legati a una salita, quindi compaiono dopo qualsiasi badge associato a una data di salita.

## Tipi di tick conteggiati

L'impostazione **Tipi di tick conteggiati** in Impostazioni → Visualizzazione e visibilità determina quali salite registrate vengono considerate da ciascun badge. Vedi [Tipi di salita](/docs/tick-types) per questa impostazione.

- I tipi di tick impostati su **Solo progetti e obiettivi** sono esclusi dalle salite principali e dai totali della dashboard, ma consentono comunque di conquistare badge: **La costanza paga**, le serie di giorni consecutivi, **Giornata di vie a più tiri**, **Settimana di viaggio**, i traguardi di altezza e altri badge di attività continuano a conteggiarli. I traguardi di altezza continuano quindi a crescere anche con i tentativi di lavorata sui progetti, anche se i totali delle tue salite restano contenuti.
- I tipi di tick impostati su **Nascondi** non fanno guadagnare nulla: tali salite sono escluse sia dai badge sia da qualsiasi altra analisi.

La distinzione è intenzionale. I totali principali filtrano le vie che hai chiuso, mentre i badge descrivono ciò che hai fatto — un giro di lavorata è comunque una giornata in falesia e conta per i badge che celebrano questa attività. Se un badge che ti aspetti non è apparso, controlla se il suo tipo di tick è nascosto anziché semplicemente escluso dai totali.

## Distanza scalata

I badge di altezza calcolano l'altezza totale delle tue salite registrate: 1, 5, 10, 20, 50, 100 e 150 km. Ciascun badge riporta la data della salita che fa superare la soglia al tuo totale progressivo. **Giornata da 250m** somma invece l'altezza scalata in un singolo giorno solare.

Le soglie dei badge sono definite nel sistema metrico e non cambiano mai con l'impostazione dell'unità di misura. Cambia solo il testo: selezionando le unità imperiali, **1 km climbed** viene mostrato in miglia e **Giornata da 250m** in piedi. Le stesse salite fanno guadagnare esattamente gli stessi badge in entrambi i sistemi di unità di misura. Vedi [Impostazioni di visualizzazione](/docs/display-settings).

## Meteo

**Ondata di calore**, **Fermo immagine**, **Rinvio per pioggia**, **Arrampicata sulla neve**, **Spazzato dal vento**, **Cielo limpido**, **Aderenza umida**, **Chiusura in tempesta** e **Quattro stagioni** richiedono la cache facoltativa del meteo all'aperto (`WEATHER_IMPORT`). Vedi [Meteo](/docs/weather). Fino a quando non vengono recuperati i dati di quei giorni, i badge rimangono bloccati. **Chiusura in tempesta** richiede una chiusura con successo in un giorno di pioggia battente; i soli tentativi non contano.

## Quasi fatto

Nella pagina completa **[Badge](/badges)**, **Quasi fatto** elenca fino a tre badge bloccati più vicini al completamento. Sono idonee solo le soglie **conteggiabili** (totale salite, altezza, chiusure per fascia di grado, conteggio FA/FFA, vie tracciate e simili). I badge monouso come i giorni festivi, i giorni meteo o First Moves sono esclusi. Il progresso è ordinato in base alla percentuale dell’obiettivo raggiunta (mantenuta al di sotto del 100% finché il badge non viene ottenuto), poi in base agli obiettivi più piccoli in caso di parità. La scheda dei badge della dashboard continua a mostrare solo i badge conseguiti di recente.

## Compagni, multipitch e viaggi

Questi quattro badge utilizzano campi già presenti nel tuo carnet e riportano la data della salita che li completa:

| Distintivo                     | Regola                                                                                                                                                                                                                                                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sosta affollata**            | Una salita elenca 3 o più compagni diversi (l'abbinamento dei nomi ignora maiuscole e minuscole).                                                                                                                                                                                                                            |
| **Giornata di vie a più tiri** | Chiudi 3 o più tiri nello stesso giorno di calendario: gli intervalli e gli elenchi di tiri vengono espansi e deduplicati per via/giorno. Le registrazioni dell'intera via e dei singoli tiri non vengono conteggiate due volte. Quando esistono tick dei tiri memorizzati in cache tramite API, contano solo i tiri chiusi. |
| **Settimana di viaggio**       | Registri salite in 4 falesie diverse nell'arco di 7 giorni consecutivi. Le palestre e le falesie sconosciute non contano.                                                                                                                                                                                                    |
| **La costanza paga**           | Chiudi una via per la prima volta dopo averla registrata in 4 o più giorni diversi (tentativi inclusi). Ripetere una via che hai già chiuso non conta.                                                                                                                                                                       |

Sono badge monouso, quindi non appaiono in **Quasi fatto**.

## Ripetizioni e nuove vie

Questi badge condividono le regole della scheda [Ripetizioni vs nuove vie](/docs/repeats). Le vie vengono verificate tramite il relativo ID via di theCrag, i tentativi contano e ciascun badge riporta la data della salita che lo completa.

| Distintivo               | Regola                                                                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Esploratore**          | Salite registrate su 50 vie diverse.                                                                                                                    |
| **Esploratore**          | Salite registrate su 100 vie diverse.                                                                                                                   |
| **Collezionista di vie** | Salite registrate su 250 vie diverse.                                                                                                                   |
| **Esploratore di guide** | Salite registrate su 500 vie diverse.                                                                                                                   |
| **Vecchio amico**        | Una via scalata in 10 giorni diversi. Più salite nello stesso giorno contano come una sola.                                                             |
| **Falesia di casa**      | 25 salite ripetute (qualsiasi giorno successivo al primo giorno di registrazione di una via) su vie di una stessa falesia. Le prime visite non contano. |

Tutti e sei sono conteggiabili, quindi possono apparire in **Quasi fatto**.

## Parete al sole d'estate

Registra una salita all'aperto su una via esposta verso l'equatore nell'estate meteorologica locale: N/NE/NO da dicembre a febbraio nell'emisfero australe, oppure S/SE/SO da giugno ad agosto nell'emisfero boreale. Questa versione conservativa copre latitudini assolute da 25° fino a (ma senza includere) 60°. I tentativi contano come salite registrate, come per i badge relativi ai giorni meteo. Il badge si sblocca una sola volta nel primo giorno idoneo e non ha un contatore Quasi fatto.

Utilizza prima i tag dell'esposizione/sole della via stessa. Quando non ha tag di esposizione propri, possono essere utilizzati i tag ereditati dal suo **elemento padre diretto** (ad esempio il suo settore, falesia o sasso). L'ID di origine del tag memorizzato in cache deve corrispondere esattamente a quel genitore diretto. I tag provenienti da antenati di livello superiore, fonti sconosciute e ampie aree geografiche non vengono mai presi in considerazione. I tag di esposizione della via hanno la priorità anche se l'elemento padre indica qualcosa di diverso; direzioni sconosciute o discordanti della via non collegano ai dati del genitore.

Al livello selezionato, **Sole tutto il giorno** può essere idoneo anche senza una direzione di esposizione. **Sempre in ombra** ne impedisce l'assegnazione. In caso contrario, l'esposizione deve guardare verso l'equatore come descritto sopra; i tag di sole limitati a mattina/mezzogiorno/pomeriggio non sono idonei da soli. Non è necessario che i tag di sole e di esposizione siano presenti contemporaneamente.

Le salite indoor, le date non valide, le posizioni tropicali/ad alta latitudine, i punti legacy di precisione sconosciuta e le approssimazioni di città vicine non sono idonei. Gli aggiornamenti dei dati in cache recuperano la provenienza di via/elemento padre/antenato superiore senza un'ulteriore sincronizzazione o richiesta esterna.

Questo registra l'esposizione descritta dal provider oltre a un'euristica stagionale. Non determina l'ora in cui hai arrampicato, il sole effettivo, l'ombra data da strapiombi o la temperatura della roccia, e non richiede alcuna cache di Open-Meteo. Il badge distinto relativo al caldo descrive la temperatura elevata dell'aria memorizzata in cache. Le fixture dei tag reali dell'API minimizzate e la loro provenienza sono documentate nel repository.

## Greenpoint

**Greenpoint** è un badge monouso per aver scalato da primo una via sportiva chiodata proteggendosi con le proprie protezioni veloci. Si sblocca la prima volta che:

- registri su theCrag un tick **Green point**, **Green point onsight** o **Green point flash** valido come chiusura, oppure
- chiudi una via classificata come **Sportiva** con la tua salita registrata come **Trad**, utilizzando un tick pulito da primo (a vista, flash, rotpunkt, pink point, rotpunkt dal basso o da primo).

Le voci generiche Tick/Send/Clean, i tentativi, la moulinette e la salita da secondo non contano per la seconda opzione, poiché non dimostrano che hai scalato da primo piazzando le protezioni. Come per i badge sopra, non appare in **Quasi fatto**. Vedi i [tipi di tick](https://www.thecrag.com/en/article/ticktypes) di theCrag per le definizioni dei tick Green point.

## Prime salite in rope solo

**Prima autoassicurazione da primo** si sblocca alla tua prima salita riuscita registrata esplicitamente come Lead solo. **Prima autoassicurazione top-rope** si sblocca separatamente alla tua prima salita riuscita registrata come Roped Solo / Top rope solo. Ciascuno si collega alla prima salita idonea, utilizzando l'ID salita per risolvere i pareggi nello stesso giorno, e nessuno dei due appare in Quasi fatto.

La classificazione corrisponde alla scheda Arrampicata in solitario. L'API del [provider](https://www.thecrag.com/en/article/api) documenta `leadsolo` e `ropedsolo`; le etichette di visualizzazione e le relative varianti di maiuscole/spazi/separatori vengono riconosciute senza modificare il testo del tick originale. Un aggiornamento dei dati in cache corregge i vecchi flag di completamento solo quando il payload memorizzato dal provider conferma lo stesso esplicito metodo in solitario. La disciplina della via e lo stile di salita rimangono separati.

Tentativi, azzerate, ritiri, free solo, deep-water solo, solo in artificiale, normali salite in moulinette ed elementi con completamento sconosciuto non sono idonei. Un'ascesa registrata esplicitamente come Boulder o Secondo contraddice inoltre entrambi i metodi rope-solo e non può sbloccare questi badge. L'assenza di compagni indicati non è sufficiente a definire una salita in solitario. Questi traguardi si applicano alle salite indoor e outdoor e non richiedono né coordinate né importazioni del meteo.

## Serie di giorni consecutivi

**7-Day Streak**, **10-Day Streak** e **30-Day Streak** celebrano la registrazione di
almeno una salita per ogni giorno solare consecutivo. I tentativi contano e sia le salite indoor
sia quelle outdoor vengono conteggiate, in linea con la scheda Serie. Più salite nello stesso
giorno contano come una sola; le date mancanti o non valide non costituiscono un giorno. Le date di arrampicata,
non gli orari di registrazione, determinano la serie senza spostare le date scritte
tra fusi orari.

Ciascun badge riporta la data del primo giorno in cui la relativa soglia è stata raggiunta. Fare una pausa
non cancella un traguardo nella tua cronologia registrata. Si tratta di premi monouso
e non appaiono in Quasi fatto.

## Con chi hai arrampicato

I badge conseguiti con una salita idonea mostrano i compagni registrati per quest'ultima. “Compagni in questa salita” si riferisce solo alla salita collegata, compresi i badge conquistati su più tiri, giorni o vie. Non è un elenco di tutti coloro che hanno contribuito all'intero risultato. I nomi mancanti non implicano una salita in solitario.
