# Prime ascensioni

La scheda **Prime ascensioni** conta le vie e i blocchi in cui hai effettuato la prima ascensione (**FA**) o la prima libera (**FFA**). Quando la cronologia della via è salvata in cache, mostra anche quante vie ti accreditano come **tracciatore** (chiodatura / tracciatura).

## Cosa ti serve

- **Login proprietario** — Se `APP_PASSWORD` è impostata, effettua l'accesso in modo da poter aprire le Impostazioni e usare **Contrassegna FA** / **FFA** nel logbook. I visitatori vedono la scheda e i badge non appena è contrassegnata almeno una via, ma non possono aggiungere contrassegni personalmente.
- **Importazione opzionale dei dati delle vie** — Imposta `ROUTE_DATA_IMPORT=true` sul server se vuoi che Crag Stats contrassegni automaticamente le FA e le FFA dalla cronologia pubblica delle vie di theCrag (vedi sotto). I contrassegni manuali e l'importazione scrivono entrambi nella stessa tabella `first_ascents`; nessuno dei due dipende dalle note private.
- **Le note private non sono collegate** — **Impostazioni → Mostra note private** controlla solo se i tuoi **commenti di salita** appaiono su `/logbook` (e nella ricerca). Non vincola la scheda Prime ascensioni, i badge FA/FFA, i traguardi o l'importazione dei dati delle vie.

## Contrassegnare una prima ascensione

theCrag registra le prime ascensioni nella **cronologia** di ciascuna via (le voci FA / FFA nella pagina della via), non come tipo di salita. La sua API per il logbook non restituisce la cronologia della via, quindi una sincronizzazione normale non può vederla. Puoi contrassegnarle tu stesso o attivare l'importazione opzionale di seguito.

### Contrassegnane una tu stesso

1. Apri il **Logbook** e trova una qualsiasi salita della via.
2. Passa il cursore sulla riga (o navigaci con il tasto Tab) e premi **Contrassegna FA** o **FFA**.
3. Premi **Rimuovi contrassegno** per annullare.

Solo chi può aprire le Impostazioni può contrassegnare le FA: chiunque se non è impostata alcuna `APP_PASSWORD`, altrimenti solo quando si è collegati. I visitatori vedono il badge FA e la scheda, ma non i pulsanti.

Il contrassegno viene salvato associandolo all'ID via di theCrag, quindi sopravvive alle risincronizzazioni. Scompare dalla scheda se ogni salita della via viene eliminata su theCrag e riappare se registri di nuovo la via. **Impostazioni → Cancella tutto** rimuove tutti i contrassegni.

### Filtrare il logbook

Su **Logbook**, usa il controllo **Contrassegno prima salita** per mostrare solo le tue FA, FFA, entrambe, o le salite senza ancora alcun contrassegno (`?fa=FA|FFA|any|none`). Se l'importazione dei dati delle vie è abilitata, il proprietario ha a disposizione anche **Cronologia non ancora verificata** (`?history=pending`), che elenca le salite non ancora recuperate dall'importatore.

### Importarle dalla cronologia della via (opzionale, disattivato di default)

Se il proprietario del server la attiva (`ROUTE_DATA_IMPORT=true`; nelle versioni precedenti era chiamata `ROUTE_HISTORY_IMPORT`, che non viene più letta, quindi rinominala e riavvia), Crag Stats legge in background la cronologia pubblica di ciascuna via del logbook da theCrag e contrassegna le FA e le FFA che indicano il tuo nome.

- Contano **solo le voci che menzionano il tuo nome utente theCrag** (`@yourlogin`). I nomi in testo semplice vengono ignorati perché è troppo facile confonderli. La sincronizzazione tramite API salva quel nome utente; se il tuo logbook proviene da caricamenti CSV, imposta `THECRAG_USERNAME` in modo che l'importazione sappia quali voci sono tue.
- **Le tue scelte hanno la priorità.** I contrassegni che imposti rimangono tali e le vie a cui hai rimosso il contrassegno rimangono senza contrassegno. **Impostazioni → Importa dati vie → Riapplica** può sovrascrivere entrambe le opzioni, utilizzando la cronologia già salvata, senza richiedere nuovamente i dati a theCrag.
- **Rispettoso verso theCrag.** Per impostazione predefinita ogni via viene verificata **una sola volta** (gli aggiornamenti periodici opzionali dei dati sono descritti di seguito), al massimo **100 vie per esecuzione** e una richiesta al secondo. A run happens after each logbook sync or CSV upload, on the background import schedule (`IMPORT_CRON`, daily by default), when the app restarts with routes still waiting (for example after an upgrade), or when you press **Check next 100 routes now**. Se theCrag limita le richieste, l'importazione si mette in pausa per almeno un giorno.
- Nelle Impostazioni viene mostrato quante delle tue vie sono state verificate finora. Con la sincronizzazione giornaliera, alcune centinaia di vie richiedono alcune settimane; premere il pulsante velocizza il processo.

