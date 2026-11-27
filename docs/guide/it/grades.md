# Gradi e fasce di grado

Crag Stats mostra i gradi nello stesso modo di [theCrag](https://www.thecrag.com/en/article/grades). Ogni sistema di gradazione viene convertito in un'unica scala interna, e tale scala è suddivisa in cinque **fasce** identificate da colori.

## Le cinque fasce

<!-- component:grade-bands -->

Questi colori compaiono in ogni piramide, etichetta di grado, grafico CPR e dettaglio delle fasce. Corrispondono a theCrag, quindi un grado appare qui nello stesso modo in cui appare lì.

## Come vengono confrontati i gradi

- **Una scala interna per ogni tipo di arrampicata.** Le vie (sportive, trad, top rope, alpinismo…) sono valutate sulla scala **Ewbank** (i numeri australiani). I boulder sono valutati sulla **V-scale**. Non sono mai mescolati in un unico elenco: un boulder V5 e una via di grado 21 si trovano in piramidi diverse.
- **Il grado decide la scala, non lo stile.** Ai deep water solo e agli highball vengono spesso assegnati gradi-V anche se non sono boulder. Questi rimangono sulla V-scale: vengono conteggiati insieme ai boulder nelle chiusure più difficili e negli indici di grado, e hanno la loro piramide (ad esempio **DWS · V**), mai una Ewbank.
- Puoi scegliere i **tuoi sistemi di visualizzazione** in **Impostazioni → Visualizzazione e visibilità**, uno per ogni tipo di arrampicata. I **gradi delle vie** (Ewbank, francese o YDS; Ewbank per impostazione predefinita) coprono l'arrampicata sportiva, trad, top rope e altre discipline con corda. I **gradi boulder** (V-scale (Hueco) o Fontainebleau; V-scale per impostazione predefinita) coprono boulder e highball con grado V. I due sono indipendenti, quindi puoi visualizzare le vie in francese e i boulder in Font. Un link condiviso può sovrascriverli una sola volta con `?system=` (un sistema per vie o boulder) e `?boulderSystem=`.
- **Grado assegnato vs il tuo grado.** theCrag memorizza sia il grado di consenso della via sia il grado che le hai assegnato tu. Crag Stats preferisce il grado dell'ascesa quando è nel sistema corretto, altrimenti ripiega sul grado della via.
- **Lettura delle singole scalate.** Progetti, cronologia dei progetti e Logbook mostrano prima il grado che hai selezionato. Quando il grado originale della via su theCrag differisce, segue tra parentesi, ad esempio `6b (20)`. Per una salita parziale di una via multi-pitch, il primo grado descrive ancora i tiri che hai scalato; le parentesi mostrano il grado originale della via. I gradi non valutati mantengono il testo originale invece di ipotizzare una conversione.
- **Multi-pitch:** il grado effettivo di un'ascesa è il tiro più difficile che _tu_ hai scalato, non il tiro più difficile della via. Per i sistemi che il parser di testo non può leggere, come l'UIAA, una scalata completa o un grado di tiro corrispondente utilizza il punteggio universale dell'ascesa. Gli altri tiri utilizzano il punto medio della loro fascia di difficoltà, quando disponibile.
- **Numeri boulder ambigui:** il contesto del sistema di gradazione del fornitore decide se un numero semplice indica la V-scale o Ewbank. Il solo paese non cambia mai un grado nelle righe dell'API. Le riparazioni conservano l'evidenza originale dell'API. Le esportazioni CSV non hanno una colonna per il sistema di gradazione, quindi le righe dei blocchi australiani con cifre semplici (`9`, `1`) ricevono un’indicazione AU dai campi Country / Crag Path / segmenti URL australia; i valori espliciti `V5` / `VB` rimangono sulla scala V. Come per le importazioni API, un grado di ascesa AU dedotto non sovrascrive un grado di via esplicito in V-scale.
- **Gli intervalli** come `V1/2` contano come punto medio (V1.5).
- **Punteggio universale di theCrag.** theCrag valuta ogni grado, in ogni sistema di gradazione, su un'unica scala di difficoltà. Le ascese sincronizzate portano con sé quel punteggio, così Crag Stats può classificare i gradi in qualsiasi sistema supportato da theCrag (UIAA, sassone, nordico, polacco, brasiliano e altri), anche quelli che non riesce a leggere come testo. I numeri semplici in quei sistemi (un `7` UIAA) non vengono mai scambiati per gradi Ewbank.
- **Gradi intermedi.** Anche le conversioni per i sistemi francese, YDS e Fontainebleau utilizzano i punteggi di theCrag, quindi i gradi senza un equivalente intero Ewbank o V (francese `5c+`, `6a` e `7a+`, Font `6A+` e `7C+`) si collocano comunque rigorosamente tra i gradi vicini (`7a` < `7a+` < `7b`). Le piramidi francese, YDS e Font raggruppano per il grado più vicino in quel sistema di visualizzazione; in caso di parità nel punto medio, si sceglie il grado più difficile. Ogni riga rimanda al proprio intervallo di gradi nel logbook. Le piramidi Ewbank e V-scale mantengono le righe per gradi interi. Anche la loro fascia deriva dal punteggio di theCrag, quindi un `6a` francese rimane Intermedio e un `7a+` rimane Avanzato.
- I **caricamenti CSV** non hanno una colonna per il punteggio, quindi i loro gradi vengono letti dal testo. I gradi francese, YDS, Ewbank, V e Font vengono convertiti come sopra; i gradi in altri sistemi potrebbero apparire non convertiti.

## Tabelle di conversione

Le conversioni tra i sistemi sono approssimative: i gradi sono culturali, e un "6c" in una falesia non è sempre un "23" in un'altra. Le tabelle sottostanti sono generate dallo stesso codice utilizzato dalla dashboard.

### Vie (Ewbank ↔ Francese ↔ YDS)

<!-- component:route-conversions -->

### Boulder (V-scale ↔ Fontainebleau)

<!-- component:boulder-conversions -->

## Fonti

- theCrag: [Gradi e conversioni di grado](https://www.thecrag.com/en/article/grades)
- theCrag: [Gradi su theCrag](https://www.thecrag.com/en/article/gradesonthecrag)

## Record di grado della dashboard

La dashboard inizia con **Chiusura più difficile** e **Più difficile a vista / flash**. Mostrano il tuo grado massimo di sempre raggiunto con successo e il grado massimo raggiunto al primo tentativo, nei sistemi selezionati. I tentativi e le scalate senza valutazione non sono validi. Vie e boulder hanno risultati separati; i DWS e gli highball con grado V contano insieme ai boulder. Le ascese parziali di vie lunghe utilizzano il tiro più difficile che tu abbia scalato. Ogni risultato indica il tipo di salita e rimanda alla salita valida corrispondente. In caso di parità tra i record a vista e flash, viene mostrato il record a vista. Un record mancante mostra un trattino e una spiegazione.
