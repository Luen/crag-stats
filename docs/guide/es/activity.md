# Actividad

Las tarjetas **Estadísticas mensuales** y **Estadísticas anuales** del panel resumen el volumen de un vistazo. **Actividad** (`/activity`) es la página de detalle cuando quieres algo más que los gráficos: una tabla mensual completa (ascensiones, encadenes, altura, combinación de estilos) y el desglose interanual.

## Qué cuenta

- **Ascensiones**: cada tick registrado ese día/mes/año (intentos incluidos).
- **Encadenes**: ticks clasificados como encadenes (consulta [Tipos de tick](/docs/tick-types)).
- **Altura**: metros de la ascensión o de la vía cuando estén disponibles.
- **Estilos**: Deportiva / Tradicional / Bloque según el estilo de equipamiento; todo lo demás se agrupa en **Otros** en la tabla.

Los enlaces de los meses abren el libro de vías para ese mes del calendario. Los enlaces de los años (en la tarjeta/tabla anual) abren `/logbook?year=`.

## Por qué una página independiente

Repetir solo los mismos dos gráficos recargaría innecesariamente la barra lateral. Actividad se gana su propia página al incluir la **tabla de desglose mensual** y mantener las variaciones interanuales fáciles de consultar, superando el listón fijado para ir más allá de simples tarjetas de resumen.

## Rachas

La tarjeta Rachas muestra las rachas actuales de días, semanas y meses junto a tu racha diaria **más larga** de todos los tiempos (cuatro casillas de métricas). Las fechas de inicio y fin de la racha más larga
se muestran debajo de las casillas. Cuando existen récords de igual duración, se muestra el rango más antiguo.
Un solo día de escalada muestra una única fecha; un historial vacío no tiene fechas de récord.

El pie de página también muestra tu último día de escalada, cuántos días enteros han pasado
desde entonces si se ha roto la racha de días actual, y los **días activos** en total
(días de escalada distintos). Los días se calculan a partir de fechas de ascensión válidas; los intentos y
encadenes, tanto en rocódromo como en roca, cuentan por igual, y varias vías en un mismo día cuentan
como una sola. Consulta [Insignias](/docs/badges) para ver los hitos de 7, 10 y 30 días.

La racha de días actual termina hoy, o ayer mientras no hayas escalado hoy.
Las comparaciones de días de calendario usan UTC, por lo que la zona horaria del servidor y los cambios de horario de verano
no pueden alterar un día registrado. Las entradas con fecha futura no prolongan la racha actual.

Las rachas actuales de semanas y meses siguen la misma regla de gracia: cuentan los períodos consecutivos
que terminan en el período actual, o en el inmediatamente anterior si todavía no se ha escalado
en este período. Tras una semana o un mes entero sin actividad, ese contador
pasa a ser cero. Las semanas empiezan el lunes y los límites del calendario usan UTC, incluso a lo largo de la semana ISO 53
y el año nuevo. Las entradas con fecha futura no cuentan para estos contadores.

## Actividades recientes

El panel enumera primero el **día de escalada** más reciente. Dentro de cada día, la ascensión **registrada** más recientemente aparece primero, utilizando la marca de tiempo de creación del registro del proveedor.
La fecha mostrada sigue siendo la fecha de escalada: registrar hoy una vía antigua
no la sitúa por encima de las escaladas de un día posterior. El orden de registro sirve como estimación del orden de escalada
cuando introduces las vías en secuencia, no como una hora exacta de la ascensión.

Las entradas sin hora de registro o con una hora no válida van después de las entradas con hora del mismo día.
En caso de horas de registro iguales o no disponibles, se utiliza el ID de ascensión guardado, mostrando el más reciente primero, para mantener el orden estable. Las marcas de tiempo de edición o sincronización no se utilizan como horas de creación del registro.

Actividades recientes también muestra las mismas insignias de estilo de escalada que el libro de vías: modalidad de la vía, un estilo de protección registrado diferente cuando corresponda y variantes explícitas en solitario como Solo de primero o Solo en polea. La ausencia de compañeros registrados nunca implica que se haya escalado en solitario.