Viene salvata solo la cronologia pubblica della via, mai le tue note private sulla salita. **Impostazioni → Cancella tutto** la rimuove insieme ai tuoi contrassegni.

## Cosa mostra la scheda

Quando la scheda include crediti FA/FFA o di tracciatura importati, il piè di pagina attribuisce la fonte alla cronologia delle vie di theCrag. Questo segue i crediti salvati, anche se l'importazione viene successivamente disabilitata. I contrassegni manuali non necessitano di etichetta di attribuzione; le raccolte miste mantengono l'attribuzione alla cronologia della via.

- **Conteggio:** quante vie sono accreditate come FA o FFA, da contrassegni manuali o dall'importazione dei dati delle vie (cronologia pubblica delle vie). Quando hai delle FFA, mostra anche la suddivisione tra FA / FFA.
- **Vie tracciate:** vie distinte la cui cronologia salvata in cache ti elenca come tracciatore (`@yourlogin`). Stessa regola del nome utente `@login` dell'importazione FA; i nomi in testo libero non contano. Richiede l'importazione dei dati delle vie (`ROUTE_DATA_IMPORT=true`) in modo che tali righe vengano salvate localmente.
- **Salite della community (stima):** salite salvate in cache sulle vie da te aperte (contrassegni FA/FFA **o** crediti di tracciatura), meno le tue salite nel logbook registrate nello stesso momento. Un secondo riquadro separa le vie **sportive / chiodate** (stile di materiale Sport, o qualsiasi via con spit/fittoni registrati). Ripetizioni o eliminazioni successive da parte del proprietario non modificano la vecchia istantanea. Queste sono stime dei totali delle salite, non di scalatori unici o contatori in tempo reale; differenze di visibilità e un logbook incompleto del proprietario possono influire su di esse.
- **Copertura della community:** la scheda mostra quante vie del logbook accreditate hanno istantanee del conteggio abbinate, su tutte le vie idonee. I totali pari a zero noti vengono visualizzati come zero; i conteggi non disponibili vengono esclusi anziché essere trattati come zero. La copertura parziale è indicata esplicitamente. Una cache completamente mancante mostra un messaggio di non disponibilità.
- **Anni:** dall'anno della tua prima FA fino alla più recente. Ogni FA è datata in base alla tua **prima chiusura registrata** della via (vedi sotto).
- **Intervallo di gradi:** la tua FA più facile e quella più dura, utilizzando il grado della via (non di un singolo tiro). Le vie e i blocchi sono elencati separatamente, perché i gradi Ewbank e V-Scale non possono essere confrontati. I gradi vengono mostrati nei sistemi di visualizzazione impostati per le vie e per i blocchi.
- **Stili:** come si suddividono le tue FA tra sportivo, trad, boulder e così via, utilizzando lo stile della via su theCrag.
- **Più recenti:** le tue tre FA più recenti sulla scheda della dashboard (elenco completo tramite il logbook).
- **Community per via:** le prime tre vie accreditate sulla dashboard (altre vengono conteggiate sotto l'elenco).
- **Community per via:** fino a otto vie accreditate, ordinate in base alla stima della community. Ogni riga mostra il credito FA, FFA e/o tracciatore, un badge di stile (Sportiva/chiodata, Trad, Boulder o altro stile noto dalle info via salvate in cache), la stima (o Non disponibile) e quando è stato recuperato quel conteggio. La data del conteggio viene salvata separatamente dagli altri dati della via, così aggiornare soltanto le informazioni tecniche o la qualità non fa apparire nuovo il conteggio.

La scheda appare ai visitatori solo dopo che è stata contrassegnata almeno una FA. Fino ad allora, il proprietario vede invece una breve guida di istruzioni.

L'importazione dei dati delle vie deve essere abilitata (`ROUTE_DATA_IMPORT=true`) per compilare le istantanee dei conteggi. I totali della community e le istantanee del conteggio del proprietario provengono dall'API della via durante l'importazione in background (100 vie per esecuzione, con limitazione della frequenza e tempi d'attesa). Per mantenere aggiornati automaticamente i totali e gli altri dati delle vie, imposta `ROUTE_DATA_REFRESH_DAYS` su un numero intero di giorni da 30 a 3650 (ad es. `90` consigliato, oppure `180` per circa metà anno) insieme a `ROUTE_DATA_IMPORT=true`. Le vie diventano idonee allo scadere di quel numero di giorni e si aggiornano dopo una sincronizzazione riuscita del logbook, condividendo la quota di 100 vie con le nuove vie. Le nuove vie vengono elaborate per prime, seguite dai dati non aggiornati più vecchi; arretrati consistenti possono richiedere più sincronizzazioni. Se non impostato, `0`, inferiore a 30 o superiore a 3650, viene mantenuto il comportamento di recupero singolo; **Aggiorna tutto** nelle Impostazioni rimane un ripristino manuale opzionale. I contrassegni e le rimozioni manuali dei contrassegni rimangono protetti.

