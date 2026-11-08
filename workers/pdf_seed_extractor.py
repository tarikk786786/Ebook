"""
AnonTrove — PDF Seed Extraction Engine
Extracts all 1,000 startup & business books from '1000_worldwide_startup_business_books.pdf'
across all 25 subject categories with exact index numbering, title, author, and category mappings.
"""

import os
import re
import json
from pathlib import Path
import fitz  # PyMuPDF

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_FILE = DATA_DIR / "seed_1000_books.json"

PDF_PATH = Path(r"C:\Users\tarik\Downloads\1000_worldwide_startup_business_books.pdf")

# The 25 subject areas as defined on Page 3 of the PDF
CATEGORY_MAPPING = {
    1: {"name": "Startups & Entrepreneurship", "slug": "startups-entrepreneurship", "expected": 51},
    2: {"name": "Small Business, Solopreneurship & Business Models", "slug": "small-business-solopreneurship", "expected": 57},
    3: {"name": "Innovation, Product Management & Design", "slug": "innovation-product-design", "expected": 52},
    4: {"name": "Business Strategy & Competitive Advantage", "slug": "business-strategy", "expected": 45},
    5: {"name": "Leadership & Executive Development", "slug": "leadership-executive-development", "expected": 51},
    6: {"name": "Management, Organization & Company Culture", "slug": "management-organization-culture", "expected": 42},
    7: {"name": "Marketing, Branding & Positioning", "slug": "marketing-branding-positioning", "expected": 42},
    8: {"name": "Copywriting, Advertising, Content & Growth", "slug": "copywriting-advertising-growth", "expected": 46},
    9: {"name": "Sales, Selling & Customer Acquisition", "slug": "sales-customer-acquisition", "expected": 42},
    10: {"name": "Negotiation, Communication & Influence", "slug": "negotiation-communication-influence", "expected": 38},
    11: {"name": "Business Finance, Accounting & Cash Flow", "slug": "business-finance-accounting", "expected": 36},
    12: {"name": "Investing, Markets & Capital Allocation", "slug": "investing-markets-capital-allocation", "expected": 42},
    13: {"name": "Personal Finance, Wealth & Financial Freedom", "slug": "personal-finance-wealth", "expected": 40},
    14: {"name": "Economics, Business History & Economic Systems", "slug": "economics-business-history", "expected": 48},
    15: {"name": "Psychology, Decision-Making & Behavioral Science", "slug": "psychology-behavioral-science", "expected": 42},
    16: {"name": "Productivity, Focus, Habits & Execution", "slug": "productivity-habits-execution", "expected": 43},
    17: {"name": "Operations, Process, Quality & Supply Chain", "slug": "operations-process-supply-chain", "expected": 35},
    18: {"name": "Technology, Digital Business, Software & AI", "slug": "technology-software-ai", "expected": 42},
    19: {"name": "Ecommerce, Retail, DTC & Digital Commerce", "slug": "ecommerce-retail-dtc", "expected": 29},
    20: {"name": "Customer Experience, Service & Customer Success", "slug": "customer-experience-service", "expected": 32},
    21: {"name": "Founder Biographies & Business Memoirs", "slug": "founder-biographies-memoirs", "expected": 37},
    22: {"name": "Corporate Case Studies, Business Stories & Failure", "slug": "corporate-case-studies-failure", "expected": 19},
    23: {"name": "Global Business, International Markets & Emerging Economies", "slug": "global-business-emerging-markets", "expected": 29},
    24: {"name": "Sustainability, Social Enterprise, Ethics & Impact", "slug": "sustainability-social-enterprise", "expected": 34},
    25: {"name": "Talent, Teams, Hiring & Workplace", "slug": "talent-teams-hiring", "expected": 26},
}

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-")[:90]

