# Tipi di tick

Un **tipo di tick** registra _come_ hai salito qualcosa, non solo se hai raggiunto la cima. Un a vista vale più di un rotpunkt sulla stessa via. Ecco perché theCrag (e Crag Stats) li tengono distinti.

Nelle tabelle qui sotto, **Chiusura** significa che Crag Stats conta il tick come una salita riuscita (pulita), ad esempio nelle "salite riuscite", nelle percentuali di chiusura e nelle piramidi. **Tentativo** significa che è registrato come tentativo: appare in grigio nei grafici, conta comunque nel volume di arrampicata e può contrassegnare una via come progetto.

<!-- component:tick-types -->

## Come vengono usati i tick qui

- **Piramidi e grafici** colorano ogni tipo di tick in modo coerente: a vista in verde, flash in giallo, rotpunkt in rosso, pink point in rosa, chiusura/salita pulita in blu, tentativi in grigio.
- Il **CPR** sposta ogni tick di uno scarto di grado (un a vista conta come più difficile di un rotpunkt); vedi [CPR](/docs/cpr).
- I **Progetti** sono vie con tentativi ma senza ancora una chiusura. Una via chiusa al primo giro (a vista o flash) non è mai un progetto.
- Il **Carico di allenamento** conta i tentativi a 0,8× rispetto a una chiusura, poiché lavorare una via richiede comunque un grande sforzo; vedi [Carico di allenamento](/docs/training-load).

## Tipi di salita conteggiati nelle analisi

Su theCrag, i tentativi senza chiusura (come `Working`, `Attempt`, `Hang dog` o `Retreat`) vengono registrati come salite. Se registri molti giri di lavoro mentre provi un progetto, contare ogni tentativo nei totali della dashboard può falsare il conteggio principale delle salite, la ripartizione degli stili e il tipo di arrampicatore.

In **Impostazioni → Visualizzazione e visibilità → Tipi di salita conteggiati**, puoi configurare come viene trattato ciascun tipo di tick in Crag Stats:

- **Abilita (Conta ovunque):** incluso nelle salite principali, nella ripartizione per disciplina, nelle falesie e nei settori, nelle piramidi, nei totali sulla mappa, nei numeri di Eddington, nelle ripetizioni delle vie, negli assi del profilo arrampicatore, nelle mappe di calore delle attività, nel carico di allenamento, nei badge, nei progetti e negli obiettivi.
- **Solo progetti e obiettivi (Fuori dai totali):** escluso dalle salite principali, dalla quota per disciplina, dalle falesie, dai settori, dalle piramidi, dai totali sulla mappa, dai numeri di Eddington, dalle ripetizioni delle vie e dagli assi del profilo arrampicatore, ma comunque conteggiato per il rilevamento dei progetti, l'attività delle sessioni (mappa di calore, serie consecutive, sessioni a settimana e grafici per giorno della settimana), l'affaticamento del carico di allenamento, i badge e gli obiettivi di grado.
- **Nascondi (Escludi completamente):** escluso da tutte le analisi, progetti, obiettivi e badge.

Il registro conserva e mostra sempre tutte le salite registrate con il filtraggio completo, indipendentemente da questa impostazione. Per sapere quali badge seguono ciascuna scelta, vedi [Badge](/docs/badges).

Quando un tipo di tick configurato esclude alcune delle tue salite registrate, la dashboard ricalcola anche i dati del profilo che normalmente provengono da theCrag (salite outdoor e indoor, vie salite, dislivello totale e tipo di arrampicatore) a partire dalle salite conteggiate, così ogni totale nella pagina descrive lo stesso insieme di tick. Cancella la configurazione con il preset **Tutti i tick registrati** per tornare ai totali originali di theCrag.

## Fonte

Le definizioni sono parafrasate dall'articolo [Tick types](https://www.thecrag.com/en/article/ticktypes) di theCrag. Non tutti i tipi di tick si applicano a ogni stile di attrezzatura.
