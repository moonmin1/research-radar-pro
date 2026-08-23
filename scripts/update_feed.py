#!/usr/bin/env python3
"""Build Research Radar's curated-first feed.

The script is dependency-free and designed for GitHub Actions. It can:
- retain editorially curated records;
- collect recent article metadata from Europe PMC and bioRxiv;
- scan NIH Guide RSS for relevant funding notices;
- hash selected programme/event pages and place material changes in a review queue;
- deduplicate, classify, score, and emit JSON, RSS, iCalendar, source-health,
  daily-brief, and offline fallback assets.

Automated records are deliberately labelled as metadata-only. They never replace
an editorial record with the same DOI, PMID, canonical URL, or title.
"""
from __future__ import annotations

import argparse
import datetime as dt
import email.utils
import hashlib
import html
from html.parser import HTMLParser
import json
import math
from pathlib import Path
import re
import sys
import time
from typing import Any, Iterable
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
ASSETS_JS = ROOT / "assets" / "js"
USER_AGENT = "ResearchRadarBot/2.0 (+https://github.com/; curated academic feed)"
SCHEMA_VERSION = 3

TOPIC_KEYWORDS: dict[str, tuple[str, ...]] = {
    "3d-genome": (
        "3d genome", "three-dimensional genome", "chromatin architecture", "genome organization",
        "chromosome conformation", "hic", "hi-c", "micro-c", "topologically associating", "contact domain",
        "chromatin loop", "looping", "nuclear architecture", "compartmentalization",
    ),
    "cohesin-ctcf": (
        "cohesin", "ctcf", "nipbl", "mau2", "wapl", "pds5", "rad21", "smc1", "smc3",
        "loop extrusion", "extrusion barrier", "insulation boundary",
    ),
    "enhancer-promoter": (
        "enhancer-promoter", "enhancer promoter", "promoter-enhancer", "long-range enhancer",
        "transcriptional hub", "mediator complex", "super-enhancer", "promoter contact",
    ),
    "epigenetics": (
        "epigenetic", "epigenome", "chromatin state", "histone modification", "histone methylation",
        "h3k9me3", "h3k27me3", "polycomb", "heterochromatin", "hp1", "dna methylation",
        "epigenetic memory", "chromatin remodeling", "nucleosome",
    ),
    "ivg-germline": (
        "in vitro gametogenesis", "ivg", "primordial germ cell", "pgclc", "germline", "germ cell",
        "oocyte", "oogenesis", "spermatogenesis", "spermatogonial", "meiotic", "meiosis", "gonadal",
        "follicle", "gamete",
    ),
    "developmental-biology": (
        "early embryo", "embryogenesis", "developmental biology", "lineage specification", "cell fate",
        "blastocyst", "gastrulation", "embryonic stem", "pluripotent", "totipotent", "organizer",
        "embryo model", "stem-cell embryo",
    ),
    "single-molecule": (
        "single-molecule", "single molecule", "smfret", "fret", "tirf", "dna curtain", "optical tweezer",
        "super-resolution", "live-cell imaging", "quantitative imaging", "molecule tracking",
    ),
    "crispr-engineering": (
        "crispr", "dcas9", "cas9", "cas12", "base editing", "prime editing", "epigenome editing",
        "genome engineering", "chromatin engineering", "programmable chromatin", "targeted epigenetic",
    ),
    "mechanobiology": (
        "mechanobiology", "mechanotransduction", "nuclear mechanics", "lamin", "nuclear envelope",
        "substrate stiffness", "matrix stiffness", "mechanical force", "chromatin mechanics", "yap", "taz",
    ),
    "us-opportunity": (
        "phd", "doctoral", "postbac", "post-baccalaureate", "internship", "visiting scientist",
        "fellowship", "research scholar", "summer research", "j-1", "international applicant",
    ),
    "events-funding": (
        "conference", "workshop", "webinar", "symposium", "course", "summer school", "funding opportunity",
        "request for applications", "notice of funding", "abstract deadline", "registration deadline",
    ),
}

PROFILE_TOPIC_WEIGHT = {
    "3d-genome": 1.00,
    "cohesin-ctcf": 1.00,
    "enhancer-promoter": 0.98,
    "epigenetics": 0.96,
    "ivg-germline": 0.98,
    "developmental-biology": 0.90,
    "single-molecule": 0.86,
    "crispr-engineering": 0.88,
    "mechanobiology": 0.78,
    "us-opportunity": 0.94,
    "events-funding": 0.72,
}

