# Sincronización del libro de vías

Crag Stats obtiene tu libro de vías de una de estas dos formas:

- **Sincronización por API** con una clave de API de supporter de theCrag. Se ejecuta según la programación existente (`SYNC_CRON`, diaria por defecto), desde **Configuración → Sincronizar ahora** (abre **`/settings`**, o **`/login`** primero si `APP_PASSWORD` está configurado) y desde el worker de Docker. Una nueva instalación se sincroniza al iniciar cuando hay una clave configurada.
- **Carga manual de CSV**. Exporta tu libro de vías en theCrag y carga el archivo en **Configuración → Importación de CSV** cada vez que quieras actualizarlo.

## Copia de seguridad: guarda una copia local

Tu cuenta de theCrag sigue siendo la fuente principal de verdad para el libro de vías en vivo. Crag Stats almacena los encadenes sincronizados, la configuración, los objetivos, la caché de historial de vías, los días meteorológicos y el estado relacionado en **SQLite** (`DATABASE_PATH`, normalmente `./data/crag-stats.sqlite` o `/data/crag-stats.sqlite` en Docker). Haz una copia de seguridad del **volumen de datos** de Docker (o del directorio del host que montes en `/data`) junto con el resto de las copias de seguridad de tu homelab. Para obtener una copia de seguridad del archivo consistente, detén todas las aplicaciones y workers que utilicen esa base de datos, copia el volumen incluidos los archivos auxiliares `-wal` / `-shm`, y vuelve a iniciarlos. Copiar estos archivos uno a uno mientras hay procesos de escritura en ejecución puede producir una copia de seguridad inconsistente; usa una herramienta de copia de seguridad en línea compatible con SQLite si necesitas mantener la aplicación en funcionamiento. Compose ya mantiene la persistencia del volumen a través de las actualizaciones de imagen.

Para obtener una copia portátil en formato de hoja de cálculo, abre **Configuración → Privacidad y control de datos** y usa **Descargar CSV del libro de vías** (la misma acción que `/settings/export`). El archivo es un CSV similar al de theCrag de tu libro de vías local: vías, encadenes, compañeros, calidad, fechas y comentarios/notas. Las notas siempre se incluyen en esta descarga porque es tu copia de seguridad; trata el archivo como datos personales. Puedes volver a importarlo más tarde con **Configuración → Importación de CSV** (solo inserción/actualización — no elimina los encadenes que falten en el archivo). Descarga un CSV antes de **Borrar todos los datos locales** si quieres tener una alternativa mientras los reconstruyes desde theCrag; aun así, una copia de seguridad del volumen sigue siendo la vía completa de restauración.

El CSV de Configuración proviene de Crag Stats, no es una extracción en vivo de theCrag. Para una copia de seguridad externa del propio libro de vías, utiliza también **Acción → Exportar libro de vías como CSV** en tu libro de vías en línea de theCrag.

## Qué ha importado una sincronización manual

Tras completarse con éxito **Sincronizar ahora** o **Resincronización completa**, Configuración muestra los encadenes procesados,
los nuevos encadenes, los encadenes existentes actualizados, las nuevas vías y los encadenes/vías eliminados.
Una vía compartida por varios encadenes cuenta como una sola vía nueva. «Actualizado» significa que se volvió a procesar un
encadene existente; no significa que su contenido haya cambiado.
Por lo tanto, un libro de vías sin cambios muestra cero adiciones/eliminaciones y los encadenes existentes
actualizados. Las ejecuciones omitidas y los errores muestran sus propios mensajes, no un resumen de éxito.

Las cargas manuales de CSV también muestran los recuentos de procesados/nuevos/actualizados, pero nunca eliminan
las entradas que faltan. Route data and weather enrichment are separate background
imports: when enabled, they start after every successful sync or CSV upload
(including uploads to `POST /api/logbook/csv`), and are not included in these
logbook counts. El resumen describe la acción del botón
completada; no es un historial de sincronización persistente.

## Sincronización por API

Configura `THECRAG_API_KEY` con tu clave de lectura del libro de vías de supporter. Cada sincronización lee el libro de vías completo y reconcilia los encadenes locales, incluidas las eliminaciones. Este modo proporciona datos más completos sobre vías, perfiles y vías de varios largos, y es la única forma en que Crag Stats consulta automáticamente tu libro de vías en theCrag.

### Si falla la sincronización por API

Configuración muestra el fallo y conserva la hora de la última sincronización correcta. El mensaje indica la causa cuando theCrag notifica una, seguida del código de error corto de theCrag (por ejemplo `invalid-api-key`):

- **Clave no válida:** theCrag ha rechazado `THECRAG_API_KEY`. Comprueba si contiene errores tipográficos o reemplázala si ha caducado o se ha revocado, y luego reinicia el servidor.
- **Acceso denegado:** la clave carece de acceso de lectura al libro de vías. Comprueba tu clave de supporter o carga manualmente la exportación CSV en su lugar (a continuación).
- **Límite de uso:** la clave ha alcanzado el límite de solicitudes de theCrag. Espera a que se restablezca y vuelve a sincronizar.

Si falla una página posterior, las actualizaciones de las páginas anteriores permanecen almacenadas en caché, pero no se elimina ningún encadene que falte ni se marca la ejecución como correcta. La siguiente ejecución programada (diaria por defecto) o **Sincronizar ahora** vuelve a intentar leer el libro de vías completo desde la página 1. Los fallos de la API no pausan la programación.

