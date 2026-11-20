# Meteorología

Crag Stats puede almacenar en caché la **meteorología diaria en exterior** para las escaladas que tengan coordenadas de vía y usarla luego para insignias, tarjetas del panel principal y del libro de vías, y para comparar cómo te fue escalando según el tiempo.

## Activación voluntaria

Desactivado de forma predeterminada. El propietario del servidor configura `WEATHER_IMPORT=true` en `.env` y reinicia. Después de cada sincronización correcta del libro de vías, en la programación de importación en segundo plano (`IMPORT_CRON`, diaria por defecto, que también cubre los libros de vías que llegan por CSV) y desde **Ajustes → Importar meteorología**, Crag Stats obtiene hasta **50** días en exterior faltantes por ejecución desde la API de meteorología histórica de [Open-Meteo](https://open-meteo.com/), empezando por los días de escalada más antiguos y dejando al menos **1,1 segundos** entre solicitudes. La acción de Ajustes inicia esa ejecución en segundo plano para que la página no tenga que esperar a que termine todo el lote. Borrar vacía la caché.

El plan gratuito no comercial de Open-Meteo está pensado para instalaciones personales autoalojadas. No actives esta función en un servicio comercial multiinquilino sin revisar antes sus condiciones y opciones de pago.

## Qué se obtiene

- **Solo exterior** — se omiten las vías probablemente de interior o rocódromo (con la misma heurística que en los objetivos).
- **Coordenadas obligatorias** — la vía debe tener latitud y longitud (procedentes de la sincronización con theCrag o de la importación de datos de vías en libros de vías en CSV).
- **Días pasados** — se omite la fecha UTC de hoy, ya que el archivo suele estar incompleto para el día en curso.
- **Clave de caché compartida** — la latitud y la longitud se redondean a **un decimal**, por lo que las vías cercanas de una misma zona comparten una fila de día.

Campos almacenados: temperatura máxima y mínima diaria (°C), precipitación (mm), código meteorológico WMO, humedad media y viento máximo/medio a 10 m (km/h). En **Ajustes → Visualización y visibilidad** puedes elegir las unidades de visualización para temperatura (°C o °F), viento (km/h o mph) y precipitación (mm o in).

## Insignias

Una vez almacenado un día en caché, estas insignias se pueden desbloquear con cualquier ascensión registrada **en exterior** ese día en esa ubicación (los intentos también cuentan; las filas de interior o rocódromo se omiten aunque compartan lat/lon en caché):

| Insignia                     | Regla                                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| **Ola de calor**             | Máxima del día ≥ 35 °C                                                                           |
| **Helada**                   | Mínima del día ≤ 0 °C                                                                            |
| **Pasado por agua**          | ≥ 1 mm de precipitación y no clasificado como nieve                                              |
| **Escalada en la nieve**     | Códigos WMO de nieve (71–77, 85–86), o ≥ 1 mm de precipitación con máxima ≤ 1 °C                 |
| **Arrastrado por el viento** | Viento máximo diario a 10 m ≥ 50 km/h                                                            |
| **Cielo azul**               | Máxima de 15–25 °C, precipitación medida < 0,1 mm, sin código WMO de nieve ni tormenta eléctrica |
| **Pegajoso**                 | Humedad media ≥ 85 %                                                                             |
| **Encadene en la tormenta**  | Un **encadene** en un día con ≥ 10 mm de precipitación que no sea nieve                          |
| **Cuatro estaciones**        | Consigue Ola de calor, Helada, Pasado por agua y Escalada en la nieve al menos una vez           |

Sin `WEATHER_IMPORT` (o antes de que se obtenga el historial pendiente), estas insignias permanecen bloqueadas aunque hayas escalado en esas condiciones. La racha de calor intenso («scorcher streak», muchos días de calor en una semana) queda pospuesta.

## Página de detalles de meteorología

Abre [Meteorología](/weather) desde la barra lateral de analíticas o desde el título de cualquiera de las dos tarjetas meteorológicas del panel principal. El panel principal mantiene un resumen compacto de condiciones y de máxima diaria/tasa de encadene cuando existe una señal clara. Cuando no hay una señal clara, rendimiento conserva sus bandas detalladas y controles; la página de detalles siempre ofrece la vista completa. La visibilidad y las posiciones guardadas de las tarjetas del panel principal siguen aplicándose.

En la página de detalles, la agrupación y la métrica de rendimiento se guardan en la URL (`group=temperature|conditions`, `measure=sendRate|nearLimit|onsightFlash`), para que puedas guardar una vista en marcadores y usar Atrás/Adelante. Los patrones meteorológicos describen correlaciones, no recomendaciones ni causas.

**Cobertura y calidad de ubicación** separa los días-ubicación en caché utilizables, los días comprobados sin meteorología disponible y los días aún sin comprobar (incluidos hoy y las fechas futuras). Las ascensiones en exterior con fechas válidas pero sin una ubicación resuelta se cuentan aparte: no se pueden asignar a un día-ubicación y quedan excluidas de ese denominador. Las condiciones cuentan todos los registros en exterior; el rendimiento cuenta solo encadenes e intentos. Los controles de importación y ubicación siguen en Ajustes, enlazados desde Meteorología para el propietario que ha iniciado sesión.

Si no hay meteorología en exterior en caché, la página explica cómo funciona la importación. Las cachés con pocos datos siguen mostrando las condiciones mientras rendimiento espera a alcanzar su muestra mínima actual. Consultar Meteorología nunca solicita datos al proveedor.

## Condiciones meteorológicas

La tarjeta **Condiciones meteorológicas** del panel principal aparece en cuanto al menos un día de escalada en exterior tiene una fila meteorológica en caché; sin `WEATHER_IMPORT` (o antes de que termine la primera obtención) permanece oculta. Se puede mostrar, ocultar o mover desde Ajustes → Panel principal como cualquier otra tarjeta.

- Los **días** son _días-ubicación_: un día natural en una ubicación en caché (latitud/longitud redondeadas a un decimal). Un día repartido entre dos zonas cuenta dos veces; las vías de rocódromo u otras probablemente de interior nunca cuentan.
- La **cobertura** compara los días que tienen una fila meteorológica en caché con todos los días en exterior que tienen coordenadas de vía. Los días sin una fila en caché utilizable (incluidos los días sin comprobar y los comprobados sin disponibilidad) figuran como «sin meteorología utilizable» y quedan fuera del resto de cifras de la vista de condiciones.
- **Escalada más calurosa / más fría** usa la temperatura máxima y mínima del día. El enlace lleva a la primera ascensión registrada ese día en theCrag.
- **Proporción de días** muestra los días perfectos, lluviosos, nevados, helados y calurosos como proporción de los días con meteorología en caché, usando las mismas reglas que las insignias anteriores (lluvia ≥ 1 mm y sin nieve, códigos de nieve, mínima ≤ 0 °C, máxima ≥ 35 °C). Un día puede aparecer en más de una fila, por ejemplo un día helado y con nieve.
- Un día **Perfecto** es un día de buen tiempo (máxima de 15–25 °C, seco, sin nieve ni tormenta eléctrica) que además es tranquilo (viento máximo inferior a 25 km/h), no húmedo (humedad media inferior al 85 %) y sin heladas durante la noche. Si falta el viento, la humedad o la mínima de un día, no se cuenta como perfecto.
- **Máxima diaria** es un pequeño histograma de la temperatura máxima de cada día en intervalos de 5 °C, etiquetado con la unidad de temperatura que hayas elegido. Los rangos incluyen el límite inferior y excluyen el superior (por ejemplo, 0–<5 °C o 32–<41 °F).

Estos son valores de modelo para la celda de cuadrícula más cercana, no valores climáticos oficiales ni mediciones a pie de vía.

## Meteorología y rendimiento

Una vez que **20 o más** días-ubicación en exterior tienen meteorología en caché, la vista de detalle **Meteorología y rendimiento** compara cómo te fue escalando en roca según el tiempo. Antes de alcanzar esa cifra muestra cuántos días-ubicación válidos hay en caché hasta el momento. El resumen del panel principal permanece oculto mientras no haya meteorología en caché y se puede mover u ocultar desde Ajustes → Panel principal; la página de detalles sigue accesible con una explicación de estado vacío.

**Qué se cuenta.** Encadenes e intentos en exterior (la misma clasificación de registros que en el resto de la aplicación) cuyo día-ubicación tenga meteorología en caché. Se excluyen las vías de rocódromo, los registros que no son ni encadene ni intento y las ascensiones sin ubicación meteorológica. Se incluyen las ascensiones cuya meteorología procede de una localidad cercana aproximada o de un polígono de área, y la vista indica cuántas son.

El resumen compacto del panel principal muestra la relación máxima diaria/tasa de encadene. Su vista alternativa cuando no hay señal y la página de detalles ofrecen los dos controles siguientes.

**Agrupar por:**

- **Máxima diaria:** menos de 10°, 10–17°, 18–24°, 25–29° y 30°+. Cada banda incluye su límite inferior y termina justo por debajo de la siguiente, igual que el rango de temperatura del libro de vías.
- **Condiciones:** Buen tiempo, Seco (precipitación medida inferior a 1 mm y sin nieve; si falta el dato de lluvia se considera desconocido, no seco), Lluvioso, Nevado, Caluroso, Helado, En calma (viento máximo inferior a 25 km/h) y Ventoso (≥ 50 km/h), usando las reglas de insignias y del libro de vías indicadas arriba. Un mismo día puede estar en varias condiciones. Un viento medido desde 25 hasta menos de 50 km/h no es ni En calma ni Ventoso.

**Métricas:**

- **Tasa de encadene:** encadenes como proporción de encadenes e intentos.
- **Cerca del límite:** la proporción de encadenes graduados dentro de un margen de 2 grados (1 grado V en la escala V) respecto a tu encadene en exterior más duro del **mismo estilo y escala de grados** en los 365 días anteriores a ese día. La escalada clásica se compara con clásica y la deportiva con deportiva, y los grados de la escala V y los de vías nunca se mezclan. Usar tu mejor marca reciente en lugar de tu mejor marca histórica evita que progresar con los años haga que la meteorología reciente parezca mejor. Los encadenes sin ningún encadene previo del mismo estilo en ese año y los encadenes sin grado quedan fuera de esta métrica.
- **A vista/flash:** encadenes a vista y al flash como proporción del total de encadenes.

**Cómo interpretarlo con rigor.**

- Cada barra muestra la tasa de esa banda; la línea marca tu tasa global. Una banda necesita al menos **10** ascensiones (para el denominador de esa métrica) repartidas en al menos **3** días antes de mostrar una tasa. Las bandas más pequeñas muestran «Sin datos suficientes».
- Una banda se marca como **Mayor** o **Menor** solo cuando difiere de todos tus _demás_ días meteorológicos más de lo que explica la variación diaria (una prueba bilateral en torno al 95 %), con al menos 5 días a cada lado. Las ascensiones del mismo día comparten el mismo tiempo y normalmente la misma zona y compañero, así que la prueba trata cada día-ubicación como una unidad en lugar de cada ascensión. Un gran día de escalada no puede crear un patrón por sí solo.
- El resumen de una línea nombra la banda que más destaca para la métrica seleccionada, o indica que aún no destaca nada.
- Esto es una **correlación, no una causa**. La temporada, la zona, los compañeros y en qué punto de un proyecto te encuentres cambian junto con el tiempo. Con muchas bandas y métricas, puede aparecer algún «Mayor» o «Menor» ocasional por puro azar.

Cada banda de máxima diaria y las condiciones de buen tiempo, lluvia, nieve, calor, helada, calma y viento enlazan al libro de vías filtrado por esas ascensiones. Seco no tiene filtro en el libro de vías. Una tabla de valores debajo de las barras de la página de detalles enumera cada banda con los recuentos de las tres métricas. Consultar la tarjeta nunca dispara una solicitud meteorológica y nunca se utilizan las notas privadas.

Cuando la comparación de máxima diaria/tasa de encadene del panel principal no tiene una señal clara, la tarjeta Meteorología y rendimiento mantiene sus bandas detalladas, los controles locales de agrupación/métrica y la tabla de valores. Estos controles dejan la URL del panel principal sin cambios. Cuando hay una señal clara se mantiene el resumen compacto; ambas versiones enlazan a la página de meteorología. Los umbrales de muestra mínima no cambian.

## Filtros y etiquetas del libro de vías

Las referencias cerca del límite usan el mismo cálculo de estilo y escala de grados que
[Roca y rendimiento](/docs/rock-types), utilizando los grados de los largos escalados cuando están disponibles.
La referencia meteorológica incluye encadenes en exterior sin meteorología en caché, incluye
el día 365 anterior y excluye los encadenes del día que se está comparando.

Cuando hay algún dato meteorológico en caché, el libro de vías añade un filtro **Meteorología del día** (`?weather=`): `fair`, `perfect`, `heat`, `freeze`, `rain`, `snow`, `wind` o `calm`. **Día ventoso** coincide con viento máximo diario a 10 m **≥ 50 km/h**, el mismo umbral que **Arrastrado por el viento**. **Día en calma / sin viento** coincide con viento máximo medido **inferior a 25 km/h**, el umbral de calma usado por **Día perfecto**, sin exigir temperaturas agradables, tiempo seco ni baja humedad. Si faltan lecturas de viento no coincide con ninguna opción; los días desde 25 hasta menos de 50 km/h no coinciden con ningún filtro de viento. Las demás opciones usan las mismas reglas que las insignias. Solo coincide con ascensiones **en exterior** con coordenadas de vía y un día en caché para esa ubicación; las vías de rocódromo, las ascensiones sin coordenadas y los días no obtenidos nunca coinciden.

Las filas de los días en caché también muestran pequeñas etiquetas de texto (por ejemplo «Calor 36 °C», «Helada -2 °C», «Lluvia 4 mm», «Nieve», «Viento 55 km/h», «Buen tiempo 21 °C»). Los días normales no muestran nada.

El propietario que ha iniciado sesión también dispone de **Sin meteorología en caché** (`?missing=weather`), que lista las ascensiones en exterior con coordenadas y una fecha pasada que aún no tienen meteorología en caché, para que puedas ver qué obtendrán las próximas importaciones. Los visitantes nunca ven esta opción.

La lista pendiente de meteorología excluye los días que el proveedor ya comprobó pero no pudo suministrar. Estas entradas de caché negativas no generan etiquetas meteorológicas y no se vuelven a poner en cola automáticamente. Las fechas de calendario no válidas se excluyen tanto del importador como de la lista pendiente.

## Actividades recientes

La tarjeta **Actividades recientes** del panel principal muestra las mismas etiquetas de texto bajo una escalada en exterior cuando su día está en caché. Se leen como una lista corta etiquetada como «Meteorología del día», nunca solo por color, y la franja se omite en vías de rocódromo, días sin caché y tiempo normal.

## Historia de escalada

Los porcentajes de la historia describen días-ubicación en exterior en caché, no días cuya meteorología sigue siendo desconocida.

Cuando la caché cubre al menos 20 días en exterior y la mitad o más de tus días en exterior, la [Historia de escalada](/docs/climbing-story) puede añadir una línea corta sobre las condiciones en las que escalas (nieve, frío, calor, lluvia o una gran amplitud térmica). Describe en qué condiciones sí escalas, nunca lo que evitas, y se mantiene fuera de la historia cuando la cobertura es escasa.

## Calendario de ascensiones

El [Calendario de ascensiones](/docs/ascent-calendar) tiene un modo de color **Meteorología** (solo se muestra cuando hay meteorología en caché). Comparte las reglas de las insignias; consulta esa página para ver la leyenda de colores.

## Sectores: clima en tus visitas

En la página **Sectores**, una zona con al menos **5** días de visita en exterior en caché muestra un resumen de una línea: media de máxima y mínima diaria, y la proporción de esos días con lluvia, nieve, helada o calor (nieve, helada y calor solo cuando superan el 0 %). Describe los días que realmente escalaste allí, por lo que tiende hacia las estaciones en las que visitas el lugar. **No** son valores climáticos oficiales ni un pronóstico, y permanece oculto para zonas por debajo del umbral, para vías de rocódromo y cuando no hay meteorología en caché.

## Tasa de buen tiempo

Cuando **20 o más** días en exterior tienen meteorología en caché, la tarjeta Condiciones meteorológicas añade una **Tasa de buen tiempo**: la proporción de esos días que fueron de _buen tiempo_ (máxima de 15–25 °C, seco, sin nieve ni tormenta eléctrica — la misma regla que **Cielo azul**). También informa de la proporción de días _duros_ (caluroso, helado, lluvioso, nevado o con mucho viento). Los días intermedios, como un día seco a 29 °C, no cuentan en ninguno de los dos grupos.

La etiqueta es descriptiva, no una nota: **Preferencia por el buen tiempo** con un 60 % o más de días de buen tiempo, **Escalador todoterreno** con un 50 % o más de días duros y, en caso contrario, **Un poco de todo**. Los grupos pueden solaparse: un día templado y seco puede seguir siendo muy ventoso o helar por la noche. Cuando se cumplen ambos umbrales de etiqueta, **Escalador todoterreno** tiene prioridad. Por debajo de 20 días no se muestra nada, de modo que una caché con pocos datos nunca te etiqueta. El enlace abre el libro de vías filtrado por días de buen tiempo.
Para ver recomendaciones estacionales a partir de los metadatos de las vías, consulta [Mejores meses](/docs/best-months); esas recomendaciones son independientes de la meteorología registrada en tus visitas.

Las etiquetas de buen tiempo utilizan los recuentos exactos de días para sus umbrales; las tasas mostradas se redondean a un decimal. El redondeo en pantalla por sí solo nunca cambia tu etiqueta.

### De los detalles meteorológicos a tu libro de vías

Cada fila de condición y cada barra de máxima diaria en la vista de detalles **Condiciones meteorológicas** abre el libro de vías filtrado por esos días. Una barra de temperatura incluye su límite inferior y termina justo por debajo de la siguiente barra (por ejemplo, 20–24° abarca desde 20,0 °C hasta, sin incluirlo, 25 °C). El rango se mantiene aplicado mientras ordenas, paginas o añades otros filtros; usa **Limpiar rango meteorológico** para quitar solo ese rango.

La tarjeta cuenta _días_ en exterior en cada ubicación, mientras que el libro de vías enumera cada _ascensión_ coincidente, por lo que ambos números pueden diferir. En pantallas anchas, el libro de vías muestra una columna Meteorología con la máxima, mínima y lluvia en caché; en pantallas más pequeñas, las etiquetas de condición aparecen junto a la vía. Las ascensiones en interior o sin caché muestran un guion. Consultar estas páginas nunca dispara una solicitud meteorológica.

## Ubicaciones meteorológicas cuando faltan las coordenadas de la vía

Las exportaciones CSV no incluyen coordenadas. Con la importación meteorológica y la importación de datos de vías activadas (`WEATHER_IMPORT=true` y `ROUTE_DATA_IMPORT=true`), la clave de API de colaborador configurada también puede buscar ubicaciones para los ID de zona/sector encontrados en los datos de vías en caché. Esto no importa el libro de vías ni el perfil del propietario de esa clave. Se admiten tanto los ancestros del libro de vías obtenido con clave como las matrices de ancestros de la API de vías.

Las búsquedas de áreas comparten el presupuesto de diez solicitudes y el ritmo de un segundo de la importación de vías. Las comprobaciones de vías usan el presupuesto primero; las solicitudes restantes comprueban hasta diez áreas cada una. Ajustes muestra **áreas meteorológicas pendientes** y ofrece **Comprobar ubicaciones meteorológicas ahora** cuando todas las vías están comprobadas. Las instalaciones existentes con CSV pueden completar las ubicaciones de área faltantes sin usar **Actualizar todas las vías**. La siguiente ejecución de importación también comprueba la lista pendiente. Una vez finalizadas las comprobaciones de ubicación, se inicia un lote meteorológico en segundo plano si existen días válidos.

Las respuestas de área (incluidas las ubicaciones faltantes) se almacenan en caché una vez por ID de área del proveedor. `ROUTE_DATA_REFRESH_DAYS` también controla su antigüedad de actualización opcional, y **Actualizar todas las vías** vuelve a hacer elegibles las búsquedas de área. Los fallos de acceso detienen la importación y usan su espera progresiva habitual; una clave que puede leer el historial de vías no garantiza el acceso a las ubicaciones de área. Si la API no suministra ninguna ubicación compatible, utiliza la alternativa explícita de localidad cercana que se indica abajo. No se realiza ninguna llamada a la API mientras se consultan las páginas de meteorología.

Meteorología prefiere un punto explícito de la vía, luego el punto de su zona de primer nivel (TLC) y después el punto de su sector inmediato a partir de los datos en caché del proveedor. Ignora la geometría exclusiva de país y la de ancestros arbitrarios. Los puntos en caché más antiguos sin geometría original del proveedor siguen siendo utilizables y se etiquetan como «Punto en caché»; no se puede recuperar su precisión original solo a partir de ese punto. Las vías de interior siguen excluidas.

Ajustes → Importar meteorología → **Revisar ubicaciones meteorológicas** enumera las áreas en exterior y el recuento de vías sin resolver. Para una ubicación faltante, busca una localidad cercana usando su nombre o región y un código de país de dos letras, y luego elige explícitamente el resultado correcto. La búsqueda envía únicamente ese texto introducido y el código de país a la [geocodificación de Open-Meteo](https://open-meteo.com/en/docs/geocoding-api), cuyos datos de ubicación proceden de GeoNames. No envía vías, fechas de ascensión, notas privadas ni claves de API. Las búsquedas solo se realizan tras enviar el formulario, se almacenan en caché durante 30 días, tienen ritmo regulado y aplican espera progresiva ante errores.

Una localidad elegida es una **alternativa aproximada de localidad cercana**, compartida únicamente por el mismo ID de área del proveedor (o la identidad de la vía si no existe un ID de área). No sobrescribe las coordenadas de la vía, no altera los mapas de vías ni pretende ser la población más cercana. Un punto válido de vía, sector o zona siempre tiene prioridad. La meteorología de una localidad puede diferir de la de una pared por la distancia, la altitud y el terreno, por lo que los datos basados en localidades aparecen en las vistas y filtros meteorológicos pero **no desbloquean insignias meteorológicas**. Puedes eliminar la alternativa en cualquier momento.

El libro de vías y la actividad reciente muestran el origen de la ubicación meteorológica. El importador, la lista pendiente, el calendario, la tarjeta de condiciones, los resúmenes de visitas a zonas y el libro de vías utilizan la misma clave resuelta de ubicación/día. Cambiar o eliminar una alternativa deja de usar inmediatamente su clave anterior; la meteorología antigua sigue en caché y puede seguir siendo utilizada por otras escaladas en esa ubicación. Obtén el siguiente lote meteorológico para rellenar una ubicación recién elegida. Borrar limpia las resoluciones, elecciones de lugares y resultados de búsqueda, y cancela las búsquedas en curso.

Cuando faltan esos puntos, la geometría GeoJSON Polygon/MultiPolygon tipada explícitamente en una zona o sector identificado puede aportar directamente su primera coordenada del contorno exterior; no se calcula ningún centro ni centroide. Esto está etiquetado como **Polígono de área aproximada** y no desbloquea insignias meteorológicas ni de Cara al Sol de Verano. Los puntos de vía y escuela siempre tienen prioridad. Se excluyen los límites de país/región, las formas mal compuestas, las áreas grandes (más allá de una diagonal delimitadora conservadora de 15 km) y las formas que cruzan la línea internacional de cambio de fecha. Los arrays de límites sin tipo y los formatos Fence no documentados siguen sin ser compatibles; aún no hay disponible ningún fixture de polígono de proveedor capturado. La localidad seleccionada solo se utiliza si estas alternativas de geometría también fallan. La importación del tiempo todavía debe estar habilitada para obtener los días que faltan. Cara al Sol de Verano utiliza evidencias de etiquetas de vías verificadas por separado; consulta [Insignias](/docs/badges).
