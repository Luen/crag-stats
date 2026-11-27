# Primeras ascensiones

La tarjeta **Primeras ascensiones** cuenta las vías y bloques en los que hiciste la primera ascensión (**FA**) o la primera ascensión libre (**FFA**). Cuando el historial de la vía está en caché, también muestra cuántas vías te acreditan como **equipador** (equipamiento / diseño de vías).

## Lo que necesitas

- **Inicio de sesión del propietario** — Si `APP_PASSWORD` está configurada, inicia sesión para poder abrir Configuración y usar **Marcar FA** / **FFA** en el libro de vías. Los visitantes ven la tarjeta y las insignias una vez que se ha marcado al menos una vía, pero no pueden añadir marcas ellos mismos.
- **Importación opcional de datos de vías** — Configura `ROUTE_DATA_IMPORT=true` en el servidor si quieres que Crag Stats marque automáticamente las FA y FFA a partir del historial público de vías de theCrag (ver más abajo). Las marcas manuales y la importación escriben en la misma tabla `first_ascents`; ninguna depende de las notas privadas.
- **Las notas privadas no están relacionadas** — **Configuración → Mostrar notas privadas** solo controla si tus **comentarios de ascensión** aparecen en `/logbook` (y en las búsquedas). No condiciona la tarjeta Primeras ascensiones, las insignias de FA/FFA, los hitos ni la importación de datos de vías.

## Marcar una primera ascensión

theCrag registra las primeras ascensiones en el **historial** de cada vía (las entradas de FA / FFA en la página de la vía), no como un tipo de encadenamiento. Su API del libro de vías no devuelve el historial de la vía, por lo que una sincronización normal no puede verlas. Puedes marcarlas tú mismo o activar la importación opcional que se explica a continuación.

### Marcar una tú mismo

1. Abre el **Libro de vías** y busca cualquier ascensión de la vía.
2. Pasa el cursor sobre la fila (o desplázate con el tabulador hasta ella) y pulsa **Marcar FA** o **FFA**.
3. Pulsa **Desmarcar** para deshacerlo.

Solo alguien que pueda abrir Configuración puede marcar FA: cualquiera si no hay definida ninguna `APP_PASSWORD`, o solo cuando se haya iniciado sesión en caso contrario. Los visitantes ven la insignia de FA y la tarjeta, pero no los botones.

La marca se almacena asociada al ID de la vía en theCrag, por lo que se mantiene tras las resincronizaciones. Desaparece de la tarjeta si se elimina cada ascensión de la vía en theCrag, y vuelve a aparecer si registras la vía de nuevo. **Configuración → Borrar todo** elimina todas las marcas.

### Filtrar el libro de vías

En el **Libro de vías**, usa el control **Marca de primera ascensión** para mostrar solo tus FA, FFA, cualquiera de las dos o escaladas sin marca todavía (`?fa=FA|FFA|any|none`). Si la importación de datos de vías está activada, el propietario también obtiene **Historial no comprobado aún** (`?history=pending`), que enumera las escaladas que el importador no ha obtenido.

### Importarlas desde el historial de vías (opcional, desactivado por defecto)

Si el propietario de tu servidor lo activa (`ROUTE_DATA_IMPORT=true`; en versiones anteriores se llamaba `ROUTE_HISTORY_IMPORT`, que ya no se lee, así que renómbralo y reinicia), Crag Stats lee en segundo plano el historial público de cada vía del libro de vías en theCrag y marca las FA y FFA que te nombran.

- **Solo cuentan las entradas que nombran tu nombre de usuario de theCrag** (`@yourlogin`). Los nombres en texto plano se ignoran porque es demasiado fácil confundirlos. La sincronización por API guarda ese nombre de usuario; si tu libro de vías proviene de archivos CSV subidos, configura `THECRAG_USERNAME` para que la importación sepa qué entradas son tuyas.
- **Tus elecciones prevalecen.** Las marcas que establezcas se mantienen como están, y las vías que desmarques permanecen desmarcadas. **Configuración → Importar datos de vías → Volver a aplicar** puede anular cualquiera de las dos opciones, usando el historial ya guardado, sin volver a consultar a theCrag.
- **Uso respetuoso con theCrag.** Cada vía se comprueba **una vez** por defecto (las actualizaciones periódicas opcionales de datos se describen a continuación), como máximo **100 vías por ejecución** y una solicitud por segundo. A run happens after each logbook sync or CSV upload, on the background import schedule (`IMPORT_CRON`, daily by default), when the app restarts with routes still waiting (for example after an upgrade), or when you press **Check next 100 routes now**. Si theCrag limita las peticiones, la importación se pausa durante al menos un día.
- Configuración muestra cuántas de tus vías se han comprobado hasta el momento. Con la sincronización diaria, unas pocas cientos de vías tardan unas cuantas semanas; pulsar el botón acelera ese proceso.

