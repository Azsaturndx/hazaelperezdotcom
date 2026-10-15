# jsPDF (local distribution)

- Package: `jspdf@4.2.1`, MIT, downloaded from the official npm registry.
- Upstream: https://github.com/parallax/jsPDF
- File: unmodified `dist/jspdf.umd.min.js` → `jspdf-4.2.1.umd.min.js`.
- License: `jspdf.LICENSE` (copied from the package).
- npm tarball integrity: `sha512-YyAXyvnmjTbR4bHQRLzex3CuINCDlQnBqoSYyjJwTP2x9jDLuKDzy7aKUl0hgx3uhcl7xzg32agn5vlie6HIlQ==`.

This is the only runtime dependency added for direct, browser-local PDF creation.
No CDN, installation, build, server conversion, HTML rendering plugin, or external
request is needed. `proposal-pdf.js` uses vector text, tables and the local signature.
Optional HTML/canvas rendering plugins are not invoked. Keep the version pinned;
review upstream changes and rerun PDF QA before replacing this distribution.
