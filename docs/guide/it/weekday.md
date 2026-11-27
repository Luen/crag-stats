# Giorno della settimana

La scheda **Giorno della settimana** mostra in quali giorni della settimana arrampichi, ispirandosi al grafico settimanale di [Dreeve](https://dreeve.app/) per Strava. La distribuzione è un **grafico ad anello (a torta)** con una legenda Lun–Dom. Per impostazione predefinita si trova a sinistra di **Sessioni a settimana** (a metà larghezza), nella riga sotto le statistiche **Mensili** / **Annuali**; con Personalizza dashboard è possibile spostare entrambe le schede.

## Cosa viene conteggiato

- **Sessioni** (predefinito) — un giorno di calendario con almeno una salita corrispondente (lo stesso principio di [Sessioni a settimana](/docs/sessions-per-week))
- **Salite** — ogni salita registrata corrispondente in quel giorno della settimana

Il giorno della settimana è ricavato dalla data `YYYY-MM-DD` della salita in UTC — le righe del diario riportano solo la data senza l’ora.

## Filtri

- **Tutti i tempi** / **Ultime 12 settimane** — finestra inclusiva di 84 giorni che termina oggi per l’intervallo breve
- **Sessioni** / **Salite** — cosa indica la dimensione di ciascuna fetta
- **Tutto** / **Sportiva** / **Tradizionale** / **Blocco** — i chip di stile usano gli stessi colori delle discipline presenti nel resto dell’app e corrispondono ai filtri di stile del diario (stile di arrampicata **o** stile della via). Moulinette e altri stili compaiono solo sotto **Tutto**.

Le scelte vengono salvate nel browser (`cs_weekday_range`, `cs_weekday_metric`, `cs_weekday_style`).

## Giorno più attivo

Il centro del grafico ad anello e la riga principale indicano il giorno della settimana con il valore più alto per la metrica corrente (in caso di parità si guarda l’altra metrica). La fetta e la riga della legenda di quel giorno della settimana vengono evidenziate. **Vedi valori dei giorni della settimana** sotto il grafico elenca esattamente sessioni, salite e percentuale per gli screen reader e gli utenti che navigano da tastiera.
