# Carga de entrenamiento

La tarjeta **Carga de entrenamiento** (y la página dedicada [`/training-load`](/training-load)) calcula cuánto has estado escalando recientemente en comparación con lo que tu cuerpo está acostumbrado. Un aumento rápido es cuando suelen ocurrir la mayoría de las lesiones de dedos y hombros. La tarjeta del panel resume las 12 semanas más recientes; la página muestra 26 semanas más una tira de carga diaria de 28 días.

## 1. Carga por ascensión

Cada ascensión recibe una puntuación de carga:

> **carga = 10 × intensidad × factor de estilo**

La **intensidad** compara el grado de la ascensión con tu **encadene más difícil de los últimos 12 meses** en la misma disciplina. Las vías se comparan en la escala Ewbank y los bloques en la escala V.

| Grado comparado con tu máximo de 12 meses                      | Intensidad |
| -------------------------------------------------------------- | ---------- |
| En tu máximo                                                   | 1.0        |
| 2 grados Ewbank (1 grado V) por debajo                         | 0.5        |
| 4 grados Ewbank (2 grados V) por debajo                        | 0.25       |
| Por encima de tu máximo (un nuevo récord)                      | hasta 1.5  |
| Ensayar una vía sin grado o un proyecto de theCrag (ver abajo) | 1.0        |
| Encadene sin grado, o sin encadenes en 12 meses                | 0.3        |

Escalar cerca de tu límite cuenta mucho más que hacer volumen muy por debajo de él. Un día de diez vías fáciles y un día dedicado a un solo proyecto pueden resultar similares.

**Proyectos sin grado y marcados:** un intento, acero/hang-dog u otro registro sin encadenar en una vía **sin grado**, o en una vía que theCrag marca con la etiqueta **Proyecto** (de la importación opcional de información de vías), se trata como escalar **en tu máximo**. Las vías sin grado que sigues ensayando suelen ser líneas nuevas cerca de tu límite; la etiqueta es el caso definitivo cuando la tenemos. Esos mismos intentos también cuentan para la proporción cerca del límite. Si tú mismo le diste un grado al registro en theCrag, se utilizará ese grado en su lugar. Un _encadene_ sin grado sigue contando como ligero (0.3), ya que una vía fácil sin nombre no debería parecer un día límite.

**Factor de estilo:** un encadene de primero es 1.0. Los intentos y hang-dogs son 0.8, porque ensayar una vía sigue siendo un esfuerzo real. Escalar en top-rope o de segundo es 0.8× adicional sobre eso.

## 2. Fatiga y forma física

Las cargas diarias se promedian de dos formas, ambas ponderadas hacia los días más recientes:

- **Fatiga (aguda):** un promedio ponderado exponencialmente de 7 días.
- **Forma física (crónica):** un promedio ponderado exponencialmente de 28 días.

## 3. Ratio agudo : crónico

**ratio = fatiga ÷ forma física**

| Ratio     | Estado                    | Significado                                                              |
| --------- | ------------------------- | ------------------------------------------------------------------------ |
| —         | En descanso               | Nada registrado recientemente                                            |
| < 0.8     | Por debajo de lo habitual | Más ligero de lo normal: fresco, en afinamiento o perdiendo forma física |
| 0.8 – 1.3 | Punto óptimo              | En línea con a lo que estás acostumbrado                                 |
| 1.3 – 1.5 | En aumento                | Escalando más de lo habitual; vigila la recuperación                     |
| > 1.5     | Pico                      | Un gran salto; la zona más asociada a lesiones por sobreuso              |

Esas franjas provienen del ratio de carga de trabajo agudo:crónico utilizado en las ciencias del deporte y el entrenamiento de escalada. Tómalas como una orientación, no como un diagnóstico.

## También en la tarjeta / página

- **Carga semanal:** la carga total de cada semana (12 en la tarjeta, 26 en la página). La semana actual es la barra destacada.
- **Carga diaria (página):** los últimos 28 días de carga ponderada por intensidad, incluidos los días de descanso.
- **Encadenes cerca del límite · 28d:** encadenes en los últimos 28 días dentro de 2 grados Ewbank (1 grado V) de tu máximo de 12 meses.
- **Proporción cerca del límite:** el porcentaje de ascensiones con grado de los últimos 28 días que estuvieron cerca de tu límite. Una proporción alta durante varias semanas significa mucha escalada al límite; considera semanas de descarga.
- **Últimos 7 / 28 días:** ascensiones, encadenes, días activos y de descanso, altura escalada y porcentaje de encadenes.

## Consideraciones

- **Solo cuenta lo que registras.** Las sesiones de rocódromo, multipresa y otros entrenamientos que no registras son invisibles.
- **Los grados son imprecisos**, y una vía blanda o dura para el grado desvirtúa la intensidad.
- **El ratio necesita historial.** Con menos de unas pocas semanas de registros, la "forma física" es baja y el ratio fluctúa.

Para las vías marcadas como Proyecto, el grado personal debe proceder de la ascensión o de un largo escalado (o del campo CSV Ascent Grade). Un grado efectivo copiado de la vía es solo una alternativa por defecto, por lo que no desactiva la suposición de Proyecto en el máximo.
