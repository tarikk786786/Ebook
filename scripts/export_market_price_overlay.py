#!/usr/bin/env python3
"""Export slim marketplace price overlay for storefront PDPs (priced rows only)."""
from __future__ import annotations

import json
import re
import sqlite3
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "data" / "enrichment_86k_checkpoint.db"
OUT = ROOT / "data" / "catalog" / "market_price_overlay.json"


def slugify(value: str, max_len: int = 80) -> str:
    text = unicodedata.normalize("NFKD", value or "")
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text).strip("-").lower()
    return (text[:max_len] or "book").rstrip("-")


def main() -> None:
    con = sqlite3.connect(str(DB))
    con.row_factory = sqlite3.Row
    rows = con.execute(
        """
        SELECT
          b.title,
          b.author,
          b.isbn13,
          b.isbn10,
          pi.lowest_comparable_digital_price AS lowest,
          pi.market_reference_price AS market_ref,
          pi.publisher_msrp AS msrp,
          pi.recommended_selling_price AS recommended,
          pi.updated_at AS verified_at,
          (
            SELECT ml.current_price
            FROM marketplace_listings ml
            WHERE ml.manifest_id = b.manifest_id
              AND ml.current_price IS NOT NULL AND ml.current_price > 0
            ORDER BY ml.current_price ASC
            LIMIT 1
          ) AS amazonish_price,
          (
            SELECT ml.product_url
            FROM marketplace_listings ml
            WHERE ml.manifest_id = b.manifest_id
              AND ml.product_url IS NOT NULL AND trim(ml.product_url) != ''
            ORDER BY CASE WHEN lower(coalesce(ml.platform,'')) LIKE '%amazon%' THEN 0 ELSE 1 END
            LIMIT 1
          ) AS product_url,
          (
            SELECT ml.current_price
            FROM marketplace_listings ml
            WHERE ml.manifest_id = b.manifest_id
              AND lower(coalesce(ml.platform,'')) LIKE '%google%'
              AND ml.current_price IS NOT NULL AND ml.current_price > 0
            ORDER BY ml.current_price ASC
            LIMIT 1
          ) AS google_price
        FROM books b
        LEFT JOIN pricing_intelligence pi ON pi.manifest_id = b.manifest_id
        WHERE
          (pi.lowest_comparable_digital_price IS NOT NULL AND pi.lowest_comparable_digital_price > 0)
          OR EXISTS (
            SELECT 1 FROM marketplace_listings ml
            WHERE ml.manifest_id = b.manifest_id
              AND ml.current_price IS NOT NULL AND ml.current_price > 0
          )
        """
    ).fetchall()
    con.close()

    mapping: dict[str, dict] = {}
    for r in rows:
        title = (r["title"] or "").strip()
        if not title:
            continue
        slug = slugify(title)
        lowest = r["lowest"] or r["amazonish_price"]
        market = r["google_price"] or r["market_ref"] or r["amazonish_price"]
        entry = {
            "title": title,
            "author": r["author"],
            "isbn13": r["isbn13"],
            "isbn10": r["isbn10"],
            "lowestComparablePrice": int(round(lowest)) if lowest else None,
            "marketCurrentPrice": int(round(market)) if market else None,
            "publisherListPrice": int(round(r["msrp"])) if r["msrp"] else None,
            "priceVerifiedAt": r["verified_at"] or None,
            "priceSourceUrl": r["product_url"] or None,
            "amazonUrl": r["product_url"] if r["product_url"] and "amazon" in (r["product_url"] or "").lower() else None,
        }
        mapping[slug] = entry
        if r["isbn13"]:
            mapping[f"isbn:{r['isbn13']}"] = entry

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps({"map": mapping, "count": len(rows)}, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"Wrote {OUT} rows={len(rows)} keys={len(mapping)}")


if __name__ == "__main__":
    main()
