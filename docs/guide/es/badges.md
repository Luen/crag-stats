# Insignias

La mayoría de las insignias celebran hitos de escalada: tu primera sesión o encadene, totales de ascensiones, grados y más. Estas utilizan las fechas de las escaladas correspondientes de tu libro de vías. Por lo tanto, importar una escalada más antigua puede adelantar la fecha de un hito de escalada.

**First Moves** celebra la incorporación de tu libro de vías a Crag Stats. Su fecha es la primera importación o sincronización con éxito que contenga al menos una ascensión, y su recuento se guarda con esa importación. Las sincronizaciones posteriores y la importación de escaladas más antiguas no la modifican. No está vinculada a ninguna escalada individual. Las marcas de tiempo de las importaciones utilizan la zona horaria de visualización del sitio.

Si una base de datos más antigua no tiene guardada ninguna fecha de importación, la siguiente importación no vacía que se complete con éxito la proporcionará. Las fechas guardadas existentes se conservan.

Borrar los datos locales restablece este hito junto con el libro de vías; la siguiente importación no vacía con éxito iniciará uno nuevo.

## Orden

Las insignias conseguidas se ordenan por la escalada con la que se obtuvieron, mostrando primero las más recientes. La tarjeta del panel de control muestra las últimas ocho. Las insignias conseguidas el mismo día mantienen su orden de la galería. First Moves y las estimaciones de ascensiones de la comunidad no están vinculadas a una escalada, por lo que aparecen después de cualquier insignia con fecha de escalada.

## Tipos de encadene contabilizados

El ajuste **Tipos de encadene contabilizados** en Configuración → Visualización y visibilidad determina a cuáles de tus ascensiones registradas hace seguimiento cada insignia. Consulta [Tipos de encadene](/docs/tick-types) para obtener más información sobre este ajuste.

- Los tipos de encadene configurados en **Solo proyectos y objetivos** quedan fuera de las ascensiones principales y de los totales del panel de control, pero siguen otorgando insignias: **Persistence Pays**, las rachas de días consecutivos, **Multipitch Day**, **Travel Week**, los hitos de altura y otras insignias de actividad continúan contabilizándolos. Por lo tanto, los hitos de altura siguen aumentando con los pegues de trabajo, aunque los totales de tus ascensiones se mantengan reducidos.
- Los tipos de encadene configurados en **Ocultar** no otorgan nada: esas ascensiones quedan excluidas tanto de las insignias como de cualquier otra métrica.

La distinción es intencionada. Los totales principales filtran lo que encadenas, mientras que las insignias describen lo que hiciste: un pegue de trabajo sigue siendo un día en la roca y continúa contando para las insignias que lo celebran. Si una insignia que esperas no ha aparecido, comprueba si su tipo de encadene está oculto en lugar de simplemente fuera de los totales.

## Distancia escalada

Las insignias de altura contabilizan la altura total de tus escaladas registradas: 1, 5, 10, 20, 50, 100 y 150 km. Cada una lleva la fecha de la escalada que hace que tu total acumulado supere la marca. **250m Day**, en cambio, suma la altura escalada en un solo día natural.

Los umbrales de las insignias están definidos en el sistema métrico y nunca cambian con el ajuste de unidades de visualización. Solo cambia el texto: con las unidades imperiales seleccionadas, **1 km climbed** se muestra en millas y **250m Day** en pies. Las mismas escaladas otorgan exactamente las mismas insignias en cualquiera de los dos sistemas de unidades. Consulta [Ajustes de visualización](/docs/display-settings).

## Meteorología

**Heat Wave**, **Freeze Frame**, **Rain Check**, **Climbing in the Snow**, **Blown Away**, **Bluebird**, **Sticky**, **Storm Send** y **Four Seasons** necesitan la caché opcional del tiempo en el exterior (`WEATHER_IMPORT`). Consulta [Meteorología](/docs/weather). Hasta que se obtengan los datos de esos días, las insignias permanecerán bloqueadas. **Storm Send** requiere encadenar con éxito en un día de lluvia intensa; los intentos por sí solos no cuentan.

## Casi lo tienes

