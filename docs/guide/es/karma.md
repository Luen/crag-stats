# Karma

theCrag otorga **Karma** por las contribuciones al índice de escalada: registrar ascensos y editar datos de las guías. Consulta [Karma en theCrag](https://www.thecrag.com/article/cragkarma).

## Lo que puede mostrar Crag Stats

El objeto de cuenta de la API del **libro de vías** de colaboradores **no** incluye tu total de karma personal ni el desglose entre ascensos y ediciones. Los endpoints de zona `/karma` son clasificaciones de colaboradores para una escuela, no un sustituto de la puntuación de tu cuenta.

Hasta que theCrag exponga el karma personal (o un acceso negociado), la tarjeta del panel es solo una **aproximación de la parte de los ascensos**:

| Origen                                                      | Puntos                                                                                           |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Registrar ascenso                                           | **1** una vez por vía (nodo), cumpliendo la regla de una vez por tipo de contribución de theCrag |
| Ediciones de la guía (descripciones, croquis, historial, …) | **No disponible**: no se puede reconstruir a partir de la caché del libro de vías                |

Cuando tu cuenta sincronizada incluye `routesTicked` y esa cifra es al menos tan grande como la caché local de vías, la tarjeta la utiliza para el total de ascensos (coincide con «vías que has registrado» en theCrag). De lo contrario, cuenta las vías distintas en tu caché local de SQLite.

El recuadro de **vías locales registradas** siempre muestra el número de vías distintas vinculadas a tus ascensos guardados en caché, incluso si la estimación de ascensos utiliza el contador más grande de la cuenta. Los encadenamientos repetidos cuentan una sola vez; los metadatos de las vías sin ascenso no cuentan.

## Lo que no es

- No es un clon exacto byte por byte de la puntuación de tu perfil de theCrag.
- El karma real permanece en una **cola de revisión** durante aproximadamente una semana antes de reflejarse en tu cuenta.
- Eliminar o editar ascensos, las cuentas privadas y las importaciones históricas pueden hacer que el recuento local y theCrag queden desincronizados.
- **No** inventamos puntos de edición a partir de marcas de primera ascensión o créditos de equipador de vías — esas actividades pueden otorgar karma en theCrag, pero las reglas de puntuación son de una por nodo por tipo de contribución y no disponemos de tu historial de ediciones.

## Cuándo puede mejorar esto

Si theCrag añade el karma (o los totales de ascensos/ediciones) a la carga útil de la cuenta del libro de vías o a un endpoint documentado para escaladores con el que nos podamos sincronizar de forma segura, Crag Stats podrá sustituir la estimación con los números reales y completar el recuadro de ediciones.
