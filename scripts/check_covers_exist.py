import os
import json
import re

with open('lib/catalog.ts', 'r', encoding='utf-8') as f:
    text = f.read()

start = text.find('export const INITIAL_BOOK_CATALOG: Book[] = [')
end = text.find('function compileBookCatalog()')
snippet = text[start:end]

titles = re.findall(r'"title":\s*"([^"]+)"', snippet)
covers = re.findall(r'"coverImage":\s*"([^"]+)"', snippet)

print(f"Titles in INITIAL_BOOK_CATALOG: {len(titles)}")
print(f"Covers in INITIAL_BOOK_CATALOG: {len(covers)}")

# Check public/covers directory
public_covers = set(os.listdir('public/covers'))
print(f"Total files in public/covers: {len(public_covers)}")

missing_covers = []
for c in covers:
    fname = os.path.basename(c)
    if fname not in public_covers:
        missing_covers.append(c)

print(f"Missing covers from public/covers: {len(missing_covers)}")
if missing_covers:
    print("Sample missing:", missing_covers[:10])
