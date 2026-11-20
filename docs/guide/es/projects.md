# Proyectos

Crag Stats muestra las vías en exterior como **proyectos abiertos** tras registrar intentos sin encadenar en **al menos dos días de escalada distintos** en el libro de vías. Varios intentos en un solo día no crean un proyecto abierto. Los proyectos abiertos desaparecen tras un año sin actividad.

Un **proyecto completado** es una vía encadenada tras trabajarla en al menos dos días, o después de **al menos dos intentos fallidos en el día del encadene** (tres o más intentos contando el encadene). Los intentos pueden ser entradas independientes en el registro o figurar en el recuento de intentos del encadene. Las entradas independientes y el recuento del encadene no se suman entre sí, para evitar contar dos veces los mismos intentos. Los encadenes al primer intento y un intento fallido seguido de un encadene en el mismo día no se consideran proyectos. Solo cuenta el trabajo previo al primer encadene; las repeticiones posteriores no convierten un encadene anterior en un proyecto. Las fechas ausentes o no válidas no cuentan como sesiones. Los proyectos completados aparecen en la sección **Encadenes recientes** durante los últimos seis meses naturales.

Cuando tanto un intento como el primer encadene incluyen marca de tiempo, los intentos posteriores a ese encadene se excluyen de la clasificación. Las entradas que solo tienen fecha en el día del encadene se tratan como trabajo previo a este, ya que se desconoce su orden dentro del mismo día. Cuando hay varios encadenes en la misma fecha sin horas utilizables, se usa el orden de ascensión guardado, de modo que una repetición posterior no sustituye al primer encadene registrado. Los totales de sesiones en las tarjetas y en el panel principal utilizan los mismos días naturales válidos que el clasificador.

**Encadenes recientes** abarca los últimos seis meses naturales en UTC, incluido el día límite para los encadenes que solo tienen fecha. A fin de mes, el límite se ajusta al último día válido (el 31 de octubre retrocede hasta el 30 de abril). Se excluyen las fechas futuras. Los encadenes con marca de tiempo conservan el reloj de referencia en el límite. El panel principal usa la misma ventana temporal al rellenar los huecos libres de proyectos con encadenes recientes.

## Elegir tus propios proyectos

El propietario ve selectores compactos de proyecto junto a los controles de FA/FFA en el libro de vías y en las tarjetas o detalles del proyecto:

- **Marcar como proyecto** selecciona una vía en exterior registrada incluso tras una sola sesión o un año sin actividad.
- **No es un proyecto** / **Desmarcar proyecto** la descarta de Proyectos, del panel principal y del recuento de proyectos activos hasta que el propietario la vuelva a marcar o restaure la detección automática.
- **Usar automático** elimina la elección manual y restablece las reglas anteriores.

Cada selector se guarda directamente. Los selectores del libro de vías te mantienen en la misma página filtrada; los de las tarjetas o detalles del proyecto vuelven a la lista de proyectos. La etiqueta Proyecto / No es un proyecto muestra una elección manual sin depender del color.

Las selecciones son metadatos locales y se conservan tras sincronizaciones, reconstrucciones de caché e incluso si una vía se elimina en origen y vuelve a aparecer más adelante. No modifican el libro de vías de theCrag ni su indicador público de Proyecto. Solo un encadene real registrado marca como encadenado un proyecto seleccionado. Los encadenes seleccionados fuera de la ventana de seis meses aparecen en **Encadenes seleccionados anteriores** en lugar de Encadenes recientes. Ajustes → Borrar datos elimina las selecciones. Los visitantes pueden ver los proyectos resultantes, pero no pueden cambiar las elecciones. Las vías de interior y las vías sin registrar no se pueden incluir manualmente.

## Detalles del proyecto, progresión y estimaciones

Haz clic en el nombre de un proyecto en la página Proyectos o en el panel principal para abrir su página de detalle. Muestra la vía, extractos públicos de la guía cuando están en caché, la progresión de sesiones por fecha e intentos/encadenes anteriores (incluidas las etiquetas de los largos escalados). El enlace inferior abre todas las entradas del libro de vías para esa vía exacta, incluidas las repeticiones anteriores. Las notas privadas de ascensión permanecen en el libro de vías bajo el ajuste de visibilidad exclusivo para el propietario.

La barra de **preparación aproximada** sigue el enfoque de preparación de objetivos: mide la evidencia de respaldo, no el porcentaje de un grado ni la probabilidad de encadenar. Solo un encadene registrado en esta vía completa la barra. Otra vía del mismo grado no puede hacerlo. Las sesiones anteriores utilizan únicamente la evidencia disponible hasta ese día de escalada, por lo que un encadene posterior no reescribe su nivel de preparación.

Para cada día de referencia, el modelo usa los 365 días anteriores (incluido ese día) de encadenes en exterior en la misma disciplina y escala de grados, utilizando los grados efectivos escalados. Los recuentos de la pirámide de respaldo utilizan vías distintas; las repeticiones no vuelven a llenar la pirámide. La vía objetivo se excluye de la evidencia de respaldo.