WHY_TEMPLATE = {
    "3d-genome": "3D genome folding의 원리와 contact-domain 해석에 직접 연결된다.",
    "cohesin-ctcf": "cohesin loading·loop extrusion·CTCF barrier의 인과기전을 검토하는 데 직접 연결된다.",
    "enhancer-promoter": "enhancer–promoter communication을 구조와 전사 활성의 관점에서 함께 해석할 수 있다.",
    "epigenetics": "chromatin state, epigenetic memory, 또는 epigenome engineering의 기전적 근거가 될 수 있다.",
    "ivg-germline": "PGCLC 이후 meiosis·gamete maturation이라는 IVG 병목을 이해하는 데 직접 연결된다.",
    "developmental-biology": "초기 발생의 lineage specification과 chromatin-state 전환을 연결해 볼 수 있다.",
    "single-molecule": "정제 단백질·defined chromatin·single-molecule imaging 기반 실험 설계의 benchmark가 된다.",
    "crispr-engineering": "programmable chromatin 또는 3D epigenome editor 설계·검증에 응용할 수 있다.",
    "mechanobiology": "nuclear mechanics와 chromatin organization 사이의 양방향 인과관계를 검토하는 데 유용하다.",
    "us-opportunity": "미국 연구경험 또는 대학원 진입 경로로서 실제 지원 가능성과 visa 조건을 검토할 가치가 있다.",
    "events-funding": "교육·네트워킹·발표 또는 funding 기회로 전환할 수 있는 행동 가능한 공고다.",
}

RESEARCH_ACTION = "초록과 핵심 Figure를 먼저 확인하고, 주장–실험–대안 설명을 3단 구조로 기록한다."
OPPORTUNITY_ACTION = "공식 페이지에서 eligibility, deadline, funding, visa/J-1 조건을 재확인한 뒤 지원 추적표에 등록한다."

PAPER_KINDS = {"paper", "preprint", "review", "method", "news", "commentary", "guideline", "policy"}
EVENT_KINDS = {"conference", "workshop", "webinar"}
RESEARCH_OPPORTUNITY_KINDS = {"internship", "postbac", "visiting", "fellowship", "funding"}
GRADUATE_KINDS = {"phd", "masters", "graduate-program", "application-assistance"}
VALID_SECTIONS = {"papers", "opportunities", "graduate"}


def section_for_kind(kind: str | None) -> str:
    if kind in GRADUATE_KINDS:
        return "graduate"
    if kind in EVENT_KINDS or kind in RESEARCH_OPPORTUNITY_KINDS:
        return "opportunities"
    return "papers"


def subsection_for_kind(kind: str | None, section: str | None = None) -> str:
    section = section if section in VALID_SECTIONS else section_for_kind(kind)
    if section == "graduate":
        return "phd" if kind == "phd" else "other-programs"
    if section == "opportunities":
        if kind in EVENT_KINDS:
            return "events"
        if kind == "funding":
            return "funding"
        return "research-experience"
    return kind if kind in {"paper", "preprint", "review", "method"} else "insight"


def now_kst() -> dt.datetime:
    return dt.datetime.now(dt.timezone(dt.timedelta(hours=9))).replace(microsecond=0)


def iso_date(value: Any) -> str | None:
    if value in (None, ""):
        return None
    if isinstance(value, dt.datetime):
        return value.date().isoformat()
    if isinstance(value, dt.date):
        return value.isoformat()
    text = str(value).strip()
    for candidate in (text[:10], text):
        try:
            return dt.date.fromisoformat(candidate).isoformat()
        except ValueError:
            pass
    try:
        return email.utils.parsedate_to_datetime(text).date().isoformat()
    except (TypeError, ValueError, OverflowError):
        return None


def load_json(path: Path, default: Any) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return default


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def strip_markup(value: str | None) -> str:
    text = html.unescape(value or "")
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def truncate(text: str, limit: int = 900) -> str:
    text = re.sub(r"\s+", " ", text).strip()
    return text if len(text) <= limit else text[: limit - 1].rstrip() + "…"


def slug(text: str, limit: int = 70) -> str:
    asciiish = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    if not asciiish:
        asciiish = "item"
    return asciiish[:limit].rstrip("-")


def canonical_url(url: str | None) -> str:
    if not url:
        return ""
    try:
        parts = urlsplit(url.strip())
        host = parts.netloc.lower().removeprefix("www.")
        path = re.sub(r"/+", "/", parts.path).rstrip("/") or "/"
        tracking = {"utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid"}
        query_pairs = [(k, v) for k, v in parse_qsl(parts.query, keep_blank_values=True) if k.lower() not in tracking]
        query = urlencode(sorted(query_pairs))
        return urlunsplit((parts.scheme.lower() or "https", host, path, query, ""))
    except Exception:
        return url.strip()


def normalize_doi(doi: str | None) -> str:
    if not doi:
        return ""
    value = doi.strip().lower()
    value = re.sub(r"^https?://(?:dx\.)?doi\.org/", "", value)
    value = re.sub(r"^doi:\s*", "", value)
    return value.rstrip(". ")


