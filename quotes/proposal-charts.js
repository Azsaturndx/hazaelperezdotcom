/* Native SVG, using the same visible proposal data as the vector PDF. */
(() => {
  'use strict';
  const ns = 'http://www.w3.org/2000/svg';
  function element(tag, attrs = {}, content) {
    const node = document.createElementNS(ns, tag);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    if (content !== undefined) node.textContent = content;
    return node;
  }
  for (const figure of document.querySelectorAll('[data-proposal-chart]')) {
    const model = window.QuotePDF.readChart(figure);
    const pie = model.kind === 'pie';
    const svg = element('svg', { viewBox: pie ? '0 0 240 240' : '0 0 680 300', role: 'img', 'aria-label': model.title });
    const total = model.items.reduce((sum, item) => sum + item.value, 0);
    const format = value => value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    svg.append(element('title', {}, model.title));
    svg.append(element('desc', {}, model.items.map(item => `${item.label}: ${pie ? `${item.value} horas, ${(item.value / total * 100).toFixed(1)}%` : `$${format(item.value)} USD/mes`}`).join('; ')));
    if (pie) {
      let angle = -Math.PI / 2;
      model.items.forEach((item, index) => {
        const end = angle + item.value / total * Math.PI * 2;
        const point = a => `${120 + 104 * Math.cos(a)} ${120 + 104 * Math.sin(a)}`;
        const path = element('path', { d: `M120 120 L${point(angle)} A104 104 0 ${end - angle > Math.PI ? 1 : 0} 1 ${point(end)} Z`, class: `chart-series-${index}` });
        svg.append(path);
        const li = figure.querySelectorAll('[data-hours]')[index];
        li.querySelector('.chart-swatch').classList.add(`chart-series-${index}`);
        const percent = document.createElement('strong');
        percent.className = 'chart-percent'; percent.textContent = `${(item.value / total * 100).toFixed(1)}%`;
        li.append(percent);
        angle = end;
      });
    } else {
      const max = Math.ceil(Math.max(...model.items.map(item => item.value)) / 500) * 500;
      const left = 145, length = 430;
      [0, max / 2, max].forEach(value => {
        const x = left + value / max * length;
        svg.append(element('line', { x1: x, x2: x, y1: 25, y2: 245, class: 'chart-grid' }));
        svg.append(element('text', { x, y: 272, 'text-anchor': 'middle', class: 'chart-tick' }, `$${format(value)}`));
      });
      model.items.forEach((item, index) => {
        const y = 42 + index * 72, barWidth = item.value / max * length;
        svg.append(element('text', { x: left - 14, y: y + 24, 'text-anchor': 'end' }, item.label));
        svg.append(element('rect', { x: left, y, width: barWidth, height: 36, rx: 4, class: 'chart-bar' }));
        svg.append(element('text', { x: left + barWidth + 10, y: y + 24, class: 'chart-value' }, `$${format(item.value)}`));
      });
    }
    const plot = figure.querySelector('.chart-plot');
    plot.replaceChildren(svg); plot.hidden = false;
  }
})();
