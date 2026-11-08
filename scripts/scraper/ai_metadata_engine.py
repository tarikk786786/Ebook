"""
AI Metadata Engine: Normalizes book titles, validates ISBN checksums, classifies categories,
and calculates confidence scores for cross-source deduplication.
"""

import re

def clean_title(raw_title):
    if not raw_title:
        return "Untitled"
    # Remove file extensions
    cleaned = re.sub(r'\.(pdf|epub|mobi|azw3|docx|txt)$', '', raw_title, flags=re.IGNORECASE)
    # Remove leading numbering like "001-", "01_", "[Team SPY]"
    cleaned = re.sub(r'^\d+[\s\-_]+', '', cleaned)
    cleaned = re.sub(r'\[.*?\]|\(.*?\)', '', cleaned)
    cleaned = re.sub(r'[\-_]+', ' ', cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned.title() if cleaned else raw_title

def validate_isbn(isbn_str):
    if not isbn_str:
        return False
    clean = re.sub(r'[^0-9X]', '', str(isbn_str).upper())
    # ISBN-10 check
    if len(clean) == 10:
        total = 0
        for i in range(9):
            if not clean[i].isdigit():
                return False
            total += int(clean[i]) * (10 - i)
        check = 10 if clean[9] == 'X' else int(clean[9]) if clean[9].isdigit() else -1
        total += check
        return total % 11 == 0
    # ISBN-13 check
    elif len(clean) == 13:
        if not clean.isdigit():
            return False
        total = sum(int(clean[i]) * (1 if i % 2 == 0 else 3) for i in range(12))
        check = (10 - (total % 10)) % 10
        return check == int(clean[12])
    return False

def compute_confidence_score(record):
    score = 0.5
    if record.get("title") and record.get("title") != "Untitled":
        score += 0.2
    if record.get("authors") and record.get("authors")[0] not in ["Unknown Author", "Unknown"]:
        score += 0.1
    if record.get("primaryIsbn") and validate_isbn(record.get("primaryIsbn")):
        score += 0.15
    if record.get("coverImage") and record.get("coverImage").startswith("http"):
        score += 0.05
    return min(1.0, round(score, 2))

def generate_dedup_key(record):
    isbn = record.get("primaryIsbn", "")
    if isbn and validate_isbn(isbn):
        return f"isbn:{re.sub(r'[^0-9X]', '', isbn.upper())}"
    title_norm = re.sub(r'[^a-z0-9]', '', record.get("title", "").lower())
    first_author = ""
    if record.get("authors"):
        first_author = re.sub(r'[^a-z0-9]', '', str(record.get("authors")[0]).lower())[:10]
    return f"title:{title_norm[:30]}_{first_author}"
