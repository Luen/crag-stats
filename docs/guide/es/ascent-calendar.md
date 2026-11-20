# Calendario de ascensiones

El **Calendario de ascensiones** es un mapa de calor anual de los días en los que registraste escaladas. Las celdas enlazan a `/logbook?day=` para esa fecha.

## Intensidad

Los colores varían según cuántas ascensiones registraste ese día (vacío → pocas → muchas), utilizando la misma escala de calor verde. Los intentos cuentan para la intensidad; la descripción emergente sigue separando el recuento de encadenes.

## Grado

Cada día se colorea según el **encadene exitoso más duro** de ese día, utilizando la misma paleta de rangos de Principiante → Élite que las etiquetas de grado en otras partes. Los días en los que solo hay intentos (sin encadene) utilizan un relleno atenuado de «intento». Cuando en un mismo día se mezclan grados de bloque y de vía, el calendario elige el id de rango más alto; los rangos no son perfectamente comparables entre distintos sistemas.

Tu preferencia de Intensidad / Grado se guarda en el navegador (`cs_heatmap_mode`).

## Tiempo

Cuando la [caché meteorológica](/docs/weather) opcional contiene alguno de tus días de escalada, aparece un tercer modo: **Tiempo**. Cada día escalado se colorea según las condiciones de su primera ascensión en exterior con datos meteorológicos en caché: nieve, lluvia, calor (35 °C+), helada, buen tiempo (15–25 °C y seco) o templado, siguiendo las mismas reglas que las insignias. Los días sin datos meteorológicos en caché (rocódromo, sin coordenadas, aún no obtenidos) permanecen en un gris atenuado. Las descripciones emergentes muestran la máxima, la mínima y la lluvia, y una tabla de **Ver valores meteorológicos** debajo del calendario ofrece los mismos números en formato de texto para el año seleccionado.

Las celdas del calendario conservan la fecha registrada en el calendario en cualquier zona horaria del navegador, incluso a través de los cambios de horario de verano. No convierten los días de escalada en marcas de tiempo locales.
