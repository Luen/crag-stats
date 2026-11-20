# Tipos de roca

theCrag almacena la geología de muchas vías como una etiqueta estructurada de **Tipo de roca** (por ejemplo, granito o arenisca). Crag Stats lee esa etiqueta del libro de vías / caché de vías sincronizado; nunca extrae información de páginas web ni adivina el tipo de roca a partir del nombre de la escuela.

## Tarjeta de tipos de roca

La tarjeta **Tipos de roca** del panel cuenta las ascensiones cuya vía tiene una etiqueta de Tipo de roca y muestra la proporción de cada nombre. El tipo dominante puede mostrar una breve descripción geológica. Cada nombre enlaza al libro de vías filtrado con `?rock=`.

Las vías sin etiqueta de Tipo de roca se excluyen del gráfico, por lo que los porcentajes describen únicamente las escaladas etiquetadas.

## Tarjeta de roca y rendimiento

Una vez que **20 o más** días de escalada incluyan al menos un encadenamiento o intento en una vía etiquetada con Tipo de roca, la tarjeta **Roca y rendimiento** compara cómo fueron esas escaladas según la roca. Antes de alcanzarlos, muestra cuántos días etiquetados llevas hasta el momento. La tarjeta permanece oculta mientras no exista ningún encadenamiento o intento etiquetado, y se puede mover u ocultar desde Ajustes → Panel.

**Qué se cuenta.** Encadenamientos e intentos (la misma clasificación de registros que en cualquier otro lugar) en vías con etiqueta de Tipo de roca. Las escaladas sin etiquetar solo se notifican como cobertura (“N más … no tienen etiqueta de tipo de roca”).

**Métricas** (mismas ideas que en [Tiempo y rendimiento](/docs/weather)):

- **Tasa de encadenamiento:** encadenamientos como porcentaje del total de encadenamientos e intentos en esa roca.
- **Cerca del límite:** el porcentaje de encadenamientos con grado situados a no más de 2 grados (1 grado V en la escala V) de tu encadenamiento más difícil del **mismo estilo y escala de grado** en los 365 días anteriores a ese día. La escala V y los grados de vía nunca se mezclan.
- **A vista/flash:** ascensiones a vista y flashes como porcentaje de los encadenamientos en esa roca.

**Interpretación honesta.**

- Un tipo de roca necesita al menos **10** ascensiones (para el denominador de esa métrica) a lo largo de al menos **3** días antes de mostrar una tasa.
- **Superior** / **Inferior** utiliza la misma prueba robusta por conglomerados que el rendimiento según el tiempo: cada grupo de roca y día es una unidad, por lo que una sola sesión grande no puede inventar un patrón por sí sola.
- La elección de escuela, los viajes y los proyectos interfieren con el tipo de roca. Trata las diferencias como correlación, no como causa.
- Cuando tienes muchos nombres de roca distintos, los menos frecuentes se agrupan en **Otros** (sin enlace al libro de vías). Las franjas con nombre enlazan a `/logbook?rock=…` con la misma coincidencia insensible a mayúsculas y minúsculas que la tarjeta Tipos de roca.

Ver la tarjeta nunca activa una solicitud al proveedor y las notas privadas nunca se utilizan.

La referencia cerca del límite incluye tus encadenamientos del mismo estilo y misma escala, incluso cuando
esas vías de referencia no tienen etiqueta de roca. Utiliza el grado del largo escalado más difícil cuando está disponible, incluye el día número 365 anterior y excluye todos los encadenes del día que se está comparando. El rendimiento por roca y el rendimiento por tiempo comparten este cálculo de referencia;
el tiempo restringe además sus encadenamientos de referencia a escaladas en exterior.
