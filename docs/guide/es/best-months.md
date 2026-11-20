# Mejores meses

La tarjeta **Mejores meses** compara la [estacionalidad de theCrag](https://www.thecrag.com/article/Seasonality) para las escuelas en las que más escalas con **cuándo escalas allí realmente**.

## De dónde proceden los datos

theCrag guarda una **curva de estacionalidad de 12 valores** por vía (un valor por cada mes del año). Crag Stats la guarda en caché en cada vía durante la importación opcional de datos de vías (`ROUTE_DATA_IMPORT`, desactivada por defecto). Hasta que se haya obtenido una vía al menos una vez, no hay estacionalidad que mostrar.

## Cómo agrupamos los datos

Para cada escuela en tu libro de vías:

1. **Tu volumen**: cuenta tus ascensiones por mes del año (todos los años combinados).
2. **Estacionalidad de theCrag**: para cada vía que hayas apuntado en esa escuela, toma la curva de 12 meses guardada en caché y pondérala según **cuántas veces has escalado esa vía**. Las vías con más encadenes o registros tuyos influyen más en la media de la escuela.

Mostramos hasta **seis** escuelas clasificadas por tu total de ascensiones en ellas, pero solo escuelas donde al menos una vía escalada tenga la estacionalidad guardada en caché.

## Lectura del gráfico

- **Barras naranjas**: estacionalidad media ponderada (más alta = más popular en theCrag ese mes).
- **Barras grises**: tus ascensiones ese mes en esa escuela.

Cuando las barras grises alcancen su punto máximo en meses distintos a la franja naranja, puede que estés escalando fuera de temporada o que tu muestra de datos sea pequeña.

## Actualizar la estacionalidad

Ejecuta **Sincronizar** desde Ajustes. Con la importación de datos de vías activada, la estacionalidad se completa en segundo plano (con límite de frecuencia, hasta 100 vías por ejecución).

La página de Sectores también puede mostrar el [tiempo en los días de visita guardados en caché](/docs/weather). Esto describe las condiciones en los días que registraste, independientemente de la estacionalidad de las vías que se usa aquí.

## Buscar por mes

Abre la [Búsqueda por estacionalidad](/seasonality) desde la tarjeta Mejores meses para explorar todas las escuelas y vías de tu libro de vías sincronizado que tengan datos mensuales en caché. Elige un mes (por defecto, el mes actual en tu zona horaria), busca el nombre de una escuela, zona o vía, y cambia entre **Escuelas** y **Vías**. Las búsquedas, la selección de mes, la ordenación y las páginas se guardan en la URL para que puedas añadirlas a marcadores o compartirlas. Elige **Ver vías** para limitarte a una escuela, o **Buscar en todas las escuelas** para salir de ese ámbito.

Los resultados se clasifican dividiendo el valor del mes seleccionado entre el valor más alto de la curva anual de ese resultado. Por ejemplo, un valor de 5 con un pico anual de 10 muestra **50 % del pico anual**. Los nombres desempatan; también puedes ordenar por nombre. No hay un límite estricto para estar «en temporada». Una curva con solo ceros indica **Sin señal estacional** y se ordena después de las curvas con un pico positivo. La franja de meses y la tabla desplegable de valores muestran los doce meses.

Las curvas de las escuelas usan la misma media ponderada por ascensiones que el panel principal: las vías con más ascensiones registradas influyen más; las curvas de vías que faltan no entran en la media. Buscar el nombre de una vía puede localizar su escuela, pero no cambia la curva completa de esa escuela. Las escuelas se mantienen separadas por la identidad de zona del proveedor cuando está disponible. Cada escuela muestra cuántas de sus vías registradas tienen datos; la página también informa sobre la cobertura entre las vías coincidentes. Las curvas no disponibles o con formato incorrecto permanecen como desconocidas y se omiten de los resultados clasificados.

Los resultados de vías enlazan a todas las entradas de tu libro de vías para esa vía exacta y a su página de reseña en theCrag. El botón Atrás de tu navegador vuelve a la búsqueda. Al buscar, solo se lee la caché local y no se activa una consulta al proveedor ni se busca en todo el catálogo de theCrag. Activa la importación opcional de datos de vías y sincroniza para ampliar la cobertura.

La estacionalidad describe **patrones de escalada de la comunidad**, no la predicción meteorológica ni las condiciones medidas en tus visitas registradas. Consulta [Tiempo](/docs/weather) para ver esas observaciones en los días de visita.
