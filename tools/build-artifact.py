"""Собирает один самодостаточный HTML (без service worker и манифеста) для предпросмотра."""
import pathlib, re, sys
root = pathlib.Path(__file__).resolve().parent.parent
html = (root / 'index.html').read_text(encoding='utf-8')
html = html.replace('<link rel="stylesheet" href="styles.css">', '<style>\n' + (root / 'styles.css').read_text(encoding='utf-8') + '</style>')
for js in ['js/data.js', 'js/voice.js', 'js/app.js']:
    html = html.replace(f'<script src="{js}"></script>', '<script>\n' + (root / js).read_text(encoding='utf-8') + '</script>')
head = re.search(r'<head>(.*)</head>', html, re.S).group(1)
body = re.search(r'<body>(.*)</body>', html, re.S).group(1)
keep = [l for l in head.splitlines() if not re.search(r'charset|name="viewport"|manifest|apple|rel="icon"|theme-color|mobile-web-app', l)]
out = '\n'.join(keep).strip() + '\n' + body.strip() + '\n'
dst = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else root / 'dist' / 'artifact.html'
dst.parent.mkdir(parents=True, exist_ok=True)
dst.write_text(out, encoding='utf-8')
print(dst)
