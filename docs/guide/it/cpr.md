# CPR (Climber Performance Rating)

**CPR** è la valutazione di theCrag del tuo livello di arrampicata. Crag Stats mostra una cronologia CPR separata per **sport**, **trad** e **boulder**, proprio come fa theCrag, perché le tre discipline hanno valutazioni molto diverse.

## Come theCrag calcola il CPR

theCrag ha sviluppato il CPR basandosi su un'analisi statistica di circa un milione di salite. I concetti principali:

- **Ogni grado è circa 5 volte più difficile di quello inferiore** (fattore di potenza _P_ = 5 sulla scala Ewbank). Ogni via unica che hai salito aggiunge approssimativamente _P_ elevato alla potenza del suo grado a un totale. Il totale viene riconvertito in un grado tramite un logaritmo in base 5. Quindi cinque salite di un determinato grado equivalgono a circa una salita del grado successivo.
- **Scostamenti dei tick.** Il modo in cui hai arrampicato conta. I tick vengono traslati di un offset di grado prima del calcolo del punteggio. Ad esempio, nell'arrampicata sportiva si chiudono vie in Rotpunkt circa **2,1 gradi** più difficili rispetto all'a vista, mentre nel trad un pink point è circa **0,8 gradi** più facile di un Rotpunkt. Gli offset vengono calcolati separatamente per sport, trad e boulder.
- **Consolidare un grado.** Un singolo tick su un nuovo grado potrebbe essere una via morbida o un colpo di fortuna. Il tuo _grado_ sale solo dopo circa **tre** tick su di esso, ma ogni salita contribuisce comunque ad aumentare la valutazione.
- **Decadimento.** Se smetti di arrampicare, il CPR scende di circa **0,7 gradi Ewbank all'anno** (all'incirca tre quarti di grado).
- Le **ripetizioni** di una via contano una sola volta (il tick migliore) e viene utilizzato il grado ufficiale assegnato alla via anziché la tua opinione personale.

theCrag mantiene una valutazione con e senza decadimento per ciascuna disciplina: sport, trad e boulder.

## Da dove Crag Stats ottiene questi dati

- **Dall'API di theCrag (preferito).** Quando effettui la sincronizzazione con una chiave API supporter, ogni salita può riportare i valori CPR originali di theCrag. Se un numero sufficiente di salite in una disciplina li possiede (almeno 3 e almeno il 20% delle salite di quella disciplina), la cronologia utilizza il **CPR con decadimento di theCrag**, etichettato come _theCrag CPR_.
- **Modello approssimativo (fallback).** In caso contrario, Crag Stats calcola il proprio CPR, etichettato come _Approx._ Utilizza gli stessi concetti: _P_ = 5, il miglior tick per via, scostamenti dei tick e un decadimento di 0,7 gradi/anno. Gli offset dei tick sono stime, ad esempio per lo sport: a vista +2,1, flash +1,4, Rotpunkt 0, pink point −0,5, tentativi −3. **Non è una copia dell'implementazione proprietaria di theCrag**, quindi aspettati piccole differenze.

## Come leggere la cronologia

- Ogni **colonna** rappresenta un trimestre dell'anno.
- Le **candele** mostrano l'intervallo di gradi che hai scalato con ciascun tipo di tick in quel trimestre. Come su theCrag, il tick più puro si trova in alto: a vista verde, flash giallo, Rotpunkt rosso, pink point rosa, chiusura/clean blu, tentativi grigio.
- La **linea nera** mostra il tuo CPR nel tempo. Un anello indica il tuo **picco**, mentre un pallino vuoto mostra la tua valutazione **attuale**.
- Lo **sfondo colorato** mostra le fasce di grado (Principiante → Elite) nei loro reali limiti di grado.
- Le **barre** in basso mostrano quante salite hai registrato in quel trimestre. Clicca su una di esse per aprire tali salite nel registro salite.
- Un **separatore tratteggiato** con **⋯** sull'asse del tempo indica un'interruzione superiore a un trimestre.
- **Mostra trimestri vuoti** assegna a ogni trimestre una propria colonna tra il tuo primo e l'ultimo trimestre registrato. I trimestri senza salite rimangono vuoti e **interrompono la linea nera**, cosicché un lungo periodo di inattività non venga più interpretato come un progresso costante. Il grafico scorre orizzontalmente quando le colonne aggiuntive richiedono più spazio. Lascialo deselezionato per mantenere la vista compatta, dove solo i trimestri con salite hanno una colonna.

theCrag nota che una **parte superiore grigia** sopra la linea (tentativi falliti su un grado più alto) precede spesso un salto di grado.

## Fonti

- theCrag: [Climber Performance Rating (CPR)](https://www.thecrag.com/en/article/cpr)
- theCrag: [Spiegazione della cronologia CPR](https://www.thecrag.com/en/article/cprtimeline)
