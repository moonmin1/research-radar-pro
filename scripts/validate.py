#!/usr/bin/env python3
"""Validate Research Radar data, assets, and deployment invariants."""
from __future__ import annotations

import argparse
import datetime as dt
import json
from pathlib import Path
import re
import sys
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
REQUIRED_ITEM_FIELDS = {
    "id", "title", "titleKo", "kind", "topics", "source", "publishedAt", "deadlineAt",
    "eventStart", "eventEnd", "location", "url", "doi", "pmid", "authors", "summary",
    "whyItMatters", "recommendedAction", "tags", "access", "eligibility", "verification",
    "signals", "featured", "status", "ingestedBy",
}
ALLOWED_KINDS = {
    "paper", "preprint", "review", "method", "news", "commentary", "guideline", "policy",
    "conference", "workshop", "webinar", "phd", "internship", "postbac", "visiting",
    "fellowship", "funding",
}
ALLOWED_STATUS = {"new", "important", "open", "watch", "closed", "restricted"}
REQUIRED_FILES = [
    "index.html", "offline.html", "manifest.webmanifest", "sw.js", "feed.xml", "robots.txt", ".nojekyll",
    "assets/css/app.css", "assets/js/app.js", "assets/js/scoring.js", "assets/js/storage.js", "assets/js/fallback-data.js",
    "assets/icons/icon-192.png", "assets/icons/icon-512.png", "assets/icons/icon-maskable-512.png",
    "data/feed.json", "data/profile.json", "data/topics.json", "data/sources.json", "data/meta.json",
    "data/source-health.json", "data/daily-brief.json", "data/deadlines.ics", "data/review-queue.json",
]


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def parse_date(value: str | None) -> bool:
    if value is None:
        return True
    try:
        dt.date.fromisoformat(str(value)[:10])
        return True
    except ValueError:
        return False


