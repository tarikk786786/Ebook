import json
import os
import sys

def audit_catalogue():
    project_dir = r"C:\Users\tarik\Downloads\EBOOKS SELLING\projects\anon-trove-ebooks"
    demanded_path = os.path.join(project_dir, "data", "demanded_books_registry.json")
    enriched_path = os.path.join(project_dir, "data", "enriched_1000_books.json")
    registry_path = os.path.join(project_dir, "data", "books_registry.json")
    all_path = os.path.join(project_dir, "data", "all_83925_catalog.json")
    covers_dir = os.path.join(project_dir, "public", "covers")

    print("=================================================================")
    print("PHASE 1: FULL CATALOGUE DISCOVERY & BASELINE INVENTORY AUDIT")
    print("=================================================================")

    # 1. Load catalogs
    print("Loading catalog files...")
    with open(demanded_path, "r", encoding="utf-8") as f:
        demanded = json.load(f)
    with open(enriched_path, "r", encoding="utf-8") as f:
        enriched = json.load(f)
    with open(registry_path, "r", encoding="utf-8") as f:
        registry = json.load(f)
    with open(all_path, "r", encoding="utf-8") as f:
        master = json.load(f)

    # 2. Inspect covers on disk
    local_covers = set(os.listdir(covers_dir)) if os.path.exists(covers_dir) else set()
    print(f"Discovered {len(local_covers):,} cover files on disk in public/covers.")

    def analyze_dataset(name, items):
        total = len(items)
        has_isbn = 0
        has_desc = 0
        has_publisher = 0
        has_year = 0
        has_author = 0
        has_real_author = 0
        has_pages = 0
        has_cover = 0
        has_local_cover = 0
        has_standard_fallback = 0

        categories = {}
        missing_fields = {
            "isbn": [],
            "description": [],
            "publisher": [],
            "cover": []
        }

        for b in items:
            # ISBN
            isbn = b.get("isbn") or b.get("isbn13") or b.get("isbn10")
            if isbn and len(str(isbn).strip()) >= 9:
                has_isbn += 1
            else:
                missing_fields["isbn"].append(b.get("id"))

            # Description
            desc = b.get("description", "")
            if desc and len(str(desc).strip()) > 30 and not "Comprehensive DRM-free" in desc:
                has_desc += 1
            else:
                missing_fields["description"].append(b.get("id"))

            # Publisher
            pub = b.get("publisher", "")
            if pub and len(str(pub).strip()) > 2 and pub != "Independent":
                has_publisher += 1
            else:
                missing_fields["publisher"].append(b.get("id"))

            # Year
            yr = b.get("publicationYear") or b.get("publishedYear")
            if yr and str(yr).isdigit() and int(yr) > 1900:
                has_year += 1

            # Author
            aut = b.get("author", "")
            if aut and len(str(aut).strip()) > 1:
                has_author += 1
                if not any(k in aut.lower() for k in ["editorial", "unknown", "guild", "anontrove"]):
                    has_real_author += 1

            # Pages
            p = b.get("pages") or b.get("pageCount")
            if p and int(p) > 5:
                has_pages += 1

            # Cover
            cv = b.get("coverImage") or b.get("coverUrl") or ""
            if cv:
                has_cover += 1
                if "standard-shelf-cover" in cv:
                    has_standard_fallback += 1
                else:
                    fn = os.path.basename(cv)
                    if fn in local_covers:
                        has_local_cover += 1

            # Category
            cat = b.get("category") or "Uncategorized"
            categories[cat] = categories.get(cat, 0) + 1

        return {
            "dataset": name,
            "total_books": total,
            "has_isbn": has_isbn,
            "isbn_pct": round((has_isbn / total) * 100, 1) if total else 0,
            "has_description": has_desc,
            "description_pct": round((has_desc / total) * 100, 1) if total else 0,
            "has_publisher": has_publisher,
            "publisher_pct": round((has_publisher / total) * 100, 1) if total else 0,
            "has_publication_year": has_year,
            "has_author": has_author,
            "has_verified_author": has_real_author,
            "verified_author_pct": round((has_real_author / total) * 100, 1) if total else 0,
            "has_page_count": has_pages,
            "has_cover_image": has_cover,
            "has_local_cover": has_local_cover,
            "has_standard_fallback": has_standard_fallback,
            "categories_count": len(categories),
            "top_categories": dict(sorted(categories.items(), key=lambda x: -x[1])[:5])
        }

    demanded_stats = analyze_dataset("Demanded Books Registry", demanded)
    enriched_stats = analyze_dataset("Enriched 1000 Registry", enriched)
    registry_stats = analyze_dataset("Telegram Harvest Registry", registry)
    master_stats = analyze_dataset("Master 86k Catalog", master)

    audit_report = {
        "timestamp": "2026-11-09T14:20:00Z",
        "inventory_summary": {
            "total_registered_titles": len(master),
            "unique_cover_files_on_disk": len(local_covers),
            "core_demanded_titles": len(demanded),
            "curated_masterclasses": len(enriched),
            "telegram_archive_titles": len(registry)
        },
        "datasets": [
            demanded_stats,
            enriched_stats,
            registry_stats,
            master_stats
        ]
    }

    out_file = os.path.join(project_dir, "data", "catalogue_inventory_audit.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(audit_report, f, indent=2)

    print("\n================ AUDIT SUMMARY ================")
    print(f"Demanded Books (261):")
    print(f"  • Verified ISBN: {demanded_stats['has_isbn']} ({demanded_stats['isbn_pct']}%)")
    print(f"  • Custom/Local Covers: {demanded_stats['has_local_cover']}")
    print(f"  • Verified Authors: {demanded_stats['has_verified_author']} ({demanded_stats['verified_author_pct']}%)")
    print(f"  • Rich Descriptions: {demanded_stats['has_description']} ({demanded_stats['description_pct']}%)")

    print(f"\nEnriched 1000 Books (1,000):")
    print(f"  • Verified ISBN: {enriched_stats['has_isbn']} ({enriched_stats['isbn_pct']}%)")
    print(f"  • Publishers Found: {enriched_stats['has_publisher']} ({enriched_stats['publisher_pct']}%)")
    print(f"  • Local Covers on Disk: {enriched_stats['has_local_cover']}")
    print(f"  • Standard Fallback Covers: {enriched_stats['has_standard_fallback']}")

    print(f"\nMaster Catalog (86,260):")
    print(f"  • Standard Fallbacks: {master_stats['has_standard_fallback']:,}")
    print(f"  • Awaiting Full Multi-Source Enrichment: {len(master) - master_stats['has_isbn']:,}")
    print(f"\nDetailed audit saved to: {out_file}")

if __name__ == "__main__":
    audit_catalogue()
