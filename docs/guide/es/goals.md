# Objetivos

Los objetivos convierten una meta de tu libro de vías de theCrag en una barra de progreso en el panel de control y en la página **Objetivos**. Los objetivos de altura y de días de escalada se completan de forma lineal. Los objetivos de **Grado** utilizan un modelo aproximado de **preparación en pirámide** para que estar un grado por debajo de la meta ya no parezca casi completado.

## Tipos de objetivo

| Tipo                | Qué significa “completado”                                               | Barra de progreso                        |
| ------------------- | ------------------------------------------------------------------------ | ---------------------------------------- |
| **Grado este año**  | Un encadene en o por encima de la puntuación meta en el año del objetivo | Preparación en pirámide (a continuación) |
| **Altura este año** | Metros escalados en ese año                                              | Lineal: metros ÷ meta                    |
| **Días este mes**   | Días distintos de escalada en el mes de calendario actual                | Lineal: días ÷ meta                      |
| **Personalizado**   | Tú lo marcas como completado                                             | Manual (sin llenado automático)          |

El alcance del lugar (exterior / interior / cualquiera) filtra qué ascensos cuentan. Los objetivos de grado están configurados por defecto en **exterior**.

Los objetivos de altura siempre **guardan metros**. El formulario de creación solicita la meta en tu unidad de altura seleccionada (metros o pies) y convierte los pies antes de guardar, y las etiquetas de progreso y meta también siguen esa unidad. Cambiar de unidad más adelante cambia la etiqueta del objetivo sin modificar la meta guardada. Consulta la [Configuración de pantalla](/docs/display-settings).

Los objetivos de grado mantienen su escala de **Vías** o **Bloques**. Las metas y las etiquetas de progreso siguen el sistema de grados correspondiente en Ajustes; cambiar el sistema de visualización no modifica la meta ni el porcentaje. Los títulos de objetivos sugeridos también siguen Ajustes, mientras que los títulos personalizados se mantienen tal como se introdujeron. En las **Preferencias de grado** de un objetivo, puedes elegir su escala y si deseas utilizar un título automático.

Si un objetivo muestra **Se necesita escala de grados**, su progreso no estará disponible hasta que el propietario elija **Vías** o **Bloques**. Su título y la meta guardada se conservan; que un título mencione un grado no decide su escala.

## Preparación para el grado

Un objetivo de grado requiere un **encadene ≥ meta** (puntuación canónica, normalmente Ewbank para vías o escala V para bloques) en el año del objetivo. La barra **no** es `mejor encadene ÷ meta` — eso hacía que 22→23 pareciera un ~96% cuando aún necesitabas el encadene en 23.

En su lugar, el modelo evalúa qué tan construida está tu pirámide por debajo de la meta **N**, y luego cuánto has trabajado cerca de ella:

1. **Completado (100%)** cuando tu mejor encadene válido ya es ≥ N.
2. **Base** cuando tienes un encadene en N−1 (~35%) o solo en N−2 (~10%).
3. **Relleno de pirámide** a partir de vías distintas con encadene en esos grupos: necesidad flexible de aproximadamente **2 vías en N−1** y **4 en N−2** (hasta aprox. +20% y +25%).
4. **Relleno por intentos** a partir de registros sin encadene (proyectos) con puntuación efectiva **≥ N−1** — hasta aprox. +20%, con una necesidad flexible **escalada según el horizonte** para que los proyectos a corto plazo avancen más rápido por intento que los a largo plazo.
5. **Límite del modelo base al 94%.** La primera sesión válida establece la línea base; cada día distinto de escalada adicional con registros de trabajo en ≥ N−1 añade un punto de preparación, hasta el 99%. Solo un encadene válido alcanza el 100%. Múltiples vías u intentos en el mismo día suman una sesión; las fechas faltantes, no válidas o futuras no suman ninguna. El crédito por sesión sigue el año y el lugar del objetivo, y no cambia las proporciones de los objetivos de altura o de días de escalada.

La evidencia de encadene utiliza el mismo filtro de año y lugar que el cumplimiento: **grado efectivo** (el largo más difícil escalado en varios largos) y **vías distintas** por grupo de la pirámide (los encadenes repetidos en una misma vía cuentan una sola vez). Los intentos cuentan cada registro de trabajo válido (las repeticiones en la misma vía siguen haciendo avanzar la barra).

La línea de progreso muestra tu mejor encadene, los conteos de vías N−1 / N−2, la evidencia de intentos si existe y una breve pista sobre el horizonte:

| Diferencia hasta la meta      | Pista       | Necesidad flexible de intentos (≈ llenar la franja de intentos) |
| ----------------------------- | ----------- | --------------------------------------------------------------- |
| 1 grado                       | Corto plazo | ~15 intentos                                                    |
| 2 grados                      | Medio plazo | ~35 intentos                                                    |
| Más amplio / sin encadene aún | Largo plazo | ~75 intentos                                                    |

## Siguiente grado sugerido

En la página **Objetivos**, cuando tienes encadenes en exterior en los últimos **dos años**, Crag Stats puede ofrecerte una sugerencia: tomar tu encadene en exterior más difícil (vía y/o bloque, manteniendo la separación) y apuntar al **siguiente paso de grado** este año (V5 → V6, 25 → 26). Las sugerencias nunca crean un objetivo hasta que haces clic en **Añadir objetivo**. Si ya realizas el seguimiento de esa meta en exterior para el año, la etiqueta muestra **Ya en seguimiento**.

## Lo que ves

- Tarjeta de “Objetivos activos” en el **panel de control**: hasta unos pocos objetivos abiertos con los mismos porcentajes y etiquetas.
- Página **Objetivos**: etiquetas opcionales de siguiente grado sugerido, listas completas de Activos / Conseguidos, crear/editar y el mismo texto de preparación para los objetivos de grado.

## Advertencias

- **Aproximado.** Los números flexibles de la pirámide son una regla general de entrenamiento, no una predicción de que encadenarás N.
- **Puntuaciones del mismo sistema.** Los grupos de apoyo son los rangos de puntuación [N−1, N) y [N−2, N−1), por lo que los encadenes fraccionarios por debajo de una meta aún cuentan como apoyo. Las puntuaciones utilizan la puntuación canónica del objetivo; los sistemas de graduación mixtos no se convierten dentro de la barra.
- **Escala, año y lugar.** La evidencia de vías y de escala V nunca se mezclan. Los registros más antiguos fuera del año del objetivo, o en el lugar equivocado, no contribuyen a la preparación. El psicobloc y los highballs graduados en la escala V cuentan para los objetivos de bloque, según el sistema de graduación y no el estilo de protección.
- **Los intentos son aproximados.** Solo vemos los registros sin encadenar con un grado ≥ N−1, no cada pegue en un proyecto sin graduar.
- Los **objetivos personalizados** nunca se completan automáticamente desde el libro de vías.

Los objetivos de altura y días mantienen proporciones lineales sencillas, de modo que un kilómetro o un mes completado a la mitad siga apareciendo como completado a la mitad.
