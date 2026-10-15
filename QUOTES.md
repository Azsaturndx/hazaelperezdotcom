# Consulta de propuestas

Módulo estático en `/quotes/`, integrado con `styles.css`, el monograma `hp_`, la paleta, las fuentes del sistema y `assets/firma.png` existentes. No requiere instalación, compilación ni servicios externos. La única dependencia de ejecución es una copia local versionada de jsPDF para exportar PDF. Los estilos y scripts propios están en `quotes/quotes.css`, `quotes/quotes.js`, `quotes/proposal.js` y `quotes/proposal-pdf.js`. La portada tiene un enlace discreto en el pie.

## Identificadores

- **CustomerKey:** entre 1 y 48 caracteres ASCII: letras `a-z`, números `0-9` y guiones simples entre grupos alfanuméricos. Ejemplos: `cliente-demo`, `demo2`. Se eliminan espacios al inicio/final y se convierte a minúsculas. Los espacios internos se rechazan; no se fusionan ni se convierten en guiones.
- **PIN:** texto de 4 a 12 dígitos ASCII `0-9`. No se eliminan espacios ni se convierte a número. `0123` es diferente de `123` (este último es inválido por longitud).
- Se rechazan acentos, guiones al principio/final o repetidos, puntos, barras, contrabarras, `%`, escapes codificados, signos y caracteres Unicode parecidos a los permitidos. Nunca se decodifica la entrada. Estas reglas impiden salir de `/quotes/{customerkey}/{pin}.html` mediante el formulario.
- El navegador solicita solo la ruta construida. No hay listado, catálogo, búsqueda de carpetas ni API de GitHub. Un GET verifica un HTML disponible antes de navegar. 404/410 se muestran como combinación inexistente; otros estados HTTP o contenido inesperado como indisponibilidad temporal; fallos de conexión y espera mayor a 12 segundos como error de conexión. El servidor conserva la responsabilidad de sus respuestas HTTP.

## Agregar una propuesta

1. Elige identificadores que cumplan las reglas; usa el CustomerKey en minúsculas también en disco. Usa identificadores opacos si quieres reducir información en los nombres, sin considerarlos secretos seguros.
2. Crea `quotes/{customerkey}/` y copia `_templates/proposal.html` a `quotes/{customerkey}/{pin}.html`. Conserva el PIN y sus ceros en el nombre. No copies la plantilla sin completar a la carpeta pública.
3. Sustituye **todos** los `{{campos}}`, incluidos título, fechas ISO, cliente, folio, vigencia, resumen, etapas, actividades, horas, costos, moneda, impuestos y pagos. Escapa texto HTML (`&` como `&amp;`, `<` como `&lt;`). Conserva `noindex`, `no-referrer`, scripts locales, recursos compartidos, clases de estructura, enlaces de regreso y estilos. Revisa cifras, vigencia y datos antes de publicar.
4. Comprueba la propuesta en móvil y pulsa **Export to PDF**. Se genera y descarga directamente `Propuesta-{folio}.pdf` en formato A4; no se abre impresión. Confirma que el archivo incluye todas las actividades, importes y firma. La descarga es administrada por el navegador: puede pedir ubicación si el usuario tiene configurada esa preferencia.
5. Comparte `https://hazaelperez.com/quotes/` junto con CustomerKey y PIN, o el enlace directo. El formulario no envía los campos como parámetros de consulta y borra el PIN al volver desde una propuesta.

Ejemplo funcional **totalmente ficticio**: CustomerKey `protexa`, PIN `0123`, archivo `/quotes/protexa/0123.html`. `protexa` es únicamente el identificador de prueba solicitado; el cliente mostrado, Empresa Horizonte Demo, y todas las condiciones son inventados y no representan a ninguna empresa real. No se muestra este ejemplo ni un catálogo en la pantalla de consulta.

## Consulta con dirección visible fija

Desde `/quotes/`, el formulario verifica la propuesta y después la carga en un iframe del mismo origen. La dirección principal permanece en `/quotes/`; no se navega a la ruta de la propuesta ni se usa `replaceState` para ocultarla después. La propuesta conserva su propio encabezado, estilos y botón Export to PDF, sin duplicar la cabecera/pie de la consulta. El iframe tiene un título accesible y ajusta su altura al contenido mediante ResizeObserver, también al desplegar o colapsar etapas, para mantener un solo desplazamiento vertical.

