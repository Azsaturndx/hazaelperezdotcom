(() => {
  'use strict';
  const button = document.getElementById('export-proposal');
  const status = document.getElementById('export-status');
  let exporting = false;
  button.hidden = false;

  async function signatureImage() {
    const image = document.querySelector('.proposal-signature');
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is unavailable');
    context.drawImage(image, 0, 0);
    // Preserve the existing signature's strokes; dark ink on white for the PDF.
    context.globalCompositeOperation = 'source-in';
    context.fillStyle = '#1c241c'; context.fillRect(0, 0, canvas.width, canvas.height);
    context.globalCompositeOperation = 'destination-over';
    context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height);
    return { data: canvas.toDataURL('image/jpeg', 1), width: 47, height: 47 * canvas.height / canvas.width };
  }

  button.addEventListener('click', async () => {
    if (exporting) return;
    exporting = true;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    status.textContent = 'Generando tu PDF…';
    try {
      if (!window.jspdf?.jsPDF || !window.QuotePDF) throw new Error('PDF library is unavailable');
      const model = window.QuotePDF.readProposal(document);
      const signature = await signatureImage();
      const pdf = window.QuotePDF.create(model, { jsPDF: window.jspdf.jsPDF, signature });
      const blob = pdf.output('blob');
      const filename = window.QuotePDF.filename(model.folio);
      if (window.parent && window.parent !== window && window.frameElement?.id === 'quote-frame') {
        window.frameElement.dispatchEvent(new window.parent.CustomEvent('quote-download-pdf', { detail: { blob, filename } }));
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = filename;
        document.body.append(link);
        try { link.click(); } finally {
          link.remove();
          window.setTimeout(() => URL.revokeObjectURL(url), 30000);
        }
      }
      status.textContent = 'PDF generado. La descarga está lista; revisa las descargas de tu navegador.';
    } catch {
      status.textContent = 'No pudimos generar el PDF. Recarga la página e intenta de nuevo.';
    } finally {
      exporting = false;
      button.disabled = false;
      button.setAttribute('aria-busy', 'false');
    }
  });
})();