En la página completa **[Insignias](/badges)**, **Casi lo tienes** muestra hasta tres insignias bloqueadas que están más cerca de completarse. Solo califican los umbrales **contabilizables** (totales de ascensiones, altura, encadenes por rango de grado, recuentos de FA/FFA, vías equipadas y similares). Las insignias de evento único, como días festivos, días meteorológicos o First Moves, quedan excluidas. El progreso se clasifica según el porcentaje del objetivo (limitado por debajo del 100 % hasta que se obtiene) y, en caso de empate en los porcentajes, por los objetivos más pequeños. La tarjeta de insignias del panel de control sigue mostrando únicamente las insignias conseguidas recientemente.

## Compañeros, varios largos y viajes

Estas cuatro insignias utilizan campos que ya están en tu libro de vías y llevan la fecha de la escalada que las completa:

| Insignia             | Regla                                                                                                                                                                                                                                                                                                             |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Crowded Belay**    | Una ascensión incluye 3 o más compañeros diferentes (los nombres se comparan sin distinguir mayúsculas y minúsculas).                                                                                                                                                                                             |
| **Multipitch Day**   | Encadenas 3 o más largos en un solo día natural: los rangos y listas de largos se amplían y se eliminan duplicados por vía/día. Los registros de vías completas y de largos individuales no se cuentan por duplicado. Cuando existen registros de largos de la API en caché, solo cuentan los largos encadenados. |
| **Travel Week**      | Registras escaladas en 4 zonas de escalada distintas al aire libre en un periodo de 7 días consecutivos. Los rocódromos y las zonas desconocidas no cuentan.                                                                                                                                                      |
| **Persistence Pays** | Encadenas una vía por primera vez tras haberla registrado en 4 o más días diferentes (intentos incluidos). Repetir una vía que ya has encadenado no cuenta.                                                                                                                                                       |

Son insignias de evento único, por lo que no aparecen en **Casi lo tienes**.

## Repeticiones y vías nuevas

Estas insignias comparten las reglas de la tarjeta [Repeticiones vs vías nuevas](/docs/repeats). Las vías se identifican mediante su ID de vía de theCrag, los intentos cuentan y cada insignia lleva la fecha de la escalada que la completa.

| Insignia               | Regla                                                                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Explorer**           | Ascensiones registradas en 50 vías diferentes.                                                                                                                |
| **Wanderer**           | Ascensiones registradas en 100 vías diferentes.                                                                                                               |
| **Route Collector**    | Ascensiones registradas en 250 vías diferentes.                                                                                                               |
| **Guidebook Explorer** | Ascensiones registradas en 500 vías diferentes.                                                                                                               |
| **Old Faithful**       | Una vía escalada en 10 días diferentes. Varias ascensiones en un mismo día cuentan como una sola.                                                             |
| **Home Turf**          | 25 ascensiones repetidas (cualquier día posterior al primer día registrado de la vía) en vías de una misma zona de escalada. Las primeras visitas no cuentan. |

Las seis son contabilizables, por lo que pueden aparecer en **Casi lo tienes**.

## Summer Sun Face

Registra una escalada al aire libre en una vía orientada hacia el ecuador durante el verano meteorológico local: N/NE/NO de diciembre a febrero en el hemisferio sur, o S/SE/SO de junio a agosto en el hemisferio norte. Esta versión conservadora cubre latitudes absolutas desde los 25° hasta los 60° (sin incluir este último). Los intentos cuentan como escaladas registradas, al igual que ocurre con las insignias de días meteorológicos. La insignia se desbloquea una sola vez en el primer día apto y no tiene contador de Casi lo tienes.

Se utilizan primero las etiquetas de sol/orientación propias de la vía. Cuando no tiene etiquetas de exposición propias, se pueden aplicar las etiquetas heredadas de su **elemento primario inmediato** (por ejemplo, su sector, pared o bloque). El ID de origen de la etiqueta en caché debe coincidir exactamente con ese elemento primario. Las etiquetas procedentes de ancestros superiores, fuentes desconocidas y áreas geográficas amplias nunca se aplican. Las etiquetas de exposición propias de la vía tienen prioridad aunque el elemento primario indique algo diferente; las orientaciones de vía desconocidas o en conflicto no activan el recurso al elemento primario.

En el nivel elegido, **All day sun** puede calificar sin necesidad de una dirección de orientación. **Always shady** impide la concesión de la insignia. De lo contrario, la orientación debe mirar al ecuador como se describe anteriormente; las etiquetas de sol solo de mañana/mediodía/tarde no califican por sí solas. No es obligatorio que coincidan simultáneamente las etiquetas de sol y de orientación.

