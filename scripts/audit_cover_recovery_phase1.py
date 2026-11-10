#!/usr/bin/env python3
"""Phase 1 audit: cover coverage, metadata, storage, market data."""
from __future__ import annotations

import json
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def count_sql(db: Path, sql: str, params: tuple = ()) -> int:
    con = sqlite3.connect(str(db))
    try:
        return int(con.execute(sql, params).fetchone()[0])
    finally:
        con.close()


def main() -> None:
    covers_db = ROOT / "data" / "covers_86k.sqlite"
    enrich_db = ROOT / "data" / "enrichment_86k_checkpoint.db"
    report: dict = {"project": "AnonTrove", "paths": {}}

    if covers_db.exists():
        con = sqlite3.connect(str(covers_db))
        status = dict(con.execute("select status, count(*) from covers group by status"))
        sources = dict(
            con.execute(
                "select coalesce(source,'(none)'), count(*) from covers where status='found' group by source"
            )
        )
        report["covers_86k"] = {
            "total": sum(status.values()),
            "by_status": status,
            "found_by_source": sources,
        }
        con.close()

    if enrich_db.exists():
        con = sqlite3.connect(str(enrich_db))
        books = con.execute("select count(*) from books").fetchone()[0]
        with_cover = con.execute(
            "select count(*) from books where cover_url is not null and trim(cover_url) != ''"
        ).fetchone()[0]
        isbn13 = con.execute(
            "select count(*) from books where isbn13 is not null and trim(isbn13) != ''"
        ).fetchone()[0]
        isbn10 = con.execute(
            "select count(*) from books where isbn10 is not null and trim(isbn10) != ''"
        ).fetchone()[0]
        author = con.execute(
            "select count(*) from books where author is not null and trim(author) != ''"
        ).fetchone()[0]
        year = con.execute(
            "select count(*) from books where publication_year is not null and publication_year != ''"
        ).fetchone()[0]
        ml_priced = con.execute(
            "select count(*) from marketplace_listings where current_price is not null and current_price > 0"
        ).fetchone()[0]
        ml_total = con.execute("select count(*) from marketplace_listings").fetchone()[0]
        pi_lowest = con.execute(
            "select count(*) from pricing_intelligence where lowest_comparable_digital_price is not null and lowest_comparable_digital_price > 0"
        ).fetchone()[0]
        tables = [r[0] for r in con.execute("select name from sqlite_master where type='table'")]
        report["enrichment"] = {
            "books": books,
            "books_with_cover_url": with_cover,
            "isbn13": isbn13,
            "isbn10": isbn10,
            "with_author": author,
            "with_year": year,
            "marketplace_listings": ml_total,
            "marketplace_priced": ml_priced,
            "pricing_lowest_comparable": pi_lowest,
            "tables": tables,
        }
        con.close()

    idx_path = ROOT / "data" / "catalog" / "cover_url_index_86k.json"
    if idx_path.exists():
        idx = json.loads(idx_path.read_text(encoding="utf-8"))
        report["cover_url_index"] = {
            "count_field": idx.get("count"),
            "map_keys": len(idx.get("map") or {}),
            "bytes": idx_path.stat().st_size,
        }

    covers_dir = ROOT / "public" / "covers"
    report["local_storage"] = {
        "public_covers_jpg": sum(1 for _ in covers_dir.glob("*.jpg")),
        "public_covers_webp": sum(1 for _ in covers_dir.glob("*.webp")),
        "book_covers": sum(1 for p in (ROOT / "public" / "book-covers").iterdir() if p.is_file())
        if (ROOT / "public" / "book-covers").exists()
        else 0,
        "private_storage_exists": (ROOT / "private_storage").exists(),
    }

    # Existing scripts / API surface
    report["existing_surface"] = {
        "cover_api": (ROOT / "app" / "api" / "covers" / "[slug]" / "route.ts").exists(),
        "cover_index_lib": (ROOT / "lib" / "cover-url-index.ts").exists(),
        "fetch_script": (ROOT / "scripts" / "fetch_all_86k_covers.py").exists(),
        "pdf_render_script": (ROOT / "scripts" / "render_covers_from_local_pdfs.py").exists(),
        "admin_discovery": (ROOT / "app" / "admin" / "discovery" / "page.tsx").exists(),
        "admin_enrichment": (ROOT / "app" / "admin" / "enrichment" / "page.tsx").exists(),
    }

    out = ROOT / "data" / "reports" / "cover_recovery_phase1_audit.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))
    print(f"\nWrote {out}")


if __name__ == "__main__":
    main()
