# Impostazioni di visualizzazione

**Impostazioni → Visualizzazione e visibilità** definisce il modo in cui le date e le misurazioni appaiono su tutto il sito. Le scelte si applicano a ogni visitatore, non solo al browser del proprietario, e hanno effetto al caricamento della pagina successivo.

## Formato data

| Opzione        | Esempio     |
| -------------- | ----------- |
| **Automatico** | 27 ott 2026 |
| **GG/MM/AAAA** | 27/10/2026  |
| **MM/GG/AAAA** | 10/27/2026  |
| **AAAA-MM-GG** | 2026-10-27  |

**Auto** segue l'impostazione locale di visualizzazione del sito (`DISPLAY_LOCALE`), in modo da risultare naturale per la maggior parte dei visitatori senza configurazioni aggiuntive.

Il formato modifica i giorni del calendario visibili su dashboard, logbook, pagine meteo, badge, obiettivi, traguardi e grafici. I link dei filtri, gli attributi `datetime`, i dati dei grafici e i parametri URL mantengono i loro valori ISO `YYYY-MM-DD`, in modo che un link condiviso punti sempre allo stesso giorno.

## Unità di misura

Ogni misurazione ha una propria impostazione, quindi puoi combinarle come preferisci:

| Misurazione        | Opzioni                       |
| ------------------ | ----------------------------- |
| **Altezza**        | Metri (m), piedi (ft)         |
| **Distanza**       | Chilometri (km), miglia (mi)  |
| **Temperatura**    | Celsius (°C), Fahrenheit (°F) |
| **Vento**          | km/h, mph                     |
| **Precipitazioni** | Millimetri (mm), pollici (in) |

I preset compilano tutte e cinque le impostazioni contemporaneamente:

- **Metrico**: metri, chilometri, Celsius, km/h e millimetri.
- **Imperiale (US)**: piedi, miglia, Fahrenheit, mph e pollici.
- **UK (misto)**: metri, miglia, Celsius, mph e millimetri.

I preset sono solo una scorciatoia: la modifica di una singola unità in un secondo momento crea una combinazione personalizzata, e il modulo Impostazioni mostra quali valori sono memorizzati.

## Cosa rimane in sistema metrico

Il database memorizza sempre le altezze in metri, le distanze in chilometri, le temperature in °C, il vento in km/h e le precipitazioni in millimetri. La conversione avviene solo al rendering della pagina, quindi il cambio di unità non riscrive mai il tuo logbook, i tuoi obiettivi o le tue importazioni.

- L'**esportazione CSV** mantiene le sue colonne metriche canoniche.
- Le **soglie dei badge** (livelli di altezza, caldo, gelo, pioggia, vento e così via) sono definite nel sistema metrico. Solo il testo viene convertito, ad esempio **Ondata di calore** recita "35°C o più caldo" nel sistema metrico e "95°F o più caldo" in Fahrenheit. Le stesse scalate permettono di ottenere gli stessi badge in entrambi i casi.
- I **filtri meteo** come i filtri del logbook per caldo, gelo, pioggia, neve e vento mantengono le loro soglie metriche.
- Le **conversioni vengono arrotondate** per la visualizzazione, quindi un valore mostrato in piedi, miglia o pollici è approssimativo anziché una seconda misurazione memorizzata.

## Override temporanei

La dashboard accetta `?units=metric`, `?units=imperial` o `?units=uk` per visualizzare in anteprima un preset senza salvarlo. I singoli parametri sostituiscono una misurazione alla volta: `unitHeight`, `unitDistance`, `unitTemp`, `unitWind` e `unitPrecip` (ad esempio `?unitTemp=fahrenheit&unitWind=mph`). Questi si applicano solo a quel caricamento della pagina e non modificano le Impostazioni.

## Dove appaiono le impostazioni

Le opzioni di data e unità si applicano a dashboard, logbook, calendario delle attività, carico di allenamento, pagine meteo, settori, mappa di arrampicata, obiettivi, badge, traguardi, schede incorporate e snapshot offline. I sistemi di grado sono separati: vedi [Gradi](/docs/grades).
