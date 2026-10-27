# Hazael Pérez — Cloud con intención.

Sitio personal estático en HTML, CSS y JavaScript. Diseño oscuro con tarjetas translúcidas, iconografía de línea original, una esfera de arquitectura animada y microinteracciones discretas.

## Abrir

- **Archivo autónomo:** abre `Hazael_Perez.html`. Incluye CSS, JavaScript, fotografía e icono dentro del mismo archivo. No necesita conexión, servidor ni instalación.
- **Proyecto editable:** abre `index.html` y conserva a su lado `styles.css`, `script.js` y la carpeta `assets`.
- Para verlo con servidor local: `python3 -m http.server 8000`, desde esta carpeta; después abre `http://localhost:8000`.

## Interacciones

- **CV Digital:** `/cv/`, accesible desde la navegación de escritorio/móvil y desde la invitación al final de trayectoria. Página estática independiente con estilos de marca, navegación de secciones, lectura progresiva, experiencia desplegable y expansión global. No carga el script de la portada ni dependencias externas. El CV está en español; sus enlaces en la portada se traducen junto con la navegación existente.

- **Propuestas comerciales:** acceso desde el pie o `/quotes/`. Instrucciones, reglas, plantilla, privacidad y validación en [QUOTES.md](QUOTES.md).

- Botón EN / ES: cambia el idioma de la página y de la consola.
- Ctrl + K / ⌘ + K: abre la navegación rápida. Flechas y Enter permiten navegar; Escape cierra el diálogo.
- La sección de enfoque tiene cuatro etapas. También se puede recorrer con las flechas del teclado.
- La consola admite `help`, `about`, `stack`, `approach`, `contact` y `clear`. Es una interacción local: no ejecuta comandos del sistema ni envía consultas a terceros.
- Contacto abre `mailto:me@hazaelperez.com`. El botón de copiar usa el portapapeles cuando el navegador lo permite; si no, selecciona la dirección y explica cómo copiarla.
- El sitio respeta la preferencia de movimiento reducido y pausa la esfera cuando queda fuera de pantalla o la pestaña está oculta.

## Editar

- **Contenido en español:** `index.html`.
- **Contenido en inglés y texto del enfoque:** `script.js`, objetos `english` y `stages`.
- **Paleta y estilos:** variables de `:root` en `styles.css`.
- **Fotografía:** `assets/hazael-perez.jpg`.
- **Firma:** `assets/firma.png`, imagen adjunta original, sin modificar sus trazos.
- **Nombre, cargo y datos de contacto:** `index.html`; los textos de consola también están en `script.js`.
- **Distribución de clientes:** 50% Fortune 500, 30% Corporate & Enterprise y 20% SMBs de México. Modifica también el gráfico CSS y su etiqueta accesible si cambian estos porcentajes.
- Después de editar, ejecuta `python3 build.py` para reconstruir el HTML autónomo en esta carpeta.

## Contenido profesional

La descripción fue reescrita para este sitio, con enfoque en estrategia, arquitectura y economía cloud. `descripcion-profesional.md` contiene una versión reutilizable en español e inglés.

El perfil público identificado es [Geronimo Hazael Pérez Antonio](https://mx.linkedin.com/in/hazael-perez): Associate Director — CTA Cloud en Kyndryl, Monterrey. Una [publicación del titular](https://www.linkedin.com/posts/hazael-perez_after-six-years-at-bwd-and-one-at-inbest-activity-7308634636585189376-xhiB) confirma seis años en Big Wave Data y uno en iNBest. Se recuperó la fotografía pública de perfil. Se usó también el contexto profesional proporcionado por el titular. No se inventaron fechas exactas ni cargos anteriores que no pudieron verificarse.

Los porcentajes de clientes fueron indicados por el titular. No se incluyen nombres, logotipos de clientes ni detalles confidenciales. Los nombres de plataformas se usan únicamente para describir áreas de trabajo, sin sugerir un aval de sus fabricantes. La página expresa un perfil profesional personal.

No se modificó el perfil de LinkedIn ni se publicó el sitio. Sin backend, analítica, cookies de seguimiento, CDN, fuentes remotas o frameworks. El formulario de propuestas consulta únicamente archivos HTML del mismo sitio. Se puede alojar en cualquier hosting estático. El efecto de cristal utiliza `backdrop-filter`, con fondo alternativo para navegadores que no lo admitan.

## CV Digital: contenido y mantenimiento

- Contenido: `cv/index.html`; estilos específicos: `cv/cv.css`; mejoras progresivas: `cv/cv.js`. La paleta y tipografía se heredan de `styles.css`. El HTML mantiene información y navegación disponibles sin JavaScript. Las animaciones son sutiles, respetan movimiento reducido y no animan contadores ni simulan niveles de competencia.
- Fuentes: PDF «CV HazaelPerez2026.pdf» proporcionado por el titular (dos páginas), capturas de los cargos de iNBest y Kyndryl, información profesional ya existente en el sitio y aclaraciones del titular en esta conversación. No se consultaron ni modificaron perfiles externos.
- Actualización a octubre de 2026: Kyndryl desde mayo de 2026, iNBest de septiembre de 2024 a marzo de 2025. Onesec de marzo a julio de 2025, confirmado por el titular; no se asignó un cargo ni responsabilidades porque no se proporcionaron. Dotech de agosto de 2025 a abril de 2026: intervalo inferido **por instrucción explícita del titular** para situarlo entre Onesec y Kyndryl, no fechas verificadas documentalmente. Las etapas de Big Wave Data y la formación conservan los años del PDF.
- USD 19M+ describe valor de oportunidades acompañadas desde preventa, no ventas cerradas. 50+ corresponde a demos y pruebas de concepto de la trayectoria acumulada. No se atribuyen esas cifras exclusivamente al empleador actual. Se preserva la confidencialidad de clientes; el texto digital omite la valoración económica de la venta de Big Wave Data.
- `assets/cv-hazael-perez-2026-original.pdf` es una copia sin modificar del documento entregado. La descarga está identificada como **CV original**: contiene datos y fechas anteriores a las actualizaciones de esta versión digital. No se presenta como un nuevo PDF actualizado. Para sustituirlo, revisar previamente sus datos de contacto y trayectoria.
- El CV incorpora estilos de impresión y expansión visual de los detalles al imprimir; no se añadió exportación programática ni se modificó la descarga de propuestas.
- Pruebas: `node --test tests/cv.test.cjs tests/quotes.test.cjs tests/proposal.test.cjs tests/nic-mg.test.cjs tests/protexa.test.cjs`. Se verifican archivos, enlaces, metadatos, fechas, controles de expansión, ausencia de dependencias remotas y compatibilidad con las suites de propuestas. La verificación visual automatizada de esta entrega quedó pendiente por un bloqueo de acceso de la herramienta del navegador. Revisar manualmente escritorio, móvil, impresión, movimiento reducido y navegación antes de publicar.
- Trabajo desarrollado en `codex/digital-cv`; integración en `main` autorizada por el titular el 27 de octubre de 2026. El PDF fuente original en Descargas no fue modificado.

## Archivos

```
index.html
styles.css
script.js
assets/hazael-perez.jpg
assets/favicon.svg
assets/firma.png
descripcion-profesional.md
build.py
Hazael_Perez.html
README.md
```