def valid_url(value: str | None) -> bool:
    if not value:
        return False
    parsed = urlparse(value)
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def normalized_title(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--warnings-as-errors", action="store_true")
    args = parser.parse_args()

    errors: list[str] = []
    warnings: list[str] = []

    for rel in REQUIRED_FILES:
        path = ROOT / rel
        if not path.exists():
            errors.append(f"Missing required file: {rel}")
        elif path.is_file() and path.stat().st_size == 0 and rel != ".nojekyll":
            errors.append(f"Empty required file: {rel}")

    try:
        topics = load(DATA / "topics.json")
        profile = load(DATA / "profile.json")
        feed = load(DATA / "feed.json")
        meta = load(DATA / "meta.json")
        manifest = load(ROOT / "manifest.webmanifest")
        health = load(DATA / "source-health.json")
        review = load(DATA / "review-queue.json")
    except (FileNotFoundError, json.JSONDecodeError) as exc:
        errors.append(f"JSON load failed: {exc}")
        topics = profile = feed = meta = manifest = health = review = {}

    topic_ids = set(topics)
    if set(profile.get("interests", {})) - topic_ids:
        errors.append(f"Profile contains unknown topics: {sorted(set(profile.get('interests', {})) - topic_ids)}")

    items = feed.get("items") if isinstance(feed, dict) else None
    if not isinstance(items, list):
        errors.append("data/feed.json must contain an items array")
        items = []

    ids: set[str] = set()
    dois: set[str] = set()
    urls: set[str] = set()
    titles: set[str] = set()
    for index, item in enumerate(items):
        prefix = f"items[{index}]"
        if not isinstance(item, dict):
            errors.append(f"{prefix} is not an object")
            continue
        missing = REQUIRED_ITEM_FIELDS - set(item)
        if missing:
            errors.append(f"{prefix} ({item.get('id','?')}) missing fields: {sorted(missing)}")
        item_id = str(item.get("id") or "")
        if not re.fullmatch(r"[a-z0-9][a-z0-9._-]{2,160}", item_id):
            errors.append(f"{prefix} has invalid id: {item_id!r}")
        if item_id in ids:
            errors.append(f"Duplicate id: {item_id}")
        ids.add(item_id)

        kind = item.get("kind")
        if kind not in ALLOWED_KINDS:
            errors.append(f"{item_id}: unknown kind {kind!r}")
        status = item.get("status")
        if status not in ALLOWED_STATUS:
            errors.append(f"{item_id}: unknown status {status!r}")
        item_topics = item.get("topics")
        if not isinstance(item_topics, list) or not item_topics:
            errors.append(f"{item_id}: topics must be a non-empty list")
        else:
            unknown = set(item_topics) - topic_ids
            if unknown:
                errors.append(f"{item_id}: unknown topics {sorted(unknown)}")

        for key in ("publishedAt", "deadlineAt", "eventStart", "eventEnd"):
            if not parse_date(item.get(key)):
                errors.append(f"{item_id}: invalid ISO date in {key}: {item.get(key)!r}")
        if not valid_url(item.get("url")):
            errors.append(f"{item_id}: invalid URL {item.get('url')!r}")
        source = item.get("source") or {}
        if not isinstance(source, dict) or not source.get("name"):
            errors.append(f"{item_id}: source.name is required")

        doi = str(item.get("doi") or "").lower().strip()
        if doi:
            if doi in dois:
                errors.append(f"Duplicate DOI: {doi}")
            dois.add(doi)
        url = str(item.get("url") or "").lower().rstrip("/")
        if url:
            if url in urls:
                errors.append(f"Duplicate canonical URL: {url}")
            urls.add(url)
        title = normalized_title(str(item.get("title") or ""))
        if title:
            if title in titles:
                warnings.append(f"Near-duplicate title: {item.get('title')}")
            titles.add(title)

        verification = item.get("verification") or {}
        confidence = verification.get("confidence")
        if not isinstance(confidence, (int, float)) or not 0 <= confidence <= 1:
            errors.append(f"{item_id}: verification.confidence must be 0..1")
        signals = item.get("signals") or {}
        for key in ("baseRelevance", "novelty", "actionability", "authority"):
            value = signals.get(key)
            if not isinstance(value, (int, float)) or not 0 <= value <= 100:
                errors.append(f"{item_id}: signals.{key} must be 0..100")

    if meta.get("itemCount") != len(items):
        errors.append(f"meta.itemCount={meta.get('itemCount')} but feed has {len(items)} items")
    if manifest.get("start_url") not in {"./", ".", "/"}:
        warnings.append("Manifest start_url should normally be './' for project-site portability")
    if not isinstance(health.get("sources"), list) or not health.get("sources"):
        errors.append("source-health.json must contain non-empty sources")
    if not isinstance(review.get("items"), list):
        errors.append("review-queue.json must contain an items array")

    fallback_path = ROOT / "assets/js/fallback-data.js"
    if fallback_path.exists():
        text = fallback_path.read_text(encoding="utf-8")
        if not text.startswith("window.RR_FALLBACK = "):
            errors.append("fallback-data.js has unexpected format")
        if f'"itemCount":{len(items)}' not in text.replace(" ", ""):
            warnings.append("fallback-data.js may not match current feed/meta; rerun update_feed.py")

    sw_text = (ROOT / "sw.js").read_text(encoding="utf-8") if (ROOT / "sw.js").exists() else ""
    for required_asset in ("index.html", "offline.html", "assets/css/app.css", "assets/js/app.js", "data/feed.json"):
        if required_asset not in sw_text:
            warnings.append(f"Service worker precache does not mention {required_asset}")

    if errors or (warnings and args.warnings_as_errors):
        for message in errors:
            print(f"ERROR: {message}")
        for message in warnings:
            print(f"WARNING: {message}")
        print(f"Validation failed: {len(errors)} errors, {len(warnings)} warnings")
        return 1

    for message in warnings:
        print(f"WARNING: {message}")
    print(f"Validation passed: {len(items)} items, {len(topic_ids)} topics, {len(warnings)} warnings")
    return 0


if __name__ == "__main__":
    sys.exit(main())