## Carga manual de CSV

¿No tienes clave de supporter? En theCrag, abre tu libro de vías y selecciona **Acción → Exportar libro de vías como CSV**, y luego carga el archivo en **Configuración → Importación de CSV**. Repite este proceso cada vez que quieras añadir nuevos encadenes.

Las cargas manuales añaden y actualizan encadenes, pero nunca eliminan aquellos que falten en el archivo. Para descartar encadenes eliminados, usa **Borrar todos los datos locales** y carga una nueva exportación. El CSV contiene menos campos que la API, con menos información del perfil, metadatos de vías y datos de vías de varios largos, y no incluye las notas privadas de ascensiones de theCrag (`privateMarkdown`); solo se importa la columna pública Comment. Los números simples de bloque en Australia usan el país / ruta como pista de AU para evitar que se conviertan en grados V falsos.

La importación de datos de vías compara las atribuciones FA/FFA con tu nombre de usuario de theCrag. La sincronización por API lo guarda desde tu perfil, y `THECRAG_USERNAME` se ignora en ese modo; una instalación solo por CSV lo establece en su lugar. Sin un nombre de usuario, la importación se detiene antes de obtener nada, así que configúralo (o marca las primeras ascensiones manualmente en el libro de vías).

## Libro de vías CSV con datos de vías

Puedes mantener el libro de vías en CSV y seguir disponiendo de datos de vías (popularidad, recuentos de ascensiones, calidad, estacionalidad, largos) y marcas automáticas FA/FFA. Configura:

- `CSV_INGEST_TOKEN`: un valor aleatorio largo. Es lo que permite que un contenedor o script te envíe una exportación CSV, por lo que también le indica a Crag Stats que las cargas son la fuente del libro de vías: no se ejecuta ninguna sincronización por API, por lo que los encadenes cargados nunca se eliminan y la sincronización nunca escribe el perfil de escalador del titular de la clave.
- `THECRAG_API_KEY`: tu clave de lectura del libro de vías de supporter, utilizada ahora solo para datos de vías y consultas de ubicación de escuelas/sectores.
- `THECRAG_USERNAME`: tu nombre de usuario de theCrag, para que el historial de FA/FFA coincida contigo (las exportaciones CSV no lo incluyen).

Esa es toda la configuración: tres valores, sin cambio de modo. Sin `CSV_INGEST_TOKEN`, `THECRAG_API_KEY` sincroniza el libro de vías y los datos de las vías comparten la misma clave. Background route and weather imports start after each successful sync or CSV upload, and also follow `IMPORT_CRON` (daily by default) rather than the logbook schedule, so a weekly or monthly `SYNC_CRON` still gets route data daily. Configuración → **Importar datos de vías** muestra el progreso e inicia una ejecución de forma manual.

## Cargar un CSV desde otro contenedor

Cargar manualmente está bien para actualizaciones ocasionales. Si guardas tu exportación en un lugar accesible desde tu red — una carpeta compartida, un recurso compartido de Nextcloud o Dropbox, o un pequeño contenedor auxiliar que suba cada nueva exportación — Crag Stats puede recibirla a través de HTTP. Configura `CSV_INGEST_TOKEN` con un valor aleatorio largo, reinicia y luego haz un `POST` del archivo:

```bash
curl -X POST https://cragstats.example.com/api/logbook/csv \
  -H "Authorization: Bearer $CSV_INGEST_TOKEN" \
  -H "Content-Type: text/csv" \
  --data-binary @thecrag-logbook.csv
```

Una carga multipart con el archivo en un campo `file` también funciona. Las solicitudes sin el token son rechazadas, y una respuesta correcta informa cuántos encadenes se procesaron y cuántos eran nuevos:

```json
{ "ok": true, "imported": 412, "created": { "routes": 318, "ascents": 412 } }
```

Para comprobar una instalación sin importar nada, envía un cuerpo que no sea una exportación:

```bash
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://cragstats.example.com/api/logbook/csv \
  -H "Authorization: Bearer $CSV_INGEST_TOKEN" \
  -H "Content-Type: text/csv" --data-binary 'x'
```

`400` significa que se puede acceder al endpoint y que el token fue aceptado: rechazó el cuerpo del mensaje, por lo que no se escribió nada. `401` significa que el token no coincidía, mientras que `404` significa que esa imagen es anterior a este endpoint. En una instalación con restricción de acceso a toda la interfaz (`AUTH_SCOPE=all`), una imagen más antigua responde `401` ante cualquier ruta `/api/` desconocida, por lo que debes interpretar `401` como "token o imagen".

Un archivo vacío, una página de inicio de sesión guardada por error o cualquier archivo de más de 25 MB se rechaza en lugar de importarse. Este endpoint realiza la misma importación de solo inserción/actualización que el formulario de Configuración, por lo que nunca elimina encadenes que falten en el archivo. No realiza ninguna solicitud a theCrag: la exportación aún debe proceder de tu propio navegador o de otra herramienta que controles.

## Por qué no hay descargas automáticas de CSV

Crag Stats nunca inicia sesión en el sitio web de theCrag ni descarga exportaciones por ti. theCrag exige en sus [términos](https://www.thecrag.com/terms#ownership-and-licenses) que todo acceso programático se realice mediante la API, y cada exportación es una copia completa del libro de vías que supone una carga considerable para sus servidores. Exportar y cargar el CSV tú mismo no supone ningún problema.