El estado **“Buscando tu propuesta…”** permanece visible al menos 500 ms, en paralelo con la comprobación HTTP. Si existe, **“Navegando a la propuesta…”** permanece otros 500 ms como mínimo, mientras se carga el iframe. Si la red tarda más, se conserva el estado hasta que termine la operación. El formulario sigue bloqueado durante ambos estados. Hay un límite de 12 segundos para la comprobación y otro para cargar el documento; los errores permiten reintentar.

Los enlaces “Volver a consulta” dentro de la propuesta cierran el iframe, borran el PIN y devuelven el foco al CustomerKey sin modificar la dirección principal. La navegación al inicio del sitio sale del iframe. El PDF se genera en el documento de la propuesta y su Blob se entrega mediante un evento local al contenedor, que inicia la descarga desde la página principal. Los enlaces directos a propuestas conservan su descarga autónoma y siguen funcionando.

Al recargar `/quotes/` se muestra el formulario: no se guarda la combinación en localStorage, sessionStorage ni parámetros. Para probar este flujo localmente, usa el servidor HTTP descrito abajo; abrir `index.html` por `file://` no sirve para consultar las propuestas con sus recursos y permisos de origen.

Esto es una mejora de presentación, **no una protección de acceso**. La ruta real continúa en el atributo src del iframe, las solicitudes de red y los archivos del repositorio. Puede descubrirse y abrirse directamente. La política no-referrer se conserva en el iframe y las propuestas.

## Estructura comercial y edición

La propuesta comienza con cliente, folio, fecha y vigencia. El resumen destaca honorarios únicos, gasto mensual y anual de nube y licenciamiento, entendimiento de requerimientos, solución y beneficios incluidos sin cargos adicionales de servicios. Aclara cuáles beneficios están cubiertos por los honorarios y evita prometer consumo o suscripciones sin costo.

Cada `<details class="milestone">` representa una etapa. En su `<summary>` se muestran nombre, periodo, horas totales y monto de la etapa; la tabla interior contiene **solo actividad y horas**, sin precios unitarios. Duplica o elimina bloques completos para adaptar el proyecto y conserva las clases `milestone-label`, `milestone-hours` y `milestone-amount`. El control nativo permite abrir y cerrar con clic, Enter o Espacio, también sin JavaScript.

Nube y licenciamiento tienen tablas separadas con producto, categoría, descripción, costo mensual y anual, y un subtotal en `<tfoot>`. Duplica o elimina filas de `<tbody>`. La moneda se define con `{{moneda}}` en la plantilla: reemplaza **todas** sus apariciones por la misma moneda ISO. El ejemplo usa MXN.

Las cifras son texto editorial, no una calculadora: al editar, concilia horas de actividades con su etapa, montos de etapas con honorarios y filas de productos con sus subtotales y highlights. Indica expresamente si el anual equivale a 12 mensualidades o incorpora otra condición. No sumes una inversión única al gasto mensual ni mezcles monedas sin explicar conversión y fecha. Mantén consistentes IVA, anticipos y saldo. El cierre incluye un mensaje breve, “Atentamente,”, firma y nombre.

## Exportación directa a PDF

`proposal-pdf.js` lee el **mismo HTML** de la propuesta: no hay otro archivo de precios ni captura raster de la página. Genera texto vectorial seleccionable, tarjetas, tablas, todas las actividades (aunque estén colapsadas), numeración de páginas y firma. El estilo del PDF usa papel blanco, tinta oscura y acentos verdes de la marca. La firma existente se adapta a tinta oscura sobre blanco sin alterar sus trazos. No se incluyen controles, enlaces de navegación ni instrucciones para desplegar etapas.

`proposal.js` convierte el resultado a Blob, inicia la descarga, evita doble clic durante la generación y libera el recurso temporal. Si falla la biblioteca o la firma, muestra un mensaje para reintentar y no descarga un documento incompleto. Todo sucede localmente; solo se solicitan scripts e imágenes del mismo sitio, sin subida del contenido, CDN ni conversión en un servidor. El nombre descargado usa el folio normalizado, sin CustomerKey ni PIN.

La biblioteca es `jspdf@4.2.1`, con licencia MIT incluida en `quotes/vendor/jspdf.LICENSE`; procedencia e integridad en `quotes/vendor/README.md`. No usa los complementos opcionales de HTML, html2canvas o AutoTable. El motor divide descripciones extensas entre páginas y repite los encabezados de tabla; conserva el cierre y la firma juntos. Mantén las clases de la plantilla si quieres que nuevas propuestas se exporten con la misma estructura. Si agregas un bloque especial, añade soporte y verifica el PDF. Las fuentes estándar cubren español y caracteres latinos; para otros alfabetos o emojis hace falta integrar una fuente adecuada. El PDF tiene texto seleccionable pero no etiquetas estructurales PDF/UA; la experiencia accesible principal es el HTML.

