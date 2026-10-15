"""Build a portable, offline HTML. Standard-library Python only."""
from pathlib import Path
import base64

root = Path(__file__).resolve().parent
page = (root / "index.html").read_text(encoding="utf-8")
css = (root / "styles.css").read_text(encoding="utf-8")
script = (root / "script.js").read_text(encoding="utf-8")
photo = base64.b64encode((root / "assets/hazael-perez.jpg").read_bytes()).decode()
signature = base64.b64encode((root / 'assets/firma.png').read_bytes()).decode()
icon = base64.b64encode((root / "assets/favicon.svg").read_bytes()).decode()
page = page.replace('<link rel="stylesheet" href="styles.css">', f'<style>\n{css}\n</style>')
page = page.replace('<script src="script.js" defer></script>', '')
page = page.replace('src="assets/hazael-perez.jpg"', f'src="data:image/jpeg;base64,{photo}"')
page = page.replace('src="assets/firma.png"', f'src="data:image/png;base64,{signature}"')
page = page.replace('href="assets/favicon.svg"', f'href="data:image/svg+xml;base64,{icon}"')
page = page.replace('</body>', f'<script>\n{script}\n</script>\n</body>')
output = root / 'Hazael_Perez.html'
output.write_text(page, encoding="utf-8")
print(f'{output.name}: {output.stat().st_size:,} bytes')
