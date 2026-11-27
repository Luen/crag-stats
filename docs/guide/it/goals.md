# Obiettivi

Gli obiettivi trasformano un traguardo nel tuo logbook di theCrag in una barra di avanzamento sulla dashboard e sulla pagina **Obiettivi**. Gli obiettivi di altezza e di giorni di arrampicata si caricano linearmente. Gli obiettivi di **Grado** utilizzano un modello approssimativo di **preparazione a piramide**, in modo che trovarsi un grado sotto il traguardo non sembri più quasi completato.

## Tipi di obiettivo

| Tipo                   | Cosa significa “completato”                                                | Barra di avanzamento                    |
| ---------------------- | -------------------------------------------------------------------------- | --------------------------------------- |
| **Grado quest'anno**   | Una chiusura pari o superiore al punteggio target nell'anno dell'obiettivo | Preparazione a piramide (sotto)         |
| **Altezza quest'anno** | Metri arrampicati in quell'anno                                            | Lineare: metri ÷ traguardo              |
| **Giorni questo mese** | Giorni di arrampicata distinti nel mese solare corrente                    | Lineare: giorni ÷ traguardo             |
| **Personalizzato**     | Lo contrassegni come completato                                            | Manuale (nessun caricamento automatico) |

L'ambito del luogo (all'aperto / indoor / qualsiasi) filtra quali salite contano. Gli obiettivi di grado sono impostati come predefiniti su **all'aperto**.

Gli obiettivi di altezza **memorizzano sempre i metri**. Il modulo di creazione richiede il traguardo nell'unità di altezza selezionata (metri o piedi) e converte i piedi prima di salvare; anche le etichette di avanzamento e del traguardo seguono tale unità. Cambiando le unità in un secondo momento si rietichetta l'obiettivo senza modificare il traguardo memorizzato. Vedi [Impostazioni di visualizzazione](/docs/display-settings).

Gli obiettivi di grado mantengono la loro scala per **Vie** o **Boulder**. I traguardi e le etichette di avanzamento seguono il sistema di gradi corrispondente nelle Impostazioni; cambiare il sistema di visualizzazione non modifica il traguardo o la percentuale. Anche i titoli degli obiettivi suggeriti seguono le Impostazioni, mentre i titoli personalizzati rimangono come inseriti. Nelle **Preferenze di grado** di un obiettivo, puoi scegliere la sua scala e se utilizzare un titolo automatico.

Se un obiettivo indica **Scala di gradi necessaria**, il suo avanzamento non è disponibile finché il proprietario non sceglie **Vie** o **Boulder**. Il titolo e il traguardo salvato vengono preservati; un titolo che menziona un grado non determina la sua scala.

## Preparazione al grado

Un obiettivo di grado richiede una **chiusura ≥ traguardo** (punteggio canonico, solitamente Ewbank per le vie o scala V per i boulder) nell'anno dell'obiettivo. La barra **non** è `best send ÷ target` — ciò faceva apparire il passaggio 22→23 come ~96% quando era ancora necessaria la chiusura a 23.

Invece, il modello valuta quanto sia solida la tua piramide sotto il traguardo **N**, e quanto hai lavorato vicino ad esso:

1. **Completato (100%)** quando la tua migliore chiusura valida è già ≥ N.
2. **Base** quando hai una chiusura a N−1 (~35%) o solo a N−2 (~10%).
3. **Riempimento piramide** da vie distinte con una chiusura in quegli scaglioni — necessità indicativa di circa **2 vie a N−1** e **4 a N−2** (fino a circa +20% e +25%).
4. **Contributo dei tentativi** dalle salite senza chiusura (di lavoro) con punteggio effettivo **≥ N−1** — fino a circa +20%, con un fabbisogno indicativo **proporzionato all’orizzonte temporale**, così i progetti a breve termine avanzano più per ogni tentativo rispetto a quelli a lungo termine.
5. **Il modello base è limitato al 94%.** La prima sessione valida stabilisce il valore di base; ogni ulteriore giorno distinto di arrampicata con tentativi registrati a ≥ N−1 aggiunge un punto di preparazione, fino al 99%. Solo una chiusura valida raggiunge il 100%. Più vie o tentativi nello stesso giorno valgono come una sessione; date mancanti, non valide e future non valgono nulla. Il credito della sessione segue l'anno dell'obiettivo e il luogo, e non cambia i rapporti degli obiettivi di altezza o di giorni di arrampicata.

L'evidenza della chiusura utilizza lo stesso filtro di anno e luogo del completamento: **grado effettivo** (tiro più difficile scalato su una multipitch) e **vie distinte** per scaglione della piramide (chiusure ripetute sulla stessa via contano una volta sola). I tentativi contano ogni segnatura di progetto valida (le ripetizioni sulla stessa via fanno comunque avanzare la barra).

La linea di avanzamento mostra la tua migliore chiusura, il conteggio delle vie a N−1 / N−2, l'evidenza dei tentativi se presente e un breve suggerimento sull'orizzonte:

| Divario dal traguardo               | Suggerimento  | Necessità indicativa di tentativi (≈ riempire la fascia dei tentativi) |
| ----------------------------------- | ------------- | ---------------------------------------------------------------------- |
| 1 grado                             | Breve termine | ~15 tentativi                                                          |
| 2 gradi                             | Medio         | ~35 tentativi                                                          |
| Più ampio / nessuna chiusura ancora | Lungo termine | ~75 tentativi                                                          |

## Grado successivo suggerito

Sulla pagina **Obiettivi**, quando hai delle chiusure all'aperto negli ultimi **due anni**, Crag Stats può offrire un suggerimento indicativo: prendi la tua chiusura all'aperto più difficile (via e/o boulder, tenuti separati) e punta al **grado successivo** per quest'anno (V5 → V6, 25 → 26). I suggerimenti non creano mai un obiettivo finché non clicchi su **Aggiungi obiettivo**. Se stai già monitorando quel traguardo all'aperto per l'anno, il chip dirà **Già monitorato**.

## Cosa vedi

- Scheda “Obiettivi attivi” della **Dashboard**: fino a pochi obiettivi aperti con le stesse percentuali ed etichette.
- Pagina **Obiettivi**: chip opzionali con il grado successivo suggerito, elenchi completi Attivi / Raggiunti, crea/modifica e lo stesso testo sulla preparazione per gli obiettivi di grado.

## Avvertenze

- **Approssimativo.** I numeri indicativi della piramide sono una regola empirica di allenamento, non una previsione che chiuderai N.
- **Punteggi dello stesso sistema.** Gli scaglioni di supporto sono gli intervalli di punteggio [N−1, N) e [N−2, N−1), quindi le chiusure frazionarie al di sotto di un traguardo lo supportano comunque. I punteggi utilizzano il punteggio canonico dell'obiettivo; i sistemi di gradazione misti non vengono convertiti all'interno della barra.
- **Scala, anno e luogo.** Le prove per le vie e per la scala V non si mescolano mai. Segnature più vecchie al di fuori dell'anno dell'obiettivo, o nel luogo sbagliato, non aiutano la preparazione. DWS e highball con gradazione V contano per gli obiettivi boulder, utilizzando il sistema di gradi piuttosto che lo stile dell'attrezzatura.
- **I tentativi sono approssimativi.** Vediamo solo le segnature senza chiusura registrate con un grado ≥ N−1 — non ogni giro su un progetto senza grado.
- Gli **obiettivi personalizzati** non vengono mai caricati automaticamente dal logbook.

Gli obiettivi di altezza e di giorni rimangono semplici rapporti lineari, quindi un chilometro o un mese completato a metà risulterà comunque come metà percorso.