El PDF exportado es otra copia del documento: también debe tratarse con la misma discreción que la URL pública. `output/` y `tmp/` son carpetas locales de validación excluidas de Git y de Pages; no se añaden PDFs al directorio público de clientes.

## Publicación y rutas

La estructura existente tiene `index.html` y `CNAME` (`hazaelperez.com`) en la raíz, sin workflow ni paquete de compilación. `build.py` únicamente genera una copia autónoma del sitio principal; no publica ni empaqueta las propuestas. La configuración remota de Pages no está versionada, por lo que debe confirmarse en GitHub antes de publicar: **Deploy from a branch**, rama aprobada, carpeta **/ (root)**. Este trabajo queda en una rama local para revisión; no hace push ni despliega.

GitHub Pages resuelve `/quotes` con redirección a `/quotes/` y sirve `quotes/index.html`. Cada propuesta es un archivo HTML real: admite enlace directo y recarga sin reglas SPA, redirecciones JavaScript ni página 404 especial. Los recursos parten de `/` porque el dominio personalizado publica este proyecto en la raíz. Para usar un dominio con subcarpeta habría que adaptar esos prefijos.

No existe sitemap en el proyecto y este módulo no crea uno. `_config.yml` excluye documentación, pruebas y plantillas de la publicación Jekyll y fija `sitemap: false` para `quotes` si se incorpora `jekyll-sitemap`. Si se añade otro generador de sitemap, excluir expresamente **todo `/quotes/`** y verificar su salida. La plantilla queda fuera de publicación en `_templates/`. Tanto consulta como propuestas incluyen `noindex, nofollow, noarchive`. No se usa `Disallow: /quotes/` en robots.txt: impedir el rastreo podría impedir que el buscador lea `noindex`.

## Privacidad y segunda versión

Acceso por conocimiento de la combinación, **sin autenticación ni autorización**. El PIN forma parte de la URL y puede quedar en historial, registros, enlaces compartidos o herramientas del usuario. Los archivos, nombres e historial del repositorio son visibles si este es público. `noindex` es una indicación para buscadores, no impide acceso directo, copia, descubrimiento ni enumeración. No incluir información confidencial en esta versión; no añadir contraseñas, hashes o listas de acceso en JavaScript. La política `no-referrer` evita enviar la ruta como Referer desde estas páginas.

Una versión privada requiere backend o funciones de servidor fuera de GitHub Pages, autenticación real, sesiones y autorización por cliente/propuesta en **cada** solicitud. Guardar documentos en almacenamiento privado y servirlos tras esa validación (o mediante enlaces firmados breves), añadir límites de intentos y auditoría, y retirar archivos sensibles de la publicación y de repositorios públicos. Ocultar un archivo ya publicado no elimina copias ni su historial.

## Verificación local

Desde la raíz: `python -m http.server 8000 --bind 127.0.0.1`. Abrir `http://127.0.0.1:8000/quotes/`. Para las pruebas automáticas sin instalar paquetes: `node --test tests/quotes.test.cjs tests/proposal.test.cjs`. El servidor local estándar sirve también directorios que Jekyll excluye; úsalo únicamente para desarrollo local.

Revisar: `PROTEXA` con espacios exteriores y `0123` abre la muestra; un PIN inexistente da mensaje sin navegación; `../`, barras, `%2f`, Unicode y espacios internos son inválidos; un fallo de red permite reintentar; doble envío genera una sola consulta; mostrar/ocultar PIN funciona con teclado; regreso, enlaces directos y recarga funcionan; no hay desbordamiento en móvil; PDF legible sin navegación. Las pruebas locales no sustituyen la comprobación final de rutas y cabeceras HTTP en el despliegue aprobado de GitHub Pages.

## Validación de acceso inicial — 15 de octubre de 2026

