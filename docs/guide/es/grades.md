# Grados y franjas de grado

Crag Stats muestra los grados de la misma manera que [theCrag](https://www.thecrag.com/en/article/grades). Cada sistema de graduación se convierte a una única escala interna, y esa escala se divide en cinco **franjas** codificadas por colores.

## Las cinco franjas

<!-- component:grade-bands -->

Estos colores aparecen en cada pirámide, etiqueta de grado, gráfico CPR y desglose por franjas. Coinciden con theCrag, por lo que un grado se ve igual aquí que allí.

## Cómo se comparan los grados

- **Una escala interna por tipo de escalada.** Vías (deportiva, clásica, top rope, alpina…) se puntúan en la escala **Ewbank** (los números australianos). Los bloques se puntúan en la **escala V**. Nunca se mezclan en una misma lista: un bloque V5 y una vía de grado 21 están en pirámides diferentes.
- **El grado decide la escala, no el estilo.** El psicobloc y los highballs a menudo reciben grados V aunque no sean bloques. Esas se quedan en la escala V: se cuentan con los bloques en los encadenamientos más difíciles e índices de grado, y tienen su propia pirámide (por ejemplo **DWS · V**), nunca una Ewbank.
- **Tus sistemas de visualización** se eligen en **Ajustes → Visualización y visibilidad**, uno para cada tipo de escalada. **Los grados de vías** (Ewbank, francés o YDS; Ewbank por defecto) cubren escalada deportiva, clásica, top rope y otras modalidades con cuerda. **Los grados de bloque** (escala V (Hueco) o Fontainebleau; escala V por defecto) cubren bloques y highballs graduados en escala V. Ambos son independientes, por lo que puedes mostrar vías en grado francés con bloques en grado Font. Un enlace compartido puede anularlos temporalmente con `?system=` (un sistema de vías o de bloques) y `?boulderSystem=`.
- **Grado asignado frente a tu grado.** theCrag almacena tanto el grado de consenso de la vía como el grado que tú le diste. Crag Stats prefiere el grado de la ascensión cuando está en el sistema correcto, y recurre al grado de la vía como alternativa.
- **Lectura de escaladas individuales.** Los proyectos, el historial de proyectos y el libro de vías muestran primero el grado seleccionado. Cuando el grado original de la vía en theCrag difiere, se muestra a continuación entre paréntesis, por ejemplo `6b (20)`. En una ascensión parcial de varios largos, el primer grado sigue describiendo los largos que escalaste; los paréntesis muestran el grado original de la vía. Los grados no puntuados conservan su texto original en lugar de adivinar una conversión.
- **Varios largos:** el grado efectivo de una ascensión es el largo más difícil que _tú_ escalaste, no el largo más difícil de la vía. Para los sistemas que el analizador de texto no puede leer, como UIAA, una escalada completa o un grado de largo coincidente utiliza la puntuación universal de la ascensión. Otros largos utilizan el punto medio de su franja de dificultad cuando está disponible.
- **Números de bloque ambiguos:** el contexto del sistema de grados del proveedor decide si un número simple significa escala V o Ewbank. El país por sí solo nunca cambia un grado en las filas de la API. Las reparaciones conservan la evidencia original de la API. Las exportaciones CSV no tienen columna de sistema de grados, por lo que las filas de bloques australianos con dígitos simples (`9`, `1`) reciben una indicación AU a partir de País / Ruta de la escuela / fragmentos de URL de australia; los valores explícitos `V5` / `VB` se mantienen en la escala V. Al igual que con las importaciones de la API, un grado de ascensión AU deducido no anula un grado de vía explícito en escala V.
- Los **rangos** como `V1/2` cuentan como el punto medio (V1.5).
- **Puntuación universal de theCrag.** theCrag puntúa cada grado, en cada sistema de graduación, en una única escala de dificultad. Las ascensiones sincronizadas llevan esa puntuación, por lo que Crag Stats puede clasificar grados en cualquier sistema compatible con theCrag (UIAA, sajón, nórdico, polaco, brasileño y más), incluso en los que no puede leer como texto. Los números simples en esos sistemas (un `7` en UIAA) nunca se confunden con la escala Ewbank.
- **Grados intermedios.** Las conversiones de los sistemas francés, YDS y Fontainebleau también utilizan las puntuaciones de theCrag, por lo que los grados sin un equivalente exacto entero en Ewbank o escala V (francés `5c+`, `6a` y `7a+`, Font `6A+` y `7C+`) se clasifican estrictamente entre sus vecinos (`7a` < `7a+` < `7b`). Las pirámides de francés, YDS y Font se agrupan según el grado más cercano en ese sistema de visualización; en caso de empate en el punto medio, se asigna al grado más difícil. Cada fila se enlaza a su propio rango de grados en el libro de vías. Las pirámides de Ewbank y escala V conservan filas para grados enteros. Su franja también proviene de la puntuación de theCrag, de modo que un `6a` francés se mantiene en Intermedio y un `7a+` se mantiene en Experimentado.
- Las **cargas CSV** no tienen columna de puntuación, por lo que sus grados se leen directamente del texto. Los grados en francés, YDS, Ewbank, V y Font se convierten según lo indicado anteriormente; los grados en otros sistemas pueden mostrarse sin convertir.

## Tablas de conversión

Las conversiones entre sistemas son aproximadas: los grados son culturales y un «6c» en una escuela no siempre equivale a un «23» en otra. Las siguientes tablas se generan a partir del mismo código que utiliza el panel de control.

### Vías (Ewbank ↔ Francés ↔ YDS)

<!-- component:route-conversions -->

### Bloques (Escala V ↔ Fontainebleau)

<!-- component:boulder-conversions -->

## Fuentes

- theCrag: [Grados y conversiones de grados](https://www.thecrag.com/en/article/grades)
- theCrag: [Grados en theCrag](https://www.thecrag.com/en/article/gradesonthecrag)

## Récords de grados en el panel de control

El panel de control empieza con **Encadenamiento más difícil** y **A vista / flash más difícil**. Muestran tu grado más alto conseguido de todos los tiempos y el grado más alto al primer pegue en tus sistemas seleccionados. Los intentos y las escaladas sin puntuar no cuentan. Las vías y los bloques tienen resultados separados; el psicobloc y los highballs con grado V cuentan con los bloques. Las ascensiones parciales de varios largos utilizan el largo más difícil que escalaste. Cada resultado nombra su tipo de ascensión y se enlaza a la ascensión correspondiente. Cuando hay un empate entre los récords a vista y flash, se muestra el a vista. Si no hay ningún récord, se muestra un guion y una explicación.
