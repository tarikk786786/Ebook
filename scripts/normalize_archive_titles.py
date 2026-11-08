"""
Normalizes and sanitizes archive titles in data/books_registry.json.
Strips personal channel tags, replaces single-number titles with descriptive study set names,
and cleans noisy strings.
"""
import json
import re

registry_path = "projects/anon-trove-ebooks/data/books_registry.json"

with open(registry_path, "r", encoding="utf-8") as f:
    books = json.load(f)

cleaned_count = 0

for b in books:
    orig_title = b.get("title", "")
    t = orig_title.strip()
    category = b.get("category", "Academic")

    # 1. Clean single number titles (e.g. "5", "6", "2")
    if re.match(r'^\d+$', t):
        b["title"] = f"{category} Practice Set #{t}"
        cleaned_count += 1
        continue

    # 2. Clean "Worksheet X"
    if re.match(r'^Worksheet\s+\d+$', t, flags=re.I):
        b["title"] = f"{category} Study Worksheet #{t.split()[-1]}"
        cleaned_count += 1
        continue

    # 3. Clean "Module X Video Y"
    if re.match(r'^Module\s+\d+\s+Video\s+\d+', t, flags=re.I):
        b["title"] = f"{category} Course Lecture Companion Notes ({t})"
        cleaned_count += 1
        continue

    # 4. Remove personal channel watermarks (e.g. "Yusuf Developer", "Team SPY", "Team CyberX")
    cleaned_t = re.sub(r'\b(Yusuf Developer|Team SPY|Team CyberX|UdyogaMarg|Codebasics|Z-Lib\.org|OceanOfPDF)\b', '', t, flags=re.I)
    cleaned_t = re.sub(r'\s+', ' ', cleaned_t).strip(' -_,.')

    if len(cleaned_t) >= 4 and cleaned_t != t:
        b["title"] = cleaned_t
        cleaned_count += 1

print(f"Total titles cleaned/normalized: {cleaned_count}")

with open(registry_path, "w", encoding="utf-8") as f:
    json.dump(books, f, indent=2)

print("Saved updated data/books_registry.json")