- Rama de trabajo: `codex/quotes-module`.
- Ocho pruebas automáticas aprobadas con Node: normalización y ceros iniciales; límites y entradas maliciosas (incluido Unicode que podría transformarse en ASCII); 404/410 frente a fallos HTTP; contenido no HTML; fallo de red y reintento; timeout; doble envío y restauración al volver; visibilidad accesible del PIN; recursos, metadatos y plantilla.
- Sintaxis JavaScript y `git diff --check` aprobados.
- Servidor HTTP local: `/quotes` responde 301 hacia `/quotes/`; la propuesta directa responde 200; una propuesta inexistente responde 404.
- Navegador local: acceso real con `  PROTEXA  ` y `0123`, recarga del documento directo, enlace de regreso, combinación inexistente, rechazo de `../`, foco en campo inválido y acceso por Tab al control del PIN. El árbol de accesibilidad muestra etiquetas, pistas y mensajes de estado. No se realizó una sesión con lector de pantalla externo.
- Revisión visual de consulta y propuesta en escritorio y móvil. Sin desbordamiento horizontal a anchos de ventana de 320 y 390 px. Firma cargada correctamente. Portada y enlace de propuestas en inglés funcionan; sin errores de consola en esa comprobación.
- La exportación directa posterior sustituye el botón de impresión de la versión inicial; su resultado se describe a continuación. La comprobación de rutas en el despliegue real de Pages sigue pendiente de una publicación aprobada. No se accedió a la configuración remota de GitHub.

Archivos agregados: `quotes/index.html`, `quotes/quotes.css`, `quotes/quotes.js`, `quotes/proposal.js`, `quotes/protexa/0123.html`, `_templates/proposal.html`, `_config.yml`, `tests/quotes.test.cjs` y este documento. Cambios puntuales en `index.html` (enlace en pie), `script.js` (traducción del enlace) y `README.md` (guía del módulo).

## Validación de resumen, etapas y PDF — 15 de octubre de 2026

- Actualizados ejemplo y plantilla con resumen de precios/requerimientos/solución/valor incluido, etapas colapsables, actividades con horas, tablas de nube y licencias, impuestos/pago y cierre con firma.
- **14 pruebas automáticas aprobadas**: las ocho de acceso y seis adicionales para conciliación de importes/horas, sumas mensuales/anuales, PDF real con texto y firma, paginación de tablas y descripciones mayores a una página, control de doble exportación, liberación del Blob y recuperación ante recursos no disponibles.
- En navegador de escritorio: expandir/colapsar con clic, Enter y Espacio; descarga real `Propuesta-DEMO-2026-001.pdf` con todas las etapas colapsadas y sin diálogo de impresión. El PDF incluye las nueve actividades completas.
- PDF real: cuatro páginas A4 (~19 KB), autor y folio correctos, texto seleccionable, firma visible y numeración. Renderizadas e inspeccionadas las cuatro páginas; comprobados contenido y límites de texto con extracción independiente. Se ajustó paginación para mantener el encabezado de actividades con su primera etapa.
- En móvil de 390 px: etapas y precios legibles, sin desbordamiento global; las tablas de cinco columnas desplazan horizontalmente dentro de una región etiquetada accesible por teclado. Verificación adicional a 320 px.
- Nuevos archivos: `quotes/proposal-pdf.js`, `quotes/vendor/jspdf-4.2.1.umd.min.js`, su licencia/procedencia, `tests/proposal.test.cjs` y `.gitignore`. También se actualizaron `quotes/proposal.js`, `quotes/quotes.css`, ejemplo, plantilla, `_config.yml` y esta guía. No se hizo push, fusión ni despliegue durante esta actualización.

## Validación de vista incrustada — 15 de octubre de 2026

- **18 pruebas automáticas aprobadas**: se conservaron las comprobaciones de acceso/PDF y se añadieron estados con temporizadores controlados, visibilidad y foco del contenedor, crecimiento/reducción del iframe, retorno sin navegación, fallo de carga recuperable y entrega del PDF al contenedor.
- Navegador local: `protexa` / `0123` muestra la propuesta dentro de `/quotes/`; dirección principal comprobada sin ruta ni PIN. Al abrir/cerrar la segunda etapa, la altura cambió de 4880 a 5111 px y regresó a 4880 px en el ancho de prueba.
- Descarga real de PDF desde el iframe, iniciada por la página principal; el navegador recibió el archivo. Regreso al formulario comprobado con foco en CustomerKey y PIN vacío. Recarga devuelve el formulario. Combinación inexistente permanece en `/quotes/` con su mensaje de error.
- Modificados `quotes/index.html`, `quotes/quotes.js`, `quotes/quotes.css`, `quotes/proposal.js`, las dos suites de pruebas y esta guía. Sin cambios de autenticación, dependencias nuevas, push, fusión o despliegue.