Solo se guarda el historial público de las vías, nunca tus notas privadas de ascensión. **Configuración → Borrar todo** lo elimina junto con tus marcas.

## Lo que muestra la tarjeta

Cuando la tarjeta incluye créditos importados de FA/FFA o de equipador, su pie de página acredita el historial de vías de theCrag. Esto sigue los créditos guardados, incluso si la importación se desactiva más adelante. Las marcas manuales no necesitan etiqueta de atribución; las colecciones mixtas conservan el crédito del historial de vías.

- **Total:** cuántas vías están acreditadas como FA o FFA, a partir de marcas manuales o de la importación de datos de vías (historial público de vías). Cuando tienes FFA, también muestra el desglose entre FA y FFA.
- **Vías equipadas:** vías distintas cuyo historial en caché te indica como equipador (`@yourlogin`). Misma regla `@login` que la importación de FA; los nombres en texto libre no cuentan. Requiere la importación de datos de vías (`ROUTE_DATA_IMPORT=true`) para que esas filas se guarden localmente.
- **Ascensiones de la comunidad (estimación):** encadenamientos en caché en vías que abriste/equipaste (marcas FA/FFA **o** créditos de equipador), menos tus propios encadenamientos del libro de vías registrados en la misma obtención. Un segundo mosaico desglosa las vías **deportivas / equipadas** (estilo de material Deportiva, o cualquier vía con parabolts/chapas registrados). Las repeticiones o eliminaciones posteriores del propietario no cambian la instantánea anterior. Son estimaciones de los totales de ascensiones, no escaladores únicos ni contadores en directo; las diferencias de visibilidad y un libro de vías del propietario incompleto pueden afectarlas.
- **Cobertura de la comunidad:** la tarjeta muestra cuántas vías acreditadas del libro de vías tienen instantáneas de recuento emparejadas, del total de vías elegibles. Los totales nulos conocidos se muestran como cero; los recuentos no disponibles se excluyen en lugar de tratarse como cero. La cobertura parcial se etiqueta explícitamente. Si la caché falta por completo, se muestra un mensaje de no disponible.
- **Años:** desde el año de tu primera FA hasta la más reciente. Cada FA se fecha según tu **primer encadenamiento registrado** de la vía (ver más abajo).
- **Rango de grados:** tu FA más fácil y más difícil, usando el grado de la vía (no un solo largo). Las vías y los bloques se enumeran por separado, porque los grados Ewbank y V no se pueden comparar. Los grados se muestran en tus sistemas de visualización de vías y bloques.
- **Estilos:** cómo se dividen tus FA entre deportiva, tradicional, bloque, etc., según el estilo de la vía en theCrag.
- **Más recientes:** tus tres FA más recientes en la tarjeta del panel (lista completa a través del libro de vías).
- **Comunidad por vía:** las tres vías acreditadas principales en el panel (se cuentan más debajo de la lista).
- **Comunidad por vía:** hasta ocho vías acreditadas, clasificadas por la estimación de la comunidad. Cada fila muestra crédito de FA, FFA y/o equipador, una insignia de estilo (Deportiva/equipada, Trad, Bloque u otro estilo de material conocido a partir de la información de la vía en caché), la estimación (o No disponible) y cuándo se obtuvo ese recuento. La fecha de actualización del recuento se guarda por separado de los demás datos de la vía, por lo que actualizar solo la beta o la calidad no hace que el contador parezca recién actualizado.

La tarjeta solo aparece para los visitantes cuando se ha marcado al menos una FA. Hasta entonces, el propietario ve una breve guía en su lugar.

