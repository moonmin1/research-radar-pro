#!/usr/bin/env python3
"""Create the minimal static directory uploaded to GitHub Pages."""
from __future__ import annotations

import shutil
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "_site"
FILES = [
    "index.html", "404.html", "offline.html", "manifest.webmanifest", "sw.js",
    "feed.xml", "robots.txt", ".nojekyll",
]
DIRS = ["assets", "data/briefs"]
DATA_FILES = [
    "data/feed.json", "data/profile.json", "data/topics.json", "data/meta.json",
    "data/source-health.json", "data/sources.json", "data/daily-brief.json",
    "data/brief-index.json", "data/deadlines.ics", "data/review-queue.json",
]


def main() -> int:
    result = subprocess.run([sys.executable, str(ROOT / "scripts" / "validate.py")], cwd=ROOT)
    if result.returncode:
        return result.returncode
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    for rel in FILES + DATA_FILES:
        src = ROOT / rel
        dst = OUT / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
    for rel in DIRS:
        src = ROOT / rel
        if src.exists():
            shutil.copytree(src, OUT / rel, dirs_exist_ok=True)
    print(f"Built deployable site at {OUT} ({sum(1 for p in OUT.rglob('*') if p.is_file())} files)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
