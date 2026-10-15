# Consulta de propuestas

Módulo estático en `/quotes/`, integrado con `styles.css`, el monograma `hp_`, la paleta, las fuentes del sistema y `assets/firma.png` existentes. No requiere paquetes, compilación ni servicios externos. Los estilos y scripts propios están en `quotes/quotes.css`, `quotes/quotes.js` y `quotes/proposal.js`. La portada tiene un enlace discreto en el pie.

## Identificadores

- **CustomerKey:** entre 1 y 48 caracteres ASCII: letras `a-z`, números `0-9` y guiones simples entre grupos alfanuméricos. Ejemplos: `cliente-demo`, `demo2`. Se eliminan espacios al inicio/final y se convierte a minúsculas. Los espacios internos se rechazan; no se fusionan ni se convierten en guiones.
- **PIN:** texto de 4 a 12 dígitos ASCII `0-9`. No se eliminan espacios ni se convierte a número. `0123` es diferente de `123` (este último es inválido por longitud).
- Se rechazan acentos, guiones al principio/final o repetidos, puntos, barras, contrabarras, `%`, escapes codificados, signos y caracteres Unicode parecidos a los permitidos. Nunca se decodifica la entrada. Estas reglas impiden salir de `/quotes/{customerkey}/{pin}.html` mediante el formulario.
- El navegador solicita solo la ruta construida. No hay listado, catálogo, búsqueda de carpetas ni API de GitHub. Un GET verifica un HTML disponible antes de navegar. 404/410 se muestran como combinación inexistente; otros estados HTTP o contenido inesperado como indisponibilidad temporal; fallos de conexión y espera mayor a 12 segundos como error de conexión. El servidor conserva la responsabilidad de sus respuestas HTTP.

## Agregar una propuesta

1. Elige identificadores que cumplan las reglas; usa el CustomerKey en minúsculas también en disco. Usa identificadores opacos si quieres reducir información en los nombres, sin considerarlos secretos seguros.
2. Crea `quotes/{customerkey}/` y copia `_templates/proposal.html` a `quotes/{customerkey}/{pin}.html`. Conserva el PIN y sus ceros en el nombre. No copies la plantilla sin completar a la carpeta pública.
3. Sustituye **todos** los `{{campos}}`, incluidos título, fechas ISO, cliente, folio, vigencia, alcance, hitos, importes, moneda, impuestos y pagos. Escapa texto HTML (`&` como `&amp;`, `<` como `&lt;`). Conserva `noindex`, `no-referrer`, recursos compartidos, enlaces de regreso y estilos de impresión. Revisa cifras, vigencia y datos antes de publicar.
4. Comprueba la propuesta en móvil y en la vista de impresión A4. El botón **Imprimir / PDF** abre la impresión del navegador; desactiva sus encabezados y pies automáticos para evitar URL, fecha y título añadidos por el navegador. Los estilos ocultan la navegación, repiten cabeceras de tabla y evitan dividir filas y firma; un bloque mayor que una hoja necesariamente puede dividirse.
5. Comparte `https://hazaelperez.com/quotes/` junto con CustomerKey y PIN, o el enlace directo. El formulario no envía los campos como parámetros de consulta y borra el PIN al volver desde una propuesta.

Ejemplo funcional **totalmente ficticio**: CustomerKey `protexa`, PIN `0123`, archivo `/quotes/protexa/0123.html`. `protexa` es únicamente el identificador de prueba solicitado; el cliente mostrado, Empresa Horizonte Demo, y todas las condiciones son inventados y no representan a ninguna empresa real. No se muestra este ejemplo ni un catálogo en la pantalla de consulta.

## Publicación y rutas

La estructura existente tiene `index.html` y `CNAME` (`hazaelperez.com`) en la raíz, sin workflow ni paquete de compilación. `build.py` únicamente genera una copia autónoma del sitio principal; no publica ni empaqueta las propuestas. La configuración remota de Pages no está versionada, por lo que debe confirmarse en GitHub antes de publicar: **Deploy from a branch**, rama aprobada, carpeta **/ (root)**. Este trabajo queda en una rama local para revisión; no hace push ni despliega.

GitHub Pages resuelve `/quotes` con redirección a `/quotes/` y sirve `quotes/index.html`. Cada propuesta es un archivo HTML real: admite enlace directo y recarga sin reglas SPA, redirecciones JavaScript ni página 404 especial. Los recursos parten de `/` porque el dominio personalizado publica este proyecto en la raíz. Para usar un dominio con subcarpeta habría que adaptar esos prefijos.

