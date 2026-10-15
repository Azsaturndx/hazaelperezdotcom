/* Vector PDF layout. Reads the proposal HTML once; no parallel pricing dataset,
   screenshots, print dialog, remote renderer, or optional jsPDF HTML dependencies. */
((root, factory) => {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.QuotePDF = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  'use strict';
  const text = node => (node?.textContent || '').replace(/\s+/g, ' ').trim();
  const clean = value => String(value).replace(/[\u2010-\u2015]/g, '-').replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"').replace(/\u00a0/g, ' ').replace(/\u2192/g, '>');

  function readTable(table) {
    const cells = row => [...row.cells].flatMap(cell => [text(cell), ...Array(cell.colSpan - 1).fill('')]);
    return {
      type: 'table', kind: table.classList.contains('activity-table') ? 'activity' : 'cost',
      headers: [...table.tHead.rows[0].cells].map(text),
      rows: [...table.tBodies].flatMap(body => [...body.rows].map(row => ({ cells: cells(row), total: false }))),
      totals: table.tFoot ? [...table.tFoot.rows].map(row => ({ cells: cells(row), total: true })) : []
    };
  }

  function readBlocks(parent) {
    const blocks = [];
    for (const child of parent.children) {
      if (child.tagName === 'H2') continue;
      if (child.matches('.proposal-highlights')) {
        blocks.push({ type: 'highlights', cards: [...child.children].map(card => ({
          label: text(card.querySelector('.highlight-label')), value: text(card.querySelector('strong')),
          note: text(card.querySelector('p'))
        })) });
      } else if (child.matches('.summary-card, .proposal-recurring')) {
        blocks.push({ type: 'subheading', text: text(child.querySelector('h3')) });
        blocks.push(...readBlocks(child));
      } else if (child.matches('.milestone')) {
        blocks.push({
          type: 'milestone', title: text(child.querySelector('.milestone-label strong')),
          timing: text(child.querySelector('.milestone-label > span')),
          hours: text(child.querySelector('.milestone-hours')), amount: text(child.querySelector('.milestone-amount')),
          table: readTable(child.querySelector('table'))
        });
      } else if (child.tagName === 'TABLE') blocks.push(readTable(child));
      else if (child.tagName === 'P' && !child.matches('.milestone-intro')) blocks.push({ type: 'paragraph', text: text(child) });
      else if (child.tagName === 'UL' || child.tagName === 'OL') {
        blocks.push({ type: 'list', items: [...child.children].map(text) });
      } else if (child.tagName !== 'H3') blocks.push(...readBlocks(child));
    }
    return blocks;
  }

  function readProposal(document) {
    const article = document.querySelector('.proposal article');
    if (!article) throw new Error('Proposal is missing');
    const closing = article.querySelector('.proposal-closing');
    return {
      title: text(article.querySelector('h1')), lead: text(article.querySelector('.proposal-lead')),
      folio: text(article.querySelector('[data-proposal-folio]')),
      meta: [...article.querySelectorAll('.proposal-meta > div')].map(item => ({ label: text(item.querySelector('dt')), value: text(item.querySelector('dd')) })),
      notice: text(article.querySelector('.proposal-demo')),
      sections: [...article.querySelectorAll('.proposal-section')].map(section => ({
        title: text(section.querySelector('h2')).replace(/^(\d+\s*\/)\s*/, '$1 '), blocks: readBlocks(section)
      })),
      closing: {
        message: text(closing.querySelector('.closing-message')),
        salutation: text(closing.querySelector('.closing-salutation')),
        name: text(closing.querySelector('strong')), email: text(closing.querySelector('a'))
      }
    };
  }

  function filename(folio) {
    const safe = clean(folio).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
    return `Propuesta-${safe || 'Hazael-Perez'}.pdf`;
  }

  function create(model, { jsPDF, signature }) {
    if (!signature) throw new Error('Signature is required');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4', compress: true, putOnlyUsedFonts: true });
    doc.setProperties({ title: clean(model.title), subject: `Propuesta ${clean(model.folio)}`, author: 'Hazael Pérez', creator: 'Hazael Pérez / Quotes' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 42;
    const width = pageW - margin * 2;
    const bottom = pageH - 52;
    const ink = [28, 36, 28], muted = [83, 91, 83], green = [65, 88, 40], line = [215, 221, 210];
    let y = 70;

    function font(size = 10.5, bold = false, color = ink) {
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(size); doc.setTextColor(...color);
    }
    function wrap(value, maxWidth, size = 10.5, bold = false) {
      font(size, bold);
      return doc.splitTextToSize(clean(value), maxWidth);
    }
    function header() {
      font(17, true); doc.text('hp', margin, 34);
      doc.setTextColor(...green); doc.text('_', margin + 21, 34);
      font(8, false, muted); doc.text('HAZAEL PÉREZ / PROPUESTA COMERCIAL', pageW - margin, 31, { align: 'right' });
      doc.setDrawColor(...line); doc.setLineWidth(.5); doc.line(margin, 45, pageW - margin, 45);
    }
    function nextPage() { doc.addPage(); header(); y = 70; }
    function ensure(height) { if (y + height > bottom) nextPage(); }
    function paragraph(value, { size = 10.5, bold = false, color = ink, indent = 0, after = 11 } = {}) {
      const lines = wrap(value, width - indent, size, bold);
      const leading = size * 1.43;
      ensure(Math.min(lines.length, 3) * leading);
      for (const row of lines) {
        ensure(leading); font(size, bold, color);
        doc.text(row, margin + indent, y); y += leading;
      }
      y += after;
    }
    function sectionTitle(value, minimum) {
      ensure(minimum); y += 9;
      doc.setDrawColor(...line); doc.line(margin, y, pageW - margin, y); y += 25;
      paragraph(value, { size: 17, bold: true, after: 7 });
    }

    function highlights(cards) {
      const gap = 10, cardW = (width - gap * (cards.length - 1)) / cards.length;
      const sizes = cards.map(card => ({
        label: wrap(card.label, cardW - 26, 8, true), value: wrap(card.value, cardW - 26, 16, true),
        note: wrap(card.note, cardW - 26, 8.5)
      }));
      const height = Math.max(...sizes.map(s => 34 + s.label.length * 11 + s.value.length * 21 + s.note.length * 12));
      ensure(height + 12);
      cards.forEach((card, i) => {
        const x = margin + i * (cardW + gap), content = sizes[i];
        doc.setFillColor(...(i === 0 ? [237, 245, 225] : [247, 248, 245]));
        doc.setDrawColor(...line); doc.roundedRect(x, y - 3, cardW, height, 6, 6, 'FD');
        let cy = y + 15;
        font(8, true, green); doc.text(content.label, x + 13, cy, { lineHeightFactor: 1.375 }); cy += content.label.length * 11 + 11;
        font(16, true); doc.text(content.value, x + 13, cy, { lineHeightFactor: 1.3125 }); cy += content.value.length * 21 + 7;
        font(8.5, false, muted); doc.text(content.note, x + 13, cy, { lineHeightFactor: 1.41 });
      });
      y += height + 14;
    }

    function table(block) {
      const ratios = block.kind === 'activity' ? [.86, .14] : [.18, .14, .30, .19, .19];
      const widths = ratios.map(ratio => ratio * width);
      const size = block.kind === 'activity' ? 10 : 8.5;
      const leading = size * 1.4, padding = 7;
      let rowNumber = 0;
      function drawCells(lines, height, { heading = false, total = false } = {}) {
        if (heading || total || rowNumber % 2 === 0) {
          doc.setFillColor(...(heading ? [235, 242, 225] : total ? [240, 243, 235] : [249, 250, 247]));
          doc.rect(margin, y, width, height, 'F');
        }
        let x = margin;
        lines.forEach((cell, i) => {
          font(size, heading || total, heading ? green : ink);
          const numeric = i >= widths.length - (block.kind === 'activity' ? 1 : 2);
          doc.text(cell, numeric ? x + widths[i] - padding : x + padding, y + padding + size, {
            align: numeric ? 'right' : 'left', lineHeightFactor: 1.4
          });
          x += widths[i];
        });
        doc.setDrawColor(...line); doc.line(margin, y + height, margin + width, y + height);
        y += height;
      }
      const headLines = block.headers.map((cell, i) => wrap(cell, widths[i] - padding * 2, size, true));
      const headHeight = Math.max(...headLines.map(cell => cell.length)) * leading + padding * 2;
      function heading() { drawCells(headLines, headHeight, { heading: true }); }
      ensure(headHeight + leading * 2 + padding * 2); heading();
      for (const row of [...block.rows, ...block.totals]) {
        let lines = row.cells.map((cell, i) => wrap(cell, widths[i] - padding * 2, size, row.total));
        let remaining = Math.max(...lines.map(cell => cell.length));
        if (y + remaining * leading + padding * 2 > bottom && remaining * leading + padding * 2 < bottom - 70 - headHeight) {
          nextPage(); heading();
        }
        // Oversized descriptions are continued across pages, with repeated headers.
        while (remaining > 0) {
          let capacity = Math.floor((bottom - y - padding * 2) / leading);
          if (capacity < 1) { nextPage(); heading(); capacity = Math.floor((bottom - y - padding * 2) / leading); }
          const count = Math.min(capacity, remaining);
          drawCells(lines.map(cell => cell.slice(0, count)), count * leading + padding * 2, { total: row.total });
          lines = lines.map(cell => cell.slice(count));
          remaining = Math.max(...lines.map(cell => cell.length));
          if (remaining) { nextPage(); heading(); }
        }
        rowNumber++;
      }
      y += 15;
    }

    function milestone(block) {
      const title = wrap(block.title, width - 180, 12, true);
      const height = Math.max(56, title.length * 16 + 36);
      ensure(height + 78);
      doc.setFillColor(240, 244, 233); doc.roundedRect(margin, y - 4, width, height, 5, 5, 'F');
      font(12, true); doc.text(title, margin + 12, y + 15, { lineHeightFactor: 1.33 });
      font(9, false, muted); doc.text(clean(block.timing), margin + 12, y + 19 + title.length * 16);
      font(11, true, green); doc.text(clean(block.amount), pageW - margin - 12, y + 16, { align: 'right' });
      font(10, false, muted); doc.text(clean(block.hours), pageW - margin - 12, y + 35, { align: 'right' });
      y += height + 3; table(block.table);
    }

    header();
    paragraph(model.title, { size: 27, bold: true, after: 4 });
    paragraph(model.lead, { size: 11, color: muted, after: 13 });
    const metaGap = 12, metaW = (width - metaGap * 3) / 4;
    const metaValues = model.meta.map(item => wrap(item.value, metaW, 9.5));
    const metaHeight = Math.max(...metaValues.map(value => value.length)) * 13.5 + 31;
    ensure(metaHeight);
    model.meta.forEach((item, i) => {
      const x = margin + i * (metaW + metaGap);
      font(7.5, true, green); doc.text(clean(item.label), x, y);
      font(9.5); doc.text(metaValues[i], x, y + 17, { lineHeightFactor: 1.42 });
    });
    y += metaHeight;
    if (model.notice) paragraph(model.notice, { size: 8.5, color: muted, after: 3 });

    for (const section of model.sections) {
      const minimum = section.blocks.some(block => block.type === 'milestone') ? 235
        : section.blocks.some(block => block.type === 'table') ? 190 : 110;
      sectionTitle(section.title, minimum);
      for (const block of section.blocks) {
        if (block.type === 'paragraph') paragraph(block.text);
        else if (block.type === 'subheading') {
          ensure(55); paragraph(block.text, { size: 12, bold: true, after: 3 });
        } else if (block.type === 'list') {
          block.items.forEach(item => paragraph(`- ${item}`, { size: 10, indent: 8, after: 7 }));
        } else if (block.type === 'highlights') highlights(block.cards);
        else if (block.type === 'table') table(block);
        else if (block.type === 'milestone') milestone(block);
      }
    }

    const closingLines = wrap(model.closing.message, width, 10.5);
    ensure(closingLines.length * 15 + 157);
    y += 14; paragraph(model.closing.message);
    paragraph(model.closing.salutation, { after: 4 });
    doc.addImage(signature.data, 'JPEG', margin, y, signature.width, signature.height);
    y += signature.height + 15;
    paragraph(model.closing.name, { size: 12, bold: true, after: 0 });
    paragraph(model.closing.email, { size: 9, color: muted, after: 0 });

    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i); font(8, false, muted);
      doc.setDrawColor(...line); doc.line(margin, pageH - 37, pageW - margin, pageH - 37);
      doc.text(clean(model.folio), margin, pageH - 23);
      doc.text(`Página ${i} de ${pages}`, pageW - margin, pageH - 23, { align: 'right' });
    }
    return doc;
  }
  return { readProposal, create, filename };
});
