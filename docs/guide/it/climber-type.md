# Tipo di climber

La dashboard ti etichetta con un **tipo di climber**, come _Climber sportivo_ o _Rock climber_. Si trova nella parte superiore della dashboard e nella scheda "Tipo di climber".

## Come viene determinato

1. **Prima theCrag, finché ogni tipo di tick viene conteggiato.** Se il tuo account theCrag ha un tipo di climber impostato (sincronizzato tramite API), Crag Stats lo usa così com'è. Non appena imposti un qualsiasi tipo di tick su _Solo progetti e obiettivi_ o _Nascondi_ nelle Impostazioni, l'etichetta viene ricalcolata in base alle tue salite conteggiate, evitando che i tentativi sui progetti ti facciano rimanere nella disciplina sbagliata.
2. **Altrimenti, dal tuo logbook.** Ogni salita conteggiata vale per la propria disciplina (stile dell'attrezzatura): Sport, Trad, Boulder, Top rope, Alpina, Artif, Deep-water solo e così via. Di default vengono conteggiati anche i tentativi, ma puoi configurare i [tipi di tick conteggiati](/docs/tick-types) nelle Impostazioni per evitare che i tentativi sui progetti (come la lavorazione dei blocchi) distorcano il tuo tipo di climber.
3. **La regola del 40%.** Se una singola disciplina rappresenta **almeno il 40%** di tutte le tue salite conteggiate _e_ quella disciplina è **Sport, Trad o Boulder**, sei un "Climber sportivo", "Climber trad" o "Climber boulder".
4. **Tutto il resto** è **Rock climber**. Questo include i casi in cui nessuna disciplina raggiunge il 40%, o in cui la quota maggiore è rappresentata da qualcosa come la Top rope.

La barra colorata nella scheda mostra la quota di ciascuna disciplina, utilizzando gli stessi colori presenti nel resto dell'app: blu per Sport, arancione per Trad e rosso per Boulder.

## Perché il 40%?

La maggior parte dei climber pratica diverse discipline. Una soglia ben al di sotto del 50% individua comunque una chiara preferenza (ad esempio 47% sport, 24% boulder e 24% trad) senza forzare un climber completo in un'unica categoria. I climber il cui tempo è distribuito in modo abbastanza omogeneo rimangono "Rock climber".

## Come modificarlo

- Imposta un tipo di climber sul tuo profilo theCrag e sincronizza,
- regola i tipi di tick conteggiati nelle Impostazioni se i tentativi sui progetti stanno falsando la percentuale delle tue discipline, oppure
- registra più salite nello stile in cui ti identifichi. L'etichetta si aggiorna al successivo caricamento della pagina.