No existe sitemap en el proyecto y este módulo no crea uno. `_config.yml` excluye documentación, pruebas y plantillas de la publicación Jekyll y fija `sitemap: false` para `quotes` si se incorpora `jekyll-sitemap`. Si se añade otro generador de sitemap, excluir expresamente **todo `/quotes/`** y verificar su salida. La plantilla queda fuera de publicación en `_templates/`. Tanto consulta como propuestas incluyen `noindex, nofollow, noarchive`. No se usa `Disallow: /quotes/` en robots.txt: impedir el rastreo podría impedir que el buscador lea `noindex`.

## Privacidad y segunda versión

Acceso por conocimiento de la combinación, **sin autenticación ni autorización**. El PIN forma parte de la URL y puede quedar en historial, registros, enlaces compartidos o herramientas del usuario. Los archivos, nombres e historial del repositorio son visibles si este es público. `noindex` es una indicación para buscadores, no impide acceso directo, copia, descubrimiento ni enumeración. No incluir información confidencial en esta versión; no añadir contraseñas, hashes o listas de acceso en JavaScript. La política `no-referrer` evita enviar la ruta como Referer desde estas páginas.

Una versión privada requiere backend o funciones de servidor fuera de GitHub Pages, autenticación real, sesiones y autorización por cliente/propuesta en **cada** solicitud. Guardar documentos en almacenamiento privado y servirlos tras esa validación (o mediante enlaces firmados breves), añadir límites de intentos y auditoría, y retirar archivos sensibles de la publicación y de repositorios públicos. Ocultar un archivo ya publicado no elimina copias ni su historial.

## Verificación local

Desde la raíz: `python -m http.server 8000 --bind 127.0.0.1`. Abrir `http://127.0.0.1:8000/quotes/`. Para las pruebas automáticas sin dependencias: `node --test tests/quotes.test.cjs`. El servidor local estándar sirve también directorios que Jekyll excluye; úsalo únicamente para desarrollo local.

Revisar: `PROTEXA` con espacios exteriores y `0123` abre la muestra; un PIN inexistente da mensaje sin navegación; `../`, barras, `%2f`, Unicode y espacios internos son inválidos; un fallo de red permite reintentar; doble envío genera una sola consulta; mostrar/ocultar PIN funciona con teclado; regreso, enlaces directos y recarga funcionan; no hay desbordamiento en móvil; PDF legible sin navegación. Las pruebas locales no sustituyen la comprobación final de rutas y cabeceras HTTP en el despliegue aprobado de GitHub Pages.

## Resultado de validación — 15 de octubre de 2026

- Rama local: `codex/quotes-module`; cambios disponibles para revisión, sin commit, push, fusión ni publicación.
- Ocho pruebas automáticas aprobadas con Node: normalización y ceros iniciales; límites y entradas maliciosas (incluido Unicode que podría transformarse en ASCII); 404/410 frente a fallos HTTP; contenido no HTML; fallo de red y reintento; timeout; doble envío y restauración al volver; visibilidad accesible del PIN; recursos, metadatos y plantilla.
- Sintaxis JavaScript y `git diff --check` aprobados.
- Servidor HTTP local: `/quotes` responde 301 hacia `/quotes/`; la propuesta directa responde 200; una propuesta inexistente responde 404.
- Navegador local: acceso real con `  PROTEXA  ` y `0123`, recarga del documento directo, enlace de regreso, combinación inexistente, rechazo de `../`, foco en campo inválido y acceso por Tab al control del PIN. El árbol de accesibilidad muestra etiquetas, pistas y mensajes de estado. No se realizó una sesión con lector de pantalla externo.
- Revisión visual de consulta y propuesta en escritorio y móvil. Sin desbordamiento horizontal a anchos de ventana de 320 y 390 px. Firma cargada correctamente. Portada y enlace de propuestas en inglés funcionan; sin errores de consola en esa comprobación.
- Impresión: estilos A4 revisados y botón conectado al diálogo de impresión; el diálogo impidió completar la inspección visual del PDF en el navegador automatizado. **Pendiente antes de publicar:** revisar paginación y firma en la vista previa de impresión de un navegador de escritorio y comprobar rutas en el despliegue real de Pages. No se accedió a la configuración remota de GitHub.

Archivos agregados: `quotes/index.html`, `quotes/quotes.css`, `quotes/quotes.js`, `quotes/proposal.js`, `quotes/protexa/0123.html`, `_templates/proposal.html`, `_config.yml`, `tests/quotes.test.cjs` y este documento. Cambios puntuales en `index.html` (enlace en pie), `script.js` (traducción del enlace) y `README.md` (guía del módulo).
