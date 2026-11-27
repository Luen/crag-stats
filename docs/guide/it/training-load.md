# Carico di allenamento

La scheda **Carico di allenamento** (e la pagina dedicata [`/training-load`](/training-load)) stima quanto duramente hai arrampicato di recente rispetto a ciò a cui il tuo corpo è abituato. Un aumento rapido è il momento in cui si verificano più spesso infortuni a dita e spalle. La scheda della dashboard riassume le ultime 12 settimane; la pagina mostra 26 settimane più una striscia del carico giornaliero degli ultimi 28 giorni.

## 1. Carico per salita

Ogni salita riceve un punteggio di carico:

> **carico = 10 × intensità × fattore stile**

L'**intensità** confronta il grado della salita con la tua **chiusura più dura degli ultimi 12 mesi** nella stessa disciplina. Le vie vengono confrontate sulla scala Ewbank e i boulder sulla scala V.

| Grado rispetto al tuo massimo sui 12 mesi                         | Intensità  |
| ----------------------------------------------------------------- | ---------- |
| Al tuo massimo                                                    | 1,0        |
| 2 gradi Ewbank (1 grado V) sotto                                  | 0,5        |
| 4 gradi Ewbank (2 gradi V) sotto                                  | 0,25       |
| Sopra il tuo massimo (un nuovo record)                            | fino a 1,5 |
| Lavorare una via senza grado o un Project di theCrag (vedi sotto) | 1,0        |
| Chiusura senza grado, o nessuna chiusura in 12 mesi               | 0,3        |

Arrampicare vicino al proprio limite conta molto di più rispetto al volume molto al di sotto di esso. Una giornata con dieci vie facili e una giornata passata su un solo progetto possono dare un risultato simile.

**Progetti senza grado e contrassegnati:** un tentativo, un lavorato con riposi o un'altra salita non chiusa su una via **senza grado**, o su una via contrassegnata su theCrag con il flag **Project** (dall'importazione opzionale delle info sulla via), viene considerato come arrampicata **al tuo massimo**. Le vie senza grado su cui continui a lavorare sono di solito nuove linee vicino al tuo limite; il flag è il caso certo quando disponibile. Gli stessi tentativi contribuiscono anche alla quota vicino al limite. Se hai assegnato tu stesso un grado alla salita su theCrag, viene usato quel grado. Una _chiusura_ senza grado conta comunque come leggera (0,3), poiché una via facile senza nome non dovrebbe apparire come una giornata al limite.

**Fattore stile:** una chiusura da primo vale 1,0. Tentativi e salite con riposi valgono 0,8, perché lavorare una via richiede comunque un impegno reale. In moulinette o da secondo si applica un ulteriore 0,8×.

## 2. Fatica e forma fisica

I carichi giornalieri vengono mediati in due modi, entrambi ponderati verso i giorni più recenti:

- **Fatica (acuta):** una media ponderata esponenzialmente su 7 giorni.
- **Forma fisica (cronica):** una media ponderata esponenzialmente su 28 giorni.

## 3. Rapporto acuto : cronico

**rapporto = fatica ÷ forma fisica**

| Rapporto  | Stato          | Significato                                                           |
| --------- | -------------- | --------------------------------------------------------------------- |
| —         | A riposo       | Nulla di registrato di recente                                        |
| < 0,8     | Sotto la norma | Più leggero del normale: fresco, in scarico o in calo di forma        |
| 0,8 – 1,3 | Zona ideale    | In linea con ciò a cui sei abituato                                   |
| 1,3 – 1,5 | In aumento     | Arrampichi più del solito; tieni d'occhio il recupero                 |
| > 1,5     | Picco          | Un grande salto; la zona più associata agli infortuni da sovraccarico |

Queste fasce derivano dal rapporto di carico acuto:cronico utilizzato nella scienza dello sport e nell'allenamento per l'arrampicata. Considerale come un'indicazione, non una diagnosi.

## Inoltre nella scheda / pagina

- **Carico settimanale:** il carico totale per ogni settimana (12 nella scheda, 26 nella pagina). La settimana corrente è la barra evidenziata.
- **Carico giornaliero (pagina):** gli ultimi 28 giorni di carico ponderato per intensità, inclusi i giorni di riposo.
- **Chiusure vicine al limite · 28g:** chiusure negli ultimi 28 giorni entro 2 gradi Ewbank (1 grado V) dal tuo massimo sui 12 mesi.
- **Quota vicina al limite:** la percentuale delle salite gradate degli ultimi 28 giorni che erano vicine al tuo limite. Una quota elevata per diverse settimane indica molta arrampicata al limite; valuta settimane di scarico.
- **Ultimi 7 / 28 giorni:** salite, chiusure, giorni attivi e di riposo, dislivello scalato e tasso di chiusura.

## Avvertenze

- **Conta solo ciò che registri.** Le sessioni in palestra, al trave e altri allenamenti non registrati sono invisibili.
- **I gradi sono variabili** e una via generosa o severa distorce l'intensità.
- **Il rapporto richiede uno storico.** Con meno di qualche settimana di registrazioni, la "forma fisica" è bassa e il rapporto oscilla molto.

Per le vie Project, un grado personale deve provenire dalla salita o da un tiro salito (oppure dal campo Ascent Grade del CSV). Un grado effettivo copiato dalla via è solo un valore di ripiego, quindi non disattiva l'ipotesi di Project al massimo.
