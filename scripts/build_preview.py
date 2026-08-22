#!/usr/bin/env python3
"""Build a standalone HTML preview with CSS, JS, and fallback data inlined."""
from __future__ import annotations

import base64
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "dist" / "research-radar-pro-preview.html"


def main() -> int:
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    css = (ROOT / "assets/css/app.css").read_text(encoding="utf-8")
    scripts = []
    for rel in ("assets/js/fallback-data.js", "assets/js/scoring.js", "assets/js/storage.js", "assets/js/app.js"):
        scripts.append((ROOT / rel).read_text(encoding="utf-8"))
    icon = base64.b64encode((ROOT / "assets/icons/icon-192.png").read_bytes()).decode("ascii")
    icon_data = f"data:image/png;base64,{icon}"

    html = re.sub(r'\s*<link rel="manifest"[^>]*>', '', html)
    html = re.sub(r'\s*<link rel="icon"[^>]*>', '', html)
    html = re.sub(r'\s*<link rel="apple-touch-icon"[^>]*>', '', html)
    html = html.replace('<link rel="stylesheet" href="assets/css/app.css">', f'<style>\n{css}\n</style>')
    html = re.sub(r'\s*<script defer src="assets/js/(?:fallback-data|scoring|storage|app)\.js"></script>', '', html)
    html = html.replace('</head>', f'<link rel="icon" href="{icon_data}">\n</head>')
    # Disable fetch in the standalone preview so the deterministic embedded snapshot is used immediately.
    prelude = "window.RR_PREVIEW_MODE=true; window.fetch=()=>Promise.reject(new Error('Standalone snapshot'));"
    html = html.replace('</body>', f'<script>{prelude}</script>\n<script>\n{"\n".join(scripts)}\n</script>\n</body>')
    html = html.replace("icon:'assets/icons/icon-192.png'", f"icon:'{icon_data}'")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(html, encoding="utf-8")
    print(f"Built standalone preview: {OUT} ({OUT.stat().st_size:,} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