def extract_books_from_pdf():
    if not PDF_PATH.exists():
        raise FileNotFoundError(f"Source PDF not found at {PDF_PATH}")

    doc = fitz.open(PDF_PATH)
    print(f"[PDF Extractor] Opened '{PDF_PATH.name}' ({len(doc)} pages).")

    all_books = []
    current_category_idx = 1

    # Book entries start on page 4 (0-indexed: page 3) through page 35 (0-indexed: page 34)
    # Each entry has a 4-digit reference number: 0001 to 1000
    
    # Aggregate text blocks across pages 3 to 34
    for page_num in range(3, 35):
        page = doc[page_num]
        text = page.get_text("text")
        lines = [line.strip() for line in text.split("\n") if line.strip()]

        i = 0
        while i < len(lines):
            line = lines[i]

            # Detect category headings on page
            for cat_id, cat_meta in CATEGORY_MAPPING.items():
                if line.lower() == cat_meta["name"].lower():
                    current_category_idx = cat_id
                    break

            # Match 4-digit book index e.g. "0001" or "0001 The Lean Startup"
            match = re.match(r"^(\d{4})\s*(.*)$", line)
            if match:
                ref_num = int(match.group(1))
                rest = match.group(2).strip()

                title = ""
                author = ""

                if rest:
                    title = rest
                    # Author is on the next line
                    if i + 1 < len(lines):
                        author = lines[i + 1]
                        i += 1
                else:
                    # Title is on line i+1, Author is on line i+2
                    if i + 1 < len(lines):
                        title = lines[i + 1]
                        i += 1
                    if i + 1 < len(lines):
                        author = lines[i + 1]
                        i += 1

                # Clean up author if it contains subsequent index or header
                if re.match(r"^\d{4}", author) or "curated bibliography" in author.lower() or "page " in author.lower():
                    author = "Unknown"

                # Check category based on ref_num ranges if heading wasn't explicitly triggered
                cat_info = get_category_for_ref(ref_num, current_category_idx)

                all_books.append({
                    "ref": f"{ref_num:04d}",
                    "id": f"seed-book-{ref_num:04d}",
                    "title": clean_title(title),
                    "author": clean_author(author),
                    "category": cat_info["name"],
                    "categorySlug": cat_info["slug"],
                    "categoryIndex": cat_info["id"],
                    "slug": slugify(f"{title} by {author}"),
                    "source": "Global Reading List: 1000 Startup & Business Books",
                    "status": "DISCOVERED",
                    "verified": False,
                    "metadata": {
                        "seedReference": ref_num,
                        "extractedFromPdf": True
                    }
                })

            i += 1

    doc.close()

    # Deduplicate / sort by reference number
    unique_books = {}
    for b in all_books:
        ref = b["ref"]
        if ref not in unique_books or len(b["author"]) > len(unique_books[ref]["author"]):
            unique_books[ref] = b

    sorted_books = [unique_books[k] for k in sorted(unique_books.keys())]

    print(f"[PDF Extractor] Extracted {len(sorted_books)} unique books from PDF (Target: 1,000).")

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(sorted_books, f, indent=2, ensure_ascii=False)

    print(f"[PDF Extractor] Saved canonical seed database to: {OUTPUT_FILE}")
    return sorted_books

def get_category_for_ref(ref: int, fallback_idx: int):
    # Reference ranges based on the table of contents cumulative counts
    ranges = [
        (1, 51, 1),
        (52, 108, 2),
        (109, 160, 3),
        (161, 205, 4),
        (206, 256, 5),
        (257, 298, 6),
        (299, 340, 7),
        (341, 386, 8),
        (387, 428, 9),
        (429, 466, 10),
        (467, 502, 11),
        (503, 544, 12),
        (545, 584, 13),
        (585, 632, 14),
        (633, 674, 15),
        (675, 717, 16),
        (718, 752, 17),
        (753, 794, 18),
        (795, 823, 19),
        (824, 855, 20),
        (856, 892, 21),
        (893, 911, 22),
        (912, 940, 23),
        (941, 974, 24),
        (975, 1000, 25),
    ]
    for start, end, cat_id in ranges:
        if start <= ref <= end:
            return {"id": cat_id, "name": CATEGORY_MAPPING[cat_id]["name"], "slug": CATEGORY_MAPPING[cat_id]["slug"]}

    return {"id": fallback_idx, "name": CATEGORY_MAPPING[fallback_idx]["name"], "slug": CATEGORY_MAPPING[fallback_idx]["slug"]}

def clean_title(title: str) -> str:
    title = re.sub(r"\s+", " ", title).strip()
    return title

def clean_author(author: str) -> str:
    author = re.sub(r"\s+", " ", author).strip()
    # Remove unwanted footer text if accidentally captured
    author = re.sub(r"(Worldwide Startup & Business Books|Curated bibliography|Page \d+).*", "", author, flags=re.I).strip()
    return author

if __name__ == "__main__":
    extract_books_from_pdf()
