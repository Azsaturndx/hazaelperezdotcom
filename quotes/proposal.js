(() => {
  'use strict';
  const button = document.getElementById('print-proposal');
  button.hidden = false;
  button.addEventListener('click', () => window.print());
})();
