# Popularidad de las vías

La tarjeta de **Popularidad de las vías** utiliza estadísticas de la comunidad que theCrag guarda en caché para cada vía: **número de ascensiones**, **popularidad** y **popularidad relativa** (0–100). Crag Stats los almacena cuando se ejecuta la importación de datos de vías (`ROUTE_DATA_IMPORT=true` en el servidor, después reinicia y sincroniza).

## Vías muy transitadas vs. poco transitadas

Para cada ascensión en la que existan datos de popularidad, comparamos la **popularidad relativa** cuando esté presente; de lo contrario, la **popularidad global**:

| Categoría            | Regla              |
| -------------------- | ------------------ |
| **Muy transitadas**  | Puntuación ≥ 50    |
| **Poco transitadas** | Puntuación &lt; 50 |

La tarjeta muestra qué **proporción de esos encadenes** cae en cada categoría. Las ascensiones en vías sin estadísticas en caché quedan excluidas de los porcentajes.

## Joyas ocultas

Las **joyas ocultas** son **encadenes** en vías que están bien valoradas (`qualityScore` ≥ 70, o al menos ★★★, o una etiqueta de buena calidad en tu encadene) y son tranquilas (**número de ascensiones** de la comunidad ≤ 100 y puntuación de popularidad &lt; 50). Se enumeran hasta tres vías distintas, ordenadas por calidad.

## Libro de vías

Ordena por **Pop.** para clasificar los encadenes según la popularidad de la vía (las más altas primero por defecto). Las filas sin estadísticas en caché se ordenan al final.

## Fuente

Los números proceden de la API de vías de theCrag (`show=info`). Reflejan a toda la comunidad, no solo a tu libro de vías.

La popularidad utiliza la popularidad relativa cuando está disponible y, en su defecto, la popularidad global. El número de ascensiones de la comunidad se muestra por separado y nunca se compara numéricamente con las puntuaciones de popularidad.

Para mantener actualizados los totales de ascensiones de la comunidad, la popularidad y las valoraciones, el propietario del servidor puede establecer `ROUTE_DATA_REFRESH_DAYS` en un número entero de días entre 30 y 3650 (p. ej. se recomienda `90`, o `180` para unos seis meses), con `ROUTE_DATA_IMPORT=true`. Estos son intervalos de días móviles. Tras sincronizar con éxito el libro de vías, las vías nuevas tienen prioridad, y después se actualizan las consultas almacenadas más antiguas dentro del mismo límite de 100 vías y ritmo de actualización. Resolver una acumulación de datos pendientes puede requerir varias sincronizaciones. Si no se define, es `0`, es menor de 30 o mayor de 3650, se mantiene la caché por defecto de consulta única; la opción **Actualizar todo** sigue disponible en Ajustes.
