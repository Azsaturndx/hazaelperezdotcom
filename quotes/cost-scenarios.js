/* Mutually exclusive full-cloud estimates, read from the proposal's visible table. */
(() => {
  'use strict';
  const picker = document.getElementById('scenario-picker');
  const table = document.getElementById('cloud-scenarios');
  if (!picker || !table) return;
  const money = value => Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fee = [...document.querySelectorAll('.milestone-amount')].reduce((sum, node) => sum + Number(node.textContent.replace(/[^0-9.]/g, '')), 0);
  function select(value) {
    const row = [...table.tBodies[0].rows].find(row => row.dataset.scenario === value);
    if (!row) return;
    const name = row.cells[0].textContent.trim();
    const monthly = Number(row.dataset.monthly), annual = Number(row.dataset.annual);
    document.getElementById('cloud-summary-label').textContent = `NUBE / MES · ${name.toUpperCase()}`;
    // Preserve the existing currency markup without introducing HTML from data.
    document.getElementById('cloud-summary-value').replaceChildren(`$${money(monthly)} `, Object.assign(document.createElement('small'), { textContent: 'USD' }));
    document.getElementById('cloud-summary-note').textContent = `$${money(annual)} USD al año. Estimación provisional.`;
    document.getElementById('scenario-total').textContent = `${name}: $${money(monthly)} USD/mes · $${money(annual)} USD/año. No se suma con otras alternativas.`;
    document.getElementById('scenario-first-year').textContent = `Primer año estimado, nube + implementación única: $${money(annual + fee)} USD antes de impuestos. Odoo y operación continua no incluidos.`;
    for (const candidate of table.tBodies[0].rows) candidate.classList.toggle('scenario-selected', candidate === row);
  }
  picker.addEventListener('change', event => {
    if (event.target.name === 'cloud-plan') select(event.target.value);
  });
  select(picker.querySelector('input:checked').value);
  picker.hidden = false;
})();
