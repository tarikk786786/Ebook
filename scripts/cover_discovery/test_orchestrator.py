"""
Test Runner for Cover Discovery Orchestrator
Executes real discovery across top books to verify all providers, visual QA, and rights logging.
"""
import sys
import os
import json

# Ensure parent directory is in sys.path
sys.path.insert(0, os.path.abspath("projects/anon-trove-ebooks"))

from scripts.cover_discovery.orchestrator import CoverOrchestrator

test_books = [
    {
        "id": "test-book-001",
        "title": "The Lean Startup",
        "author": "Eric Ries",
        "isbn": "9780307887894",
        "category": "Startup & Entrepreneurship"
    },
    {
        "id": "test-book-002",
        "title": "Zero to One: Notes on Startups, or How to Build the Future",
        "author": "Peter Thiel",
        "isbn": "9780804139298",
        "category": "Startup & Entrepreneurship"
    },
    {
        "id": "test-book-003",
        "title": "Thinking, Fast and Slow",
        "author": "Daniel Kahneman",
        "isbn": "9780374275631",
        "category": "Personal Development & Psychology"
    },
    {
        "id": "test-book-004",
        "title": "Rich Dad Poor Dad",
        "author": "Robert T. Kiyosaki",
        "isbn": "9781612680194",
        "category": "Finance & Wealth"
    },
    {
        "id": "test-book-005",
        "title": "Atomic Habits",
        "author": "James Clear",
        "isbn": "9780735211292",
        "category": "Personal Development & Psychology"
    }
]

if __name__ == "__main__":
    print("=== Testing Cover Discovery Multi-Agent System ===")
    orchestrator = CoverOrchestrator()
    results = orchestrator.run_batch(test_books, limit=5)

    print("\n=== Test Results Summary ===")
    print(f"Total Processed: {results['total_processed']}")
    print(f"Success Count:   {results['success_count']}")
    print(f"Skipped Count:   {results['skipped_count']}")
    print(f"Failed Count:    {results['failed_count']}")
    print("\nDetailed Records:")
    for detail in results["details"]:
        print(f"- [{detail.get('book_id')}] {detail.get('title')}: {detail.get('status')} -> {detail.get('cover_url')} (Provider: {detail.get('provider')}, Score: {detail.get('confidence')})")

    # Read and print ledger entries
    ledger_path = "projects/anon-trove-ebooks/data/cover_provenance_ledger.json"
    if os.path.exists(ledger_path):
        with open(ledger_path, "r", encoding="utf-8") as f:
            ledger = json.load(f)
        print(f"\nProvenance Ledger Records: {len(ledger)} entries stored.")
