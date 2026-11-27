# Progetti

Crag Stats elenca le vie outdoor come **progetti aperti** dopo tentativi non riusciti in **almeno due giorni di scalata distinti** nel logbook. Più tentativi in un solo giorno non creano un progetto aperto. I progetti aperti scompaiono dopo un anno senza attività.

Un **progetto completato** è una via chiusa dopo averla lavorata per almeno due giorni, oppure dopo **almeno due tentativi falliti nel giorno della chiusura** (tre o più tentativi includendo la chiusura). I tentativi possono essere voci separate nel logbook o registrati nel conteggio dei tentativi della chiusura. Le voci separate e il conteggio della chiusura non vengono sommati, per evitare di contare due volte gli stessi tentativi. Le chiusure al primo colpo e un tentativo fallito seguito da una chiusura nello stesso giorno non sono considerati progetti. Conta solo il lavoro fino alla prima chiusura; ripetizioni successive non trasformano una chiusura precedente in un progetto. Le date mancanti o non valide non stabiliscono delle sessioni. I progetti completati appaiono nella sezione **Chiusi di recente** per gli ultimi sei mesi solari.

Quando sia un tentativo che la prima chiusura includono l'orario, i tentativi successivi a quella chiusura sono esclusi dalla classificazione. Le voci con la sola data nel giorno della chiusura sono trattate come lavoro preparatorio perché l'ordine cronologico all'interno della giornata non è noto. Più chiusure nella stessa data senza orari validi utilizzano l'ordine di inserimento, quindi una ripetizione successiva non sostituisce la prima chiusura registrata. I totali delle sessioni sulle schede e sulla dashboard utilizzano gli stessi giorni solari validi del classificatore.

**Chiusi di recente** copre gli ultimi sei mesi solari in UTC, incluso il giorno limite per le chiusure con la sola data. Alla fine del mese il limite si fissa all'ultimo giorno valido (il 31 ottobre guarda indietro fino al 30 aprile). Le date future sono escluse. Le chiusure con orario mantengono l'orologio di riferimento al limite. La dashboard utilizza la stessa finestra temporale quando riempie gli slot liberi dei progetti con le chiusure recenti.

## Scegliere i propri progetti

Il proprietario vede dei piccoli indicatori di progetto accanto ai controlli FA/FFA nel logbook e sulle schede/dettagli del progetto:

- **Segna come progetto** seleziona una via outdoor registrata anche dopo una sola sessione o un anno senza attività.
- **Non è un progetto** / **Rimuovi progetto** lo esclude dai Progetti, dalla dashboard e dal conteggio dei progetti attivi finché il proprietario non lo segna di nuovo o ripristina il rilevamento.
- **Usa automatico** rimuove la scelta manuale e ripristina le regole sopra indicate.

Ogni indicatore salva direttamente. Gli indicatori del logbook ti mantengono sulla stessa pagina filtrata; quelli delle schede/dettagli del progetto tornano alla lista dei progetti. Il tag Progetto / Non è un progetto mostra una scelta manuale senza basarsi sul colore.

Le selezioni sono metadati locali e sopravvivono a sincronizzazioni, ricostruzioni della cache e persino alla rimozione di una via a monte che ritorna successivamente. Non modificano il logbook di theCrag o il suo flag pubblico Progetto. Solo una vera chiusura registrata rende chiusa un progetto selezionato. Le chiusure selezionate al di fuori della finestra di sei mesi appaiono sotto **Chiusure selezionate precedenti** invece di Chiusi di recente. Impostazioni → Cancella tutto pulisce le selezioni. I visitatori possono leggere i progetti risultanti ma non possono modificare le scelte. Le vie indoor e quelle non registrate non possono essere incluse manualmente.

## Dettagli del progetto, progressione e stime

Clicca sul nome di un progetto nella pagina Progetti o nella dashboard per aprire la sua pagina di dettaglio. Mostra la via, estratti della guida pubblica se presenti in cache, la progressione delle sessioni datate e i tentativi/chiusure precedenti (inclusi i nomi dei tiri saliti). Il link in basso apre ogni voce del logbook per quella esatta via, incluse le ripetizioni più vecchie. Le note private delle salite rimangono nel logbook con l'attuale impostazione di visibilità riservata al solo proprietario.

La barra di **preparazione approssimativa** segue l'approccio della preparazione agli obiettivi: misura le prove a supporto, non una percentuale di un grado o la probabilità di chiusura. Solo una chiusura registrata su questa via completa la barra. Un'altra via dello stesso grado non può farlo. Le sessioni precedenti utilizzano solo le prove disponibili entro quel giorno di scalata, quindi una chiusura successiva non riscrive la loro preparazione.

Per ogni giorno di riferimento, il modello utilizza i 365 giorni precedenti (incluso quel giorno) di chiusure outdoor nella stessa disciplina e scala di gradi, utilizzando i gradi effettivi saliti. I conteggi della piramide di supporto utilizzano vie distinte; le ripetizioni non riempiono di nuovo la piramide. La via target è esclusa dalle prove a supporto.