def normalize_title(title: str | None) -> str:
    return re.sub(r"[^a-z0-9]+", "", (title or "").lower())


def fetch_bytes(url: str, timeout: int = 35) -> tuple[bytes, int]:
    start = time.perf_counter()
    request = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json, application/xml, text/xml, text/html;q=0.9, */*;q=0.8"})
    with urlopen(request, timeout=timeout) as response:
        payload = response.read()
    return payload, int((time.perf_counter() - start) * 1000)


def fetch_json(url: str) -> tuple[Any, int]:
    payload, latency = fetch_bytes(url)
    return json.loads(payload.decode("utf-8")), latency


def topic_matches(text: str) -> list[tuple[str, int]]:
    hay = f" {strip_markup(text).lower()} "
    matches: list[tuple[str, int]] = []
    for topic, terms in TOPIC_KEYWORDS.items():
        hits = 0
        for term in terms:
            # Phrase matching is intentional; short acronyms receive word boundaries.
            if len(term) <= 4 and re.fullmatch(r"[a-z0-9-]+", term):
                hits += len(re.findall(rf"(?<![a-z0-9]){re.escape(term)}(?![a-z0-9])", hay))
            else:
                hits += hay.count(term)
        if hits:
            matches.append((topic, hits))
    return sorted(matches, key=lambda pair: (pair[1] * PROFILE_TOPIC_WEIGHT.get(pair[0], 0.5)), reverse=True)


def acceptance_score(matches: list[tuple[str, int]], *, opportunity: bool = False) -> float:
    if not matches:
        return 0.0
    score = sum(min(hits, 3) * PROFILE_TOPIC_WEIGHT.get(topic, 0.5) for topic, hits in matches)
    research_groups = {topic for topic, _ in matches if topic not in {"us-opportunity", "events-funding"}}
    if len(research_groups) >= 2:
        score += 1.5
    if opportunity and "us-opportunity" in {topic for topic, _ in matches}:
        score += 1.0
    return score


def topics_for(text: str, limit: int = 4) -> list[str]:
    return [topic for topic, _ in topic_matches(text)[:limit]]


def reason_for(topics: list[str]) -> str:
    reasons = [WHY_TEMPLATE[t] for t in topics[:2] if t in WHY_TEMPLATE]
    return " ".join(reasons) or "사용자 관심사와 교차하는 신규 항목으로, 원문 검토가 필요하다."


def infer_kind(title: str, source_type: str, publication_types: Iterable[str] = ()) -> str:
    lower = title.lower()
    pub = " ".join(publication_types).lower()
    if source_type == "biorxiv":
        return "preprint"
    if source_type == "nih-rss":
        return "funding"
    if "review" in pub or re.search(r"\breview\b|perspective|roadmap", lower):
        return "review"
    if re.search(r"method|pipeline|protocol|toolbox|software|algorithm|framework", lower):
        return "method"
    return "paper"


def make_id(title: str, stable: str = "") -> str:
    digest = hashlib.sha1((stable or title).encode("utf-8")).hexdigest()[:8]
    return f"{slug(title)}-{digest}"


def auto_item(*, title: str, abstract: str, source_name: str, source_type: str, url: str,
              published: str | None, doi: str | None = None, pmid: str | None = None,
              authors: list[str] | None = None, publication_types: Iterable[str] = (),
              extra_text: str = "") -> dict[str, Any] | None:
    text = " ".join([title, abstract, extra_text])
    matches = topic_matches(text)
    threshold = 2.1 if source_type != "nih-rss" else 2.7
    if acceptance_score(matches, opportunity=(source_type == "nih-rss")) < threshold:
        return None
    topics = [topic for topic, _ in matches[:4]]
    kind = infer_kind(title, source_type, publication_types)
    stable = normalize_doi(doi) or pmid or canonical_url(url) or title
    novelty = 88 if published and (dt.date.today() - dt.date.fromisoformat(published)).days <= 5 else 66
    authority = 90 if source_type in {"europepmc", "nih-rss"} else 76
    actionability = 92 if kind == "funding" else 62
    base = min(100, round(48 + acceptance_score(matches) * 9))
    summary = truncate(abstract, 850) if abstract else "자동 수집된 공식 metadata 항목입니다. 원문 또는 공식 공고 페이지에서 세부 내용을 확인해야 합니다."
    return {
        "id": make_id(title, stable),
        "title": title,
        "titleKo": title,
        "kind": kind,
        "section": section_for_kind(kind),
        "subsection": subsection_for_kind(kind),
        "topics": topics,
        "source": {"name": source_name, "type": "index" if source_type != "nih-rss" else "funder", "authority": 4 if source_type != "biorxiv" else 3, "url": url},
        "publishedAt": published or dt.date.today().isoformat(),
        "deadlineAt": None,
        "eventStart": None,
        "eventEnd": None,
        "location": None,
        "url": url,
        "doi": normalize_doi(doi) or None,
        "pmid": str(pmid) if pmid else None,
        "authors": authors or [],
        "summary": summary,
        "whyItMatters": reason_for(topics),
        "recommendedAction": OPPORTUNITY_ACTION if kind == "funding" else RESEARCH_ACTION,
        "tags": [term for topic, _ in matches[:3] for term in TOPIC_KEYWORDS[topic][:2]][:6],
        "access": {"openAccess": source_type == "biorxiv", "fullText": "index-metadata"},
        "eligibility": {"international": None, "careerStages": [], "visa": None, "funding": None, "confidence": 0.0, "notes": "자동 수집 항목은 eligibility를 추정하지 않습니다."} if kind == "funding" else None,
        "verification": {"level": "automated-metadata", "checkedAt": dt.date.today().isoformat(), "confidence": 0.70 if source_type != "biorxiv" else 0.62, "note": "Machine-filtered metadata; editorial review pending."},
        "signals": {"baseRelevance": base, "novelty": novelty, "actionability": actionability, "authority": authority},
        "featured": False,
        "status": "new",
        "ingestedBy": source_type,
    }


def collect_europe_pmc(config: dict[str, Any], start: dt.date, end: dt.date) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    query_terms = [
        '"3D genome"', '"chromatin architecture"', 'cohesin', 'CTCF', '"loop extrusion"',
        '"enhancer promoter"', '"epigenome editing"', '"chromatin engineering"',
        '"in vitro gametogenesis"', '"primordial germ cell"', 'oocyte', 'spermatogenesis',
        '"single molecule"', '"nuclear mechanics"',
    ]
    query = f"FIRST_PDATE:[{start.isoformat()} TO {end.isoformat()}] AND ({' OR '.join(query_terms)})"
    params = {
        "query": query,
        "format": "json",
        "pageSize": min(int(config.get("maxItems", 140)), 1000),
        "sort": "P_PDATE_D desc",
        "resultType": "core",
    }
    url = config["endpoint"] + "?" + urlencode(params)
    payload, latency = fetch_json(url)
    items: list[dict[str, Any]] = []
    for record in payload.get("resultList", {}).get("result", []):
        title = strip_markup(record.get("title"))
        abstract = strip_markup(record.get("abstractText"))
        if not title:
            continue
        doi = record.get("doi")
        pmid = record.get("pmid")
        source_url = f"https://europepmc.org/article/MED/{pmid}" if pmid else (f"https://doi.org/{doi}" if doi else "https://europepmc.org/")
        author_text = record.get("authorString") or ""
        authors = [name.strip() for name in author_text.split(",") if name.strip()][:25]
        item = auto_item(
            title=title,
            abstract=abstract,
            source_name=record.get("journalTitle") or "Europe PMC",
            source_type="europepmc",
            url=source_url,
            published=iso_date(record.get("firstPublicationDate") or record.get("journalInfo", {}).get("printPublicationDate")),
            doi=doi,
            pmid=pmid,
            authors=authors,
            publication_types=record.get("pubTypeList", {}).get("pubType", []),
            extra_text=" ".join(record.get("keywordList", {}).get("keyword", [])),
        )
        if item:
            item["access"]["openAccess"] = str(record.get("isOpenAccess", "N")).upper() == "Y"
            item["source"]["url"] = source_url
            items.append(item)
    return items, {"latencyMs": latency, "received": len(payload.get("resultList", {}).get("result", [])), "accepted": len(items)}


def collect_biorxiv(config: dict[str, Any], start: dt.date, end: dt.date) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    endpoint = config["endpoint"].rstrip("/")
    limit = int(config.get("maxItems", 180))
    cursor = 0
    records: list[dict[str, Any]] = []
    latency_total = 0
    while len(records) < limit:
        url = f"{endpoint}/{start.isoformat()}/{end.isoformat()}/{cursor}/json"
        payload, latency = fetch_json(url)
        latency_total += latency
        batch = payload.get("collection", [])
        records.extend(batch)
        if len(batch) < 100:
            break
        cursor += len(batch)
    items: list[dict[str, Any]] = []
    for record in records[:limit]:
        title = strip_markup(record.get("title"))
        abstract = strip_markup(record.get("abstract"))
        if not title:
            continue
        doi = record.get("doi")
        source_url = f"https://www.biorxiv.org/content/{doi}v{record.get('version', '1')}" if doi else "https://www.biorxiv.org/"
        authors = [name.strip() for name in str(record.get("authors") or "").split(";") if name.strip()][:25]
        item = auto_item(
            title=title,
            abstract=abstract,
            source_name="bioRxiv",
            source_type="biorxiv",
            url=source_url,
            published=iso_date(record.get("date")),
            doi=doi,
            authors=authors,
            publication_types=["preprint"],
            extra_text=str(record.get("category") or ""),
        )
        if item:
            item["verification"] = {"level": "preprint", "checkedAt": dt.date.today().isoformat(), "confidence": 0.58, "note": "Not peer reviewed; metadata and abstract automatically filtered."}
            items.append(item)
    return items, {"latencyMs": latency_total, "received": len(records[:limit]), "accepted": len(items)}


def collect_nih_rss(config: dict[str, Any]) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    payload, latency = fetch_bytes(config["endpoint"])
    root = ET.fromstring(payload)
    nodes = root.findall(".//item")[: int(config.get("maxItems", 80))]
    items: list[dict[str, Any]] = []
    for node in nodes:
        def t(tag: str) -> str:
            child = node.find(tag)
            return strip_markup(child.text if child is not None else "")
        title = t("title")
        description = t("description")
        link = t("link")
        published = iso_date(t("pubDate"))
        item = auto_item(
            title=title,
            abstract=description,
            source_name="NIH Guide for Grants and Contracts",
            source_type="nih-rss",
            url=link,
            published=published,
            extra_text="funding opportunity notice of funding opportunity research grant",
        )
        if item:
            item["source"] = {"name": "NIH Guide", "type": "funder", "authority": 5, "url": link}
            item["verification"] = {"level": "official-feed", "checkedAt": dt.date.today().isoformat(), "confidence": 0.88, "note": "Official NIH Guide RSS; eligibility and deadline require notice-level review."}
            items.append(item)
    return items, {"latencyMs": latency, "received": len(nodes), "accepted": len(items)}


class VisibleTextParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []
        self.skip = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in {"script", "style", "svg", "noscript"}:
            self.skip += 1

    def handle_endtag(self, tag: str) -> None:
        if tag in {"script", "style", "svg", "noscript"} and self.skip:
            self.skip -= 1

    def handle_data(self, data: str) -> None:
        if not self.skip:
            self.parts.append(data)


def page_watch(config: dict[str, Any], previous_hashes: dict[str, str]) -> tuple[list[dict[str, Any]], dict[str, str], dict[str, Any]]:
    queue: list[dict[str, Any]] = []
    hashes = dict(previous_hashes)
    successes = 0
    latency_total = 0
    for page in config.get("pages", []):
        page_id = page["id"]
        try:
            raw, latency = fetch_bytes(page["url"], timeout=30)
            latency_total += latency
            parser = VisibleTextParser()
            parser.feed(raw.decode("utf-8", errors="ignore"))
            visible = re.sub(r"\s+", " ", " ".join(parser.parts)).strip()
            digest = hashlib.sha256(visible.encode("utf-8")).hexdigest()
            old = previous_hashes.get(page_id)
            hashes[page_id] = digest
            successes += 1
            if old and old != digest:
                queue.append({
                    "id": f"watch-{page_id}-{now_kst().date().isoformat()}",
                    "pageId": page_id,
                    "name": page.get("name"),
                    "url": page.get("url"),
                    "topics": page.get("topics", []),
                    "section": page.get("section") or "opportunities",
                    "detectedAt": now_kst().isoformat(),
                    "reason": "Visible page content hash changed; editorial review required.",
                    "status": "needs-review",
                })
        except Exception as exc:  # per-page isolation
            queue.append({
                "id": f"watch-error-{page_id}-{now_kst().date().isoformat()}",
                "pageId": page_id,
                "name": page.get("name"),
                "url": page.get("url"),
                "topics": page.get("topics", []),
                "section": page.get("section") or "opportunities",
                "detectedAt": now_kst().isoformat(),
                "reason": f"Page check failed: {type(exc).__name__}: {exc}",
                "status": "check-failed",
            })
    return queue, hashes, {"latencyMs": latency_total, "received": len(config.get("pages", [])), "accepted": successes}


def dedupe(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    # Caller orders records by precedence. First record wins.
    result: list[dict[str, Any]] = []
    doi_seen: set[str] = set()
    pmid_seen: set[str] = set()
    url_seen: set[str] = set()
    title_seen: set[str] = set()
    id_seen: set[str] = set()
    for item in items:
        doi = normalize_doi(item.get("doi"))
        pmid = str(item.get("pmid") or "").strip()
        url = canonical_url(item.get("url"))
        title = normalize_title(item.get("title"))
        item_id = str(item.get("id") or make_id(item.get("title", "item"), doi or pmid or url))
        conflict = (
            (doi and doi in doi_seen) or
            (pmid and pmid in pmid_seen) or
            (url and url in url_seen) or
            (title and title in title_seen) or
            item_id in id_seen
        )
        if conflict:
            continue
        item["id"] = item_id
        if doi:
            item["doi"] = doi
            doi_seen.add(doi)
        if pmid:
            pmid_seen.add(pmid)
        if url:
            url_seen.add(url)
        if title:
            title_seen.add(title)
        id_seen.add(item_id)
        result.append(item)
    return result


def rough_score(item: dict[str, Any], profile: dict[str, Any], today: dt.date) -> int:
    topics = item.get("topics") or []
    interests = profile.get("interests", PROFILE_TOPIC_WEIGHT)
    interest = max([float(interests.get(t, 0)) for t in topics] or [0]) * 42
    base = float(item.get("signals", {}).get("baseRelevance", 50)) * 0.22
    authority = float(item.get("signals", {}).get("authority", 50)) * 0.12
    action = float(item.get("signals", {}).get("actionability", 50)) * 0.10
    published = iso_date(item.get("publishedAt"))
    freshness = 0.0
    if published:
        age = max(0, (today - dt.date.fromisoformat(published)).days)
        freshness = 12 * math.exp(-age / 28)
    eligibility = item.get("eligibility") or {}
    eligible_boost = 5 if eligibility.get("international") is True else (-8 if eligibility.get("international") is False else 0)
    visa = str(eligibility.get("visa") or "").lower()
    visa_boost = 3 if any(k in visa for k in ("j-1", "sponsor", "support")) else 0
    verified = item.get("verification", {}).get("level") in {"official-page", "official-feed", "peer-reviewed"}
    verified_boost = 3 if verified else 0
    return max(0, min(100, round(interest + base + authority + action + freshness + eligible_boost + visa_boost + verified_boost)))


def generate_rss(items: list[dict[str, Any]], generated_at: str) -> None:
    def x(value: Any) -> str:
        return html.escape(str(value or ""), quote=True)
    entries = []
    for item in items[:40]:
        entries.append(f"""    <item>
      <title>{x(item.get('titleKo') or item.get('title'))}</title>
      <link>{x(item.get('url'))}</link>
      <guid isPermaLink="false">{x(item.get('id'))}</guid>
      <pubDate>{email.utils.format_datetime(dt.datetime.fromisoformat((iso_date(item.get('publishedAt')) or dt.date.today().isoformat()) + 'T12:00:00+00:00'))}</pubDate>
      <category>{x(item.get('section') or 'papers')}</category>
      <category>{x(', '.join(item.get('topics') or []))}</category>
      <description>{x(item.get('whyItMatters') or item.get('summary'))}</description>
    </item>""")
    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Research Radar Pro</title>
    <link>./</link>
    <description>Personalized papers, conferences and research opportunities, and graduate admissions.</description>
    <language>ko-KR</language>
    <lastBuildDate>{email.utils.format_datetime(dt.datetime.fromisoformat(generated_at))}</lastBuildDate>
{chr(10).join(entries)}
  </channel>
</rss>
"""
    (ROOT / "feed.xml").write_text(xml, encoding="utf-8")


def escape_ics(value: str) -> str:
    return str(value).replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,").replace("\n", "\\n")


def fold_ics(line: str, limit: int = 73) -> str:
    # ASCII-safe enough for clients; keep continuation syntax valid.
    chunks = [line[i:i + limit] for i in range(0, len(line), limit)]
    return "\r\n ".join(chunks)


def generate_ics(items: list[dict[str, Any]]) -> None:
    events = []
    stamp = now_kst().astimezone(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    for item in items:
        deadline = iso_date(item.get("deadlineAt"))
        if not deadline:
            continue
        start = dt.date.fromisoformat(deadline)
        end = start + dt.timedelta(days=1)
        lines = [
            "BEGIN:VEVENT",
            f"UID:{escape_ics(item['id'])}@research-radar",
            f"DTSTAMP:{stamp}",
            f"DTSTART;VALUE=DATE:{start.strftime('%Y%m%d')}",
            f"DTEND;VALUE=DATE:{end.strftime('%Y%m%d')}",
            f"SUMMARY:{escape_ics(item.get('titleKo') or item.get('title'))}",
            f"DESCRIPTION:{escape_ics(item.get('recommendedAction') or item.get('whyItMatters') or '')}",
            f"URL:{escape_ics(item.get('url') or '')}",
            "END:VEVENT",
        ]
        events.extend(fold_ics(line) for line in lines)
    content = "\r\n".join(["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Research Radar//Deadline Feed//KO", "CALSCALE:GREGORIAN", *events, "END:VCALENDAR", ""])
    (DATA / "deadlines.ics").write_text(content, encoding="utf-8")


def generate_fallback(feed: dict[str, Any], profile: dict[str, Any], topics: dict[str, Any], meta: dict[str, Any], health: dict[str, Any], sources: dict[str, Any], brief: dict[str, Any], review: dict[str, Any]) -> None:
    payload = {"feed": feed, "profile": profile, "topics": topics, "meta": meta, "health": health, "sources": sources, "brief": brief, "review": review}
    js = "window.RR_FALLBACK = " + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n"
    (ASSETS_JS / "fallback-data.js").write_text(js, encoding="utf-8")


def run(live: bool, strict_network: bool = False) -> int:
    generated = now_kst()
    today = generated.date()
    sources = load_json(DATA / "sources.json", {})
    profile = load_json(DATA / "profile.json", {"interests": PROFILE_TOPIC_WEIGHT, "preferences": {}})
    topics = load_json(DATA / "topics.json", {})
    curated_doc = load_json(DATA / "curated.json", {"items": []})
    existing_doc = load_json(DATA / "feed.json", {"items": []})
    state = load_json(DATA / "state.json", {"seen": [], "pageHashes": {}, "schemaVersion": SCHEMA_VERSION})

    curated = curated_doc.get("items", [])
    existing_auto = [item for item in existing_doc.get("items", []) if not str(item.get("ingestedBy", "")).startswith("curated")]
    automated: list[dict[str, Any]] = []
    health: list[dict[str, Any]] = [{
        "id": "curated", "label": "Curated editorial layer", "status": "healthy",
        "lastSuccess": generated.isoformat(), "latencyMs": 0, "items": len(curated),
        "message": "Editorial records have deduplication priority over automated metadata."
    }]
    review_queue = load_json(DATA / "review-queue.json", {"items": []}).get("items", [])
    failures = 0

    start = today - dt.timedelta(days=max(int(sources.get("europePmc", {}).get("days", 5)), int(sources.get("biorxiv", {}).get("days", 5))))

    collectors = [
        ("europepmc", "Europe PMC", lambda: collect_europe_pmc(sources["europePmc"], start, today), sources.get("europePmc", {})),
        ("biorxiv", "bioRxiv", lambda: collect_biorxiv(sources["biorxiv"], start, today), sources.get("biorxiv", {})),
        ("nih-rss", "NIH Guide RSS", lambda: collect_nih_rss(sources["nihRss"]), sources.get("nihRss", {})),
    ]

    if live:
        for source_id, label, collector, config in collectors:
            if not config.get("enabled", True):
                health.append({"id": source_id, "label": label, "status": "disabled", "lastSuccess": None, "latencyMs": None, "items": 0, "message": "Disabled in data/sources.json."})
                continue
            try:
                batch, stats = collector()
                automated.extend(batch)
                health.append({
                    "id": source_id, "label": label, "status": "healthy", "lastSuccess": generated.isoformat(),
                    "latencyMs": stats.get("latencyMs"), "items": stats.get("accepted", 0),
                    "message": f"Received {stats.get('received', 0)}; retained {stats.get('accepted', 0)} after relevance filtering."
                })
            except Exception as exc:
                failures += 1
                health.append({"id": source_id, "label": label, "status": "error", "lastSuccess": None, "latencyMs": None, "items": 0, "message": f"{type(exc).__name__}: {exc}"})

        page_config = sources.get("pageWatch", {})
        if page_config.get("enabled", True):
            try:
                queue_new, hashes, stats = page_watch(page_config, state.get("pageHashes", {}))
                state["pageHashes"] = hashes
                queue_by_id = {entry.get("id"): entry for entry in [*review_queue, *queue_new]}
                review_queue = list(queue_by_id.values())[-200:]
                health.append({
                    "id": "page-watch", "label": "Curated programme page-watch", "status": "healthy",
                    "lastSuccess": generated.isoformat(), "latencyMs": stats.get("latencyMs"), "items": stats.get("accepted", 0),
                    "message": f"Checked {stats.get('received', 0)} pages; {len(queue_new)} change/error flags added."
                })
            except Exception as exc:
                failures += 1
                health.append({"id": "page-watch", "label": "Curated programme page-watch", "status": "error", "lastSuccess": None, "latencyMs": None, "items": 0, "message": f"{type(exc).__name__}: {exc}"})
    else:
        for source_id, label, _, config in collectors:
            health.append({"id": source_id, "label": label, "status": "configured" if config.get("enabled", True) else "disabled", "lastSuccess": None, "latencyMs": None, "items": 0, "message": "Offline build: collector not executed."})
        health.append({"id": "page-watch", "label": "Curated programme page-watch", "status": "configured", "lastSuccess": None, "latencyMs": None, "items": len(sources.get("pageWatch", {}).get("pages", [])), "message": "Offline build: page hashes retained."})

    # Keep prior automated records for a short rolling window, especially after transient source failures.
    retention_start = today - dt.timedelta(days=75)
    retained_auto = []
    for item in existing_auto:
        published = iso_date(item.get("publishedAt"))
        if not published or dt.date.fromisoformat(published) >= retention_start:
            retained_auto.append(item)

    combined = dedupe([*curated, *automated, *retained_auto])
    for item in combined:
        item.setdefault("featured", False)
        item.setdefault("status", "new")
        inferred_section = section_for_kind(item.get("kind"))
        if item.get("section") not in VALID_SECTIONS:
            item["section"] = inferred_section
        item.setdefault("subsection", subsection_for_kind(item.get("kind"), item.get("section")))
        item.setdefault("topics", [])
        item.setdefault("authors", [])
        item.setdefault("tags", [])
        item.setdefault("access", {"openAccess": False, "fullText": "unknown"})
        item.setdefault("verification", {"level": "unknown", "checkedAt": None, "confidence": 0.0, "note": ""})
        item.setdefault("signals", {"baseRelevance": 50, "novelty": 50, "actionability": 50, "authority": 50})
        item.setdefault("eligibility", None)
        item["publishedAt"] = iso_date(item.get("publishedAt")) or today.isoformat()
        item["deadlineAt"] = iso_date(item.get("deadlineAt"))
        item["eventStart"] = iso_date(item.get("eventStart"))
        item["eventEnd"] = iso_date(item.get("eventEnd"))
        item["_buildScore"] = rough_score(item, profile, today)

    combined.sort(key=lambda i: (bool(i.get("featured")), i.get("_buildScore", 0), i.get("publishedAt", "")), reverse=True)
    for item in combined:
        item.pop("_buildScore", None)
    combined = combined[:250]

    feed = {"items": combined}
    brief_items = sorted(combined, key=lambda i: rough_score(i, profile, today), reverse=True)[: int(profile.get("preferences", {}).get("dailyBriefSize", 8))]
    brief = {
        "date": today.isoformat(),
        "generatedAt": generated.isoformat(),
        "title": f"Research Radar — {today.isoformat()}",
        "itemIds": [item["id"] for item in brief_items],
        "counts": {
            "total": len(combined),
            "new72h": sum(1 for i in combined if (today - dt.date.fromisoformat(i["publishedAt"])).days <= 3),
            "papers": sum(1 for i in combined if i.get("section") == "papers"),
            "opportunities": sum(1 for i in combined if i.get("section") == "opportunities"),
            "graduate": sum(1 for i in combined if i.get("section") == "graduate"),
            "deadlines": sum(1 for i in combined if i.get("deadlineAt")),
        },
    }
    meta = {
        "schemaVersion": SCHEMA_VERSION,
        "generatedAt": generated.isoformat(),
        "timezone": "Asia/Seoul",
        "itemCount": len(combined),
        "pipeline": "curated-first + Europe PMC + bioRxiv + NIH RSS + page-watch",
        "build": "pro-v4-three-pillar",
        "mode": "live" if live else "offline",
        "reviewQueueCount": len([q for q in review_queue if q.get("status") == "needs-review"]),
        "dataNotice": "Three-pillar taxonomy: papers, conferences/research opportunities, and graduate admissions. Editorial records have precedence over automated metadata.",
    }
    health_doc = {"generatedAt": generated.isoformat(), "sources": health}

    state["schemaVersion"] = SCHEMA_VERSION
    state["lastRun"] = generated.isoformat()
    state["seen"] = [item["id"] for item in combined[:1000]]

    write_json(DATA / "feed.json", feed)
    write_json(DATA / "meta.json", meta)
    write_json(DATA / "source-health.json", health_doc)
    write_json(DATA / "daily-brief.json", brief)
    write_json(DATA / "brief-index.json", {"issues": [{"date": today.isoformat(), "path": f"briefs/{today.isoformat()}.json", "itemCount": len(brief_items)}]})
    write_json(DATA / "briefs" / f"{today.isoformat()}.json", brief)
    review_doc = {"generatedAt": generated.isoformat(), "items": review_queue}
    write_json(DATA / "review-queue.json", review_doc)
    write_json(DATA / "state.json", state)
    generate_rss(combined, generated.isoformat())
    generate_ics(combined)
    generate_fallback(feed, profile, topics, meta, health_doc, sources, brief, review_doc)

    print(f"Research Radar build complete: {len(combined)} items, {len(automated)} freshly automated, {failures} source failures, mode={'live' if live else 'offline'}")
    if strict_network and failures:
        return 2
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--live", action="store_true", help="Fetch configured network sources.")
    mode.add_argument("--offline", action="store_true", help="Regenerate derived assets without network access (default).")
    parser.add_argument("--strict-network", action="store_true", help="Fail when any live source errors.")
    args = parser.parse_args()
    return run(live=args.live, strict_network=args.strict_network)


if __name__ == "__main__":
    sys.exit(main())