Nelle Impostazioni, il pulsante di verifica della cronologia della via mostra un conto alla rovescia fino all'esecuzione successiva consentita e diventa disponibile automaticamente. Le esecuzioni hanno un intervallo minimo di un minuto; un blocco o un errore possono richiedere un'attesa più lunga. Senza JavaScript, ricarica le Impostazioni per aggiornare la disponibilità.

## Quando conta una FA e la sua data

Una prima ascensione è la chiusura, quindi ciascuna viene datata in base alla tua **prima chiusura registrata** della via contrassegnata. I tentativi precedenti e i rest su corda mentre lavoravi la via non contano, e nemmeno le ripetizioni successive. Se finora hai registrato solo tentativi, la via appare comunque sulla scheda (datata in base alla tua ascensione più remota), ma non ottiene badge o traguardi finché non registri la chiusura.

## Badge e traguardi

Questi si sbloccano dalle FA/FFA contrassegnate dal proprietario (e dalla tua prima chiusura di ogni via contrassegnata), non dall'attivazione delle note private. La scheda Traguardi e il catalogo dei badge usano le stesse soglie — non una riga per via.

- **Prima salita** e **Prima salita in libera:** la tua prima chiusura di una via che hai contrassegnato come FA o FFA.
- **Conteggio complessivo prime ascensioni** (5, 10 / Pioneer, 20, 50, 100): quel numero di vie distinte contrassegnate come FA o FFA.
- **Conteggio prime libere** (5, 10, 20, 50, 100): solo contrassegni FFA.
- **Conteggio prime ascensioni per stile** (10, 20, 50 per Sportiva, Trad e Boulder): contrassegni FA o FFA su quello stile di arrampicata.
- **Tracciatore**, **Sviluppatore di vie** (5), **Costruttore di pareti** (10), **Architetto di falesia** (25): crediti di tracciatore dalla cronologia della via salvata in cache, datati in base alla prima voce di tracciatura che menziona il tuo `@login` su ciascuna via (non dalle chiusure nel logbook).
- **Falesia condivisa** (10), **Grande successo** (50), **Cento mani** (100), **Classica locale** (500): salite approssimative della community sulle vie da te aperte (FA/FFA o tracciatore), dalle istantanee abbinate dei conteggi. I conteggi si riferiscono alle salite, non a scalatori distinti. La copertura incompleta è segnalata nei dettagli del badge.
- **Fervore chiodato** (10), **Calamita sportiva** (50), **Classica da rinvio** (100): la stessa stima limitata allo stile Sportiva o vie chiodate.

Ciascuna soglia è datata in base alla prima chiusura della via che l'ha superata; il dettaglio riporta il nome di quella via sbloccante.

I crediti di tracciatore privi di una data di cronologia valida contano comunque per i badge da tracciatore, ma la loro data di ottenimento rimane sconosciuta. Allo stesso modo, i badge per le salite della community lasciano la data di ottenimento sconosciuta — i totali sono aggregati salvati in cache, non un giorno specifico.
