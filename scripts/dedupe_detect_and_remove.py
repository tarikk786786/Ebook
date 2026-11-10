#!/usr/bin/env python3
"""
Detect ebook duplicates and safely soft-remove HIGH-confidence exact file duplicates.

AUTO-ELIGIBLE (may soft-remove with --apply):
  - Same SHA-256 file hash (exact binary duplicates)
  - Same absolute file path linked to multiple catalog numbers

HIGH but REVIEW-REQUIRED (never auto-removed):
  - Same ISBN-13 / ISBN-10 with compatible edition/volume/language

MEDIUM / LOW: CSV + admin review only — NEVER auto-removed.

Soft-remove means:
  - Write data/catalog/duplicate_suppression.json (storefront filter)
  - Mark covers_86k.sqlite for suppressed IDs
  - Quarantine redundant files (move, never hard-delete)
  - Keep merge_map for rollback
  - Backup JSON before apply

Usage:
  python scripts/dedupe_hash_ebook_files.py
  python scripts/dedupe_detect_and_remove.py           # dry-run
  python scripts/dedupe_detect_and_remove.py --apply   # soft-remove AUTO-ELIGIBLE HIGH only
  python scripts/dedupe_detect_and_remove.py --rollback-latest
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import shutil
import sqlite3
import sys
import time
import unicodedata
import zipfile
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from dedupe_init_db import main as init_db  # noqa: E402

DEDUPE_DB = ROOT / "data" / "dedupe_86k.sqlite"
ENRICH_DB = ROOT / "data" / "enrichment_86k_checkpoint.db"
COVERS_DB = ROOT / "data" / "covers_86k.sqlite"
MAP_PATH = ROOT / "data" / "catalog" / "catalog_file_map.json"
SUPPRESSION_PATH = ROOT / "data" / "catalog" / "duplicate_suppression.json"
QUARANTINE_DIR = ROOT / "private_storage" / "_quarantine_duplicates"
REPORT_DIR = ROOT / "data" / "reports"
BACKUP_DIR = ROOT / "data" / "backups" / "dedupe"

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def hashlib_sha1_short(s: str) -> str:
    return hashlib.sha1(s.encode("utf-8", errors="replace")).hexdigest()[:10]


def norm_text(s: str) -> str:
    s = unicodedata.normalize("NFKD", s or "").casefold()
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def norm_isbn(s: str | None) -> str:
    if not s:
        return ""
    return re.sub(r"[^0-9Xx]", "", str(s)).upper()


def volume_token(title: str, volume: str | None = None) -> str:
    if volume and str(volume).strip():
        return f"vol:{norm_text(str(volume))}"
    m = re.search(r"\bvolume\s+(\d+)\b", title or "", re.I)
    if m:
        return f"vol:{m.group(1)}"
    m = re.search(r"\bv\.?\s*(\d+)\b", title or "", re.I)
    return f"vol:{m.group(1)}" if m else "vol:none"


def edition_token(edition: str | None, title: str = "") -> str:
    if edition and str(edition).strip():
        return f"ed:{norm_text(str(edition))}"
    m = re.search(r"\b(\d+)(st|nd|rd|th)?\s+edition\b", title or "", re.I)
    if m:
        return f"ed:{m.group(1)}"
    return "ed:none"


def format_token(fmt: str | None) -> str:
    f = norm_text(fmt or "")
    if "epub" in f and "pdf" in f:
        return "fmt:mixed"
    if "epub" in f:
        return "fmt:epub"
    if "mobi" in f or "azw" in f:
        return "fmt:mobi"
    if "pdf" in f:
        return "fmt:pdf"
    return f"fmt:{f or 'unknown'}"


def ensure_dbs() -> None:
    init_db()


def load_map() -> dict:
    if not MAP_PATH.exists():
        raise SystemExit("Missing catalog_file_map.json — run build_catalog_file_map.py first")
    return json.loads(MAP_PATH.read_text(encoding="utf-8")).get("map") or {}


def load_enrichment_meta() -> dict[int, dict]:
    """Pull ISBN/edition/publisher from enrichment DB when available."""
    out: dict[int, dict] = {}
    if not ENRICH_DB.exists():
        return out
    con = sqlite3.connect(str(ENRICH_DB))
    try:
        rows = con.execute(
            """
            SELECT manifest_id, title, subtitle, author, isbn10, isbn13, publisher,
                   edition, publication_year, language, format, pages, cover_url
            FROM books
            """
        ).fetchall()
        for r in rows:
            out[int(r[0])] = {
                "title": r[1] or "",
                "subtitle": r[2] or "",
                "author": r[3] or "",
                "isbn10": norm_isbn(r[4]),
                "isbn13": norm_isbn(r[5]),
                "publisher": r[6] or "",
                "edition": r[7] or "",
                "publication_year": str(r[8] or ""),
                "language": r[9] or "",
                "format": r[10] or "",
                "pages": r[11],
                "cover_url": r[12] or "",
                "volume": "",
            }
    except Exception as e:
        print(f"enrichment meta load skipped: {e}", flush=True)
    finally:
        con.close()
    return out


def persist_catalog_meta(con: sqlite3.Connection, meta: dict[int, dict]) -> None:
    now = time.time()
    rows = []
    for n, m in meta.items():
        rows.append(
            (
                n,
                m.get("title"),
                m.get("author"),
                m.get("subtitle"),
                m.get("isbn10"),
                m.get("isbn13"),
                m.get("publisher"),
                m.get("publication_year"),
                m.get("edition"),
                m.get("volume"),
                m.get("language"),
                m.get("format"),
                m.get("pages"),
                m.get("cover_url"),
                m.get("fileName"),
                now,
            )
        )
    con.executemany(
        """
        INSERT OR REPLACE INTO catalog_meta(
          catalog_num, title, author, subtitle, isbn10, isbn13, publisher,
          publication_year, edition, volume, language, format, pages, cover_url, file_name, updated_at
        ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """,
        rows,
    )
    con.commit()


def light_content_fingerprint(path: str) -> dict:
    """Best-effort content fingerprint. Never required for auto-delete."""
    p = Path(path)
    result = {
        "page_count": None,
        "text_fingerprint": None,
        "structure_fingerprint": None,
        "epub_identifier": None,
        "error": None,
    }
    if not p.exists():
        result["error"] = "missing"
        return result
    ext = p.suffix.lower()
    try:
        if ext == ".epub":
            with zipfile.ZipFile(p, "r") as zf:
                names = sorted(zf.namelist())
                result["structure_fingerprint"] = hashlib.sha256(
                    "\n".join(names).encode("utf-8", errors="replace")
                ).hexdigest()
                for name in names:
                    if name.lower().endswith("content.opf") or name.lower().endswith(".opf"):
                        data = zf.read(name).decode("utf-8", errors="replace")
                        m = re.search(r"<dc:identifier[^>]*>([^<]+)</dc:identifier>", data, re.I)
                        if m:
                            result["epub_identifier"] = norm_text(m.group(1))
                        break
        elif ext == ".pdf":
            try:
                import fitz  # PyMuPDF
            except Exception:
                result["error"] = "pymupdf_unavailable"
                return result
            doc = fitz.open(str(p))
            result["page_count"] = doc.page_count
            parts = []
            for i in range(min(3, doc.page_count)):
                parts.append(doc.load_page(i).get_text("text")[:2000])
            doc.close()
            blob = norm_text("\n".join(parts))[:4000]
            if blob:
                result["text_fingerprint"] = hashlib.sha256(blob.encode("utf-8")).hexdigest()
            result["structure_fingerprint"] = f"pages:{result['page_count']}"
    except Exception as e:
        result["error"] = str(e)[:200]
    return result


def compute_content_fingerprints(con: sqlite3.Connection, meta: dict[int, dict], limit: int = 400) -> None:
    """Fingerprint a sample of multi-linked / multi-format candidates."""
    candidates: list[tuple[int, str]] = []
    for n, m in meta.items():
        paths = m.get("paths") or []
        if paths:
            candidates.append((n, paths[0]))
    # Prefer books that share title+author with another (potential content dups)
    by_ta: dict[str, list[int]] = defaultdict(list)
    for n, m in meta.items():
        key = f"{norm_text(m.get('title') or '')}|{norm_text(m.get('author') or '')}"
        if key != "|":
            by_ta[key].append(n)
    priority = set()
    for members in by_ta.values():
        if len(members) > 1:
            priority.update(members)
    ordered = sorted(candidates, key=lambda x: (0 if x[0] in priority else 1, x[0]))
    done = 0
    for catalog_num, path in ordered:
        if done >= limit:
            break
        existing = con.execute(
            "SELECT text_fingerprint, error FROM content_fingerprints WHERE catalog_num=?",
            (catalog_num,),
        ).fetchone()
        if existing and (existing[0] or existing[1] in {"missing", "pymupdf_unavailable"}):
            continue
        fp = light_content_fingerprint(path)
        con.execute(
            """
            INSERT OR REPLACE INTO content_fingerprints(
              catalog_num, path, page_count, text_fingerprint, structure_fingerprint,
              epub_identifier, extracted_at, error
            ) VALUES(?,?,?,?,?,?,?,?)
            """,
            (
                catalog_num,
                path,
                fp["page_count"],
                fp["text_fingerprint"],
                fp["structure_fingerprint"],
                fp["epub_identifier"],
                time.time(),
                fp["error"],
            ),
        )
        done += 1
        if done % 25 == 0:
            con.commit()
    con.commit()


def detect_groups(con: sqlite3.Connection, mapping: dict, enrich: dict[int, dict]) -> tuple[list[dict], dict]:
    path_sha = {
        r[0]: r[1]
        for r in con.execute("SELECT path, sha256 FROM file_assets WHERE sha256 IS NOT NULL")
    }
    path_size = {
        r[0]: int(r[1] or 0)
        for r in con.execute("SELECT path, size_bytes FROM file_assets")
    }

    by_sha: dict[str, set[int]] = defaultdict(set)
    by_path: dict[str, set[int]] = defaultdict(set)
    by_isbn: dict[str, set[int]] = defaultdict(set)
    by_title_author: dict[str, set[int]] = defaultdict(set)
    by_title_author_pub_year: dict[str, set[int]] = defaultdict(set)
    by_similar_title: dict[str, set[int]] = defaultdict(set)
    by_filename: dict[str, set[int]] = defaultdict(set)
    by_text_fp: dict[str, set[int]] = defaultdict(set)
    meta: dict[int, dict] = {}

    for _key, e in mapping.items():
        catalog_num = int(e["catalogNum"])
        em = enrich.get(catalog_num, {})
        title = e.get("title") or em.get("title") or ""
        author = e.get("author") or em.get("author") or ""
        fname = e.get("fileName") or ""
        paths = e.get("localPaths") or ([] if not e.get("localPath") else [e["localPath"]])
        edition = em.get("edition") or ""
        volume = em.get("volume") or ""
        isbn13 = em.get("isbn13") or ""
        isbn10 = em.get("isbn10") or ""
        publisher = em.get("publisher") or ""
        year = em.get("publication_year") or ""
        language = em.get("language") or ""
        fmt = e.get("format") or em.get("format") or ""
        pages = e.get("pages") or em.get("pages")
        cover_url = em.get("cover_url") or e.get("dbCoverUrl") or ""

        size = 0
        sha = None
        for p in paths:
            by_path[p].add(catalog_num)
            if path_sha.get(p):
                sha = path_sha[p]
                by_sha[sha].add(catalog_num)
            size = max(size, path_size.get(p, 0))

        meta[catalog_num] = {
            "title": title,
            "subtitle": em.get("subtitle") or "",
            "author": author,
            "fileName": fname,
            "slug": e.get("slug"),
            "paths": paths,
            "sha256": sha,
            "edition": edition,
            "volume": volume,
            "isbn10": isbn10,
            "isbn13": isbn13,
            "publisher": publisher,
            "publication_year": year,
            "language": language,
            "format": fmt,
            "pages": pages,
            "cover_url": cover_url,
            "size_bytes": size,
        }

        vol = volume_token(title, volume)
        ed = edition_token(edition, title)
        lang = norm_text(language) or "lang:none"
        fmt_t = format_token(fmt)

        if isbn13:
            by_isbn[f"isbn13:{isbn13}|{ed}|{vol}|{lang}|{fmt_t}"].add(catalog_num)
        elif isbn10:
            by_isbn[f"isbn10:{isbn10}|{ed}|{vol}|{lang}|{fmt_t}"].add(catalog_num)

        nt = norm_text(title)
        na = norm_text(author)
        ta = f"{nt}|{na}|{vol}|{ed}|{fmt_t}"
        # Require real bibliographic identity for MEDIUM signals
        if len(nt) >= 8 and len(na) >= 3 and na not in {"unknown", "n a", "na", "anon", "anonymous"}:
            by_title_author[ta].add(catalog_num)
            if publisher and year:
                by_title_author_pub_year[
                    f"{ta}|{norm_text(publisher)}|{norm_text(year)}"
                ].add(catalog_num)

        # LOW: identical long titles only (still review-only)
        if len(nt) >= 20:
            by_similar_title[nt].add(catalog_num)

        nf = norm_text(fname)
        if len(nf) >= 12:
            by_filename[nf].add(catalog_num)

    for catalog_num, text_fp, struct_fp, epub_id in con.execute(
        """
        SELECT catalog_num, text_fingerprint, structure_fingerprint, epub_identifier
        FROM content_fingerprints
        WHERE text_fingerprint IS NOT NULL OR epub_identifier IS NOT NULL
        """
    ):
        if text_fp:
            by_text_fp[f"text:{text_fp}"].add(int(catalog_num))
        if epub_id:
            by_text_fp[f"epub:{epub_id}"].add(int(catalog_num))

    groups: list[dict] = []

    def add_group(
        confidence: str,
        reason: str,
        members: set[int],
        extra: dict | None = None,
        auto_eligible: bool = False,
    ):
        if len(members) < 2:
            return
        ordered = sorted(members)
        # Prefer lowest catalog num with a local file as canonical
        with_file = [m for m in ordered if meta.get(m, {}).get("paths")]
        canonical = with_file[0] if with_file else ordered[0]
        member_sig = hashlib_sha1_short(",".join(str(m) for m in ordered))
        extra_blob = json.dumps(extra or {}, sort_keys=True, default=str)
        extra_sig = hashlib_sha1_short(extra_blob)
        total_bytes = sum(int(meta.get(m, {}).get("size_bytes") or 0) for m in ordered)
        canon_size = int(meta.get(canonical, {}).get("size_bytes") or 0)
        recoverable = max(0, total_bytes - canon_size)
        # Include extra_sig so identical member sets under different evidence keys do not collide.
        gid = f"{confidence.lower()}:{reason}:{canonical}:{len(ordered)}:{member_sig}:{extra_sig}"
        groups.append(
            {
                "group_id": gid,
                "confidence": confidence,
                "reason": reason,
                "canonical_catalog_num": canonical,
                "members": ordered,
                "duplicates": [m for m in ordered if m != canonical],
                "extra": extra or {},
                "auto_eligible": bool(auto_eligible),
                "total_bytes": total_bytes,
                "estimated_recoverable_bytes": recoverable,
            }
        )

    for sha, members in by_sha.items():
        if len(members) > 1:
            add_group("HIGH", "exact_sha256", members, {"sha256": sha}, auto_eligible=True)

    for path, members in by_path.items():
        if len(members) > 1:
            add_group("HIGH", "same_filepath", members, {"path": path}, auto_eligible=True)

    for key, members in by_isbn.items():
        if len(members) > 1:
            add_group("HIGH", "same_isbn_edition", members, {"key": key}, auto_eligible=False)

    for key, members in by_title_author_pub_year.items():
        if 1 < len(members) <= 25:
            add_group("MEDIUM", "same_title_author_publisher_year", members, {"key": key})

    for key, members in by_title_author.items():
        if 1 < len(members) <= 25:
            add_group("MEDIUM", "same_title_author_volume_edition", members, {"key": key})

    for key, members in by_text_fp.items():
        if 1 < len(members) <= 25:
            add_group("MEDIUM", "matching_content_fingerprint", members, {"key": key})

    for key, members in by_similar_title.items():
        if 1 < len(members) <= 12:
            add_group("LOW", "similar_title_only", members, {"key": key})

    for key, members in by_filename.items():
        if 1 < len(members) <= 12:
            add_group("LOW", "similar_filename", members, {"key": key})

    return groups, meta


def write_reports(groups: list[dict], meta: dict) -> dict:
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    high = [g for g in groups if g["confidence"] == "HIGH"]
    medium = [g for g in groups if g["confidence"] == "MEDIUM"]
    low = [g for g in groups if g["confidence"] == "LOW"]
    auto = [g for g in groups if g.get("auto_eligible")]

    high_dup_ids = sorted({d for g in high for d in g["duplicates"]})
    auto_dup_ids = sorted({d for g in auto for d in g["duplicates"]})
    high_canonicals = sorted({g["canonical_catalog_num"] for g in high})
    medium_dup_ids = sorted({d for g in medium for d in g["duplicates"]})
    low_dup_ids = sorted({d for g in low for d in g["duplicates"]})

    def write_pair_csv(path: Path, group_list: list[dict], include_hash: bool = True):
        with path.open("w", encoding="utf-8", newline="") as f:
            fields = [
                "group_id",
                "confidence",
                "reason",
                "auto_eligible",
                "canonical_catalog_num",
                "duplicate_catalog_num",
                "title",
                "author",
                "edition",
                "volume",
                "isbn13",
                "file_name",
                "file_size",
                "cover_url",
            ]
            if include_hash:
                fields.extend(["sha256", "path"])
            w = csv.DictWriter(f, fieldnames=fields)
            w.writeheader()
            for g in group_list:
                for dup in g["duplicates"]:
                    row = {
                        "group_id": g["group_id"],
                        "confidence": g["confidence"],
                        "reason": g["reason"],
                        "auto_eligible": int(bool(g.get("auto_eligible"))),
                        "canonical_catalog_num": g["canonical_catalog_num"],
                        "duplicate_catalog_num": dup,
                        "title": meta.get(dup, {}).get("title"),
                        "author": meta.get(dup, {}).get("author"),
                        "edition": meta.get(dup, {}).get("edition"),
                        "volume": meta.get(dup, {}).get("volume"),
                        "isbn13": meta.get(dup, {}).get("isbn13"),
                        "file_name": meta.get(dup, {}).get("fileName"),
                        "file_size": meta.get(dup, {}).get("size_bytes"),
                        "cover_url": meta.get(dup, {}).get("cover_url"),
                    }
                    if include_hash:
                        row["sha256"] = meta.get(dup, {}).get("sha256") or g.get("extra", {}).get(
                            "sha256"
                        )
                        row["path"] = (meta.get(dup, {}).get("paths") or [None])[0]
                    w.writerow(row)

    write_pair_csv(REPORT_DIR / "exact_duplicate_files.csv", auto, include_hash=True)
    write_pair_csv(
        REPORT_DIR / "duplicate_ebooks.csv",
        [g for g in high if g.get("auto_eligible") or g["reason"] == "same_isbn_edition"],
        include_hash=True,
    )
    write_pair_csv(REPORT_DIR / "suspected_duplicates.csv", medium + low, include_hash=False)

    unresolved_ids = sorted(
        {d for d in (medium_dup_ids + low_dup_ids) if d not in auto_dup_ids}
    )
    with (REPORT_DIR / "unresolved_duplicates.csv").open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(
            [
                "catalog_num",
                "confidence",
                "reason",
                "canonical_catalog_num",
                "title",
                "author",
                "isbn13",
            ]
        )
        for g in medium + low:
            for dup in g["duplicates"]:
                if dup in auto_dup_ids:
                    continue
                w.writerow(
                    [
                        dup,
                        g["confidence"],
                        g["reason"],
                        g["canonical_catalog_num"],
                        meta.get(dup, {}).get("title"),
                        meta.get(dup, {}).get("author"),
                        meta.get(dup, {}).get("isbn13"),
                    ]
                )

    recoverable = sum(int(g.get("estimated_recoverable_bytes") or 0) for g in auto)
    summary = {
        "total_catalog_records": len(meta),
        "high_groups": len(high),
        "medium_groups": len(medium),
        "low_groups": len(low),
        "auto_eligible_groups": len(auto),
        "high_duplicate_records": len(high_dup_ids),
        "high_canonical_records": len(high_canonicals),
        "auto_remove_eligible_count": len(auto_dup_ids),
        "auto_remove_eligible": auto_dup_ids,
        "medium_duplicate_records_exclusive": len(
            [d for d in medium_dup_ids if d not in auto_dup_ids]
        ),
        "low_duplicate_records_exclusive": len([d for d in low_dup_ids if d not in auto_dup_ids]),
        "unresolved_duplicate_records": len(unresolved_ids),
        "estimated_storage_recoverable_bytes": recoverable,
        "policy": "auto_only_exact_sha256_or_same_filepath",
    }
    (REPORT_DIR / "dedupe_dry_run_summary.json").write_text(
        json.dumps({k: v for k, v in summary.items() if k != "auto_remove_eligible"}, indent=2),
        encoding="utf-8",
    )
    return summary


def persist_groups(con: sqlite3.Connection, groups: list[dict], meta: dict) -> None:
    now = time.time()
    # Preserve admin decisions; keep 'merged' only when merge_map is still active
    prior = {
        r[0]: (r[1], r[2])
        for r in con.execute("SELECT group_id, status, updated_at FROM duplicate_groups")
    }
    active_merged = {
        int(r[0])
        for r in con.execute(
            "SELECT duplicate_catalog_num FROM merge_map WHERE rolled_back_at IS NULL"
        )
    }
    con.execute("DELETE FROM duplicate_members")
    con.execute("DELETE FROM duplicate_groups")
    # Guard against residual duplicate group_ids within one detect pass.
    seen_gids: set[str] = set()
    unique_groups: list[dict] = []
    for g in groups:
        if g["group_id"] in seen_gids:
            continue
        seen_gids.add(g["group_id"])
        unique_groups.append(g)
    groups = unique_groups
    for g in groups:
        status = "open"
        if g["group_id"] in prior and prior[g["group_id"]][0] in {
            "approved",
            "rejected",
            "merged",
        }:
            prev = prior[g["group_id"]][0]
            if prev == "merged":
                if any(m in active_merged for m in g["duplicates"]):
                    status = "merged"
                else:
                    status = "open"
            else:
                status = prev
        con.execute(
            """
            INSERT INTO duplicate_groups(
              group_id, confidence, reason, canonical_catalog_num, member_count,
              total_bytes, status, auto_eligible, estimated_recoverable_bytes, created_at, updated_at
            ) VALUES(?,?,?,?,?,?,?,?,?,?,?)
            """,
            (
                g["group_id"],
                g["confidence"],
                g["reason"],
                g["canonical_catalog_num"],
                len(g["members"]),
                int(g.get("total_bytes") or 0),
                status,
                1 if g.get("auto_eligible") else 0,
                int(g.get("estimated_recoverable_bytes") or 0),
                now,
                now,
            ),
        )
        for m in g["members"]:
            con.execute(
                """
                INSERT OR REPLACE INTO duplicate_members(
                  group_id, catalog_num, path, sha256, title, author, file_name,
                  edition, volume, isbn13, cover_url, size_bytes, is_canonical
                ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)
                """,
                (
                    g["group_id"],
                    m,
                    (meta.get(m, {}).get("paths") or [None])[0],
                    meta.get(m, {}).get("sha256"),
                    meta.get(m, {}).get("title"),
                    meta.get(m, {}).get("author"),
                    meta.get(m, {}).get("fileName"),
                    meta.get(m, {}).get("edition"),
                    meta.get(m, {}).get("volume"),
                    meta.get(m, {}).get("isbn13"),
                    meta.get(m, {}).get("cover_url"),
                    meta.get(m, {}).get("size_bytes"),
                    1 if m == g["canonical_catalog_num"] else 0,
                ),
            )
    con.commit()


def quarantine_redundant_files(con: sqlite3.Connection, groups: list[dict], meta: dict) -> list[dict]:
    QUARANTINE_DIR.mkdir(parents=True, exist_ok=True)
    moved = []
    sha_canonical_path: dict[str, str] = {}
    for g in groups:
        if not g.get("auto_eligible") or g["reason"] != "exact_sha256":
            continue
        sha = g.get("extra", {}).get("sha256")
        if not sha:
            continue
        paths = meta.get(g["canonical_catalog_num"], {}).get("paths") or []
        if paths:
            sha_canonical_path[sha] = paths[0]

    seen_paths = set()
    for g in groups:
        if not g.get("auto_eligible"):
            continue
        sha = g.get("extra", {}).get("sha256") or meta.get(g["canonical_catalog_num"], {}).get("sha256")
        canon_path = sha_canonical_path.get(sha or "")
        for dup in g["duplicates"]:
            for p in meta.get(dup, {}).get("paths") or []:
                if not p or p in seen_paths:
                    continue
                if canon_path and Path(p).resolve() == Path(canon_path).resolve():
                    continue
                row = con.execute("SELECT sha256 FROM file_assets WHERE path=?", (p,)).fetchone()
                if not row or not row[0]:
                    continue
                if canon_path:
                    crow = con.execute(
                        "SELECT sha256 FROM file_assets WHERE path=?", (canon_path,)
                    ).fetchone()
                    if not crow or crow[0] != row[0]:
                        continue
                # Never quarantine a path still referenced by a non-suppressed canonical
                still_needed = con.execute(
                    """
                    SELECT COUNT(*) FROM catalog_file_links c
                    WHERE c.path=? AND c.catalog_num=?
                    """,
                    (canon_path or p, g["canonical_catalog_num"]),
                ).fetchone()[0]
                if still_needed and Path(p).resolve() == Path(canon_path or p).resolve():
                    continue
                src = Path(p)
                if not src.exists():
                    continue
                dest = QUARANTINE_DIR / f"{row[0][:12]}_{src.name}"
                if dest.exists():
                    dest = QUARANTINE_DIR / f"{row[0][:12]}_{int(time.time())}_{src.name}"
                try:
                    shutil.move(str(src), str(dest))
                    con.execute(
                        """
                        INSERT OR REPLACE INTO quarantine_files(path, sha256, moved_to, quarantined_at, notes)
                        VALUES(?,?,?,?,?)
                        """,
                        (p, row[0], str(dest), time.time(), "exact_sha256_duplicate"),
                    )
                    moved.append({"from": p, "to": str(dest), "sha256": row[0]})
                    seen_paths.add(p)
                except Exception as e:
                    moved.append({"from": p, "error": str(e)})
    con.commit()
    return moved


def apply_soft_remove(
    eligible_dup_ids: list[int],
    groups: list[dict],
    meta: dict,
    con: sqlite3.Connection,
    only_group_ids: set[str] | None = None,
) -> dict:
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    stamp = time.strftime("%Y%m%d_%H%M%S")

    if only_group_ids is not None:
        apply_groups = [g for g in groups if g["group_id"] in only_group_ids]
    else:
        # Default apply path: AUTO-ELIGIBLE exact file duplicates only
        apply_groups = [g for g in groups if g.get("auto_eligible")]

    dup_to_canon: dict[int, int] = {}
    for g in apply_groups:
        for d in g["duplicates"]:
            if only_group_ids is not None or d in eligible_dup_ids or g.get("auto_eligible"):
                dup_to_canon.setdefault(d, g["canonical_catalog_num"])

    high_dup_ids = sorted(dup_to_canon.keys())
    previous = {}
    if SUPPRESSION_PATH.exists():
        try:
            previous = json.loads(SUPPRESSION_PATH.read_text(encoding="utf-8"))
        except Exception:
            previous = {}

    backup = {
        "at": stamp,
        "suppressed": high_dup_ids,
        "previous_suppression": previous,
        "groups": apply_groups,
    }
    backup_path = BACKUP_DIR / f"dedupe_backup_{stamp}.json"
    backup_path.write_text(json.dumps(backup, indent=2), encoding="utf-8")

    existing_suppressed = set(int(x) for x in (previous.get("suppressedCatalogNums") or []))
    existing_map = {
        int(k): int(v) for k, v in (previous.get("canonicalByDuplicate") or {}).items()
    }
    existing_suppressed.update(high_dup_ids)
    existing_map.update(dup_to_canon)

    suppression = {
        "suppressedCatalogNums": sorted(existing_suppressed),
        "canonicalByDuplicate": {str(k): v for k, v in existing_map.items()},
        "updatedAt": time.time(),
        "policy": "HIGH_auto_exact_file_duplicates_plus_approved",
        "backup": str(backup_path.relative_to(ROOT)).replace("\\", "/"),
    }
    SUPPRESSION_PATH.parent.mkdir(parents=True, exist_ok=True)
    SUPPRESSION_PATH.write_text(json.dumps(suppression, indent=2), encoding="utf-8")

    now = time.time()
    for dup, canon in dup_to_canon.items():
        con.execute(
            """
            INSERT OR REPLACE INTO merge_map(duplicate_catalog_num, canonical_catalog_num, group_id, merged_at, backup_json)
            VALUES(?,?,?,?,?)
            """,
            (
                dup,
                canon,
                None,
                now,
                json.dumps({"title": meta.get(dup, {}).get("title"), "backup": str(backup_path)}),
            ),
        )
    for g in apply_groups:
        con.execute(
            "UPDATE duplicate_groups SET status='merged', updated_at=? WHERE group_id=?",
            (now, g["group_id"]),
        )

    if COVERS_DB.exists() and high_dup_ids:
        cdb = sqlite3.connect(str(COVERS_DB))
        cdb.executemany(
            """
            UPDATE covers
            SET status='not_found', error=?, updated_at=?
            WHERE catalog_num=?
            """,
            [("soft_removed_duplicate", now, dup) for dup in high_dup_ids],
        )
        cdb.commit()
        cdb.close()

    moved = quarantine_redundant_files(con, apply_groups, meta)
    con.execute(
        "INSERT INTO audit_log(action, payload_json, created_at) VALUES(?,?,?)",
        (
            "soft_remove_duplicates",
            json.dumps({"count": len(high_dup_ids), "quarantined": len(moved), "backup": str(backup_path)}),
            now,
        ),
    )
    con.commit()

    with (REPORT_DIR / "merged_records.csv").open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["duplicate_catalog_num", "canonical_catalog_num", "title", "author", "reason"])
        reason_by_dup = {}
        for g in apply_groups:
            for d in g["duplicates"]:
                reason_by_dup.setdefault(d, g["reason"])
        for dup, canon in sorted(dup_to_canon.items()):
            w.writerow(
                [
                    dup,
                    canon,
                    meta.get(dup, {}).get("title"),
                    meta.get(dup, {}).get("author"),
                    reason_by_dup.get(dup),
                ]
            )

    with (REPORT_DIR / "removed_files.csv").open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["from", "to", "sha256", "error"])
        w.writeheader()
        for row in moved:
            w.writerow({k: row.get(k) for k in w.fieldnames})

    return {
        "suppressed": len(high_dup_ids),
        "quarantined_files": len([m for m in moved if m.get("to")]),
        "backup": str(backup_path),
        "suppression_file": str(SUPPRESSION_PATH),
    }


def rollback_latest(con: sqlite3.Connection) -> dict:
    backups = sorted(BACKUP_DIR.glob("dedupe_backup_*.json"), reverse=True)
    if not backups:
        raise SystemExit("No dedupe backups found")
    backup_path = backups[0]
    payload = json.loads(backup_path.read_text(encoding="utf-8"))
    previous = payload.get("previous_suppression") or {
        "suppressedCatalogNums": [],
        "canonicalByDuplicate": {},
    }
    SUPPRESSION_PATH.parent.mkdir(parents=True, exist_ok=True)
    previous["updatedAt"] = time.time()
    previous["rolledBackFrom"] = str(backup_path.relative_to(ROOT)).replace("\\", "/")
    SUPPRESSION_PATH.write_text(json.dumps(previous, indent=2), encoding="utf-8")

    now = time.time()
    suppressed = payload.get("suppressed") or []
    for dup in suppressed:
        con.execute(
            "UPDATE merge_map SET rolled_back_at=? WHERE duplicate_catalog_num=?",
            (now, int(dup)),
        )
    con.execute(
        "UPDATE duplicate_groups SET status='open', updated_at=? WHERE status='merged'",
        (now,),
    )
    # Restore quarantined files from this backup's removed list if present
    restored = 0
    removed_csv = REPORT_DIR / "removed_files.csv"
    if removed_csv.exists():
        with removed_csv.open(encoding="utf-8", newline="") as f:
            for row in csv.DictReader(f):
                src = row.get("to")
                dest = row.get("from")
                if src and dest and Path(src).exists() and not Path(dest).exists():
                    Path(dest).parent.mkdir(parents=True, exist_ok=True)
                    shutil.move(src, dest)
                    restored += 1
                    con.execute("DELETE FROM quarantine_files WHERE moved_to=?", (src,))
    con.execute(
        "INSERT INTO audit_log(action, payload_json, created_at) VALUES(?,?,?)",
        (
            "rollback_soft_remove",
            json.dumps({"backup": str(backup_path), "restored_files": restored}),
            now,
        ),
    )
    con.commit()
    return {"backup": str(backup_path), "restored_files": restored, "suppression_restored": True}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="Soft-remove AUTO-ELIGIBLE exact duplicates")
    ap.add_argument("--skip-hash", action="store_true", help="Skip ebook file hashing")
    ap.add_argument("--skip-covers", action="store_true", help="Skip cover hashing")
    ap.add_argument("--skip-content", action="store_true", help="Skip content fingerprint sample")
    ap.add_argument("--content-limit", type=int, default=400)
    ap.add_argument("--rollback-latest", action="store_true")
    args = ap.parse_args()

    ensure_dbs()
    con = sqlite3.connect(str(DEDUPE_DB), timeout=60)

    if args.rollback_latest:
        result = rollback_latest(con)
        print(json.dumps(result, indent=2), flush=True)
        con.close()
        return

    if not args.skip_hash:
        print("Hashing local ebook files (streaming SHA-256)...", flush=True)
        from dedupe_hash_ebook_files import main as hash_main

        hash_main()

    if not args.skip_covers:
        print("Hashing cover images...", flush=True)
        try:
            from dedupe_hash_covers import main as cover_main

            cover_main()
        except Exception as e:
            print(f"cover hashing skipped: {e}", flush=True)

    mapping = load_map()
    enrich = load_enrichment_meta()
    groups, meta = detect_groups(con, mapping, enrich)
    persist_catalog_meta(con, meta)

    if not args.skip_content:
        print(f"Sampling content fingerprints (limit={args.content_limit})...", flush=True)
        compute_content_fingerprints(con, meta, limit=args.content_limit)
        # Re-detect to include fingerprint groups
        groups, meta = detect_groups(con, mapping, enrich)

    persist_groups(con, groups, meta)
    summary = write_reports(groups, meta)
    print(
        json.dumps({k: v for k, v in summary.items() if k != "auto_remove_eligible"}, indent=2),
        flush=True,
    )
    print(
        f"AUTO-ELIGIBLE duplicates for soft-remove: {summary['auto_remove_eligible_count']}",
        flush=True,
    )

    if not args.apply:
        print("Dry-run only. Re-run with --apply to soft-remove AUTO-ELIGIBLE duplicates.", flush=True)
        con.execute(
            "INSERT INTO audit_log(action, payload_json, created_at) VALUES(?,?,?)",
            ("dry_run_detect", json.dumps({k: v for k, v in summary.items() if k != "auto_remove_eligible"}), time.time()),
        )
        con.commit()
        con.close()
        return

    result = apply_soft_remove(summary["auto_remove_eligible"], groups, meta, con)
    print(json.dumps(result, indent=2), flush=True)
    con.close()


if __name__ == "__main__":
    main()
