/* Edit this single file when Aurora's actual birth date and time are known.
   Calendar calculations always use timeZone, not the visitor's location. */
(function (root) {
  const config = Object.freeze({
    birthDate: '2026-11-11',
    birthTime: '00:00',
    timeZone: 'America/Mexico_City',
    letterCount: 31
  });
  if (typeof module === 'object' && module.exports) module.exports = config;
  else root.AuroraConfig = config;
})(typeof globalThis !== 'undefined' ? globalThis : this);