- Migliore chiusura recente al livello o sopra il target: 60 punti; un grado sotto: 35; due gradi sotto: 10; altrimenti zero.
- Due vie distinte un grado sotto sommano 20 punti, e quattro vie due gradi sotto sommano 25 punti.
- I tentativi falliti sul target sommano fino a 15 punti, rispetto a un obiettivo indicativo di 15, 35 o 75 tentativi. L'orizzonte è a **Breve termine** quando il divario rispetto al tuo miglior risultato recente è al massimo di un grado, **Medio** per due gradi, altrimenti a **Lungo termine** (anche quando non è nota alcuna chiusura recente).
- Il modello di base arriva al massimo al 94%, poi guadagna un punto per ogni ulteriore giorno di scalata valido su questa via (il primo giorno stabilisce la linea di base), fino al 99% finché questo progetto non ha una chiusura registrata. I gradi sconosciuti non hanno una stima. I gradi della scala V pari a zero o negativi sono supportati e non vengono mai mescolati con i gradi delle vie.

La pratica può innalzare questa barra senza dimostrare che un particolare movimento sia stato risolto. Gradi e sforzo registrato non possono rivelare beta, condizioni, infortuni o sicurezza di sé, quindi questa è un'euristica spiegabile, non un modello validato scientificamente.

**Lavoro rimanente stimato** confronta la tua cronologia di progetti outdoor completati nella stessa disciplina e scala, entro un grado numerico. Le chiusure al primo colpo e le chiusure parziali di un tiro sotto il grado della via non rientrano in questo gruppo. Per ogni metrica separatamente, almeno tre progetti completati devono aver richiesto più sessioni/tentativi di quelli che hai registrato finora. L'intervallo visualizzato è la metà centrale (25°-75° percentile, utilizzando i ranghi osservati inclusi) di quei totali meno il tuo lavoro registrato; i tentativi rimanenti includono la chiusura finale. Quando superi quella cronologia o ci sono troppi pochi confronti, la stima viene omessa piuttosto che inventare una scadenza. I gruppi includono tutti gli anni registrati, mentre la preparazione utilizza le chiusure recenti.

Queste stime descrivono solo i progetti completati: i progetti non chiusi e i tentativi non registrati sono assenti, e l'abilità cambia nel tempo. Sono confronti personali approssimativi, non uno sforzo rimanente garantito. I totali delle sessioni contano i giorni solari scritti validi. Le date mancanti, non valide e future sono elencate nella cronologia ma escluse dalla progressione/stime. Il conteggio dei tentativi della voce di chiusura include il tentativo riuscito e può sovrapporsi a voci di fallimento separate; i riepiloghi utilizzano il totale di fallimenti maggiore invece di sommare entrambi. Una ripetizione successiva rimane visibile senza cambiare quale chiusura ha completato per prima il progetto.

## Nuova via?

Quando un progetto non ha **alcun grado** su theCrag (o è letteralmente graduato "Project" / "Proj"), le schede mostrano un badge **Nuova via?** — solitamente una nuova linea che stai chiodando o su cui stai ancora lavorando. Lo stesso badge appare anche per **ampi intervalli provvisori** come `21-23` o `V1-3`, che spesso significano che il grado è ancora in fase di definizione. I mezzi gradi adiacenti come `V1/2` rimangono gradi pubblicati ordinari e non ricevono il badge. L'indicatore del grado mostra comunque il punto medio analizzato, quando ne esiste uno; cambia solo il badge. Un flag **Progetto** definito di theCrag (dall'importazione delle info via) mostra invece il badge Progetto separato.

## Testo della guida sulle schede del progetto

Quando l'**importazione dei dati della via** ha memorizzato in cache i dati della guida pubblica per una via, le schede del progetto possono mostrare:

- Un breve estratto della **descrizione**
- Un avviso di **accesso** quando la guida elenca problemi di accesso (per esempio falesie chiuse o tollerate)

Quel testo proviene dalle pagine pubbliche delle vie di theCrag (campi `beta` come Descrizione e Problemi di accesso). **Non** sono le tue note private del logbook.

### Riservatezza

- Le **note private della salita** (`ascents.comment`) rimangono separate. Appaiono nel logbook solo se acconsenti nelle Impostazioni, e mai sulle schede dei progetti o sulle statistiche della dashboard.
- La **beta della guida** è un contenuto pubblico della community. Crag Stats memorizza brevi estratti in `routes.beta_json` durante la stessa importazione opzionale della via utilizzata per la cronologia FA — non vengono mai mescolati con le note.

### Licenza e attribuzione

il contenuto della guida di theCrag può essere concesso in licenza secondo termini quali [Creative Commons BY-SA](https://creativecommons.org/licenses/by-sa/4.0/). Le pagine delle vie spesso citano i collaboratori (ad esempio i club locali). Crag Stats mostra solo **brevi estratti**, rimanda con un link alla **pagina della via su theCrag** e indica la fonte (CC BY-SA). Per la descrizione completa, l'etica, l'avvicinamento e lo stato attuale dell'accesso, usa il link sulla scheda.

L'importazione della via è **disattivata per impostazione predefinita** (`ROUTE_DATA_IMPORT`). Imposta `ROUTE_DATA_IMPORT=true` sul server e riavvia se desideri gli estratti della guida e i suggerimenti automatici FA; vedi [Prime salite](/docs/first-ascents) per i limiti di privacy e frequenza.
