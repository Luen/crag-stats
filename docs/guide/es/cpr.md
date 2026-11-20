# CPR (Climber Performance Rating)

**CPR** es la valoración de tu nivel de escalada según theCrag. Crag Stats muestra una línea de tiempo del CPR para **deportiva**, **clásica** y **bloque** por separado, al igual que hace theCrag, ya que las tres disciplinas se valoran de forma muy diferente.

## Cómo calcula theCrag el CPR

theCrag creó el CPR a partir de un análisis estadístico de alrededor de un millón de ascensiones. Las ideas principales:

- **Cada grado es unas 5 veces más difícil que el anterior** (factor de potencia _P_ = 5 en la escala Ewbank). Cada vía única que hayas hecho suma aproximadamente _P_ elevado a la potencia de su grado a un total. El total se vuelve a convertir en un grado utilizando un logaritmo en base 5. Por lo tanto, cinco ascensiones de un grado equivalen aproximadamente a una ascensión del siguiente grado.
- **Ajustes por tipo de ascensión.** La forma en que escalaste importa. Las ascensiones se ajustan por un desfase de grado antes de puntuar. Por ejemplo, en escalada deportiva se encadena al punto rojo aproximadamente **2.1 grados** más duro que a vista, y en clásica un punto rosa es unos **0.8 grados** más fácil que un punto rojo. Los desfases se calculan por separado para deportiva, clásica y bloque.
- **Consolidar un grado.** Una ascensión en un nuevo grado podría ser una vía blanda o una casualidad. Tu _grado_ sube solo después de aproximadamente **tres** ascensiones en él, pero cada ascensión sigue sumando a la clasificación.
- **Decaimiento.** Si dejas de escalar, el CPR disminuye unos **0.7 grados Ewbank al año** (aproximadamente tres cuartas partes de un grado).
- Las **repeticiones** de una vía solo cuentan una vez (la mejor ascensión), y se utiliza el grado asignado a la vía en lugar de tu opinión personal.

theCrag mantiene una clasificación con decaimiento y otra sin decaimiento para cada una de las disciplinas: deportiva, clásica y bloque.

## De dónde lo obtiene Crag Stats

- **Desde la API de theCrag (preferido).** Cuando te sincronizas con una clave API de colaborador, cada ascensión puede incluir los propios valores de CPR de theCrag. Si suficientes de tus ascensiones en una disciplina los tienen (al menos 3 y al menos el 20% de las ascensiones de esa disciplina), la línea de tiempo utiliza el **CPR con decaimiento de theCrag**, etiquetado como _theCrag CPR_.
- **Modelo aproximado (alternativa).** De lo contrario, Crag Stats calcula su propio CPR, etiquetado como _Aprox._ Utiliza las mismas ideas: _P_ = 5, la mejor ascensión por vía, ajustes por tipo de ascensión y un decaimiento de 0.7 grados/año. Los ajustes de ascensión son estimaciones; por ejemplo, en deportiva a vista +2.1, flash +1.4, punto rojo 0, punto rosa −0.5, intentos −3. **No es una copia de la implementación propietaria de theCrag**, por lo que es normal que haya pequeñas diferencias.

## Cómo leer la línea de tiempo

- Cada **columna** representa un trimestre del año.
- Las **velas** muestran el rango de grados que escalaste con cada tipo de ascensión en ese trimestre. Al igual que en theCrag, la ascensión más pura se sitúa en la parte superior: a vista en verde, flash en amarillo, punto rojo en rojo, punto rosa en rosa, encadenado/limpio en azul, intentos en gris.
- La **línea negra** es tu CPR a lo largo del tiempo. Un anillo marca tu **máximo**, y un punto hueco tu clasificación **actual**.
- El **fondo de color** muestra las franjas de grado (Principiante → Élite) en sus límites de grado reales.
- Las **barras** de la parte inferior muestran cuántas ascensiones registraste en ese trimestre. Haz clic en una para abrir esas ascensiones en el libro de vías.
- Un **divisor discontinuo** con **⋯** en el eje del tiempo marca una interrupción de más de un trimestre.
- **Mostrar trimestres vacíos** asigna a cada trimestre su propia columna entre tu primer y último trimestre registrado. Los trimestres sin ascensiones permanecen vacíos y **rompen la línea negra**, por lo que un largo periodo de inactividad ya no se interpreta como un progreso constante. El gráfico se desplaza lateralmente cuando las columnas adicionales necesitan más espacio. Déjalo desmarcado para mantener la vista compacta, donde solo los trimestres con ascensiones tienen columna.

theCrag señala que un **extremo superior gris** por encima de la línea (intentos fallidos en un grado más alto) suele preceder a un salto de grado.

## Fuentes

- theCrag: [Climber Performance Rating (CPR)](https://www.thecrag.com/en/article/cpr)
- theCrag: [Línea de tiempo del CPR explicada](https://www.thecrag.com/en/article/cprtimeline)