La importación de datos de vías debe estar activada (`ROUTE_DATA_IMPORT=true`) para rellenar las instantáneas de recuento. Los totales de la comunidad y las instantáneas de recuento del propietario provienen de la API de vías durante la importación en segundo plano (100 vías por ejecución; se aplican el ritmo y el tiempo de espera). Para mantener los totales y otros datos de las vías actualizados automáticamente, configura `ROUTE_DATA_REFRESH_DAYS` con un número entero de días entre 30 y 3650 (p. ej. se recomienda `90`, o `180` para aproximadamente medio año) junto con `ROUTE_DATA_IMPORT=true`. Las vías pasan a ser elegibles tras transcurrir ese número de días y se actualizan después de una sincronización correcta del libro de vías, compartiendo el límite de 100 vías con las vías nuevas. Las vías nuevas van primero, seguidas de los datos no actualizados más antiguos; los acumulados grandes pueden requerir varias sincronizaciones. Si no se define, es `0`, es menor que 30 o mayor que 3650, se mantiene el comportamiento de una sola obtención; **Actualizar todo** en Configuración sigue siendo un restablecimiento manual opcional. Las marcas y desmarques manuales permanecen protegidos.

En Configuración, el botón de comprobación del historial de vías muestra una cuenta atrás hasta que se permita la siguiente ejecución y pasa a estar disponible automáticamente. Las ejecuciones tienen un intervalo mínimo de un minuto; un bloqueo o error puede requerir una espera más larga. Sin JavaScript, recarga Configuración para actualizar la disponibilidad.

## Cuándo cuenta una FA y su fecha

Una primera ascensión es el encadenamiento, por lo que cada una se fecha según tu **primer encadenamiento registrado** de la vía marcada. Los intentos anteriores y las ascensiones con reposos en la cuerda mientras trabajabas la vía no cuentan, ni tampoco las repeticiones posteriores. Si hasta ahora solo has registrado intentos, la vía aún aparece en la tarjeta (fechada con tu ascensión más antigua), pero no obtiene insignias ni hitos hasta que registres el encadenamiento.

## Insignias e hitos

Estos se desbloquean a partir de las FA/FFA marcadas por el propietario (y tu primer encadenamiento de cada vía marcada), no por activar las notas privadas. La tarjeta de Hitos y el catálogo de insignias usan los mismos umbrales, no una fila por vía.

- **Primera ascensión** y **Primera ascensión libre:** tu primer encadenamiento de una vía que marcaste como FA o FFA.
- **Recuentos combinados de primeras ascensiones** (5, 10 / Pionero, 20, 50, 100): esa cantidad de vías diferentes marcadas como FA o FFA.
- **Recuentos de primeras ascensiones libres** (5, 10, 20, 50, 100): solo marcas FFA.
- **Recuentos de primeras ascensiones por estilo** (10, 20, 50 para Deportiva, Trad y Bloque): marcas de FA o FFA en ese estilo de material.
- **Equipador**, **Abridor de vías** (5), **Constructor de paredes** (10), **Arquitecto de la escuela** (25): créditos de equipador del historial de vías en caché, fechados por la entrada de equipador más antigua que nombre tu `@login` en cada vía (no por los encadenamientos del libro de vías).
- **Escuela compartida** (10), **Favorita del público** (50), **Cien manos** (100), **Clásica local** (500): ascensiones aproximadas de la comunidad en vías que abriste/equipaste (FA/FFA o equipador), a partir de instantáneas de recuento emparejadas. Los recuentos son ascensiones, no escaladores distintos. La cobertura incompleta se indica en el detalle de la insignia.
- **Fiebre de parabolts** (10), **Imán deportivo** (50), **Clásica de mosquetoneo** (100): la misma estimación restringida al estilo de material Deportiva o vías equipadas.

Cada umbral se fecha con el primer encadenamiento de la vía que lo superó; el detalle indica esa vía desbloqueadora.

Los créditos de equipador sin una fecha válida en el historial siguen contando para las insignias de equipador, pero su fecha de obtención se deja como desconocida. Del mismo modo, las insignias de ascensiones de la comunidad dejan la fecha de obtención como desconocida: los totales son agregados en caché, no un día de evento.
