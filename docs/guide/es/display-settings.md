# Ajustes de visualización

**Ajustes → Visualización y visibilidad** define cómo aparecen las fechas y las mediciones en todo el sitio. Las opciones se aplican a cada visitante, no solo al navegador del propietario, y surten efecto la próxima vez que se cargue la página.

## Formato de fecha

| Opción         | Ejemplo     |
| -------------- | ----------- |
| **Auto**       | 27 oct 2026 |
| **DD/MM/YYYY** | 27/10/2026  |
| **MM/DD/YYYY** | 10/27/2026  |
| **YYYY-MM-DD** | 2026-10-27  |

**Auto** sigue la configuración regional de visualización del sitio (`DISPLAY_LOCALE`), por lo que resulta natural para la mayoría de los visitantes sin necesidad de configuración adicional.

El formato cambia los días del calendario visibles en el panel de control, el libro de vías, las páginas del tiempo, las insignias, los objetivos, los hitos y los gráficos. Los enlaces de los filtros, los atributos `datetime`, los datos de los gráficos y los parámetros de URL conservan sus valores ISO `YYYY-MM-DD`, de modo que un enlace compartido siempre apunta al mismo día.

## Unidades de medida

Cada medición tiene su propia configuración, por lo que puedes combinarlas como quieras:

| Medición          | Opciones                       |
| ----------------- | ------------------------------ |
| **Altura**        | Metros (m), pies (ft)          |
| **Distancia**     | Kilómetros (km), millas (mi)   |
| **Temperatura**   | Celsius (°C), Fahrenheit (°F)  |
| **Viento**        | km/h, mph                      |
| **Precipitación** | Milímetros (mm), pulgadas (in) |

Los preajustes rellenan los cinco a la vez:

- **Métrico**: metros, kilómetros, Celsius, km/h y milímetros.
- **Imperial (EE. UU.)**: pies, millas, Fahrenheit, mph y pulgadas.
- **Reino Unido (mixto)**: metros, millas, Celsius, mph y milímetros.

Los preajustes son solo un acceso directo: si cambias una unidad individual después, obtendrás una combinación personalizada, y el formulario de Ajustes mostrará qué valores están guardados.

## Lo que se mantiene en sistema métrico

La base de datos siempre guarda las alturas en metros, las distancias en kilómetros, las temperaturas en °C, el viento en km/h y la precipitación en milímetros. La conversión solo se realiza cuando se procesa una página, por lo que cambiar de unidad nunca sobrescribe tu libro de vías, tus objetivos ni tus importaciones.

- La **exportación a CSV** mantiene sus columnas métricas canónicas.
- Los **umbrales de las insignias** (marcas de altura, calor, helada, lluvia, viento, etc.) se definen en el sistema métrico. Solo se convierte la redacción; por ejemplo, **Ola de calor** indica "35 °C o más calor" en métrico y "95 °F o más calor" en Fahrenheit. Las mismas escaladas otorgan las mismas insignias de cualquiera de las dos formas.
- Los **filtros meteorológicos**, como los filtros de calor, helada, lluvia, nieve y viento del libro de vías, mantienen sus umbrales métricos.
- Las **conversiones se redondean** para su visualización, por lo que un valor mostrado en pies, millas o pulgadas es aproximado y no una segunda lectura guardada.

## Anulaciones puntuales

El panel de control acepta `?units=metric`, `?units=imperial` o `?units=uk` para ver una vista previa de un preajuste sin guardarlo. Los parámetros individuales anulan una medición cada vez: `unitHeight`, `unitDistance`, `unitTemp`, `unitWind` y `unitPrecip` (por ejemplo, `?unitTemp=fahrenheit&unitWind=mph`). Estos se aplican solo a esa carga de página y no cambian los Ajustes.

## Dónde aparecen los ajustes

Las selecciones de fecha y unidad se aplican al panel de control, el libro de vías, el calendario de actividad, la carga de entrenamiento, las páginas del tiempo, los sectores, el mapa de escalada, los objetivos, las insignias, los hitos, las tarjetas integradas y la instantánea sin conexión. Los sistemas de graduación son independientes: consulta [Grados](/docs/grades).
