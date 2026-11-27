# Karma

theCrag assegna **Karma** per i contributi all'indice dell'arrampicata — registrando le salite e modificando i dati della guida. Vedi [Karma su theCrag](https://www.thecrag.com/article/cragkarma).

## Cosa può mostrare Crag Stats

L'oggetto account API del **logbook** per i sostenitori **non** include il tuo totale personale di karma o la suddivisione tra salite e modifiche. Gli endpoint `/karma` delle aree sono classifiche dei contributori per una falesia, non un sostituto del punteggio del tuo account.

Finché theCrag non esporrà il karma personale (o l'accesso negoziato), la scheda della dashboard sarà solo un'**approssimazione della parte relativa alle salite**:

| Fonte                                                    | Punti                                                                                                 |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Registra salita                                          | **1** una volta per via (nodo), in linea con la regola di theCrag di una volta per tipo di contributo |
| Modifiche alla guida (descrizioni, topos, cronologia, …) | **Non disponibile** — non ricostruibile dalla cache del logbook                                       |

Quando il tuo account sincronizzato include `routesTicked` e tale cifra è almeno pari alla cache locale delle vie, la scheda la utilizza per il totale delle salite (corrisponde a “vie registrate” su theCrag). In caso contrario, conta le diverse vie nella tua cache SQLite locale.

Il tassello **vie locali registrate** mostra sempre il numero di vie distinte collegate alle tue salite in cache, anche quando la stima delle salite utilizza il contatore dell'account più grande. Le ripetizioni contano una volta sola; i metadati della via senza una salita non vengono conteggiati.

## Cosa non è

- Non è un clone esatto del punteggio sul tuo profilo theCrag.
- Il karma reale rimane in una **coda di revisione** per circa una settimana prima di essere accreditato sul tuo account.
- L'eliminazione o la modifica di salite, gli account privati e le importazioni storiche possono causare il disallineamento tra i conteggi locali e theCrag.
- Noi **non** inventiamo punti modifica dai tag FA o dai crediti dei tracciatori — queste attività possono far guadagnare karma su theCrag, ma le regole di punteggio prevedono un punto per nodo per tipo di contributo e non disponiamo della tua cronologia delle modifiche.

## Quando questo potrà migliorare

Se theCrag aggiungesse il karma (o i totali di salite/modifiche) al payload dell'account del logbook o a un endpoint documentato per i climber che possiamo sincronizzare in sicurezza, Crag Stats potrà sostituire la stima con i numeri reali e compilare il tassello delle modifiche.
