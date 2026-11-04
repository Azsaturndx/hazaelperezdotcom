# Misión Aurora

Página familiar independiente en `/aurora/`. GitHub Pages sirve `aurora/index.html` desde la raíz del repositorio; no requiere build ni paquetes nuevos. No está enlazada desde la portada, menús, CV, consola o propuestas. Integración y publicación en `main` autorizadas por el titular el 4 de noviembre de 2026.

## Actualizar el nacimiento

Editar **solo `aurora/config.js`**:

```js
birthDate: '2026-11-11',
birthTime: '00:00',
timeZone: 'America/Mexico_City',
letterCount: 31
```

La hora de las 00:00 es provisional. Sustituir fecha y hora por las reales cuando se conozcan. La aplicación resuelve ese horario mediante `Intl` y la zona IANA, no mediante el horario local del visitante. Los cumpleaños se abren al alcanzar también la hora configurada. No cambiar `letterCount` salvo que se agreguen o retiren archivos de cartas.

El paso a «bienvenida» es automático **por fecha configurada**: no verifica que haya ocurrido el nacimiento. No hay integración médica. La exactitud depende también del reloj del dispositivo. No usar este contador para tomar decisiones médicas.

- Antes de ese instante: días, horas, minutos y segundos restantes; cartas ocultas.
- Durante el día civil de la fecha configurada en Ciudad de México: mensaje «Es hoy» para Aurora y mamá. Al alcanzar la hora, el contador queda en cero durante ese día y aparece también la edad. Si la fecha real cambia, este día especial sigue la nueva fecha.
- Después: bienvenida, fecha y hora configuradas y edad en años, meses y días; el contador deja de mostrarse.
- Desde el nacimiento: introducción a las cartas. Ningún enlace hasta el primer cumpleaños.
- Cada cumpleaños: se incorpora su carta conservando las anteriores. Desde los 31: quedan las 31 cartas y la edad continúa aumentando.

La edad se calcula por calendario, no dividiendo milisegundos entre 365 días. Para el 29 de febrero, un aniversario en año no bisiesto se considera el 28 de febrero. Los meses se anclan al día de nacimiento, limitado al último día del mes de destino. Las unidades representan periodos completos desde la hora configurada.

## Cartas

`aurora/cartas/01/index.html` contiene una carta para el primer cumpleaños, redactada desde la espera, sin inventar recuerdos futuros. Los archivos `02` a `31` contienen mensajes honestos de espera: no son cartas futuras ya escritas.

Para escribir una carta, editar su `<article class="letter-body">` y el subtítulo; retirar la clase `letter-placeholder` cuando deje de ser un mensaje pendiente. Conservar título, metadatos `noindex` y enlaces de regreso. No hace falta agregar enlaces a mano: la página incorpora los de cumpleaños cumplidos. La carta 01 se enlazará por primera vez el **11 de noviembre de 2027 a las 00:00 de Ciudad de México**, con la configuración inicial.

Cada carta es HTML completo, legible y recargable por enlace directo, incluso sin JavaScript.

## Fotografías

Solo se incluyeron seis copias optimizadas en `aurora/images/*.webp` (aproximadamente 414 KB en total). Los originales entregados en archivos temporales no se modificaron ni se copiaron al repositorio. Se omitieron la selfie duplicada y una toma de ecografía similar. La foto de los pies en la sala de espera no fue recibida y no se inventó ni sustituyó.

- `rostro.webp`: primer retrato de ecografía, portada.
- `inicio.webp`: primeras ecografías en cuatro paneles.
- `papas.webp`: los papás en el elevador.
- `visita.webp`: mamá en una visita, monitores sin información visible.
- `creciendo.webp`: otro retrato de ecografía.
- `nosotros.webp`: imagen de la historia de sus papás, sin atribuirle una fecha o un evento específico.

Se utilizó la herramienta integrada de edición de imágenes para retirar encabezados y superposiciones en las ecografías y ocultar las pantallas en la visita. **Son copias editadas para un recuerdo familiar, no documentos médicos ni reproducciones garantizadas píxel por píxel.** Los originales permanecen intactos fuera del proyecto. Se revisaron visualmente las copias para comprobar la ausencia de nombres y encabezados. Antes de publicar, el titular debe aprobar las fotografías familiares y sus ediciones.

