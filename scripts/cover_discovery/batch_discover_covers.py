"""
Batch Cover Discovery Pipeline
Discovers, validates, optimizes, and updates covers for enriched books in data/enriched_1000_books.json.
"""
import sys
import os
import json
import logging

sys.path.insert(0, os.path.abspath("projects/anon-trove-ebooks"))

from scripts.cover_discovery.orchestrator import CoverOrchestrator

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(name)s: %(message)s')

def run_batch_discovery(batch_limit: int = 20):
    json_path = "projects/anon-trove-ebooks/data/enriched_1000_books.json"
    if not os.path.exists(json_path):
        print(f"Error: {json_path} not found.")
        return

    with open(json_path, "r", encoding="utf-8") as f:
        books = json.load(f)

    orchestrator = CoverOrchestrator()
    updated_count = 0

    print(f"Starting batch discovery for top {batch_limit} books...")

    for i, book in enumerate(books[:batch_limit]):
        # Normalize fields for orchestrator
        book_input = {
            "id": book.get("id"),
            "title": book.get("title"),
            "author": book.get("author"),
            "isbn": book.get("isbn13") or book.get("isbn10"),
            "coverImage": book.get("coverUrl"),
            "category": book.get("category")
        }

        # Check if current cover is already a verified local file
        current_cover = book.get("coverUrl", "")
        if current_cover.startswith("/covers/"):
            local_path = os.path.join("projects/anon-trove-ebooks/public/covers", os.path.basename(current_cover))
            if os.path.isfile(local_path) and os.path.getsize(local_path) > 3000:
                print(f"[{i+1}/{batch_limit}] Skipping already verified local cover: {book.get('title')}")
                continue

        res = orchestrator.process_single_book(book_input, overwrite_existing=False)

        if res.get("status") == "SUCCESS":
            new_cover = res["cover_url"]
            book["coverUrl"] = new_cover
            updated_count += 1
            print(f"[{i+1}/{batch_limit}] Updated '{book.get('title')}' -> {new_cover}")
        else:
            print(f"[{i+1}/{batch_limit}] Status {res.get('status')} for '{book.get('title')}'")

    if updated_count > 0:
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(books, f, indent=2)
        print(f"\nSuccessfully updated {updated_count} books in {json_path}")
    else:
        print("\nNo books needed updates or no new covers discovered.")

if __name__ == "__main__":
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else 15
    run_batch_discovery(batch_limit=limit)
