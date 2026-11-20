# Día de la semana

La tarjeta **Día de la semana** muestra qué días de la semana escalas, inspirada en el gráfico por día de la semana de [Dreeve](https://dreeve.app/) para Strava. La distribución es un **gráfico de anillo (circular)** con una leyenda de lun–dom. Por defecto, se sitúa a la izquierda de **Sesiones por semana** (medio ancho), en la fila debajo de las estadísticas **Mensuales** / **Anuales**; Personalizar panel permite mover cualquiera de las tarjetas.

## Qué cuenta

- **Sesiones** (por defecto) — un día natural con al menos una ascensión que coincida (misma idea que [Sesiones por semana](/docs/sessions-per-week))
- **Ascensiones** — cada registro que coincida ese día de la semana

El día de la semana se toma de la fecha `YYYY-MM-DD` de la ascensión en UTC; las filas del libro de vías tienen marca de día sin hora.

## Filtros

- **Todo el tiempo** / **Últimas 12 semanas** — ventana inclusiva de 84 días que termina hoy para el rango corto
- **Sesiones** / **Ascensiones** — qué representa el tamaño de cada porción
- **Todo** / **Deportiva** / **Clásica** / **Bloque** — las etiquetas de estilo usan los mismos colores de disciplina que el resto de la aplicación y coinciden con los filtros de estilo del libro de vías (estilo escalado **o** estilo de la vía). Top-rope y otros estilos solo aparecen en **Todo**.

Las opciones se guardan en el navegador (`cs_weekday_range`, `cs_weekday_metric`, `cs_weekday_style`).

## Día más activo

El centro del anillo y la línea principal indican el día de la semana con el valor más alto para la métrica actual (los empates se resuelven con la otra métrica). Se destacan la porción y la fila de la leyenda de ese día de la semana. **Ver valores por día de la semana** debajo del gráfico enumera las sesiones exactas, las ascensiones y el porcentaje para lectores de pantalla y usuarios de teclado.