Prompts utilizados (edición integrada, no API/CLI):

- Retratos: «Remove every text overlay, names, dates and medical labels from the top strip and edges with plain black; preserve the central ultrasound, no beautification, reconstruction or invented anatomy; no added text or watermark.»
- Ecografías iniciales: «Privacy-redact all header strips, names, dates, clinic names and medical measurement labels in all four panels with opaque black rectangles; preserve the ultrasound pictures, no enhancement or reconstruction.»
- Visita: «Privacy-redact the two monitor screens and console text with opaque dark neutral regions; preserve the person, pose, clothing and room; no retouching or invented scene.»

Se convirtieron las copias a WebP con `sharp` ya disponible en el entorno, sin agregar dependencias al sitio. La conversión omite EXIF, XMP e IPTC. Las pruebas comprueban también la ausencia de esos metadatos. Para reemplazar fotos: preparar primero una copia sin información personal o médica visible, quitar metadatos, optimizar y reemplazar solo el WebP correspondiente; ajustar el texto alternativo si cambia la escena. No añadir originales clínicos al repositorio.

## Privacidad: no es una página privada

Ocultar los enlaces y añadir `noindex` evita promover la página, **no restringe su acceso**. La configuración `_config.yml` excluye toda la carpeta `aurora` si se habilita un sitemap de Jekyll en el futuro; todos los HTML incluyen `noindex, nofollow, noarchive, noimageindex`. `AURORA.md` se excluye del despliegue de Jekyll, pero seguirá visible en un repositorio público.

Las fotografías, cartas, rutas, nombre y fecha serán accesibles directamente cuando se publiquen; también serán visibles en el código si el repositorio es público. Los buscadores pueden ignorar instrucciones. Las cartas futuras no tienen un bloqueo de acceso: **incluso la carta 01 puede leerse por su ruta antes del cumpleaños**. Cambiar el reloj del dispositivo también puede anticipar los enlaces. No colocar aquí información que deba permanecer secreta.

No hay autenticación ficticia, cookies, almacenamiento local, analítica, fuentes externas ni servicios de terceros. Para privacidad real y liberación no evadible se necesitarían archivos fuera del hosting público y una capa de servidor con identidad, autorización y fecha confiable.

## Pruebas y revisión

```powershell
node --test tests/aurora.test.cjs tests/cv.test.cjs tests/quotes.test.cjs tests/proposal.test.cjs tests/nic-mg.test.cjs tests/protexa.test.cjs
```

La suite de Aurora verifica: fecha/zona; segundo anterior y momento exacto de llegada; todo el día del mensaje para mamá; cambio al día siguiente; edad por calendario y plurales; ajuste de hora real; fin de mes y años bisiestos; resultado independiente de tres zonas de visitante; los 31 cumpleaños y el límite de enlaces; transición real del controlador del DOM y actualización al volver a la pestaña; archivos independientes, enlaces y recursos; no incorporación a navegación/sitemap; reglas de movimiento reducido/móvil/impresión; ausencia de metadatos de fotos.

Las pruebas de fecha se ejecutan con instantes simulados, sin alterar la fecha del sistema ni añadir parámetros de simulación a la página pública. Si cambia la fecha de nacimiento por la real, actualizar las expectativas de fecha fija de estas pruebas.

Revisión de navegador local: escritorio y móvil, proporciones/ausencia de desbordamiento, contador funcionando, carta 01 por enlace directo y visor de fotos con cierre Escape y restitución del foco. Hay estilos de movimiento reducido y de impresión; no se simuló una tecnología asistiva real ni se validó un PDF impreso.

Archivos del módulo: `aurora/index.html`, `aurora/aurora.css`, `aurora/config.js`, `aurora/time.js`, `aurora/aurora.js`, `aurora/mark.svg`, seis WebP y 31 cartas. Cambios fuera de esa carpeta: exclusión de sitemap y documentación en `_config.yml`; pruebas en `tests/aurora.test.cjs`; este documento. Sin cambios en la portada, CV ni propuestas. Flujo de integración solicitado: rama de trabajo, commit, push, pull request y merge a `main`.