Las escaladas en rocódromo, las fechas no válidas, las ubicaciones tropicales o de latitudes altas, los puntos heredados de precisión desconocida y las aproximaciones por localidades cercanas no califican. Las actualizaciones de datos en caché recuperan la procedencia de la vía, del elemento primario o de ancestros superiores sin necesidad de realizar otra sincronización o solicitud externa.

Esto registra la exposición descrita por el proveedor junto con una heurística estacional. No determina la hora a la que escalaste, la radiación solar real, la sombra de los desplomes o la temperatura de la roca, y no requiere la caché de Open-Meteo. La insignia independiente de calor describe la temperatura máxima del aire guardada en caché. Los accesorios de etiquetas reales minimizadas de la API y su procedencia están documentados en el repositorio.

## Greenpoint

**Greenpoint** es una insignia de evento único por escalar de primero una vía deportiva equipada con paraboles usando tus propios seguros flotantes. Se desbloquea la primera vez que se cumpla cualquiera de estas condiciones:

- registres en theCrag un encadene de **Green point**, **Green point onsight** o **Green point flash** que cuente como encadenado, o
- encadenes una vía catalogada como **Sport** teniendo tu ascensión registrada como **Trad**, utilizando un encadene limpio de primero (onsight, flash, red point, pink point, ground-up red point o Lead).

Las entradas genéricas de Tick/Send/Clean, los intentos, las ascensiones en polea y las ascensiones de segundo no cuentan para la segunda opción, porque no demuestran que hayas escalado de primero con protección móvil. Al igual que las insignias anteriores, no aparece en **Casi lo tienes**. Consulta los [tipos de encadene](https://www.thecrag.com/en/article/ticktypes) de theCrag para ver cómo se definen los registros de Green point.

## Primeras ascensiones en solo autoasegurado

**First Lead Rope Solo** se desbloquea con tu primera ascensión con éxito registrada explícitamente como Lead solo. **First Top-Rope Solo** se desbloquea por separado con tu primera ascensión con éxito de Roped Solo / Top rope solo. Cada una enlaza con la primera ascensión que cumple los requisitos, usando el ID de ascensión para desempatar entre las del mismo día, y ninguna aparece en Casi lo tienes.

La clasificación coincide con la tarjeta de Escalada en solo. La [API del proveedor](https://www.thecrag.com/en/article/api) documenta `leadsolo` y `ropedsolo`; las etiquetas de visualización y sus variantes de mayúsculas, espacios o separadores se reconocen sin modificar el texto original del encadene. Una actualización de datos en caché repara las banderas de finalización antiguas solo cuando los datos almacenados del proveedor confirmen el mismo método explícito en solo. La modalidad de la vía y el estilo de ascensión se mantienen independientes.

Los intentos, las ascensiones con reposos en la cuerda, las retiradas, los solos integrales, el psicobloc, los solos en artificial, las ascensiones normales en polea y los registros cuyo resultado se desconoce no cumplen los requisitos. Una ascensión registrada explícitamente como Bloque o Segundo también contradice ambos métodos de solo autoasegurado y no podrá desbloquear estas insignias. La simple ausencia de compañeros registrados no acredita una escalada en solo. Estos hitos se aplican a escaladas en rocódromo y al aire libre, y no requieren coordenadas ni importación de datos meteorológicos.

## Rachas de días consecutivos

**7-Day Streak**, **10-Day Streak** y **30-Day Streak** celebran el registro de al
menos una escalada en cada día natural consecutivo. Los intentos cuentan, y tanto las escaladas en rocódromo
como al aire libre cuentan, coincidiendo con la tarjeta de Rachas. Varias ascensiones en un mismo
día cuentan como una sola; las fechas no válidas o ausentes no determinan un día. Las fechas de escalada,
y no las horas de registro, determinan la racha sin cambiar sus fechas escritas
entre zonas horarias.

Cada insignia lleva la fecha del primer día en que se alcanzó su umbral. Tomarse un descanso
no borra un hito de tu historial registrado. Son premios de evento único
y no aparecen en Casi lo tienes.

## Con quién escalaste

Las insignias conseguidas asociadas a una escalada válida muestran los compañeros registrados en ella. «Compañeros en esta ascensión» se refiere únicamente a la escalada vinculada, incluidas las insignias obtenidas a lo largo de varios largos, días o vías. No se trata de una lista de todas las personas que contribuyeron al logro completo. La falta de nombres no implica que haya sido una ascensión en solo.