- Mejor encadene reciente igual o superior al objetivo: 60 puntos; un nivel por debajo: 35; dos niveles por debajo: 10; en caso contrario, cero.
- Dos vías distintas un nivel por debajo suman hasta 20 puntos, y cuatro dos niveles por debajo suman hasta 25 puntos.
- Los intentos fallidos en el objetivo suman hasta 15 puntos, frente a una referencia orientativa de 15, 35 o 75 intentos. El horizonte es **A corto plazo** cuando la diferencia respecto a tu mejor marca reciente es de como máximo un nivel, **Medio** para dos y, en caso contrario, **A largo plazo** (también cuando no se conoce ningún encadene reciente).
- El modelo base tiene un límite del 94 %, y luego suma un punto por cada día de escalada válido adicional en esta vía (el primer día establece la base), hasta el 99 % mientras este proyecto no tenga un encadene registrado. Los grados desconocidos no tienen estimación. Se admiten grados cero y negativos de la escala V y nunca se mezclan con grados de vías.

La práctica puede hacer subir esta barra sin demostrar que un paso concreto esté resuelto. Los grados y el esfuerzo registrado no pueden revelar la beta, las condiciones, las lesiones ni la confianza, por lo que se trata de una heurística explicable, no de un modelo validado científicamente.

**Trabajo restante estimado** compara tu historial de proyectos en exterior completados en la misma disciplina y escala, dentro de un margen de un paso numérico de grado. Los encadenes al primer intento no entran en esta cohorte; los encadenes de largos parciales por debajo del grado de la vía no sustituyen a los encadenes de la vía completa. Para cada métrica por separado, al menos tres proyectos completados deben haber requerido más sesiones o intentos de los que has registrado hasta ahora. El rango mostrado corresponde a la mitad central (percentil 25–75, utilizando los rangos observados que la enmarcan) de esos totales menos el trabajo que ya has registrado; los intentos restantes incluyen el encadene final. Cuando superas ese historial o hay muy pocas comparaciones, la estimación se omite en lugar de inventar un plazo. Las cohortes incluyen todos los años registrados, mientras que la preparación utiliza los encadenes recientes.

Estas estimaciones describen únicamente proyectos completados: faltan los proyectos sin encadenar y los intentos no registrados, y la capacidad cambia con el tiempo. Son comparaciones personales aproximadas, no un esfuerzo restante garantizado. Los totales de sesiones cuentan los días naturales válidos anotados. Las fechas ausentes, no válidas y futuras aparecen en el historial, pero se excluyen de la progresión y las estimaciones. El recuento de intentos en la entrada del encadene incluye el intento exitoso y puede solaparse con entradas de intentos fallidos independientes; los resúmenes utilizan el total mayor de fallos en lugar de sumar ambos. Una repetición posterior sigue siendo visible sin cambiar qué encadene completó primero el proyecto.

## ¿Vía nueva?

Cuando un proyecto **no tiene grado** en theCrag (o tiene literalmente el grado «Project» / «Proj»), las tarjetas muestran la insignia **¿Vía nueva?** — normalmente una línea nueva que estás equipando o todavía trabajando. La misma insignia también aparece para **horquillas provisionales amplias** como `21-23` o `V1-3`, que suelen indicar que el grado aún se está afinando. Los grados intermedios adyacentes como `V1/2` siguen siendo grados publicados normales y no reciben la insignia. La etiqueta del grado sigue mostrando el punto medio interpretado cuando existe; solo cambia la insignia. Un indicador definitivo de **Proyecto** en theCrag (procedente de la importación de información de vías) muestra en su lugar la insignia independiente de Proyecto.

## Texto de la guía en las tarjetas de proyecto

Cuando la **importación de datos de vías** ha guardado en caché datos públicos de la guía para una vía, las tarjetas de proyecto pueden mostrar:

- Un breve extracto de la **descripción**
- Un aviso de **acceso** cuando la guía indica problemas de acceso (por ejemplo, sectores cerrados o tolerados)

Ese texto procede de las páginas públicas de vías de theCrag (campos `beta` como Descripción y Problemas de acceso). **No** son tus notas privadas del libro de vías.

### Privacidad

- Las **notas privadas de ascensión** (`ascents.comment`) se mantienen separadas. Solo aparecen en el libro de vías si lo activas en Ajustes, y nunca en las tarjetas de proyecto ni en las estadísticas del panel principal.
- La **beta de la guía** es contenido público de la comunidad. Crag Stats guarda extractos breves en `routes.beta_json` durante la misma importación opcional de vías que el historial de FA — nunca mezclados con tus notas.

### Licencia y atribución

theCrag cuenta con contenido de guías que puede estar licenciado bajo términos como [Creative Commons BY-SA](https://creativecommons.org/licenses/by-sa/4.0/). Las páginas de vías suelen acreditar a los colaboradores (por ejemplo, clubes locales). Crag Stats muestra únicamente **extractos breves**, enlaza de vuelta a la **página de la vía en theCrag** e indica la fuente (CC BY-SA). Para ver la descripción completa, la ética, la aproximación y el estado actual del acceso, utiliza el enlace de la tarjeta.

La importación de vías está **desactivada por defecto** (`ROUTE_DATA_IMPORT`). Configura `ROUTE_DATA_IMPORT=true` en el servidor y reinicia si quieres obtener extractos de la guía y sugerencias automáticas de FA; consulta [Primeras ascensiones](/docs/first-ascents) para conocer los límites de privacidad y frecuencia.
