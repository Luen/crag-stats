# Tipos de ascensión

Un **tipo de ascensión** registra _cómo_ escalaste algo, no solo si llegaste a la cima. Un a vista vale más que un punto rojo en la misma vía. Por eso theCrag (y Crag Stats) los mantienen por separado.

En las tablas a continuación, **Encadene** significa que Crag Stats cuenta la ascensión como exitosa (limpia), por ejemplo en "ascensiones exitosas", tasas de encadene y pirámides. **Intento** significa que se registra como un intento: se muestra en gris en los gráficos, sigue contando como volumen de escalada y puede marcar una vía como proyecto.

<!-- component:tick-types -->

## Cómo se usan las ascensiones aquí

- **Las pirámides y los gráficos** colorean cada tipo de ascensión de forma consistente: a vista en verde, flash en amarillo, punto rojo en rojo, pink point en rosa, encadene/limpio en azul y los intentos en gris.
- **El CPR** desplaza cada ascensión por un ajuste de grado (un a vista cuenta como más difícil que un punto rojo); consulta [CPR](/docs/cpr).
- **Los proyectos** son vías con intentos pero sin ningún encadene todavía. Una vía que encadenaste a la primera (a vista o flash) nunca es un proyecto.
- **La carga de entrenamiento** cuenta los intentos como 0,8× un encadene, ya que ensayar una vía sigue siendo un gran esfuerzo; consulta [Carga de entrenamiento](/docs/training-load).

## Tipos de ascensión contabilizados en analíticas

En theCrag, los intentos sin encadene (como `Working`, `Attempt`, `Hang dog` o `Retreat`) se registran como ascensiones. Si registras numerosos pegues de ensayo mientras trabajas un proyecto, contar cada intento en los totales del panel de control puede distorsionar tu recuento principal de ascensiones, la proporción de estilos y tu tipo de escalador.

En **Ajustes → Visualización y visibilidad → Tipos de ascensión contabilizados**, puedes configurar cómo se trata cada tipo de ascensión en Crag Stats:

- **Activar (Contar en todas partes):** Se incluye en las ascensiones principales, el desglose por disciplinas, escuelas y sectores, pirámides, totales del mapa, números de Eddington, repeticiones de vías, los ejes del perfil de escalador, mapas de calor de actividad, carga de entrenamiento, insignias, proyectos y objetivos.
- **Solo proyectos y objetivos (Fuera de los totales):** Se excluye de las ascensiones principales, la proporción por disciplinas, escuelas, sectores, pirámides, totales del mapa, números de Eddington, repeticiones de vías y los ejes del perfil de escalador, pero sigue contando para la detección de proyectos, la actividad de sesión (mapa de calor, rachas, sesiones por semana y gráficos por días de la semana), la fatiga de la carga de entrenamiento, las insignias y los objetivos de grado.
- **Ocultar (Excluir por completo):** Se excluye en todas las analíticas, proyectos, objetivos e insignias.

El libro de vías siempre conserva y muestra todas tus ascensiones registradas con filtrado completo, independientemente de este ajuste. Para ver qué insignias siguen cada opción, consulta [Insignias](/docs/badges).

Cuando un tipo de ascensión configurado excluye algunas de tus ascensiones registradas, el panel de control también recalcula las cifras del perfil que normalmente provienen de theCrag (ascensiones en exterior y en rocódromo, vías encadenadas, altura total y tipo de escalador) a partir de tus ascensiones contabilizadas, de modo que cada total de la página describe el mismo conjunto de ascensiones. Borra la configuración con el ajuste predeterminado **Todas las ascensiones registradas** para volver a los totales propios de theCrag.

## Fuente

Las definiciones son una paráfrasis del artículo [Tipos de ascensión](https://www.thecrag.com/en/article/ticktypes) de theCrag. No todos los tipos de ascensión se aplican a todos los estilos de equipamiento.
