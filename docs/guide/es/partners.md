# Compañeros

La página **Compañeros** (y la tarjeta del panel) clasifica a las personas etiquetadas en el campo `with` / compañeros de tu libro de vías. Haz clic en un nombre para abrir el libro de vías con una coincidencia exacta de compañero.

## Métricas (`/partners`)

Usa el selector de la esquina superior derecha:

- **Ascensiones** (por defecto) — cada ascensión registrada que nombre a ese compañero
- **Sesiones** — días de calendario únicos con al menos una ascensión compartida (la misma idea de “sesión = día” que en [Sesiones por semana](/docs/sessions-per-week); los marcadores de posición no válidos como `2018-00-00` se omiten, al igual que en Día de la semana)
- **Zonas** — escuelas de escalada distintas en las que has escalado con ese compañero, utilizando los ID de zona del proveedor almacenados en caché cuando están disponibles. Los cambios de nombre mantienen una sola identidad y las escuelas con el mismo nombre pero distintos ID se mantienen separadas. Sin un ID, los nombres se comparan sin distinguir entre mayúsculas y minúsculas; los nombres en blanco y “Desconocido” se omiten. Una fila solo con nombre se une a un ID conocido únicamente cuando ese nombre se mapea exactamente a un solo ID

Tu elección se guarda en el navegador (`cs_partners_metric`).

## Notas

- Los nombres de usuario se normalizan (se elimina la `@` inicial); la misma persona con diferentes mayúsculas o minúsculas comparte una misma barra.
- Los días de varios largos con muchas anotaciones inflan más las **Ascensiones** que las **Sesiones**.
- Alguien con quien solo escalas en una escuela se clasifica más abajo en **Zonas** que un compañero de viaje con menos anotaciones.

La vista previa del panel y la página completa utilizan las mismas ascensiones registradas, incluidas las ascensiones antiguas cuyo registro de vía no esté disponible. La falta de detalles de la vía no elimina las ascensiones con compañeros ni los días de sesión válidos; simplemente no aportan ninguna zona si no hay una escuela conocida. Otras analíticas del panel basadas en vías siguen requiriendo un registro de vía.

La tarjeta del panel comparte tu métrica seleccionada con esta página y muestra los siete principales compañeros para esa métrica. Haz clic en su título Compañeros para ver la lista completa.

Las insignias, los encadenes más difíciles, las ascensiones destacadas, las actividades recientes y los hitos de grado/FA específicos de la vía también muestran los compañeros registrados. La atribución sigue a la ascensión seleccionada, no a cada repetición de la vía. Las tarjetas de desarrollo/comunidad a nivel de vía y los hitos agregados no infieren compañeros. Los nombres se desduplican sin distinguir entre mayúsculas y minúsculas; los nombres que faltan se omiten y nunca se consideran como prueba de escalada en solitario.
