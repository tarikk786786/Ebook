#!/usr/bin/env python3
"""Audit an 86,260-row lookup-link CSV or ZIP without changing the eBook catalog."""

from __future__ import annotations

import argparse
import collections
import csv
import json
import sys
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

EXPECTED_HEADERS = [
    "Manifest ID",
    "Listed title",
    "Listed author / contributor (unverified)",
    "Listed category",
    "Source filename",
    "Google Books lookup",
    "Open Library lookup",
    "Crossref API lookup",
    "Cover search — Google Images",
    "Cover search — Wikimedia Commons",
    "Author research — Google",
    "Author research — Wikipedia",
    "Legal access discovery — Internet Archive",
    "Public-domain discovery — Project Gutenberg",
    "Purchase search — Amazon India",
    "Purchase search — Google Play Books",
    "Publisher / official source search",
    "Link status",
]

EXPECTED_HOSTS = {
    "Google Books lookup": {"books.google.com"},
    "Open Library lookup": {"openlibrary.org"},
    "Crossref API lookup": {"api.crossref.org"},
    "Cover search — Google Images": {"www.google.com"},
    "Cover search — Wikimedia Commons": {"commons.wikimedia.org"},
    "Author research — Google": {"www.google.com"},
    "Author research — Wikipedia": {"en.wikipedia.org"},
    "Legal access discovery — Internet Archive": {"archive.org"},
    "Public-domain discovery — Project Gutenberg": {"www.gutenberg.org"},
    "Purchase search — Amazon India": {"www.amazon.in"},
    "Purchase search — Google Play Books": {"play.google.com"},
    "Publisher / official source search": {"www.google.com"},
}

REQUIRED_TEXT = [
    "Listed title",
    "Listed author / contributor (unverified)",
    "Listed category",
    "Source filename",
]


def open_input(path: Path):
    if path.suffix.lower() == ".zip":
        archive = zipfile.ZipFile(path)
        members = [n for n in archive.namelist() if n.lower().endswith(".csv")]
        if len(members) != 1:
            archive.close()
            raise ValueError(
                f"Expected exactly one CSV inside ZIP; found {len(members)}"
            )
        raw = archive.open(members[0], "r")
        text = __import__("io").TextIOWrapper(raw, encoding="utf-8-sig", newline="")
        return archive, text, members[0]

    return None, path.open("r", encoding="utf-8-sig", newline=""), str(path)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="CSV or ZIP containing one CSV")
    parser.add_argument(
        "--report",
        type=Path,
        default=Path("data/reports/research_link_directory_audit.json"),
        help="Output JSON report path",
    )
    args = parser.parse_args()

    if not args.input.is_file():
        parser.error(f"Input file not found: {args.input}")

    archive = None
    source = None
    try:
        archive, source, member_name = open_input(args.input)
        reader = csv.DictReader(source)
        headers = reader.fieldnames or []
        missing_headers = [h for h in EXPECTED_HEADERS if h not in headers]
        if missing_headers:
            raise ValueError("Missing CSV headers: " + ", ".join(missing_headers))

        seen_ids: set[int] = set()
        duplicate_ids: list[int] = []
        title_groups: collections.Counter[str] = collections.Counter()
        link_status_counts: collections.Counter[str] = collections.Counter()
        host_counts: collections.Counter[str] = collections.Counter()
        invalid_urls: list[dict[str, str | int]] = []
        missing_values: collections.Counter[str] = collections.Counter()
        row_count = 0
        min_id: int | None = None
        max_id: int | None = None

        for row_number, row in enumerate(reader, start=2):
            row_count += 1
            raw_id = (row.get("Manifest ID") or "").strip()
            try:
                manifest_id = int(raw_id)
            except ValueError:
                manifest_id = None

            if manifest_id is None:
                invalid_urls.append(
                    {"row": row_number, "field": "Manifest ID", "value": raw_id}
                )
            else:
                if manifest_id in seen_ids:
                    duplicate_ids.append(manifest_id)
                seen_ids.add(manifest_id)
                min_id = manifest_id if min_id is None else min(min_id, manifest_id)
                max_id = manifest_id if max_id is None else max(max_id, manifest_id)

            parts = [
                (row.get("Listed title") or "").strip().casefold(),
                (row.get("Listed author / contributor (unverified)") or "").strip().casefold(),
                (row.get("Listed category") or "").strip().casefold(),
            ]
            title_groups["|".join(parts)] += 1

            link_status_counts[(row.get("Link status") or "").strip()] += 1

            for field in REQUIRED_TEXT:
                if not (row.get(field) or "").strip():
                    missing_values[field] += 1

            for field, allowed_hosts in EXPECTED_HOSTS.items():
                value = (row.get(field) or "").strip()
                if not value:
                    missing_values[field] += 1
                    continue
                parsed = urlparse(value)
                host = (parsed.hostname or "").lower()
                if parsed.scheme != "https" or host not in allowed_hosts:
                    invalid_urls.append(
                        {"row": row_number, "field": field, "value": value[:500]}
                    )
                else:
                    host_counts[host] += 1

        repeated_groups = sum(1 for count in title_groups.values() if count > 1)
        rows_in_repeated_groups = sum(
            count for count in title_groups.values() if count > 1
        )
        extra_repeat_rows = sum(
            count - 1 for count in title_groups.values() if count > 1
        )

        report = {
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "sourceArchive": str(args.input),
            "sourceMember": member_name,
            "rows": row_count,
            "manifestIds": {
                "unique": len(seen_ids),
                "min": min_id,
                "max": max_id,
                "duplicateCount": len(duplicate_ids),
                "duplicateSamples": duplicate_ids[:50],
                "sequential1To86260": (
                    row_count == 86260
                    and min_id == 1
                    and max_id == 86260
                    and len(seen_ids) == 86260
                    and not duplicate_ids
                ),
            },
            "titleAuthorCategoryGroups": len(title_groups),
            "repeatedGroups": repeated_groups,
            "rowsInRepeatedGroups": rows_in_repeated_groups,
            "extraRepeatRows": extra_repeat_rows,
            "linkStatusCounts": dict(link_status_counts),
            "validLinkHostCounts": dict(host_counts),
            "missingValueCounts": dict(missing_values),
            "invalidUrlCount": len(invalid_urls),
            "invalidUrlSamples": invalid_urls[:100],
            "notes": [
                "Lookup URLs are unverified search leads, not verified records.",
                "Google Images/Wikimedia links are search pages, not direct image files.",
                "No price, identity, image, access right, or redistribution license is verified by this audit.",
                "Repeated title/author/category groups are review candidates, not automatic deletion instructions.",
            ],
        }

        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(
            json.dumps(report, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(json.dumps(report, ensure_ascii=False, indent=2))
        print(f"\nWrote report: {args.report}")
        return 0 if not missing_headers and not invalid_urls else 2

    except (OSError, zipfile.BadZipFile, ValueError) as exc:
        print(f"Audit failed: {exc}", file=sys.stderr)
        return 1
    finally:
        if source is not None:
            source.close()
        if archive is not None:
            archive.close()


if __name__ == "__main__":
    raise SystemExit(main())
